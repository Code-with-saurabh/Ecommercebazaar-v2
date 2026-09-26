# Troubleshooting

Known errors in this project and exactly how to fix them.

---

## 1. Vite build fails: `Unexpected JSX expression` in a `.js` file

**Symptom**

```
error during build:
[builtin:vite-transform] Unexpected JSX expression ...
JSX syntax is disabled and should be enabled via the parser options
  at src/index.js:14:3
```

**Cause:** Vite 8 uses the **oxc** parser (not esbuild). JSX is only enabled for
`.jsx` files; a `.js` file with JSX is a hard error. Setting `oxc: {...}` in
`vite.config` does **not** override this, and Vite 8 ignores `esbuild: {...}`
options entirely.

**Fix:** the file must be `.jsx`, and every import that references it must be
updated.

```bash
# rename
git mv src/foo.js src/foo.jsx
# then fix importers:  from './foo.js'  ->  from './foo'
```

The repo-wide migration already did this for all 35 files, so this error should
only reappear if you add a new `.js` file containing JSX.

---

## 2. Build fails: `Could not load ... stream did not contain valid UTF-8`

**Symptom**

```
[UNLOADABLE_DEPENDENCY] Could not load src/Components/Pages/Contact/Contact.jsx
  ... stream did not contain valid UTF-8
```

**Cause:** the source file is not valid UTF-8. `Contact.jsx` was saved as
**Windows-1252** (a `’` curly quote stored as byte `0x92`). Webpack tolerated
this; Vite/Rolldown does not.

**Fix:** convert the file to UTF-8. Only text files need this — **never** run a
text re-encoder over images/fonts/videos.

```js
// convert-cp1252.cjs  (run: node convert-cp1252.cjs path/to/file.jsx)
const fs = require('fs');
const p = process.argv[2];
const buf = fs.readFileSync(p);
const CP1252 = { 0x80:0x20AC, 0x91:0x2018, 0x92:0x2019, 0x93:0x201C,
                 0x94:0x201D, 0x96:0x2013, 0x97:0x2014, 0x99:0x2122 };
let out = '';
for (const b of buf) out += String.fromCodePoint(CP1252[b] ?? b);
fs.writeFileSync(p, out, 'utf8');
console.log('converted', p);
```

Detect a bad file first:

```bash
node -e "new TextDecoder('utf-8',{fatal:true}).decode(require('fs').readFileSync(process.argv[1]))" src/somefile.jsx
```

> **Lesson learned the hard way:** a naive "re-encode everything as UTF-8"
> script also rewrites binary assets (PNG/MP4/TTF) and corrupts them. If that
> ever happens, restore them from git:
> `git restore --source=main -- frontend/src/assets frontend/public`

---

## 3. `port 3000 is already in use` (or 5000)

**Cause:** a previous dev server is still running.

```powershell
# Windows PowerShell
Get-NetTCPConnection -LocalPort 3000 -State Listen
Stop-Process -Id <OwningProcess>
```

```bash
# macOS / Linux
lsof -i :3000
kill -9 <PID>
```

Alternative: run Vite on another port — `npm run dev -- --port 3001`.

---

## 4. Backend starts but `db: "disconnected"`

**Symptom:** `GET /api/health` returns `"db":"disconnected"`.

**Causes & fixes**

1. MongoDB not running → start the local MongoDB service (`mongod` / services.msc).
2. Wrong URI → set the override: `$env:mongoURL = "mongodb://127.0.0.1:27017/ecommerce"`.
3. Old Atlas cluster is dead → do **not** use the previous `mongodb+srv` URL;
   local is the default now.

Check: `curl http://localhost:5000/api/health`.

---

## 5. Login/Signup fails with a network error

**Symptom:** browser console shows
`POST http://localhost:5000/api/users/login net::ERR_CONNECTION_REFUSED`
or CORS errors.

**Fixes**

1. Backend not running → start it (`cd backend && npm start`).
2. API base URL is **hardcoded** to `http://localhost:5000` in
   `Login.jsx` / `Signup.jsx` — if you deployed the backend elsewhere, change
   those URLs (better: introduce `import.meta.env.VITE_API_URL`, see roadmap).
3. CORS is wide open (`cors()` with no options), so CORS itself should not
   block you; the problem is almost always that the API is simply not running.

---

## 6. Signup says "Duplicate data"

**Cause:** `username`, `email` **or** `phone` already exists in the `users`
collection (the backend checks all three), or the client-side duplicate check
against `state.Data.data` matched.

**Fix:** use different values, or clear the collection:

```bash
mongosh "mongodb://127.0.0.1:27017/ecommerce" --eval "db.users.deleteMany({})"
```

---

## 7. Cart is empty after refresh / page reload

**Not a bug in the current scope** — cart and quantities live only in Redux
memory, which resets on reload. Persisting the cart (`redux-persist` /
`localStorage`) is a roadmap item:
[`../roadmap/quick-wins.md`](../roadmap/quick-wins.md).

---

## 8. `/products/tshirt` and `/products/shoes` show all products

**Cause:** `App.jsx` passes a `category` prop, but `Products.jsx` accepts no
props and always renders `state.AllProduct.productCategories` fully.

**Fix (roadmap quick win):**

```jsx
function Products({ category }) {
  const all = useSelector(state => state.AllProduct.productCategories);
  const data = category ? { [category.toLowerCase()+'s']: all[...] } : all;
  ...
}
```

See [`../roadmap/quick-wins.md`](../roadmap/quick-wins.md).

---

## 9. `npm test` / `npm run lint` do nothing useful

**Cause:** `react-scripts` was removed with the CRA migration, and ESLint is not
installed. `package.json` still contains a stale `eslintConfig: react-app` and
a stale `App.test.jsx`.

**Fix:** install Vitest + React Testing Library and ESLint (flat config), or
delete the stale files. Both are in
[`../roadmap/quality-security.md`](../roadmap/quality-security.md).

---

## 10. Install problems / weird cached state

```bash
rm -rf node_modules package-lock.json   # or: Remove-Item -Recurse -Force node_modules
npm install
```

If `npm install` tries to build native modules you do not need, remember that
frontend `dependencies` still list backend packages (`express`, `mongoose`) —
removing them is a cleanup item.

---

## Quick diagnostic checklist

```bash
# 1. ports free?
Get-NetTCPConnection -LocalPort 3000,5000 -State Listen     # PowerShell

# 2. backend healthy?
curl http://localhost:5000/api/health

# 3. frontend builds?
cd frontend && npm run build        # must end with "✓ built in ..."

# 4. frontend serves?
curl http://localhost:3000/          # HTTP 200, <title>Bazaar</title>

# 5. git clean?
git status --short                   # should be empty before pushing
```
