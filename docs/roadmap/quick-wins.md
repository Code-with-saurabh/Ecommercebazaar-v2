# Phase 1 — Quick Wins

Small, high-value fixes. Each task is hours of work, touches few files, and
makes the existing app *correct* rather than bigger. **Do these first.**

---

## 1.1 Persist the cart across refreshes

| | |
|---|---|
| **Why** | Cart lives only in Redux memory — refresh empties it. Biggest UX bug. |
| **Where** | `frontend/src/store/Store.jsx`, new `frontend/src/store/persist.js` |
| **How** | Option A: add `redux-persist` with `localStorage` for the `Shirt` and `CartValue` slices. Option B (lighter): subscribe to the store and write to `localStorage`, hydrate on boot. |
| **Verify** | Add items → refresh → cart still has them; badge count matches. |

## 1.2 Keep cart quantities in Redux

| | |
|---|---|
| **Why** | Quantities are `useState` inside `Cart.jsx` — they reset on navigation, so totals can't be shown elsewhere (header, checkout). |
| **Where** | `frontend/src/store/slices/ForShirt.jsx`, `pages/Cart/Cart.jsx` |
| **How** | Store `qty` on each cart line (`{ ...item, qty: 1 }`) and add `changeQty(id, qty)` reducer; replace local state. |
| **Verify** | Set qty 3 → go to Home → back to Cart → still 3 and total correct. |

## 1.3 API base URL via env var

| | |
|---|---|
| **Why** | `http://localhost:5000` is hardcoded in two files — deployment will break instantly. |
| **Where** | `pages/Login/Login.jsx`, `pages/SignUp/Signup.jsx`, new `frontend/.env.example` |
| **How** | `const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';` — add a small `src/api.js`. Commit `.env.example` with `VITE_API_URL=http://localhost:5000`, add `.env*` to `.gitignore`. |
| **Verify** | App works unchanged locally; changing the var redirects calls. |

## 1.4 Category routes should actually filter

| | |
|---|---|
| **Why** | `/products/tshirt` and `/products/shoes` pass `category="T-shirts"` but `Products.jsx` takes no props → full catalog renders. |
| **Where** | `pages/Products/Products.jsx` |
| **How** | Accept `category`, and when provided show only the matching slice of `productCategories` (map friendly names → keys). |
| **Verify** | `/products/shoes` shows only the 20 shoes. |

## 1.5 Add a 404 catch-all route

| | |
|---|---|
| **Why** | Unknown URLs render an empty shell (header + footer only). |
| **Where** | `src/App.jsx` |
| **How** | Add `<Route path="*"><ErrorPage /></Route>` last in the `Switch`, or redirect to `/error?message=Page not found`. |
| **Verify** | Visit `/does-not-exist` → friendly error page. |

## 1.6 Fix signup redirect race

| | |
|---|---|
| **Why** | `history.push('/login')` runs *before* axios resolves, so failed registrations still land on login with no feedback. |
| **Where** | `pages/SignUp/Signup.jsx` |
| **How** | Move `history.push('/login')` into `.then()`, show a success message, and route failures to `/error` only in `.catch()`. |
| **Verify** | Register with a duplicate email → you stay on the form and see the error. |

## 1.7 Real form validation (Formik + Yup are installed but unused)

| | |
|---|---|
| **Why** | Validation is HTML5-only: no visible messages, Gmail-only pattern, `password maxLength=8`. |
| **Where** | `pages/SignUp/Signup.jsx`, `pages/Login/Login.jsx` |
| **How** | Wire `formik` + `yup`: min 8 chars password, confirm-password field, generic email rule (not Gmail-only), inline field errors. |
| **Verify** | Invalid input shows field-level messages; valid input submits. |

## 1.8 Search improvements

| | |
|---|---|
| **Why** | Searching `shoes` often returns 0 results (category match **and** name must contain "shoes"). |
| **Where** | `pages/SearchPage/SearchPage.jsx`, `layout/Header/HeaderComponents/Search.jsx` |
| **How** | (a) If the query matches a category, return the whole category. (b) Also match `BrandName`. (c) Search across name + brand with a small scoring. (d) Remove `console.log`s. (e) Re-enable an autocomplete `<datalist>` generated from categories/brands. |
| **Verify** | `shoes` → all shoes; `nike` → Nike; `zzz` → "No products found." |

## 1.9 Single source of truth for prices

| | |
|---|---|
| **Why** | `Home.jsx` hardcodes cards with prices that differ from the catalog slice (e.g. id 103 shows `123` on Home, `423` in Products). |
| **Where** | `pages/Home/Home.jsx` |
| **How** | Render Home sections from `state.AllProduct.productCategories` (or a `recommended` id list), instead of literal props. |
| **Verify** | Same product shows the same price on Home, Products, Search and Cart. |

## 1.10 Fix duplicate-id / duplicate-add UX

| | |
|---|---|
| **Why** | Adding an already-carted item silently does nothing (only `console.warn`), while the badge still increments → badge can exceed the item count. |
| **Where** | `store/slices/ForShirt.jsx`, `pages/Home/Card.jsx`, `layout/Header/HeaderComponents/Cart.jsx` |
| **How** | Return a flag from the reducer (or compare before dispatching); show "Already in cart" toast; only increment `CartValue` when an item was actually added; dedupe ids across categories (`1001`, `1030` appear twice). |
| **Verify** | Add same product twice → one line, badge stays 1, user sees a message. |

## 1.11 Cleanup dead code & stale config

- Delete `pages/Products/Products-Backup.jsx` (not imported).
- Remove CRA leftovers: `src/logo.svg`, commented blocks in `index.jsx`,
  commented `<datalist>` in `Search.jsx`.
- Decide on the service worker: either delete `serviceWorker*.jsx` or add
  `vite-plugin-pwa` (see Phase 4). Today `serviceWorker.unregister()` is called.
- Remove backend packages from frontend `dependencies`
  (`express`, `mongoose`, `cors`, `body-parser`) and the stale
  `eslintConfig: react-app`.
- Remove unused `counter` slice or wire it to something.

## 1.12 Error/notice UX

| | |
|---|---|
| **Why** | Errors are either silent or a full page redirect; no loading states anywhere. |
| **Where** | `pages/Login`, `pages/SignUp`, `Card.jsx`, `Cart.jsx` |
| **How** | Small toast helper (or `react-hot-toast`), spinner/disabled button while a request is in flight, inline success message after signup. |
| **Verify** | Login with wrong password → clear message; button shows loading state. |

## 1.13 Developer experience

- Root `package.json` with `concurrently` to run both apps:
  `npm run dev` at repo root → backend :5000 + frontend :3000.
- Add `nodemon` for backend watch mode.
- Add `.env.example` files for both apps.
- Add `npm run check` = `vite build` (fast smoke test before pushing).

## Definition of done (Phase 1)

- [ ] Cart survives refresh, quantities survive navigation
- [ ] No hardcoded `localhost` URLs in components
- [ ] Category routes filter; unknown routes show 404 page
- [ ] Signup errors shown before redirect; validation messages visible
- [ ] Search returns sensible results for category and brand queries
- [ ] Prices consistent everywhere; no duplicate-id warnings
- [ ] Dead files removed; `npm run build` passes; `git status` clean
