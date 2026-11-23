# Bazaar-008 — Checkout core (backend)

**Date:** 2026-11-21 · **Commit:** `3efd97b`

## Objective

The commerce backbone: turn a server cart into an order — with address
snapshots, coupon evaluation, server-computed money, cancellations, plus the
supporting surfaces (addresses, wishlist, reviews) and the admin operations
queue.

## What changed

- `routes/orders.js` —
  - `POST /api/orders` — validates cart, reserves stock (`reserveStock`
    with per-line checks), snapshots address, evaluates coupon, computes
    totals **server-side only** via `utils/pricing.js` (`computePricing`:
    subtotal − discount + shipping + tax, env knobs in `config/env.js`:
    `freeShippingOver`, `shippingFlat`, `taxRate`), empties the cart on
    success,
  - `POST /api/orders/preview` — same math, **writes nothing** (address
    optional) so checkout can show exact numbers before placing,
  - `GET /api/orders/me` (paginated), `GET /api/orders/:id`,
    `POST /api/orders/:id/cancel` (only pending, restocks).
- `routes/addresses.js` — CRUD + set-default, per user.
- `routes/coupons.js` — `POST /api/coupons/validate` (server-side verdict:
  active, expiry, min order, usage limits, eligible lines).
- `routes/wishlist.js` — GET/POST/DELETE; add and remove are **explicit**
  (an add endpoint must never remove).
- `routes/reviews.js` — mounted under `/api/products`: list, create (one per
  user per product), own-review update/delete, `helpful` vote.
- `routes/admin.js` — product CRUD with soft delete, **orders queue** with
  state machine (`advanceStatus`: placed → packed → shipped → delivered;
  cancel restocks), coupon CRUD, review moderation.
- `routes/cart.js` fixes — PATCH qty stock-capped (409 when stock ≤ 0), PUT
  drops out-of-stock lines; `inStock=false` filter now means `stock ≤ 0`.
- `utils/pricing.js`, `config/env.js` pricing block.
- Tests: checkout suite (addresses → coupon → preview → place → detail →
  cancel → reviews) — **115 passing** at this milestone.

## Verification

- `npm test` full suite; `GET /api/orders/preview` verified manually against
  a seeded cart (totals match `computePricing` parts).

## State left behind

A complete, tested order lifecycle with all money computed on the server.
The frontend still shows placeholder pages — Bazaar-009 consumes these APIs.
