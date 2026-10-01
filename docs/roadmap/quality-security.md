# Phase 3 — Quality & Security

Tests, static analysis, CI, and hardening the API. **Bold items are
security-critical — complete them before any public deployment.**

---

## 3.1 Testing

Today there is **no working test command** (`react-scripts` was removed) and
`src/App.test.jsx` is a stale CRA file.

**Set up Vitest + React Testing Library:**

```bash
cd frontend
npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

```js
// vite.config.mjs
test: { environment: 'jsdom', globals: true, setupFiles: './src/test-setup.js' }
```

Scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

**Minimum test suite**

| Layer | Example test |
|---|---|
| Redux | `additems` adds once, second add sets `duplicate`; `removeitems` filters |
| Redux | `addCart` increments / `removeCart` decrements badge |
| Components | Card renders price/name, "Add to Cart" dispatches actions |
| Components | Cart shows `Items` and `Total` correctly (qty × price) |
| Components | SearchPage filters by name and shows empty state |
| Pages | Login failure shows the error message (mock axios) |
| API | `POST /register` → 201; duplicate → 400 (supertest + in-memory Mongo) |
| API | `POST /login` wrong password → 400 |
| E2E (later) | Playwright: browse → add to cart → cart totals |

Also add a **smoke test for the build**: `npm run build` must pass (it is the
fastest regression check you already have).

---

## 3.2 Linting & formatting

- Remove the stale `eslintConfig: react-app` from `package.json`.
- Install ESLint (flat config) + `eslint-plugin-react` +
  `eslint-plugin-react-hooks` + `eslint-plugin-jsx-a11y` + Prettier.
- Scripts: `"lint": "eslint ."`, `"format": "prettier --write ."`.
- Baseline rules to enforce immediately:
  - `no-console` (there are many debug `console.log`s),
  - `react-hooks/exhaustive-deps`,
  - unused vars/imports (there are several).

---

## 3.3 CI/CD (GitHub Actions)

`.github/workflows/ci.yml` on every push/PR:

```yaml
jobs:
  frontend: node 24 -> npm ci -> npm run lint -> npm test -> npm run build
  backend:  node 24 -> npm ci -> npm test
```

Later: deploy workflow (Phase 4) + branch protection requiring green CI.

---

## 3.4 Security — API

| Item | Action |
|---|---|
| **Auth tokens** | Issue a **JWT** on login (or an httpOnly, SameSite cookie). Return `{ token, user }`, not just a message. |
| **Protected routes** | `authMiddleware` verifying the token; protect cart, orders, profile, admin. |
| **Authorization** | Check resource ownership (`order.userId === req.user.id`) — prevent IDOR. |
| **CORS** | Replace `cors()` with an allow-list: `cors({ origin: ['http://localhost:3000', 'https://yourdomain.com'] })`. |
| **Rate limiting** | `express-rate-limit` on `/api/users/*` (e.g. 10 req/min/IP) to stop brute force. |
| **Helmet** | `helmet()` for secure HTTP headers. |
| **Input validation** | Validate every body with `zod`/`joi`/`express-validator` before touching the DB. |
| **Error handling** | Central error middleware; never leak stack traces to clients. |
| **Secrets** | `process.env.*` only; `.env` in `.gitignore`; never commit keys. |
| **Password policy** | Min length 8, mixed types; bcrypt cost ≥ 12. Consider `bcrypt` (native) for speed. |
| **Account safety** | Generic login errors (already done), lockout after N failures, login attempt logging. |
| **Payload limits** | `express.json({ limit: '100kb' })`. |
| **Dependency audit** | `npm audit` in CI; keep Mongoose current (v5 is very old). |
| **HTTPS** | Enforced at the reverse proxy/host in production. |

---

## 3.5 Security — Frontend

- Never store tokens in `localStorage` if you can use httpOnly cookies.
- Remove `console.log`s of user data.
- Add `rel="noopener noreferrer"` to all `target="_blank"` links (footer already does).
- Add a strict **CSP** once assets are on a CDN.
- Sanitise any user-generated content rendered in reviews/comments.

---

## 3.6 Code quality

| Item | Action |
|---|---|
| PropTypes / TypeScript | Either enforce PropTypes everywhere or migrate to TypeScript incrementally |
| Error boundaries | Add `<ErrorBoundary>` around routes so one crash doesn't blank the app |
| Loading/error states | Every async action needs loading + failure UI |
| Remove dead code | Remaining commented-out blocks in pages/slices/CSS (backup file, CRA leftovers and unused `counter` slice are already gone) |
| API layer | Single `src/api.js` with axios instance, interceptors, base URL from env |
| Backend watch | `nodemon` for dev |
| Logging | `morgan` (already a dependency) + structured error logs |
| Mongoose upgrade | v5 → v8 (breaking changes, but v5 is EOL) |
| Router upgrade | react-router v5 → v6 (`Switch`→`Routes`, `useHistory`→`useNavigate`) |
| Duplicate code | Home/Products/Search all build cards differently — share one data selector |

---

## 3.7 Data integrity

- Unique indexes on `username`, `email`, `phone` (schema says unique, but verify
  indexes exist and handle `11000` duplicate-key errors explicitly).
- Add `timestamps: true` to schemas.
- Migrate `price` from string to number end-to-end.
- Seed script for demo data + a reset script for local development.
- Backup strategy for the database (even a daily dump).

---

## Definition of done (Phase 3)

- [ ] `npm test` runs green locally and in CI
- [ ] `npm run lint` passes with zero errors
- [ ] CI blocks merges on lint/test/build failure
- [ ] Login returns a token; protected endpoints reject requests without it
- [ ] CORS restricted; rate limiting + helmet active
- [ ] No secrets in git; `npm audit` clean
- [ ] Error boundaries + loading states everywhere async happens
