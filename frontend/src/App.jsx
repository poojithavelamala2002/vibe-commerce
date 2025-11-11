import React, { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [receipt, setReceipt] = useState(null);

  // UX states
  const [addingIds, setAddingIds] = useState([]);
  const [updatingIds, setUpdatingIds] = useState([]);

  // error states (render inline instead of alerts)
  const [productError, setProductError] = useState("");
  const [cartError, setCartError] = useState("");
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    fetchProducts();
    loadCart();
  }, []);

  const fetchProducts = async () => {
    setProductError("");
    try {
      const res = await fetch(`${API_BASE}/api/products`);
      if (!res.ok) throw new Error(`Products fetch failed (${res.status})`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
      setProductError("Failed to load products. Check backend or network.");
    }
  };

  const loadCart = async () => {
    setCartError("");
    try {
      const res = await fetch(`${API_BASE}/api/cart`);
      if (!res.ok) throw new Error(`Cart fetch failed (${res.status})`);
      const data = await res.json();
      setCart(data);
    } catch (err) {
      console.error(err);
      setCartError("Failed to load cart. Check backend or network.");
    }
  };

  const addToCart = async (productId) => {
    setAddingIds((s) => [...s, productId]);
    try {
      const res = await fetch(`${API_BASE}/api/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, qty: 1 }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Add to cart failed (${res.status})`);
      }
      const updated = await res.json();
      setCart(updated);
    } catch (err) {
      console.error(err);
      setCartError(err.message || "Failed to add to cart");
    } finally {
      setAddingIds((s) => s.filter((id) => id !== productId));
    }
  };

  const removeFromCart = async (productId) => {
    setUpdatingIds((s) => [...s, productId]);
    try {
      const res = await fetch(`${API_BASE}/api/cart/${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Remove failed (${res.status})`);
      }
      const data = await res.json();
      if (data.cart) setCart(data.cart);
      else setCart(data);
    } catch (err) {
      console.error(err);
      setCartError(err.message || "Failed to remove item");
    } finally {
      setUpdatingIds((s) => s.filter((id) => id !== productId));
    }
  };

  const updateQuantity = async (productId, qty) => {
    if (qty < 0) return;
    setUpdatingIds((s) => [...s, productId]);
    try {
      const res = await fetch(`${API_BASE}/api/cart/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, qty }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Update failed (${res.status})`);
      }
      const data = await res.json();
      setCart(data);
    } catch (err) {
      console.error(err);
      setCartError(err.message || "Failed to update item quantity");
    } finally {
      setUpdatingIds((s) => s.filter((id) => id !== productId));
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setCheckoutError("");
    try {
      const res = await fetch(`${API_BASE}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Checkout failed (${res.status})`);
      }
      if (data.receiptId) {
        setReceipt(data);
        setName("");
        setEmail("");
        await loadCart();
      } else {
        throw new Error("Unexpected checkout response");
      }
    } catch (err) {
      console.error(err);
      setCheckoutError(err.message || "Checkout failed");
    }
  };

  const cartItemCount = cart.items?.reduce((s, it) => s + (it.qty || 0), 0) || 0;

  return (
    <div className="app">
      <header className="header" role="banner">
        <div className="brand">🛍️ <span style={{display:'inline-block'}}>Vibe Commerce</span></div>
        <div className="controls">
          <div>
            <strong>Cart:</strong>
            <span style={{ marginLeft: 8 }}>{cartItemCount} item{cartItemCount !== 1 ? 's' : ''}</span>
          </div>
          <div aria-hidden={false} style={{ marginLeft: 8 }}>
            <span className="badge" aria-live="polite">{cartItemCount}</span>
          </div>
        </div>
      </header>

      <main>
        {/* Products */}
        <section>
          <h2>Products</h2>
          {productError && <div className="error">{productError}</div>}
          <div className="products-grid">
            {products.map((p) => {
              const isAdding = addingIds.includes(p.id);
              return (
                <article key={p.id} className="card" aria-labelledby={`prod-${p.id}`}>
                  <div>
                    <h3 id={`prod-${p.id}`}>{p.name}</h3>
                    <div className="price">₹{p.price}</div>
                  </div>
                  <div>
                    <button
                      onClick={() => addToCart(p.id)}
                      disabled={isAdding}
                      aria-label={`Add ${p.name} to cart`}
                    >
                      {isAdding ? "Adding..." : "Add to Cart"}
                    </button>
                  </div>
                </article>
              );
            })}
            {products.length === 0 && !productError && <p>Loading products...</p>}
          </div>
        </section>

        {/* Cart */}
        <section className="cart" aria-live="polite">
          <h2>Cart</h2>
          {cartError && <div className="error">{cartError}</div>}

          {cart.items.length === 0 ? (
            <p>Your cart is empty</p>
          ) : (
            <>
              <ul>
                {cart.items.map((item) => {
                  const isUpdating = updatingIds.includes(item.productId);
                  return (
                    <li key={item.productId}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                        <div style={{ flex: 1 }}>
                          {item.name} x {item.qty} = ₹{item.subtotal}
                        </div>

                        <div>
                          <button
                            onClick={() => updateQuantity(item.productId, item.qty - 1)}
                            disabled={isUpdating || item.qty <= 0}
                            aria-label={`Decrease quantity of ${item.name}`}
                          >
                            -
                          </button>
                          <span style={{ padding: '0 8px' }}>{item.qty}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.qty + 1)}
                            disabled={isUpdating}
                            aria-label={`Increase quantity of ${item.name}`}
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            disabled={isUpdating}
                            aria-label={`Remove ${item.name} from cart`}
                            style={{ marginLeft: 8 }}
                          >
                            {isUpdating ? 'Working...' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <h3>Total: ₹{cart.total}</h3>
            </>
          )}
        </section>

        {/* Checkout */}
        <section className="checkout">
          <h2>Checkout</h2>
          {checkoutError && <div className="error">{checkoutError}</div>}
          <form onSubmit={handleCheckout} className="checkout-form">
            <input
              className="checkout-input"
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              className="checkout-input"
              type="email"
              placeholder="Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={cart.items.length === 0} aria-label="Checkout">
              Checkout
            </button>
          </form>
        </section>

        {/* Receipt */}
        {receipt && (
          <section className="receipt" aria-live="polite">
            <h2>🧾 Receipt</h2>
            <p>ID: {receipt.receiptId}</p>
            <p>Total: ₹{receipt.total}</p>
            <p>Time: {new Date(receipt.timestamp).toLocaleString()}</p>
          </section>
        )}
      </main>

      <footer className="footer-note">
        <small>Built with care — Vibe Commerce</small>
      </footer>
    </div>
  );
}

