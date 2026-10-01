# Architecture

How the code is organised and how data moves through the app.

## Repository structure

```
EC/
+-- frontend/                     React SPA (Vite dev server, port 3000)
|   +-- index.html                Vite entry HTML (preloads: hero jpg + woff2 fonts, metas)
|   +-- vite.config.mjs           react plugin, port 3000, manualChunks vendor split
|   +-- package.json              scripts: dev / build / preview
|   +-- public/                   static files copied as-is
|   |   +-- sw.js                 service worker (prod PWA caching)
|   |   +-- manifest.json         PWA manifest (Bazaar)
|   +-- src/
|       +-- main.jsx              ReactDOM root: Router + Redux Provider + SW registration
|       +-- App.jsx               lazy routes + Suspense + 404 catch-all
|       +-- api.js                shared axios instance (envelope unwrapping)
|       +-- config.js             apiUrl / timeouts / storage keys
|       +-- layout/
|       |   +-- Header/           main.jsx, NavBar/, HeaderComponents/ (Cart, Search, User, NavLinks, Logo)
|       |   +-- Footer/           footer with social links
|       +-- pages/                one folder per page (jsx + css each)
|       |   +-- Home/             Home, Hero (LCP img)
|       |   +-- Products/         Products (VirtualGrid + route category)
|       |   +-- Cart/, Login/, SignUp/, SearchPage/, ByNow/
|       |   +-- About/, Help/, Contact/, Error/ (404 + /error)
|       +-- components/
|       |   +-- LazyVideo/        background video: visible + idle before loading
|       |   +-- VirtualGrid/      windowed grid/flex list (spacers, DOM-measured rows)
|       |   +-- ProductCard/      product card (Home, Products, Search results)
|       |   +-- List/             generic list (renderItem/keyExtractor, empty + loading)
|       |   +-- Toast/, Spinner/, ScrollToTop
|       |   +-- ErrorBoundary/
|       +-- hooks/                useDebounce, useRafThrottle, usePrefersReducedMotion
|       +-- utils/                session.js (login flag), search.js, ApiError.js
|       +-- store/                Store.jsx, slices/ (Redux Toolkit), persist.js
|       +-- pwa/                  registerSW.js (prod only, hourly update())
|       +-- assets/               img/, video/, styles/, FontFamilys/
+-- backend/                      Express API (port 5000)
|   +-- app.js                    middleware pipeline (see below) - wiring only
|   +-- server.js                 entry: validateEnv -> connect DB -> listen -> guard
|   +-- config/env.js             .env loader, TRUST_PROXY, rate-limit knobs, mongoose options
|   +-- config/cors.js            CORS allow-list middleware (CORS_ORIGIN)
|   +-- middleware/
|   |   +-- security.js           CSP, HSTS, nosniff, frame/referrer/permissions
|   |   +-- requestId.js          X-Request-Id correlation id
|   |   +-- sanitize.js           strips $/. keys from body/query (NoSQL injection guard)
|   |   +-- cache.js              Cache-Control: no-store for API responses
|   |   +-- rateLimit.js          apiLimiter / authLimiter / loginLimiter
|   |   +-- spa.js                static frontend/dist + SPA fallback + cache headers
|   |   +-- error.js              404 + error handler (envelope)
|   +-- routes/health.js          GET /api/health (before the rate limiter)
|   +-- routes/users.js           POST /register (409 dup), POST /login (401, timing-safe)
|   +-- models/User.js            mongoose schema (select:false password)
|   +-- utils/                    ApiError, ApiResponse (envelope), asyncHandler, validation
+-- docs/                         this documentation
+-- old-site/                     original built site (gitignored)
```

## Frontend boot sequence

```
frontend/index.html
  -> preload Hero1.jpg (fetchpriority=high) + Roboto woff2 (font-display:swap)
  -> src/main.jsx
       createRoot(#root).render(
         <React.StrictMode>
           <BrowserRouter>
             <Provider store={Store}>
               <App />
             </Provider>
           </BrowserRouter>
         </React.StrictMode>
       )
       registerServiceWorker()      # src/pwa/registerSW.js, production only
  -> App.jsx renders Header + <Suspense><Switch> routes</Suspense> + Footer
```

- `ScrollToTop` runs on every route change and scrolls the window to the top.
- Header and Footer render on **every** page (they sit outside the `<Switch>`).
- Every page is `React.lazy`; the Suspense fallback is a spinner block.

## Routing table (`src/App.jsx`)

| Path | Component | Notes |
|---|---|---|
| `/` (exact) | `Home` | Hero + Recommended + Features cards |
| `/about` | `About` | Static about page |
| `/products` (exact) | `Products` | All categories, sectioned, each a `VirtualGrid` |
| `/products/tshirt` | `<Products category="T-shirts" />` | renders **only** the tshirts section |
| `/products/shoes` | `<Products category="Shoes" />` | renders only the shoes section |
| `/login` | `Login` | POST `/api/users/login` via `src/api.js` |
| `/signup` | `SignUp` | POST `/api/users/register`, awaits response |
| `/error` | `ErrorPage` | Reads `?message=` query param |
| `/cart` | `Cart` | Cart list + quantities + totals |
| `/help` | `Help` | Static help page |
| `/contact` | `Contact` | Contact page |
| `/search` | `SearchPage` | Reads `?query=`, ranked results |
| `/ByNow` | `ByNow` | Checkout placeholder |
| *(catch-all)* | `ErrorPage` | **404** for unknown URLs (was a blank page) |

Router version is **react-router-dom v5** (`Switch`, `useHistory`), not v6
(`Routes`, `useNavigate`). Migration is on the roadmap.

## Redux store (`src/store/Store.jsx`)

| Slice key | File | State shape | Used by |
|---|---|---|---|
| `CartValue` | `store/slices/ForCart.jsx` | `{ value, ids }` — badge **derived** from the unique ids in `Shirt.products` | header `Cart.jsx` (badge) |
| `Shirt` | `store/slices/ForShirt.jsx` | `{ products: [], duplicate: bool }` — cart items | `Cart.jsx`, `ProductCard.jsx` |
| `Data` | `store/slices/AllFormData.jsx` | `{ data: [] }` — signups this session | `Signup.jsx` (duplicate check) |
| `AllProduct` | `store/slices/ForSearch.jsx` | `{ productCategories: { tshirts, shirts, pants, shoes } }` | `Products.jsx`, `SearchPage.jsx`, header `Search.jsx` |

### Data flow examples

**Add to cart**

```
Card "Add to Cart" click (button shows "In Cart" once added)
  -> dispatch(additems({ id, Bname, name, price, image }))   # ForShirt slice
       if id already present -> item NOT added (slice guard)
  -> ForCart extraReducers listen: ids[] keeps unique ids, value = ids.length
Header badge reads state.CartValue.value   # always === Shirt.products.length
/cart reads state.Shirt.products and computes totals
```

The old design incremented the badge on every dispatch, so pressing "Add to
Cart" twice made the badge drift from the real cart size. The badge is now
**derived**, so it can never desync. (`addCart`/`removeCart` remain as no-ops
for compatibility.)

**Cart totals** (computed, not stored)

```js
totalItems = products.reduce((sum, p) => sum + qty(p.id), 0);
totalPrice = products.reduce((sum, p) => sum + qty(p.id) * Number(p.price), 0);
```

Quantities live in `Cart.jsx` local `useState` (default 1, clamped 1–99,
NaN-safe) — so quantities reset on navigation/refresh.

**Search** (see [`../features/search.md`](../features/search.md))

```
Header Search input --useDebouncedValue(250ms)--> live suggestions
submit -> history.push('/search?query=...')
SearchPage -> searchProducts() (utils/search.js): category hit | name | brand
           -> <VirtualGrid layout="flex"> of <Card>s + result count
```

**Auth** (see [`../features/authentication.md`](../features/authentication.md))

```
Signup -> await post('/users/register', ...)
           success -> dispatch(AddToDB) -> push('/login')   # after response
           failure -> inline 400/409 message
Login  -> await post('/users/login', ...)
           success -> setLoggedIn(true)  (utils/session.js) -> push('/')
Header User component subscribes to 'bazaar:auth' -> shows Login or Logout
```

There is **no token**: `sessionStorage` only holds a boolean flag, so any visitor
can set it manually. Real sessions/JWT are on the roadmap.

## Backend structure (`backend/`)

```
app.js pipeline (in order):
  trust proxy (TRUST_PROXY env)      x-powered-by off
  CORS allow-list (CORS_ORIGIN)      security headers + X-Request-Id
  access log (morgan, prod)          express.json (limit)
  sanitize ($/. key strip)           compression (streaming gzip)
  static frontend/dist               + /assets/* immutable, index.html no-cache
  SPA fallback (any non-/api GET)
  apiCache (no-store) + apiLimiter (300/15min) on /api  [health excluded]
  authLimiter (20/15min) + /api/users router
       POST /register   201 | 400 validation | 409 duplicate
       POST /login      200 | 401 generic (+ timing equaliser) | 429 login limiter
  GET /api/health       { status, db, uptime, version }
  404 -> error handler (envelope, 500 stack in dev only)
```

## Service worker (`public/sw.js`, production only)

- Cache name `bazaar-v1` (bump to re-trap assets on releases).
- Navigations: network-first with `/index.html` fallback (stays fresh, works
  offline after first visit).
- `/assets/*`: cache-first (hashed filenames are immutable).
- Other same-origin GETs: stale-while-revalidate.
- Cross-origin requests are skipped (never cache the API).
- Registered only when `import.meta.env.PROD`; `registration.update()` hourly.

## Build pipeline

```
npm run build  ->  vite build (rolldown)  ->  frontend/dist/
                                     index.html
                                     assets/vendor-react-*.js   (~160 kB, ~53 kB gzip)
                                     assets/vendor-redux-*.js   (~25 kB)
                                     assets/vendor-http-*.js    (~34 kB)
                                     assets/index-*.js          (~27 kB)  + per-route chunks
                                     assets/*.{jpg,png,mp4,woff2}  hashed copies
npm run preview -> vite preview on port 3000 (serves dist/)
```

- Route-level `React.lazy` keeps the initial JS small; `manualChunks` splits
  long-lived vendor code so returning users only re-download app chunks.
- Large media still ships as-is (Hero jpgs ~1.5–3 MB each) — media
  optimisation is on the roadmap
  ([`../roadmap/scale-deploy.md`](../roadmap/scale-deploy.md)).
