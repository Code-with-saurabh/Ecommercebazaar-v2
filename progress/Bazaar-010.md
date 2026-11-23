# Bazaar-010 — Responsive layout pass, UTF-8 recovery, cleanup

**Date:** 2026-11-23 · **Commits:** `5cddc56`, `29cb88c`

## Objective

Make every page work on phones and small tablets, align breakpoints to one
scale, recover files damaged by a bad encoding round-trip, and delete dead
code.

## What changed

### Responsiveness

- **Header** — `.search` was a hard `width: 700px` (wider than any phone):
  now `width:100%; max-width:700px; min-width:0` so the flex item shrinks.
  Nav links gain `flex-wrap` (desktop tablets) and, ≤768px, the navbar stacks
  in order: logo/cart/user row → centered nav row → full-width search row
  (`Navbar.css` order rules + `NavLinks.css` mobile block).
- **Gutters** — Products grid had no horizontal padding (cards touched the
  viewport edge); SearchPage used `margin-left:10%` (off-center). Both now
  use symmetric `padding: 0 20px` with a 480px tightening step.
- **Hero** — type scales down ≤480px inside the fixed-height (CLS-safe) box.
- **Cart** — desktop-only hacks (`margin-right:-200px` on the qty row,
  `margin-top:150px` on action buttons) reset in the mobile block; they had
  caused right-edge overflow and 150px gaps on phones. Stacked rows get a
  bounded full-width image instead of a 25% thumbnail.
- **Breakpoints normalized** to a two-step scale — `768px` / `480px` (was
  nine values: 420/480/600/640/760/768/820/900).

### UTF-8 recovery

A PowerShell bulk edit (`Get-Content`/`Set-Content` without `-Encoding`)
re-encoded five files as CP1252, leaving lone bytes (0x85 `…`, 0x97 `—`,
0xB7 `·`, 0xD7 `×`, 0xE9 `é`) that vite rejected with
*"stream did not contain valid UTF-8"*. Recovered losslessly by decoding the
files as CP1252 and rewriting UTF-8:

- `frontend/src/pages/{Checkout,Wishlist,Account}/*.jsx`
- `backend/models/{Cart,Product}.js`

**Rule going forward:** never round-trip source files through
`Get-Content`/`Set-Content` in Windows PowerShell 5.1; use editor tools or
explicit `-Encoding UTF8`.

### Cleanup

- Deleted dead `pages/ByNow/` (route aliases to Checkout) and the unused
  `.btn` calculator styles in `App.css`.
- Deleted `components/List/` (no importers; `ListSkeleton` in
  `Skeleton.jsx` stays — Admin uses it) — commit `29cb88c`.

## Verification

- UTF-8 validation sweep: all 177 source files decode cleanly.
- Frontend lint 0 errors, `vite build` clean, backend **123/123** tests.
- Dev servers: `:5000/api/health` OK; `:3000` serves `/`, `/checkout`,
  `/products`, `/wishlist` with 200.

## Left for later

- **Wishlist** is the only unbounded client-side list still on a plain
  `.map` (catalog/search are `VirtualGrid`, admin/orders are server-paginated).
  Fine at realistic sizes; revisit if wishlists can grow into the hundreds.
- The 11 pre-existing lint warnings (`react-hooks/set-state-in-effect` in
  `LazyImage`, `VirtualGrid`, `useProducts`, `Admin`) are acknowledged, not
  fixed — new code suppresses them locally with justification comments.
- Desktop-only cart row alignment (`margin-top:150px` button offset) still
  relies on the original hacked layout; a proper grid rewrite would be a
  visual-design task needing screenshots.
- In-memory rate limiter resets on backend restart (dev convenience, not a
  production store).
