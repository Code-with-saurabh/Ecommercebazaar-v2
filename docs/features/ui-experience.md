# UI / Experience

The look-and-feel layer: media, layout, navigation and the small touches that
make the app feel like a store.

## Visual identity

| Asset | Location | Used for |
|---|---|---|
| Logo | `assets/img/Logo.png`, `Logo2.png`, `public/LOGO/` | Header + favicon |
| Favicons | `public/favicon.ico`, `favicon3.ico` | Tab icon (linked in `index.html`) |
| Fonts | `assets/FontFamilys/` | Roboto (weights 100–700), Material Design Icons, `SellenaBrush-x3JyK.ttf` (script/decorative) |
| Stars | `assets/img/star.png` | Static 5-star rating on every card |
| Icons | `assets/img/pngegg.png` (search), `shopping-cart.png`, `Cart.png`, `User.png` | Header controls |
| Social icons | `Github.png`, `Linkedin.png`, `Twitter.png`, `Instagram.png` | Footer links |

CSS is **co-located**: every component/page has its own `.css` next to its
`.jsx`, plus global styles in `assets/styles/index.css` and `App.css`.

## Background videos

Four MP4s in `assets/video/` are used as autoplaying, muted, looping backdrops:

| Video | Where | Purpose |
|---|---|---|
| `BGVideo.mp4` (~23 MB) | Empty cart state | Ambient background |
| `BGvedio1.mp4` (~4.6 MB) | `/ByNow` placeholder | "Working on it" screen |
| `background2.mp4` | Login + Signup forms | Form backdrop |
| `background.mp4` | (imported but commented out in Signup) | Unused |

> These files dominate the bundle size (the production JS is only ~259 kB, but
> the videos add tens of MB). Compressing/converting them to streaming-friendly
> formats or hosting them on a CDN is a roadmap item —
> [`../roadmap/scale-deploy.md`](../roadmap/scale-deploy.md).

## Home page

1. **Hero** (`Pages/Home/Hero.jsx`) — banner area with imagery/gradient.
2. **Recommended** — 4 product cards.
3. **Features** — 5 product cards.

Sections share the `.inDiv` / `.divIMG` layout classes.

## Header

`Header/main.jsx` assembles:

| Piece | File | Behaviour |
|---|---|---|
| Logo | `HeaderComponents/logo.jsx` | Links to `/` |
| Nav links | `HeaderComponents/NavLinks.jsx` | Main menu |
| Navbar | `Header/NavBar/Navbar.jsx` | Category navigation |
| Search | `HeaderComponents/Search.jsx` | Input + button → `/search?query=…` |
| Cart | `HeaderComponents/Cart.jsx` | Icon + **badge count** from `state.CartValue.value` |
| User | `HeaderComponents/User.jsx` | Login/Logout depending on `sessionStorage` |

The cart badge is the visible link between "Add to Cart" clicks and the cart page.

## Footer

`Footer/main.jsx` — site links plus four social anchors (GitHub, LinkedIn, X,
Instagram) opening in new tabs with `rel="noopener noreferrer"`.

## Scroll behaviour

`Components/ScrollToTop.jsx` — on every route change, scrolls the window to the
top. Without it, moving from a long product list to another page kept the old
scroll offset.

## Forms (Login / Signup)

- Floating labels: `<input class="floating-input">` + `<label>` that moves on
  focus/fill (`placeholder=" "` trick).
- Autoplaying muted background video behind the card.
- Inline error message block on login failure.

## Error page

`Pages/Error/ErrorPage.jsx` reads `?message=` and displays it — used both for
real errors and as a general notice screen (e.g. duplicate signup).

## Accessibility & polish status

| Aspect | Current state |
|---|---|
| Semantic HTML | Mostly `<div>`s; headings exist per section |
| Alt text | Product images use `alt="Product"` / `alt={product.name}` — generic, not descriptive |
| Star rating | Decorative images without `alt=""`/`aria-hidden` |
| Keyboard navigation | Relies on default browser behaviour; no focus management on route change |
| Colour contrast | Not audited |
| Reduced motion | Videos autoplay regardless of `prefers-reduced-motion` |
| Responsive layout | Grid-based CSS, but no dedicated mobile audit |
| Loading states | None (no spinners/skeletons) |
| Toasts/notifications | None (duplicate cart add is silent) |

Concrete improvements are listed in
[`../roadmap/scale-deploy.md`](../roadmap/scale-deploy.md) (UX/SEO/a11y section).

## Dead / leftover UI code

- `serviceWorker.jsx` + `serviceWorkerRegistration.jsx` — CRA PWA files; the
  app explicitly calls `serviceWorker.unregister()`.
- `logo.svg` — CRA default logo, unused.
- `Pages/Products/Products-Backup.jsx` — old copy, not imported.
- Commented-out `<datalist>` in the search bar.
