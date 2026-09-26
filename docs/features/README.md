# Features

Everything the app does today, documented feature by feature.

## Feature status matrix

| # | Feature | Status | Doc |
|---|---|---|---|
| 1 | Routing & page layout | ✅ Working | [`routing-pages.md`](routing-pages.md) |
| 2 | Product catalog & cards | ✅ Working (client-side data) | [`product-catalog.md`](product-catalog.md) |
| 3 | Cart (add/remove/quantity/totals) | ✅ Working (in-memory) | [`cart-checkout.md`](cart-checkout.md) |
| 4 | Checkout / Buy now | ⛔ Placeholder page | [`cart-checkout.md`](cart-checkout.md#checkout--by-now-placeholder) |
| 5 | Search | ✅ Working | [`search.md`](search.md) |
| 6 | Signup / Login / Logout | ⚠️ Working, no real session | [`authentication.md`](authentication.md) |
| 7 | UI/UX (hero, video, scroll, footer, fonts) | ✅ Working | [`ui-experience.md`](ui-experience.md) |

Legend: ✅ complete · ⚠️ works but has known gaps · ⛔ not built yet

## Pages at a glance

| Route | Page | Purpose |
|---|---|---|
| `/` | Home | Hero video + Recommended + Features cards |
| `/products` | Products | Catalog grouped by category |
| `/products/tshirt`, `/products/shoes` | Products | Category links — **currently render the full catalog** |
| `/search?query=…` | SearchPage | Filtered results |
| `/cart` | Cart | Items, quantities, totals |
| `/ByNow` | ByNow | Checkout placeholder |
| `/login` | Login | Sign in |
| `/signup` | SignUp | Create account |
| `/about`, `/help`, `/contact` | static pages | Info pages |
| `/error?message=…` | ErrorPage | Error/notice screen |

## Data the app owns

| Data | Lives in | Persisted? |
|---|---|---|
| Product catalog (60 items, 4 categories) | Redux slice `AllProduct` (`ForSearch.jsx`) | ❌ hardcoded in source |
| Cart items | Redux slice `Shirt` (`ForShirt.jsx`) | ❌ memory only |
| Cart badge count | Redux slice `CartValue` | ❌ memory only |
| Quantities per cart line | local `useState` in `Cart.jsx` | ❌ memory only |
| Signups of the current session | Redux slice `Data` | ❌ memory only |
| User accounts | MongoDB `users` collection | ✅ yes |
| Login state | `sessionStorage.isLoggedIn` (boolean) | ⚠️ per-tab, forgeable |

## What is intentionally missing

Checkout/payment, orders, product database, reviews, wishlist, coupons and an
admin panel — all planned in [`../roadmap/`](../roadmap/).
