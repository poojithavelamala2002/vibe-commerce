// backend/server.js
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid'); // for receipt ids
const morgan = require('morgan');


const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));


const PORT = process.env.PORT || 5000;

/**
 * Mock product data (source of truth for prices)
 */
const products = [
  { id: "p1", name: "Blue Hoodie", price: 799 },
  { id: "p2", name: "White T-Shirt", price: 399 },
  { id: "p3", name: "Sneakers", price: 2499 },
  { id: "p4", name: "Cap", price: 199 },
  { id: "p5", name: "Water Bottle", price: 299 }
];

/**
 * In-memory storage (resets on server restart)
 */
let cart = []; // { productId, qty }
let receipts = []; // { receiptId, total, timestamp, name, email, items }

/* Helpers */
function findProduct(productId) {
  return products.find(p => p.id === productId);
}

function computeCartWithDetails() {
  const items = cart.map(ci => {
    const product = findProduct(ci.productId);
    return {
      productId: ci.productId,
      name: product ? product.name : 'Unknown',
      price: product ? product.price : 0,
      qty: ci.qty,
      subtotal: product ? product.price * ci.qty : 0
    };
  });
  const total = items.reduce((s, it) => s + it.subtotal, 0);
  return { items, total };
}

/* Routes */
app.get('/', (req, res) => res.send('Vibe Commerce Backend'));
app.get('/api/products', (req, res) => res.json(products));
app.get('/health', (req, res) => res.send('OK'));

/* Cart endpoints */
app.post('/api/cart', (req, res) => {
  const { productId, qty } = req.body || {};
  if (!productId || typeof qty !== 'number' || qty <= 0) {
    return res.status(400).json({ error: 'productId and positive qty required' });
  }
  const product = findProduct(productId);
  if (!product) return res.status(400).json({ error: 'Invalid productId' });

  const existing = cart.find(ci => ci.productId === productId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ productId, qty });
  }
  res.status(201).json(computeCartWithDetails());
});

app.get('/api/cart', (req, res) => {
  res.json(computeCartWithDetails());
});

app.delete('/api/cart/:productId', (req, res) => {
  const { productId } = req.params;
  const beforeLen = cart.length;
  cart = cart.filter(ci => ci.productId !== productId);
  if (beforeLen === cart.length) return res.status(404).json({ error: 'Item not in cart' });
  res.json({ success: true, cart: computeCartWithDetails() });
});

/* Optional update endpoint */
app.post('/api/cart/update', (req, res) => {
  const { productId, qty } = req.body || {};
  if (!productId || typeof qty !== 'number' || qty < 0) {
    return res.status(400).json({ error: 'productId and non-negative qty required' });
  }
  const existing = cart.find(ci => ci.productId === productId);
  if (!existing) {
    if (qty === 0) return res.json(computeCartWithDetails());
    cart.push({ productId, qty });
  } else {
    if (qty === 0) cart = cart.filter(ci => ci.productId !== productId);
    else existing.qty = qty;
  }
  res.json(computeCartWithDetails());
});

/**
 * POST /api/checkout
 * Body: { name: string, email: string }
 * Uses the current server-side cart to compute total and returns a receipt.
 * Clears the cart after successful checkout.
 */
app.post('/api/checkout', (req, res) => {
  const { name, email } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required for checkout' });
  }

  const { items, total } = computeCartWithDetails();
  if (!items.length) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  const receiptId = uuidv4();
  const timestamp = new Date().toISOString();

  const receipt = {
    receiptId,
    total,
    timestamp,
    name,
    email,
    items
  };

  // Save receipt (in-memory)
  receipts.push(receipt);

  // Clear the cart (simulate purchase)
  cart = [];

  // Return receipt (frontend can show this in a modal)
  res.status(201).json({
    receiptId,
    total,
    timestamp
  });
});

/* GET /api/receipts - optional: view past receipts */
app.get('/api/receipts', (req, res) => {
  res.json(receipts);
});

/* Start server */
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
} else {
  module.exports = app;
}


