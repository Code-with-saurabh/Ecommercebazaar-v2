# Cart & Checkout

## State involved

| Slice | File | Shape | Purpose |
|---|---|---|---|
| `Shirt` | `store/slices/ForShirt.jsx` | `{ products: [], duplicate: bool }` | The cart lines |
| `CartValue` | `store/slices/ForCart.jsx` | `{ value: number }` | Header badge count |
| — | `Cart.jsx` local state | `{ [productId]: number }` | Quantity per line |

Cart line object:

```js
{ id, Bname /* brand */, name /* product name */, price /* string */, image }
```

## Adding an item

From any `Card` ("Add to Cart"):

```js
dispatch(additems({ id, Bname: BrandName, name: ProductName, price: Price, image: Imgs }));
dispatch(addCart());   // badge += 1
```

`additems` (in `ForShirt.jsx`) checks `state.products.find(p => p.id === id)`:

- **not found** → push the item
- **found** → set `duplicate = true` and log a warning; item is not added, and
  the badge still increments (minor bug: badge and list can disagree)

`removeitems(id)` filters the item out; `removeCart()` decrements the badge.

## The cart page (`/cart`)

`pages/Cart/Cart.jsx`

**Empty state** — if `products.length === 0`, a full-screen looping video
(`BGVideo.mp4`) with:

> Your Cart is Empty — Looks like you haven't added any items to your cart yet.

**Filled state** — one row per item with:

| Element | Behaviour |
|---|---|
| Product image + name | from the cart line |
| Line price | `qty * Number(price)` formatted with `.toFixed(2)` |
| `+` / `-` buttons | increment / decrement (min 0) |
| Quantity input | editable number field (`parseInt`, NaN-guarded via `getQty`) |
| **By Now** | `<Link to="/ByNow">` — goes to the checkout placeholder |
| **Remove** | `dispatch(removeitems(id))` + `dispatch(removeCart())` |

**Summary bar** (added in the `master` commit):

```jsx
<div className="cart-summary-CC">
  <span>Items: {totalItems}</span>
  <span className="cart-total-CC">Total: ${totalPrice.toFixed(2)}</span>
</div>
```

Computed on every render:

```js
totalItems = products.reduce((sum, p) => sum + getQty(p.id), 0);
totalPrice = products.reduce((sum, p) => sum + getQty(p.id) * Number(p.price), 0);
```

`getQty(id)` defaults missing/NaN quantities to `1` so the UI never shows `NaN`.

## Checkout / By Now (placeholder)

Route `/ByNow` renders `pages/ByNow/ByNow.jsx` — a looping background video with:

> **Sorry, We Are Working On It!!** — We appreciate your patience. Please check back later.

So today the flow **stops at the cart**. There is no address form, no order
creation, no payment.

Planned in [`../roadmap/commerce-core.md`](../roadmap/commerce-core.md):
address → order document → Razorpay/Stripe → order confirmation → order history.

## Persistence

**None.** Everything above is in-memory:

- Refresh / new tab / browser restart → cart is empty.
- Quantities are component state → navigating away resets them to 1.

Fix options (roadmap quick win): `redux-persist` with `localStorage`, or a
manual `localStorage` subscription in the store.

## Known gaps

| Gap | Impact | Roadmap |
|---|---|---|
| Cart not persisted | Users lose the cart on refresh | quick-wins |
| Quantities not in Redux | Reset on navigation; cannot show totals elsewhere | quick-wins |
| Badge increments on duplicate add | Badge can exceed actual items | quick-wins |
| No "already in cart" feedback | Silent no-op feels broken | quick-wins |
| No coupon / discount / tax / shipping | Totals are just `qty × price` | commerce-core |
| Checkout is a placeholder | Cannot complete a purchase | commerce-core |
| Cart not tied to the logged-in user | Same cart for everyone on the device | commerce-core (server-side cart) |
| No stock check | Can "buy" unlimited quantity | commerce-core |
