# Bazaar-007 — Server-side cart

**Date:** 2026-10-03 · **Commit:** `ee24f98`

## Objective

Move cart truth to the server while keeping the guest experience seamless:
anonymous carts identified by an httpOnly cookie, signed-in carts per user,
and a merge when a guest registers or logs in.

## What changed

- `routes/cart.js` — full cart API:
  - guest cart keyed by `utils/guestCookie.js` (signed, httpOnly, SameSite),
  - account cart for authenticated users (`Cart` model, `status: 'active'`),
  - GET/POST/PATCH/DELETE with stock-aware quantity handling,
  - `POST /api/cart/merge` on login/signup: guest lines merge into the
    account cart (sum quantities, latest wins on conflicts).
- `hooks/useCartSync.js` — client bridge: pushes local redux changes to the
  server (debounced), pulls server state back into redux, so the persisted
  redux cart (Bazaar-005) and server cart never diverge.
- Header badge, cart page and add-to-cart buttons all flow through the sync.
- Cart tests: guest flow, account flow, merge semantics, stock caps.

## Verification

- `npm test` cart suite; manual: add as guest → register → cart merged;
  login on second device → same cart.

## State left behind

Cart survives devices and refreshes server-side; redux remains the fast local
mirror. Checkout (Bazaar-008) reads the server cart as its only input.
