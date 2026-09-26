# Tech Stack

Versions below are the ones declared in `frontend/package.json` and
`backend/package.json` (state as of 2026-02).

## Frontend (`frontend/`)

| Technology | Version | Role |
|---|---|---|
| **React** | ^18.3.1 | UI library (uses the `createRoot` API) |
| **React DOM** | ^18.3.1 | DOM renderer |
| **Vite** | ^8.3.1 (dev) | Dev server + bundler — replaced CRA (`react-scripts`) |
| **@vitejs/plugin-react** | ^6.1.1 (dev) | JSX / Fast Refresh support |
| **React Router DOM** | ^5.3.4 | Client routing (`Switch`, `Route`, `useHistory`, `Link`) |
| **Redux Toolkit** | ^2.2.6 | `createSlice` / `configureStore` — state management |
| **React Redux** | ^9.1.2 | `useSelector` / `useDispatch` bindings |
| **axios** | ^1.7.9 | Login / Signup API calls |
| **prop-types** | (transitive) | Prop validation on the Card component |

### Declared but UNUSED in frontend code

| Package | Note |
|---|---|
| `formik`, `yup` | Never imported — signup/login currently use plain `useState` plus HTML5 validation. Good candidates for real form validation (see roadmap). |
| `express`, `mongoose`, `cors`, `body-parser` | Backend packages that ended up in frontend `dependencies` too — the frontend does not need them. Cleanup candidate. |
| `eslintConfig: react-app` | Leftover CRA config, but ESLint itself is not installed, so `eslint` does not currently run. |

### Vite config

`frontend/vite.config.mjs`:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server:   { port: 3000 },
  preview:  { port: 3000 },
});
```

The entry HTML is `frontend/index.html` (instead of CRA's `public/index.html`),
with the script tag:
`<script type="module" src="/src/main.jsx"></script>`.

> **Important rule:** under Vite 8, files containing JSX must have the `.jsx`
> extension. JSX inside a `.js` file fails the build (the oxc parser has JSX
> disabled for `.js`). That is why the whole `src/` tree was renamed from `.js`
> to `.jsx`. Details: [`../setup/troubleshooting.md`](../setup/troubleshooting.md).

## Backend (`backend/`)

| Technology | Version | Role |
|---|---|---|
| **Express** | ~4.16.1 | HTTP server + routing |
| **Mongoose** | ^5.13.22 | MongoDB ODM (User model) |
| **mongodb** | ^3.7.4 | Driver (used through mongoose) |
| **bcryptjs** | ^2.4.3 | Password hashing (10 salt rounds) |
| **cors** | ^2.8.5 | Cross-origin requests (currently fully open) |
| **body-parser** | ^1.20.3 | JSON body parsing |

### Declared but UNUSED in backend

`cookie-parser`, `morgan`, `jade`, `http-errors` are never imported by
`app.js` / `routes/`. Cleanup candidates (or start using `morgan` for logging).

## Database

| | |
|---|---|
| **Engine** | MongoDB |
| **Default URI** | `mongodb://127.0.0.1:27017/ecommerce` (local) |
| **Override** | env var `mongoURL` (`set mongoURL=mongodb+srv://...`) |
| **Collections (today)** | `users` (mongoose model `User`) |

Note: the old MongoDB Atlas cluster is dead, so local MongoDB is the default
(commented in `backend/app.js`).

## Runtime / tooling

| Tool | Version (this machine) | Note |
|---|---|---|
| Node.js | v24.12.0 | |
| npm | 11.6.2 | |
| Git | 2.52.0 | branches: `v1`, `master`, `main` |

## Ports

| Port | Service | Command |
|---|---|---|
| **3000** | Frontend (Vite dev) | `cd frontend && npm run dev` |
| **5000** | Backend (Express) | `cd backend && npm start` |
| **27017** | MongoDB (local) | MongoDB service |

## Migration note: CRA → Vite

The project originally ran on Create React App. Migrating to Vite 8 changed:

1. Removed `react-scripts` (~1200 packages fewer), added `vite` +
   `@vitejs/plugin-react`.
2. Moved `public/index.html` → `frontend/index.html` (Vite convention).
3. Scripts: `start`/`dev → vite`, `build → vite build`, `preview → vite preview`.
4. `process.env.*` → `import.meta.env.*` in the service worker files.
5. `src/**/*.js` → `*.jsx` (35 files) and updated import specifiers.
6. One old file (`Contact.jsx`) was Windows-1252 encoded — converted to UTF-8.
