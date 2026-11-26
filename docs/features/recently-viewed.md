# Recently viewed products

**Implemented:** 2026-11-26

## Shopper experience

Open two different product detail pages, then scroll below **You may also like**.
The **Recently viewed** shelf links back to previously opened products and uses
the existing product cards, including wishlist and Quick Add actions.

- The browser remembers the **eight** latest unique product IDs, newest first.
- The shelf considers the **four** latest previous IDs, excluding the open product.
- Revisiting a product moves it to the front rather than duplicating it.
- A first product visit has no previous products, so the shelf stays hidden.
- History survives reloads when local storage is available and updates across tabs.
- **Clear history** removes the saved history and announces the result. A later
  product visit starts a new history; clearing does not immediately re-add the
  current product.
- Failed/loading product pages and category routes are not recorded.
- The layout uses four desktop columns, two at 768px and below, and one at
  480px and below. Controls have visible keyboard focus styles.

## Current product data and error handling

Only IDs are stored. Each shelf load fetches its selected products through the
existing `GET /api/products/:id` endpoint, so saved browsing history cannot
supply an old price, stock flag, name, or image. A retry fetches again.

- Loading uses the existing product-card skeletons.
- Removed or inactive products (`404`) are omitted from the selected four.
  If all selected products are unavailable, the shelf links to the catalog.
- Network/server failures keep successful cards visible and show **Retry
  recently viewed**. A failure does not delete history.
- Clearing history, navigating away, or changing the selected IDs aborts pending
  requests. Late responses cannot repopulate a cleared or replaced shelf.

## Storage scope

Key: `bazaar:recently-viewed:v1`

```json
{
  "version": 1,
  "ids": ["000000000000000000000001", "000000000000000000000002"]
}
```

History belongs to this browser profile, not an account. People sharing that
profile share the history; it is not synchronized between devices. No prices,
user IDs, authentication data, or product descriptions are persisted here.

Malformed storage, unsupported schema versions, invalid IDs, duplicates, and
oversized arrays are handled defensively. If storage is blocked, history works
in memory for the current tab. If removal is blocked, the clear action hides
that tab's history and explicitly reports that saved history could not be
cleared. Clear only targets this key, so cart/session storage is preserved.

## Source files and integration

- `frontend/src/utils/recentlyViewed.js` — bounded, versioned external store;
  cross-tab subscription, persistence, validation, and memory fallback.
- `frontend/src/components/RecentlyViewed/RecentlyViewed.jsx` — record a resolved
  product, subscribe to history, load fresh products, and render the shelf.
- `frontend/src/components/RecentlyViewed/loadRecentProducts.js` — ordered
  loading with partial-failure handling.
- `frontend/src/components/RecentlyViewed/RecentlyViewed.css` — scoped styles
  using the editorial design tokens.
- `frontend/src/pages/ProductDetail/ProductDetail.jsx` — import and mount
  `<RecentlyViewed currentProductId={product._id} />` after related products,
  inside the successful-product render. Preserve this mount during redesigns.

The shelf is route-code-split with ProductDetail and requires no new project
dependencies or backend endpoints.

## Verification

Run from `frontend/`:

```bash
node --test tests/recently-viewed.test.mjs
npm run lint
npm run build
```

The standalone Node suite covers recency, bounds, persistence, sanitization,
stable snapshots, clearing, blocked/full storage, cross-tab updates, remounts,
fresh server data, ordered responses, and missing versus failed products.
Node may emit a harmless `MODULE_TYPELESS_PACKAGE_JSON` warning when importing
the frontend ES modules; the package also contains CommonJS tooling config.

Browser smoke checks were run in headless Edge against an isolated Vite server
with intercepted API fixtures (not a live database). They covered navigation,
reloads, current-product exclusion, changed server prices, a 375px viewport,
Quick Add, cross-tab clear without losing cart contents, the four-card limit,
failed-page exclusion, partial failures, retry, removed products, and clearing
while requests were pending. No uncaught browser errors were observed.

For a manual check with the normal app, open two products, reload, follow a
recent-product link, then clear history with a second product tab open. Both
tabs should update, and the cart should retain its contents.
