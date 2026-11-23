# Bazaar-005 — Redux cart persistence

**Date:** 2026-10-03 · **Commit:** `561a11d`

## Objective

The cart must survive a page refresh, and the three placeholder slices
(`ForOrders`, `ForProducts`, `ForWishlist`) were dead weight.

## What changed

- `store/Store.jsx` — `redux-persist` (localStorage) wired to the `Shirt`
  cart slice with a whitelist so only cart data is persisted; rehydration
  handled before first paint.
- Removed the three placeholder slices that contained no state or actions.

## Verification

- Add items → refresh → cart intact; header badge and totals rehydrate from
  storage.

## State left behind

Client cart state is durable and is the single source of truth the header
badge, cart page and (next milestone) server sync all read from. Server-side
persistence arrives in Bazaar-007.
