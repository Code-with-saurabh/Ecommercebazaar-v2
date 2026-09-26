# Development Guide

## npm scripts

### `frontend/package.json`

| Script | Command | What it does |
|---|---|---|
| `npm run dev` | `vite` | Dev server with HMR on port 3000 |
| `npm start` | `vite` | Same as `dev` (kept for CRA muscle memory) |
| `npm run build` | `vite build` | Production bundle → `frontend/dist/` |
| `npm run preview` | `vite preview` | Serve the built `dist/` on port 3000 |

> There is **no `npm test`** anymore — `react-scripts` (which provided it) was
> removed during the Vite migration. The leftover `src/App.test.jsx` does not
> run. Setting up Vitest is in the roadmap.

### `backend/package.json`

| Script | Command | What it does |
|---|---|---|
| `npm start` | `node app.js` | Starts Express on `PORT` (default 5000) |

No nodemon/watch mode yet — restart the backend manually after changes.

## Environment variables

| Variable | Where | Default | Purpose |
|---|---|---|---|
| `mongoURL` | backend | `mongodb://127.0.0.1:27017/ecommerce` | MongoDB connection string |
| `PORT` | backend | `5000` | API port |

Example (Windows PowerShell):

```powershell
$env:mongoURL = "mongodb+srv://user:pass@cluster.mongodb.net/ecommerce"
npm start
```

**There is no frontend env var yet.** The API base URL
(`http://localhost:5000`) is hardcoded in `Login.jsx` and `Signup.jsx`.
Moving it to `import.meta.env.VITE_API_URL` (plus a `.env.example`) is a
roadmap quick win: [`../roadmap/quick-wins.md`](../roadmap/quick-wins.md).

Do not commit real secrets — `.env` files must stay out of git (add them to
`.gitignore` before you start using them).

## Ports

| Port | Service | Started by |
|---|---|---|
| 3000 | Vite dev server | `cd frontend && npm run dev` |
| 5000 | Express API | `cd backend && npm start` |
| 27017 | MongoDB | local MongoDB service |

Both 3000 and 5000 must be free before starting (only one app can own a port).

## Hot reload behaviour

- **Frontend:** Vite HMR — edits to `.jsx`/`.css` update instantly without a
  full reload; Redux state is preserved for component edits.
- **Backend:** no watch mode; restart `npm start` after editing `app.js`,
  `routes/` or `models/`.

## Git workflow

Current branches:

| Branch | Use |
|---|---|
| `main` | Default — everything merges here |
| `master` | Pre-Vite snapshot (read-only history) |
| `v1` | Original recovery snapshot (read-only history) |

Day-to-day:

```bash
git status
git checkout -b feature/your-branch
# ... edit, test ...
git add -A
git commit -m "Short imperative message"
git push -u origin feature/your-branch
```

Never push broken builds: always run `npm run build` in `frontend/` before
pushing. See [`../contributing/README.md`](../contributing/README.md).

## Recommended daily loop

1. Terminal A: `cd backend && npm start`
2. Terminal B: `cd frontend && npm run dev`
3. Browser: `http://localhost:3000`
4. After frontend edits → check the browser; after backend edits → restart
   terminal A and re-test with curl/postman.
5. Before pushing → `cd frontend && npm run build` (must end with
   `✓ built in ...`).

## Code conventions in short

- JSX files must end in `.jsx` (Vite 8 requirement).
- One component folder = `Component.jsx` + `Component.css` side by side.
- Redux: one `createSlice` per concern under `src/Components/Redux/`, wired in
  `src/Components/Store/Store.jsx`.

Full rules: [`../contributing/code-style.md`](../contributing/code-style.md).
