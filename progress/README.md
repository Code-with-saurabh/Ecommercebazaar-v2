# Bazaar — Progress Journal

Chronological milestone log for the Bazaar e-commerce project. Each file covers
one coherent milestone: objective, what changed, how it was verified, and the
state it left behind. Commits are referenced by hash so any entry can be
replayed with `git show <hash>`.

| Doc | Milestone | Date | Commits |
|-----|-----------|------|---------|
| [Bazaar-001](Bazaar-001.md) | Foundation: Vite conversion, health endpoint, docs tree | 2026-09-26 | `dfc42ff`…`60630e3` |
| [Bazaar-002](Bazaar-002.md) | API core, env/config pipeline, frontend reorg, security + PWA | 2026-09-26 | `249ecf9`…`a70106e` |
| [Bazaar-003](Bazaar-003.md) | App pipeline split, SEO layer, zod validation, Mongoose models, skeletons | 2026-10-01/03 | `a8d4dea`…`f933bdf` |
| [Bazaar-004](Bazaar-004.md) | JWT auth with refresh rotation, admin API, frontend session, ESLint | 2026-10-03 | `0446dd0`…`d3e1642` |
| [Bazaar-005](Bazaar-005.md) | Redux cart persistence across refreshes | 2026-10-03 | `561a11d` |
| [Bazaar-006](Bazaar-006.md) | Products API + seed data, API-driven catalog frontend, live search | 2026-10-03 | `c361a5c`, `ec7877d` |
| [Bazaar-007](Bazaar-007.md) | Server-side cart: guest cookie cart, account cart, signup merge | 2026-10-03 | `ee24f98` |
| [Bazaar-008](Bazaar-008.md) | Checkout core backend: orders, coupons, addresses, wishlist, reviews, admin CRUD | 2026-11-21 | `3efd97b` |
| [Bazaar-009](Bazaar-009.md) | Checkout frontend: checkout flow, receipt, account tabs, wishlist, nav | 2026-11-23 | `2cb9a25` |
| [Bazaar-010](Bazaar-010.md) | Responsive layout pass, UTF-8 recovery, dead-code cleanup | 2026-11-23 | `5cddc56`, `29cb88c` |
| [Bazaar-011](Bazaar-011.md) | Editorial shopping journey, variant-aware checkout, receipt and account directory | 2026-11-26 | `c3687b9`…`3260d9e` + working tree |

## Current state (end of Bazaar-011)

- **Backend** — Express + Mongoose on `:5000`. Auth (JWT + refresh rotation),
  products catalog, server cart, checkout (orders/preview, coupons, addresses,
  wishlist, reviews), admin CRUD with order state machine, zod validation on
  every write, envelope responses. API suite → **132/132 passing**.
- **Frontend** — React 18 + Vite 8 + Redux Toolkit on `:3000`. All routes
  lazy-loaded with skeleton fallbacks. Catalog views have shareable filters
  and pagination. Search, product detail, bag, checkout, receipt, account,
  wishlist, auth, support and admin use the editorial design system.
  Lint → **0 errors** (10 existing warnings); `npm run build` clean.
- **Docs** — `docs/` (api, features, setup, roadmap) and this `progress/` tree.
- **Verification** — see [Bazaar-011](Bazaar-011.md) for the live purchase-flow checks.

## Parallel-session feature notes

- [Customer reviews](WORK-product-reviews.md) — 2026-11-26: review UI, owner
  management, idempotent helpful votes, and deletion rating consistency.
- [Recently viewed products](WORK-recently-viewed.md) — 2026-11-26: browser-local
  product history, live-data shelf, cross-tab clearing, tests, and the precise
  ProductDetail integration to retain during the ongoing redesign.
