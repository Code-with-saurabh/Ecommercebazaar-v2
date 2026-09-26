# Architecture

How the code is organised and how data moves through the app.

## Repository structure

```
EC/
+-- frontend/                     React SPA (Vite dev server, port 3000)
|   +-- index.html                Vite entry HTML (root, NOT in public/)
|   +-- vite.config.mjs           Vite config (react plugin, port 3000)
|   +-- package.json              scripts: dev / build / preview
|   +-- public/                   static files copied as-is (favicons, logos)
|   +-- src/
|       +-- index.jsx             ReactDOM root: Router + Redux Provider
|       +-- App.jsx               route table (Switch)
|       +-- serviceWorker.jsx             CRA leftovers (unregistered)
|       +-- serviceWorkerRegistration.jsx CRA leftovers (unregistered)
|       +-- Components/
|           +-- Header/           header: main.jsx, NavBar/, HeaderComponents/
|           |   +-- HeaderComponents/  Cart, Search, User, NavLinks, logo
|           +-- Footer/           footer with social links
|           +-- Pages/            one folder per page (jsx + css each)
|           |   +-- Home/         Home, Hero, Card
|           |   +-- Products/     Products, Products-Backup (old copy)
|           |   +-- Cart/, Login/, SignUp/, SearchPage/, ByNow/
|           |   +-- About/, Help/, Contact/, Error/
|           +-- Redux/            Redux Toolkit slices
|           +-- Store/Store.jsx   configureStore
|           +-- ScrollToTop.jsx   scroll to top on route change
|       +-- assets/               img/, video/, styles/, FontFamilys/
+-- backend/                      Express API (port 5000)
|   +-- app.js                    express app, CORS, mongoose, /api/health
|   +-- routes/users.js           POST /register, POST /login
|   +-- models/User.js            mongoose schema
+-- docs/                         this documentation
+-- old-site/                     original built site (gitignored)
```

## Frontend boot sequence

```
frontend/index.html
  -> src/index.jsx
       createRoot(#root).render(
         <React.StrictMode>
           <BrowserRouter>
             <Provider store={Store}>
               <App />
             </Provider>
           </BrowserRouter>
         </React.StrictMode>
       )
       serviceWorker.unregister()
  -> App.jsx renders Header + <Switch> routes + Footer
```

- `ScrollToTop` runs on every route change and scrolls the window to the top.
- Header and Footer render on **every** page (they sit outside the `<Switch>`).

## Routing table (`src/App.jsx`)

| Path | Component | Notes |
|---|---|---|
| `/` (exact) | `Home` | Hero + Recommended + Features cards |
| `/about` | `About` | Static about page |
| `/products` | `Products` | All categories, sectioned |
| `/products/tshirt` | `<Products category="T-shirts" />` | **`category` prop is ignored** — `Products` takes no props, so this renders the full catalog |
| `/products/shoes` | `<Products category="Shoes" />` | Same issue as above |
| `/login` | `Login` | POST `/api/users/login` |
| `/signup` | `SignUp` | POST `/api/users/register` |
| `/error` | `ErrorPage` | Reads `?message=` query param |
| `/cart` | `Cart` | Cart list + totals |
| `/help` | `Help` | Static help page |
| `/contact` | `Contact` | Contact page (CP1252-encoded file, converted to UTF-8) |
| `/search` | `SearchPage` | Reads `?query=` |
| `/ByNow` | `ByNow` | Checkout placeholder — "Sorry, We Are Working On It!!" |

Router version is **react-router-dom v5** (`Switch`, `useHistory`), not v6
(`Routes`, `useNavigate`). Migration is on the roadmap.

## Redux store (`src/Components/Store/Store.jsx`)

| Slice key | File | State shape | Used by |
|---|---|---|---|
| `counter` | `Redux/Counter.jsx` | counter value | (demo slice) |
| `CartValue` | `Redux/ForCart.jsx` | `{ value: number }` — cart badge count | `Header/.../Cart.jsx` (badge) |
| `Shirt` | `Redux/ForShirt.jsx` | `{ products: [], duplicate: bool }` — cart items | `Cart.jsx`, `Card.jsx` |
| `Data` | `Redux/AllFormData.jsx` | `{ data: [] }` — signups this session | `Signup.jsx` (duplicate check) |
| `AllProduct` | `Redux/ForSearch.jsx` | `{ productCategories: { tshirts, shirts, pants, shoes } }` | `Products.jsx`, `SearchPage.jsx` |

### Data flow examples

**Add to cart**

```
Card "Add to Cart" click
  -> dispatch(additems({ id, Bname, name, price, image }))   # ForShirt slice
       if id already present -> duplicate = true, item NOT added
  -> dispatch(addCart())                                     # ForCart slice, value += 1
Header badge reads state.CartValue.value
/cart reads state.Shirt.products and computes totals
```

**Cart totals** (computed, not stored)

```js
totalItems = products.reduce((sum, p) => sum + qty(p.id), 0);
totalPrice = products.reduce((sum, p) => sum + qty(p.id) * Number(p.price), 0);
```

Quantities live in `Cart.jsx` local `useState` (default 1), not in Redux —
so quantities reset on navigation/refresh.

**Search**

```
Header Search input -> history.push('/search?query=...')
SearchPage reads ?query= from useLocation()
  -> exact category name match? filter that category by ProductName includes
  -> else flat-search every product by ProductName includes
  -> render <Card> list or "No products found."
```

**Auth**

```
Signup -> axios POST http://localhost:5000/api/users/register
            -> backend bcrypt-hashes password, saves User in MongoDB
Login  -> axios POST http://localhost:5000/api/users/login
            -> on success: sessionStorage.isLoggedIn = 'true'
                           dispatch a synthetic 'storage' event
                           history.push('/')
Header User component listens for 'storage' -> shows Login or Logout
```

There is **no token**: `sessionStorage` only holds a boolean flag, so any visitor
can set it manually. Real sessions/JWT are on the roadmap.

## Backend structure (`backend/`)

```
app.js
  +-- cors()                 all origins allowed
  +-- bodyParser.json()
  +-- mongoose.connect(mongoURL || local)
  +-- GET  /api/health       { status, db, uptime }
  +-- app.use('/api/users', routes/users)
        +-- POST /register   { username, email, phone, password }
        +-- POST /login      { username, password }
app.listen(PORT || 5000)
```

## Build pipeline

```
npm run build  ->  vite build  ->  frontend/dist/
                                     index.html
                                     assets/index-*.js   (~259 kB, ~87 kB gzip)
                                     assets/index-*.css  (~17 kB, ~4 kB gzip)
                                     assets/*.{jpg,png,mp4,...}  (hashed copies)
npm run preview -> vite preview on port 3000 (serves dist/)
```

Note: the bundle currently inlines/loads large media (the `BGVideo.mp4` alone is
~23 MB) — media optimisation and code splitting are in the roadmap
([`../roadmap/scale-deploy.md`](../roadmap/scale-deploy.md)).
