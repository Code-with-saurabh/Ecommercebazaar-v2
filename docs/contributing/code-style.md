# Code Style & Conventions

Rules that keep the codebase consistent. Existing code is the source of truth —
when in doubt, copy the pattern of a neighbouring file.

---

## 1. File naming

| Thing | Rule | Example |
|---|---|---|
| Components with JSX | **`.jsx` extension (mandatory)** | `Cart.jsx` |
| Plain JS modules (no JSX) | `.js` | `convert.cjs` utilities |
| Config / one-off scripts | `.mjs` / `.cjs` | `vite.config.mjs` |
| Styles | same base name as the component | `Cart.css` next to `Cart.jsx` |
| Slices | `For*.jsx` (existing convention) | `ForCart.jsx`, `ForShirt.jsx` |
| Pages | one folder per page | `pages/Cart/Cart.jsx` + `Cart.css` |

> **Why `.jsx`:** Vite 8's oxc parser has JSX disabled for `.js`. A `.js` file
> containing JSX fails the build with
> `Unexpected JSX expression … JSX syntax is disabled`. Never rename a JSX file
> back to `.js`.

Component names are **PascalCase**; filenames follow the existing mixed style
(`main.jsx` in layout/Header/Footer is legacy — do not spread it to new
files; new components should be PascalCase: `ProductCard.jsx`, `Logo.jsx`).

---

## 2. Component structure

```jsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import './Thing.css';

function Thing({ title = 'Default' }) {
  const items = useSelector(state => state.Shirt.products);
  const dispatch = useDispatch();

  function handleClick(id) {
    dispatch(removeitems(id));
  }

  return (
    <div className="thing">
      <h2>{title}</h2>
      ...
    </div>
  );
}

export default Thing;
```

- Function components only (no class components).
- Default export, one component per file.
- Hooks at the top; derive values, minimise `useEffect`.
- Keep JSX indentation consistent with the file (tabs are used in parts of the
  existing code — match the file you are editing).

---

## 3. State management (Redux Toolkit)

**Do**

- One `createSlice` per concern in `src/store/slices/`.
- Wire it in `src/store/Store.jsx`.
- Select with `useSelector(state => state.<slice>.<field>)`.
- Keep slices small and serialisable (plain data only — no class instances).

```js
// src/store/slices/ForCart.jsx  — existing pattern
const CartSlice = createSlice({
  name: 'cart',
  initialState: { value: 0 },
  reducers: {
    addCart: state => { state.value += 1; },
    removeCart: state => { state.value -= 1; },
  },
});
export const { addCart, removeCart } = CartSlice.actions;
export default CartSlice.reducer;
```

**Don't**

- Put async thunks inside page components — add them to the slice.
- Store derived values (totals) when they can be computed in the component.
- Reach for local component state when the value is needed by two components.

---

## 4. Routing (react-router v5)

The project is on **v5**: `<Switch>`, `<Route path exact>`, `useHistory()`,
`<Link to>`.

```jsx
// v5 — current codebase
import { Switch, Route, useHistory, Link } from 'react-router-dom';
history.push('/search?query=' + encodeURIComponent(q));

// v6 — NOT yet adopted (migration is a roadmap item)
// <Routes>, useNavigate(), <Route path="/x" element={<X />} />
```

Do not mix v5 and v6 APIs in the same file.

---

## 5. Data & API rules

- Base URL: read from `import.meta.env.VITE_API_URL` (introduce `src/api.js`);
  **never** hardcode `http://localhost:5000` in new code.
- Use one shared `axios` instance with a base URL and error interceptor.
- Always `await`/`.catch()` API calls and surface a user-visible error.
- Prices: keep as numbers in new code; existing data is `string` (call `Number()`).
- Never log passwords, tokens or full user objects.

---

## 6. Styling

- Co-located CSS file per component (`Thing.css`), imported by `Thing.jsx`.
- Existing class naming is mixed (BEM-ish `cart-summary-CC`, plain `.card`,
  `.desc-CC`) — for **new** styles use kebab-case block names, e.g.
  `.cart-summary`, `.cart-summary__total`.
- Global styles only in `src/assets/styles/index.css` / `App.css`.
- No CSS-in-JS libraries; no inline style objects for anything reusable.
- Avoid `!important`.

---

## 7. Validation & forms

- Use `formik` + `yup` (already installed) for new/edited forms.
- Keep HTML5 `required` as a fallback, but show visible field errors.
- Password: min 8 characters with mixed types; do not cap at 8.

---

## 8. Accessibility baseline

- Meaningful `alt` on content images; `alt=""` on decorative ones.
- Every form control has a `<label>`.
- Buttons are `<button>` (not clickable `<div>`).
- External links with `target="_blank"` need `rel="noopener noreferrer"`.

---

## 9. Comments

- Comments explain **why**, not what. Keep them short and in English.
- Do not leave commented-out code blocks in new contributions — use git history.
- No banners/ASCII art noise.

---

## 10. Testing expectations (once Vitest exists)

- New logic → a test alongside it (`Thing.test.jsx`).
- Redux reducers and money calculations are the highest-value targets.
- Do not commit a change that fails `npm test` or `npm run build`.

---

## 11. Dependencies

- Check if a library is already present before adding one.
- Prefer the standard tooling already in the repo (Vite, Redux Toolkit, axios).
- Backend dependencies belong in `backend/package.json` only.
- Record any new dependency in [`../overview/tech-stack.md`](../overview/tech-stack.md).

---

## 12. Security habits

- Secrets in `.env` only (and `.env` never committed).
- Validate server-side for everything the client validates.
- Hash passwords with bcrypt; never store or log plain text.
- Do not disable CORS globally outside local development.
