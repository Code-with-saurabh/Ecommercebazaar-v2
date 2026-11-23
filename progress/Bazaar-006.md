# Bazaar-006 — Products API, seed catalog, API-driven frontend

**Date:** 2026-10-03 · **Commits:** `c361a5c`, `ec7877d`

## Objective

Replace hardcoded product arrays with a real catalog: seeded MongoDB products,
a paginated/filterable/sortable products API, and a frontend that reads
everything from it — including product detail, live search and the home page.

## What changed

- `c361a5c` — backend catalog:
  - `routes/products.js`: `GET /api/products` with zod query schema
    (`category`, `q`, `brand`, `tag`, `minPrice/maxPrice`, `inStock`,
    `featured`, `sort`, `page`, `limit` — default 20, **max 50** so no client
    can request an unbounded query), `GET /api/products/:idOrSlug`,
  - `scripts/seed.js` + `seed/products.seed.json` — 60 products with images
    (`frontend/public/products/*.jpg`),
  - product endpoint tests.
- `ec7877d` — frontend consumes the API:
  - `hooks/useProducts.js` (stable query keys, loading/error states),
  - `ProductCard` rewritten for API products (image via `LazyImage`, rating,
    price/MRP/discount, out-of-stock state),
  - `ProductDetail` page (gallery, sizes/colors, add-to-cart),
  - `Products` page renders category sections through **VirtualGrid**,
  - debounced **live search** suggestions in the header + full search results
    page,
  - home page rows (`Recommended`, `Features`) fetched with limits.

## Verification

- Product tests: list pagination/filters/sort, detail by slug and id, 404s.
- Manual: search-as-you-type, deep links `/products/:slug`, home rows.

## State left behind

Catalog is fully API-backed; every long list (catalog, search) renders through
`VirtualGrid` and images through `LazyImage` — the performance baseline later
milestones reuse.
