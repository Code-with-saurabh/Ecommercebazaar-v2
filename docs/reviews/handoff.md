# Bazaar handoff · 28 November 2026

**Resume here.** The shopping path runs on the real API and MongoDB. The interface and integration checks below passed. Launch still depends on truthful SKU data, fulfillment policy, and operational testing.

## Delivered and verified

| Area | Result |
|---|---|
| Storefront | Replaced the deal headline and repeating 70% promotion with a four-category wardrobe index. Selecting a category changes the photo, purchasable product, price and collection link. Photos still come from Mongo. Shared ink/green tokens, locally licensed text/icon fonts, keyboard skip link and reduced-motion presentation. |
| Discovery | One current navigation destination; dismissible search suggestions; search pagination; price fields reflect URL history. `GET /api/products/facets` aggregates the complete active catalog, including records beyond 100. |
| Purchase | Configurable products from cards/wishlist go through selection; multi-size products need a size. Mobile buy controls precede the dossier. Bag drops the decorative video and per-line checkout. Delivery information reads `GET /api/shipping-policy`. Checkout presents COD, uses shared address validation and shows a recoverable sync failure. |
| Cart ownership | Pending quantity writes are serialized and flushed before sign-in/checkout. Changed account identity hydrates the server-merged cart; stored carts carry owner information. Tested an existing account bag + a guest item, receipt with both variants, cancellation, and a separate shopper seeing an empty bag. |
| Admin | Corrected three 400s on initial list loads. Zod 4 partial schemas applied creation defaults to omitted PATCH fields: stock edits could clear gallery/options, and coupon toggles could reset terms. PATCH now retains omitted fields, and percentage limits are checked using the merged coupon. Regression checked against Mongo. |
| Production | Same-origin `/api/*` bypasses the service worker; old Bazaar caches are evicted. Verified static assets present and zero API responses in Cache Storage after account checkout. Self-hosted fonts respect the existing CSP. The admin seeder refuses the dev password in production. Product offer JSON-LD uses real SKU, price, availability, currency and photos. Build emits a sitemap when `VITE_SITE_URL` is configured. |
| Dependencies | Updated the existing lockfile packages within declared ranges. Production dependency audit went from **5 backend / 6 frontend** advisories to **0 / 0** using `npm audit --omit=dev`. Full development-tree audits still reported 3 moderate backend and 3 moderate + 3 high frontend advisories; schedule toolchain updates. |
| Images | **117 originals**: 18 tees, 35 shirts, 31 pants and 33 footwear. [Library and license inventory](../../photos/README.md). Nothing uploaded or mapped to product records. 70 museum references are explicitly identified; they aren't photos of the listed modern merchandise. |

## QA record

- Isolated MongoDB 7; seeded 60 merchandise records and disposable customer/admin identities. No production records used. Vite dev server and built frontend served by Express in production mode were both exercised.
- `frontend`: production build passed; lint has **0 errors, 8 pre-existing warnings**. `backend`: lint passed. Backend endpoint suite: **132 passed, 0 failed, 0 skipped**. Node test suites: **40 passed**, including the new PATCH/facet regression. `git diff --check` passed.
- Browser: real login, wishlist/options, guest merge, address validation, successful COD purchase, receipt, cancellation, newsletter, account separation, search/Escape, filter history, and all five admin list views. Final production shopper run had no console/page errors. Tested Home/Catalog and checkout at 320, 390, 768, 1280 and 1440 CSS px; PDP, wishlist and receipt also checked at 320. Zero measured page overflow on those runs. This is not certification on physical Safari/Android devices.
- Visual evidence: [original Home](home-before.jpg), [desktop spread](desktop-scroll.jpg), [phone](phone-scroll.jpg), [reduced motion](reduced-motion-scroll.jpg). See the [initial audit](../roadmap/storefront-review.md) for before-state findings.

## Next session — in this order

| Priority | Task and acceptance criterion | Dependency / effort |
|---|---|---|
| P0 · merchandise | Reconcile each of the 60 seeded SKUs with its actual manufacturer, model, photograph, sizes, material and fit. Remove the repeated $50 shipping/30-day returns claim from owner-approved descriptions. Verify the source rights for the **existing** production images independently of the new library. A reviewed SKU can be listed; a generic or mismatched SKU cannot. | Merchandise owner + supplier data; medium |
| P0 · operations | Agree currency, shipping territory, delivery times, taxes and returns; set real domain, CORS, proxy and independent signing secrets. Exercise backup/restore, alerts, non-JS social previews and checkout retries. Verify stock/coupon rollback and duplicate-submit recovery under interruption before taking live orders. | Fulfillment + infrastructure; medium–large |
| P1 · assets | Fill the remaining contemporary photo shortfalls in the [library inventory](../../photos/README.md), prioritizing front/back/detail views of the **same** garment. Obtain supplier packs or an authorized commercial stock API. Keep model/trademark rights and SKU matching as separate fields at integration time. Cloud upload remains a later phase. | Licensed supplier or photo shoot; medium |
| P1 · QA | Test actual iOS/Android keyboard, sticky header, screen reader and slow/offline checkout. Run through remaining admin writes (including every order transition), expired-auth cart sync, cross-tab races, crash recovery and stock contention. Add these journeys to CI using disposable databases. | Test devices + QA fixtures; medium |
| P2 · retail | Add measurements and size-level inventory from real supplier records. Implement shipment estimates, return/refund handling and notifications once fulfillment data/support exist. Persist visible wishlist membership across routes. | Supplier/operations integrations; medium–large |
| P2 · engineering | Address remaining toolchain advisories and lint warnings. Prerender product metadata for non-JS crawlers; include published product slugs in the deployment sitemap. Measure real image/LCP performance and reserve gallery space before introducing further motion. | Domain + staging metrics; medium |
| P3 · product | Evaluate guest orders and a real payment gateway, then consent-aware funnel events. Do not add unguided comparisons or bundle recommendations without evidence of demand. | Business and payment decisions; large |

### Reproduce the checks

Use an isolated local MongoDB and seed it before endpoint tests. `npm test` in `backend/` expects the API on port 5000 and a seeded admin; pass its credentials via environment. In `frontend/`, run `npm run lint` and `npm run build`. From the root:

```sh
node --test backend/tests/catalog-contracts.test.cjs backend/tests/reviews.test.cjs frontend/tests/product-reviews.test.mjs frontend/tests/recently-viewed.test.mjs
python photos/verify.py
```

Set `REVIEWS_TEST_MONGO_URI` if the isolated Mongo instance is not at the default port. Set `VITE_SITE_URL` to the public origin at deployment. Pre-existing uncommitted admin and roadmap work remains in the working tree; review it along with these changes before committing.
