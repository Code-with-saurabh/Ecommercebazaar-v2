# Routing & Pages

Routing is handled by **react-router-dom v5** inside `src/App.jsx`.

## Shell layout

Every route renders inside the same shell:

```jsx
<>
  <ScrollToTop />                 // scrolls window to top on route change
  <div className="Header"><Header /></div>
  <div className="mainPage">
    <Switch> ...routes... </Switch>
  </div>
  <div className="FDIV"><Footer /></div>
</>
```

- **Header** and **Footer** are always visible.
- **ScrollToTop** (`src/components/ScrollToTop.jsx`) listens to route changes —
  without it, navigating from a long page kept the scroll position mid-page.
- Layout CSS lives in `src/assets/styles/App.css` (`.Header`, `.mainPage`, `.FDIV`).

## Complete route table

| Path | Component | File | Notes |
|---|---|---|---|
| `/` (exact) | `Home` | `pages/Home/Home.jsx` | Hero + Recommended + Features |
| `/about` | `About` | `pages/About/About.jsx` | Static content |
| `/products` | `Products` | `pages/Products/Products.jsx` | Full catalog, grouped by category |
| `/products/tshirt` | `<Products category="T-shirts" />` | same | **Prop ignored** — full catalog renders |
| `/products/shoes` | `<Products category="Shoes" />` | same | **Prop ignored** — full catalog renders |
| `/login` | `Login` | `pages/Login/Login.jsx` | API login |
| `/signup` | `SignUp` | `pages/SignUp/Signup.jsx` | API register |
| `/error` | `ErrorPage` | `pages/Error/ErrorPage.jsx` | Shows `?message=` |
| `/cart` | `Cart` | `pages/Cart/Cart.jsx` | Cart list + summary |
| `/help` | `Help` | `pages/Help/Help.jsx` | Static |
| `/contact` | `Contact` | `pages/Contact/Contact.jsx` | Static contact info |
| `/search` | `SearchPage` | `pages/SearchPage/SearchPage.jsx` | Reads `?query=` |
| `/ByNow` | `ByNow` | `pages/ByNow/ByNow.jsx` | Checkout placeholder |

Anything else: no catch-all route exists, so unknown paths render the empty
shell (header + footer only). A `path="*"` fallback is a roadmap quick win.

## Page anatomy

Each page is a folder containing a component and its CSS:

```
pages/Cart/
  Cart.jsx     component logic + markup
  Cart.css     page-scoped styles
```

Shared UI pieces:

| Component | Used for |
|---|---|
| `pages/Home/Card.jsx` | The product card used on Home, Products and Search results |
| `pages/Home/Hero.jsx` | Home hero banner/video |
| `layout/Header/HeaderComponents/*` | Cart badge, Search bar, User/login block, NavLinks, logo |
| `layout/Header/NavBar/Navbar.jsx` | Category navigation |
| `layout/Footer/main.jsx` | Footer + social links |
| `ScrollToTop.jsx` | Route-change scroll reset |

## Navigation entry points

- Header nav links → About / Products / Help / Contact etc.
- Header search box → `/search?query=…`
- Header cart icon (badge) → `/cart`
- Header user icon → Login / Logout depending on `sessionStorage`
- Login ↔ Signup cross links
- Cart item "By Now" button → `/ByNow`
- Error page is reached programmatically: `history.push('/error?message=…')`

## Known routing gaps

| Gap | Detail | Roadmap item |
|---|---|---|
| No 404 catch-all | Unknown URLs render an empty shell | quick-wins |
| Category routes ignore prop | `/products/tshirt` shows everything | quick-wins |
| react-router v5 | `Switch`/`useHistory` are legacy APIs | quick-wins (v6 migration) |
| No protected routes | `/cart`, `/ByNow` are open regardless of login | commerce-core |
| Query params read manually | `useLocation().search` parsing duplicated | quick-wins (shared helper) |
