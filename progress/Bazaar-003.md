# Bazaar-003 — Pipeline split, SEO, zod validation, Mongoose models, skeletons

**Date:** 2026-10-01 → 2026-10-03 · **Commits:** `a8d4dea`, `f8ba544`, `3a70ec9`, `f933bdf`

## Objective

Split the monolithic `app.js` into a composable pipeline, add the SEO layer,
replace ad-hoc body checks with zod schemas, and build the full Mongoose model
layer with loading skeletons for the UI.

## What changed

- `a8d4dea` — pipeline split: `config/cors.js`, `middleware/requestId.js`,
  `middleware/spa.js` (SPA fallback for deep links), `routes/health.js`;
  `app.js` reduced to ordered middleware assembly. (Also added the `List`
  component — later removed in Bazaar-010.)
- `f8ba544` — SEO: `src/seo/` (`Seo.jsx` per-route meta manager,
  `pageMeta.js`, `structuredData.js` JSON-LD, `site.js`), `robots.txt`,
  `sitemap.xml`, title/meta in `index.html`.
- `3a70ec9` — the big one:
  - `middleware/validate.js` — zod schema validation producing field-level
    error details,
  - full models: `Product`, `User`, `Cart`, `Order`, `Coupon`, `Review`,
    `Address` (+ `models/index.js`),
  - loading skeletons (`components/Skeleton`) wired into routes,
  - auth fixes in the old user routes.
- `f933bdf` — correctness pass: case-sensitive `Logo.css` import (broke
  Linux builds), sticky header enabled, `.features` class typo, dead slice
  removed.

## Verification

- `npm test` (backend) grows with model/validation coverage; skeleton
  components render on every lazy route.

## State left behind

Every subsequent feature (products, cart, checkout) is written as
`zod schema → model → route → envelope`, and routes render skeleton fallbacks
while lazily loading.
