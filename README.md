# Ecommercebazaar-v2

Full-stack e-commerce app (**Bazaar**) — recovered, reorganized and running.

## Structure

- `frontend/` — React app (Vite): components, pages, Redux store, assets (images / videos / fonts)
- `backend/` — Express + MongoDB API (`/api/users/register`, `/api/users/login`)

## Run

```bash
# backend (uses local MongoDB, override with mongoURL env var)
cd backend && npm install && npm start        # http://localhost:5000

# frontend
cd frontend && npm install && npm start       # http://localhost:3000
```
