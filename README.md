# Vibe Commerce — Mock E-Com Cart

Small full-stack shopping cart app built for Vibe Commerce internship screening.

## What it is
- Frontend: React (Vite)
- Backend: Node + Express
- DB: In-memory (simple), optional persistence can be added with MongoDB/SQLite
- Features: view products, add/remove/update cart items, mock checkout, receipts

---
## Quick demo (1 line)
Add products → View cart → Checkout (enter name + email) → See receipt.

---

## Local setup

### Backend
```bash
cd backend
npm install
npm start
```
backend runs on http://localhost:5000

### Frontend
```
cd frontend
npm install
npm run dev
```
frontend runs on http://localhost:5173

If you want to run both together in one terminal, consider using concurrently, but separate terminals are fine.
---

## API endpoints

1. GET /api/products — list products

2. POST /api/cart — body { productId, qty }

3. GET /api/cart — returns { items, total }

4. DELETE /api/cart/:productId — remove item

5. POST /api/cart/update — body { productId, qty } (set qty)

6. POST /api/checkout — body { name, email } → returns { receiptId, total, timestamp }

7. GET /api/receipts — list saved receipts (in-memory)
---

## Screenshots

[Products grid](./images/productsGrid.png)

[Cart with items](./images/cartWithItems.png)

[Checkout form](./images/checkoutForm.png)

[Receipt after checkout](./images/ReceiptAfterCheckout.png)
---

## Notes, limitations & next steps
1. Data is stored in memory; server restart clears cart & receipts. To persist, add MongoDB/SQLite and models.
2. No real payments — checkout returns a mock receipt.
3. Bonus implemented: basic error handling and receipts.
