# Phase 2 — Commerce Core

This phase turns the demo into an actual store: products in the database,
persisted cart, orders and payments, plus an admin panel.

---

## 2.1 Products API + database

**Why:** the catalog (60 items) is hardcoded in `ForSearch.jsx`; every change
needs a redeploy.

**New files**

```
backend/models/Product.js
backend/routes/products.js
backend/seed/products.json        (migrate the existing 60 items)
backend/scripts/seed.js
```

**Schema (suggested)**

```js
{
  sku: String (unique),
  name: String,
  brand: String,
  description: String,
  price: Number,             // store as number, not string
  category: String,          // tshirts | shirts | pants | shoes
  subcategory: String,
  images: [String],
  sizes: [String],
  colors: [String],
  stock: Number,
  rating: { avg: Number, count: Number },
  tags: [String],
  createdAt / updatedAt      // mongoose timestamps
}
```

**Endpoints**

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/products` | List, with `?category=&q=&page=&sort=` |
| `GET` | `/api/products/:id` | Detail |
| `GET` | `/api/products/brands` | Distinct brands (for filters/autocomplete) |
| `POST/PATCH/DELETE` | `/api/admin/products...` | Admin CRUD (Phase 2.7) |

**Frontend:** replace the slice's hardcoded array with a `products` thunk
(`createAsyncThunk`) + `GET /api/products`, keep the slice as a cache. Keep a
static fallback for offline/demo mode.

**Verify:** seeding works; `/products` renders from the API; changing the DB
reflects in the UI without a frontend rebuild.

---

## 2.2 Product detail page

**Why:** there is no way to inspect a product; "Add to Cart" is the only action.

- New route `/products/:id` + `pages/ProductDetail/ProductDetail.jsx`.
- Gallery, size/colour pickers, stock, rating, description, related products.
- Update `Card.jsx` so the image/title links to the detail page.
- SEO-friendly `<title>` per product.

**Verify:** clicking any card opens a detail page; deep-linking works after refresh.

---

## 2.3 Persist cart + server-side cart

**Why:** cart is per-device memory only, and cannot be used for orders.

- Client: `redux-persist` (Phase 1.1) so the cart survives refresh.
- Server: `POST /api/cart`, `GET /api/cart`, `PATCH /api/cart/item`,
  keyed by user id (logged in) or an anonymous cart id cookie.
- On login, merge the anonymous cart into the user cart.

**Verify:** log in on a second device → same cart; totals still correct.

---

## 2.4 Checkout flow (replaces the `/ByNow` placeholder)

Current state: `/ByNow` just shows "Sorry, We Are Working On It!!".

Build a real flow:

```
/Cart  ->  /checkout/address  ->  /checkout/review  ->  /checkout/payment  ->  /order/:id/confirmed
```

**New pieces**

| Piece | Details |
|---|---|
| Address model | `{ fullName, phone, line1, line2, city, state, pincode, type }` |
| Checkout page(s) | Address form (Formik + Yup), order review, coupon field |
| Order model | `{ userId, items[], subtotal, discount, shipping, tax, total, status, address, payment }` |
| Pricing server-side | **Never trust client totals** — recompute price on the server at order time |
| Stock check | Decrease stock transactionally; reject out-of-stock carts |

**Endpoints:** `POST /api/orders` (creates order in `pending`), 
`GET /api/orders/:id`, `GET /api/orders/me`.

**Verify:** complete checkout in dev; order document exists in Mongo with the
right totals; stock decreased.

---

## 2.5 Payments

| Option | Notes |
|---|---|
| **Razorpay** (recommended for India) | Checkout widget + `POST /api/payments/verify` with HMAC signature verification |
| **Stripe** | PaymentIntents + webhooks; better international DX |
| **Fake/manual** | `payment: 'COD'` or a mock gateway to finish the flow first |

Rules:

- Keys in backend `.env` (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) — never in frontend.
- Verify the signature server-side before marking the order `paid`.
- Handle failure/cancel/timeout paths and idempotency.
- Record `paymentId`, `orderId`, `status`, `paidAt`.

**Verify:** successful test payment → order `paid`; tampered signature → rejected.

---

## 2.6 Order history & account area

- `/account/orders` — list + status timeline (`placed → packed → shipped → delivered / cancelled`).
- `/account/profile` — view/edit name, phone, email, change password.
- `/account/addresses` — CRUD addresses.
- Email confirmation (Phase 4) once transactions exist.

---

## 2.7 Admin panel

- New routes under `/admin` guarded by a role check.
- **Product management:** create/edit/delete, image upload, stock updates.
- **Order management:** change status, view payment, print invoice.
- **User management:** list, block/unlock.
- **Dashboard:** revenue, orders/day, low-stock alerts.
- Backend: add `role: 'user' | 'admin'` to `User` and admin-only middleware.

---

## 2.8 Ratings & reviews

- `Review` model `{ productId, userId, rating, comment, createdAt }`.
- Enforce one review per user per product; compute average into the product.
- Show real stars on `Card.jsx` (currently 5 static images).

---

## 2.9 Wishlist & saved items

- `Wishlist` model or `wishlist: [productId]` on the user.
- Header heart icon with count, `/wishlist` page, "Move to cart".

---

## 2.10 Coupons & discounts

- `Coupon` model `{ code, type: percent|flat, value, minCart, expiresAt, usageLimit }`.
- Validate and apply server-side during `POST /api/orders`.
- Show discount line in the cart summary.

---

## Suggested build order

1. **2.1 Products API** (everything else depends on real data)
2. **2.2 Product detail**
3. **2.3 Cart persistence**
4. **2.4 Checkout + orders** (COD first — no gateway needed)
5. **2.5 Payments**
6. **2.6 Account area**
7. **2.7 Admin**
8. **2.8–2.10** reviews, wishlist, coupons

## Definition of done (Phase 2)

- [ ] Products live in MongoDB, editable without a frontend deploy
- [ ] Cart persists and is per-user after login
- [ ] A user can place an end-to-end order with a real (test) payment
- [ ] Order history shows past orders with statuses
- [ ] Admin can create a product and see it on the storefront
- [ ] Server recomputes all money; client totals can be tampered with safely
