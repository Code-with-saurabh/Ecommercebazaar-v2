# Installation & Running

## Prerequisites

| Requirement | Version used here | Why |
|---|---|---|
| **Node.js** | v24.12.0 | Runs Vite + Express |
| **npm** | 11.6.2 | Package manager |
| **MongoDB** | local server on `27017` | Backend stores users |
| **Git** | 2.52.0 | Clone the repo |

Check them:

```bash
node -v
npm -v
git --version
```

MongoDB must be running locally (default URI `mongodb://127.0.0.1:27017/ecommerce`).
Start it with your local service, or `mongod` directly.

## 1. Clone

```bash
git clone https://github.com/Code-with-saurabh/Ecommercebazaar-v2.git
cd Ecommercebazaar-v2
```

## 2. Backend (port 5000)

```bash
cd backend
npm install
npm start
```

Expected output:

```
Connected to MongoDB
Server running on port 5000
```

Verify:

```bash
curl http://localhost:5000/api/health
# {"status":"ok","db":"connected","uptime":12.34}
```

If `db` says `"disconnected"`, MongoDB is not running (see
[troubleshooting](troubleshooting.md#backend-starts-but-dbdisconnected)).

## 3. Frontend (port 3000)

Open a **second** terminal:

```bash
cd frontend
npm install
npm run dev        # `npm start` does the same thing
```

Expected output:

```
VITE v8.3.1  ready in 812 ms
  Local:   http://localhost:3000/
```

Open **http://localhost:3000** in the browser — the page title should be
**Bazaar**.

## 4. Verify the whole stack

| Check | Expected |
|---|---|
| `http://localhost:3000` | Bazaar home page, HTTP 200 |
| `http://localhost:3000/products` | Product sections |
| `http://localhost:5000/api/health` | `{"status":"ok","db":"connected",...}` |
| Sign up a new user, then log in | Redirects to `/`, header shows logged-in state |
| Add a product, open `/cart` | Item appears with **Items** and **Total** |

## Production build (optional)

```bash
cd frontend
npm run build      # outputs frontend/dist/
npm run preview    # serves the built app on port 3000
```

## Stopping the servers

- Frontend: `Ctrl+C` in its terminal (or kill the process listening on 3000).
- Backend: `Ctrl+C` in its terminal (process listening on 5000).

## One-command run (future)

There is no root-level script yet that starts both apps together — you run two
terminals today. Adding a root `package.json` with `concurrently` is listed in
[`../roadmap/quick-wins.md`](../roadmap/quick-wins.md).
