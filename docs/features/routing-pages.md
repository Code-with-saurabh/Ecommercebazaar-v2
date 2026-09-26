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
- **ScrollToTop** (`src/Components/ScrollToTop.jsx`) listens to route changes —
  without it, navigating from a long page kept the scroll position mid-page.
- Layout CSS lives in `src/assets/styles/App.css` (`.Header`, `.mainPage`, `.FDIV`).

## Complete route table

| Path | Component | File | Notes |
|---|---|---|---|
| `/` (exact) | `Home` | `Pages/Home/Home.jsx` | Hero + Recommended + Features |
| `/about` | `About` | `Pages/About/About.jsx` | Static content |
| `/products` | `Products` | `Pages/Products/Products.jsx` | Full catalog, grouped by category |
| `/products/tshirt` | `<Products category="T-shirts" />` | same | **Prop ignored** — full catalog renders |
| `/products/shoes` | `<Products category="Shoes" />` | same | **Prop ignored** — full catalog renders |
| `/login` | `Login` | `Pages/Login/Login.jsx` | API login |
| `/signup` | `SignUp` | `Pages/SignUp/Signup.jsx` | API register |
| `/error` | `ErrorPage` | `Pages/Error/ErrorPage.jsx` | Shows `?message=` |
| `/cart` | `Cart` | `Pages/Cart/Cart.jsx` | Cart list + summary |
| `/help` | `Help` | `Pages/Help/Help.jsx` | Static |
| `/contact` | `Contact` | `Pages/Contact/Contact.jsx` | Static contact info |
| `/search` | `SearchPage` | `Pages/SearchPage/SearchPage.jsx` | Reads `?query=` |
| `/ByNow` | `ByNow` | `Pages/ByNow/ByNow.jsx` | Checkout placeholder |

Anything else: no catch-all route exists, so unknown paths render the empty
shell (header + footer only). A `path="*"` fallback is a roadmap quick win.

## Page anatomy

Each page is a folder containing a component and its CSS:

```
Pages/Cart/
  Cart.jsx     component logic + markup
  Cart.css     page-scoped styles
```

Shared UI pieces:

| Component | Used for |
|---|---|
| `Pages/Home/Card.jsx` | The product card used on Home, Products and Search results |
| `Pages/Home/Hero.jsx` | Home hero banner/video |
| `Header/HeaderComponents/*` | Cart badge, Search bar, User/login block, NavLinks, logo |
| `Header/NavBar/Navbar.jsx` | Category navigation |
| `Footer/main.jsx` | Footer + social links |
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
