# Bazaar storefront review · 28 November 2026

## Evidence and product boundary

Reviewed the working tree, not the old roadmap: admin management screens exist. Ran Vite, Express and MongoDB 7 with a private local database seeded with 60 products (10 tees, 15 shirts, 15 pants, 20 shoes). Chrome walkthrough included sign-in, wishlist, variant, bag, address, COD order, receipt, account tabs, all admin lists, search, service pages and unknown route. Baseline screenshot review: 1440, 1280, 768, 390 and 320 CSS px. These are browser viewports, not physical device tests.

## Audit and decisions

| Surface | Evidence / problem | Decision → shopper or operator benefit |
|---|---|---|
| Navigation | Router v5 receives v6 `end`; several query links light up together. Duplicated catalog entry. Signed-in Home overflowed 112px at 1280 and 56px at 320. | One category vocabulary and one current destination. Reflow while preserving access to search and tools. |
| Home | Headline and a second full-width sale block repeat an unsupported coupon maximum. Six adjacent frames compete; two horizontal product grids largely repeat the catalog. | One interactive category spread, one new-arrivals row, then newsletter. Keep links usable on failed image/data loads. |
| PLP | Global facet counts computed from first 100 records; price draft doesn't follow URL history. | Aggregate active products in Mongo; preserve shareable filter/sort/page URLs. Use ordinary filter labels. |
| Search | Debounced real suggestions, but no dismissal after selecting or navigating away. Results limited to 50. | Make suggestions keyboard reachable and dismissible; paginate results. Preserve search endpoint. |
| Cards / wishlist | Quick Add writes a variantless line. Star + “New” confuses unrated with newly listed. Wishlist heart is local component state. | Choose options for configurable items. Show reviews only when present. Wishlist management remains account-backed. |
| Product | A repeated dossier above buy controls on phones, duplicate badges, too much server jargon. Single photo common despite gallery support. | Put purchase before detail on mobile; retain gallery, SKU, reviews, related and recently viewed. Don't present other garments as alternate SKU angles. |
| Bag | Decorative video plus duplicated checkout links compete with the order summary. Local freight constants can differ from server config. | Use a static empty state and one primary checkout. Get public shipping rules from server; final quote still uses orders/preview. |
| Checkout / confirmation | COD worked. Card/UPI is disabled; address validation is duplicated. Receipt has genuine snapshots, status history and cancellation. | Only show supported payment, consolidate validation and preserve order/auth/payment semantics. |
| Auth / account | Split auth layout and error messages are useful. Account has address CRUD, history and password controls. | Keep layout; improve consistency through shared primitives. Support accounts before adding social login. |
| About / Help / Contact / 404 | Portfolio implementation details sit beside claims of authorized distribution. Contact explicitly opens a draft. FAQ and error page have real destinations. | Use factual store voice. Keep native FAQ, honest contact handoff and recovery paths. |
| Admin | Products/orders/reviews initially respond 400 on empty optional enum filters. Users/coupons respond. Product editor already preserves gallery on unchanged primary. | Omit unset filters; retain server enum validation, gallery behavior, soft delist and role gates. |
| Merchandising / SEO | Seed includes misspelled names, single-image galleries and $50 delivery/30-day-return promises. Static metadata claims free returns and points to a sample domain. | Remove speculative site-level promises. Owner to approve actual SKU copy, returns and market/currency before selling; no automatic rewriting of production records. |

## Architecture

React 18, Router 5 and Vite route chunks; Redux persists bag lines, Axios unwraps API envelopes, hooks fetch lists. Express + Zod + Mongoose with separate product/cart/order/address/review/coupon/newsletter/user models. Guest cart uses an HTTP-only cookie; authenticated purchases snapshot prices and addresses. Access JWT in browser storage; refresh cookie, backend role gates, rate limits and production config checks. Keep those boundaries. Review session storage, cross-account cart hydration, idempotent checkout, crash recovery across stock/coupon/order writes and actual proxy settings before production. Text index exists but substring regex search is used. Route splitting is useful; client list cache has no expiry. SEO is client-driven and deployment domain matters to non-JS crawlers. No measured conversion or field performance data.

**Production-only finding:** the original service worker skipped cross-origin APIs in development but cached same-origin `/api/*` GETs in production. Cache Storage ignores the HTTP `no-store` directive when an application explicitly calls `cache.put`. Treat the network-only API exclusion and eviction of the old Bazaar cache as P0.

**Catalog evidence:** all 60 seed descriptions promise “Free shipping over $50 and 30-day returns”; none of the 60 have a second gallery photo. The maximum seeded compare-at discount is 23%. This does not establish a 70% coupon offer or a returns policy. Merchandise content and real rights to sell branded goods are separate from interface quality.

## Priorities (impact / dependency / effort)

| Priority | Work | Impact | Dependency | Effort |
|---|---|---|---|---|
| P0 | Repair first-load admin queries; verify actual API responses | Restores operations | Existing enums | S |
| P0 launch | Approve SKU identity, photography match, delivery/returns, live domain and COD territory | Prevents misleading sales | Merchant + fulfillment | M |
| P1 | Option-aware purchase path, bag and checkout hierarchy | Reduces unfulfillable or ambiguous orders | Product options + cart sync | M |
| P1 | Header reflow, search dismissal, keyboard and reduced-motion checks | Makes shopping usable across screens | Shared shell | M |
| P1 | Cart ownership/sync, order idempotency and recovery under interruption | Prevents lost carts / duplicate orders | Account lifecycle + isolated concurrency testing | L |
| P2 | Catalog spread, restrained product cards, truthful service pages | Brand recognition without obstructing browsing | Seeded catalog photography | M |
| P2 | Complete facets, correct price URL state, search pagination | Discovery remains accurate as inventory grows | Read-only aggregation | M |
| P2 | Local licensed image library with provenance and visual QA | Enables future merchandising | Rights + category relevance | M |
| P2 | Size-specific inventory and fit/material measurements | Better purchase confidence | Supplier feeds, SKU migration plan | L |
| P2 | Real returns workflow, service SLA and delivery estimates | Helps customers after purchase | Fulfillment and service policy | L |
| P3 | Guest orders, online payment and notifications | Potential conversion lift | Identity, gateway, reconciliation, delivery vendor | L |
| P3 | Consent-aware funnel analytics, then abandonment experiments | Evidence for priorities | Consent policy + event definitions | M |

Don't add comparison, speculative bundles, fake urgency or extra catalog departments. Existing filters, search, wishlists, reviews, stock warnings, coupons and recommendations already address most discovery needs. Low-stock reporting and per-variant inventory are more valuable here than an analytics dashboard without reliable events.
