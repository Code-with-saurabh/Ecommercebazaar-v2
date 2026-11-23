# Bazaar-001 — Foundation

**Date:** 2026-09-26 · **Commits:** `dfc42ff`, `e172179`, `981b141`, `60630e3`

## Objective

Get the project onto a maintainable toolchain: leave CRA behind, expose a
health endpoint for ops checks, and write the documentation tree that later
milestones build on.

## What changed

- `dfc42ff` — initial commit of the CRA-era storefront (cart, header, footer,
  page components) and the Express skeleton.
- `e172179` — `/api/health` endpoint (status + uptime), cart total summary on
  the cart page, `ScrollToTop` on route change.
- `981b141` — **CRA → Vite**: `react-scripts` replaced with `vite`,
  `public/index.html` moved to `frontend/index.html`, `.js` components renamed
  `.jsx`, dev server on `:3000`. Package-lock shrank by ~17k lines.
- `60630e3` — `docs/` tree: `api/endpoints.md`, `features/*` (auth, cart,
  catalog, routing, search, ui), `setup/*`, `contributing/code-style.md`,
  `overview/*`, `roadmap/*`.

## Verification

- `npm run dev` serves the storefront on `:3000`; `GET /api/health` returns
  JSON on `:5000`.

## State left behind

Vite dev/build pipeline, health endpoint, and the documentation skeleton that
the next milestone fills with a real API core.
