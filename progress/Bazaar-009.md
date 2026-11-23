# Bazaar-009 — Checkout frontend

**Date:** 2026-11-23 · **Commit:** `2cb9a25`

## Objective

Replace the remaining stub pages with the real shopping flow: checkout, order
receipt, account (profile/orders/addresses) and wishlist — plus the navigation
to reach them.

## What changed

- `pages/Checkout/Checkout.jsx` + `.css` —
  - login guard, address picker with inline new-address form (`FormField`),
  - coupon apply/remove via `POST /coupons/validate`, live summary via
    `POST /orders/preview` (seq-guarded so stale responses drop),
  - COD payment option, place order → `clearCart()` → redirect to receipt
    (clearing first is required: otherwise the cart sync pushes old lines
    back to the server),
  - legacy `/ByNow` route aliased to this page.
- `pages/OrderConfirmation/OrderConfirmation.jsx` + `.css` — receipt with
  address snapshot, priced lines, totals, status timeline; exports
  `ORDER_STATUS` label map shared with the account page.
- `pages/Account/Account.jsx` + `.css` — tabs Profile / Orders / Addresses
  (`?tab=` deep-linkable): profile edit (`PATCH /users/me`), password change
  (revokes other sessions), paginated order history with cancel action,
  address CRUD + set-default, logout.
- `pages/Wishlist/Wishlist.jsx` + `.css` — saved items grid with
  move-to-cart and remove.
- `layout/Header/NavLinks.jsx` — **Wishlist** (always) and **Account** (when
  signed in) links; cart page button now reads Checkout → `/checkout`.
- `store/slices/ForShirt.jsx` — `clearCart` action; `utils/session.js` —
  `updateUser` patch helper.
- `App.jsx` — lazy routes for all four pages with skeleton fallbacks;
  `ByNow` placeholder page deleted from the import graph.
- `backend/routes/orders.js` — extracted `buildOrderContext` shared by
  create and preview (preview added here; userId from `req.user`).

## Verification

- Frontend lint 0 errors; vite build clean (routes code-split: Checkout
  ~11 kB, Account ~12.5 kB).
- Backend suite **123/123** including SPA fallback tests against the built
  `dist`.
- Routes `/checkout`, `/account`, `/wishlist`, `/order/:id/confirmed`,
  `/ByNow` all serve 200.

## State left behind

A complete buy path: browse → cart → checkout → receipt → account history.
