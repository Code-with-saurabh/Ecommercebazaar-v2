# About the Project

## Identity

| | |
|---|---|
| **App name** | **Bazaar** (same as the `<title>` tag) |
| **Repo** | `Code-with-saurabh/Ecommercebazaar-v2` |
| **Type** | Full-stack e-commerce storefront (web app) |
| **Author** | Saurabh |
| **License** | ISC (`frontend/package.json`) |
| **Versions** | `v1` (recovery) → `master` (CRA) → `main` (Vite, current) |

## What is this project?

**Bazaar** is an online clothing store: a React frontend plus a lightweight
Express backend. A visitor can browse clothing categories (T-shirts, Shirts,
Pants, Shoes), search for products, add items to a cart, see the cart total, and
sign up / log in with an account.

It is a **learning / portfolio project**. The goal is not to launch real
production payments today, but to build a complete e-commerce UI and auth flow
that gets connected to a real backend step by step.

## Architecture in one line

```
React SPA (frontend/, port 3000)  --axios-->  Express API (backend/, port 5000)  --mongoose-->  MongoDB (local, 27017)
        |
        +-- Redux store (catalog + cart + form data) -- currently client-side, in-memory
```

- The **frontend** keeps its catalog (60 products) **hardcoded** in Redux.
- The **backend** currently exposes only **auth** (register/login) and a
  **health check**.

## What a user can do today

1. View the home page — hero video plus "Recommended" and "Features" product cards.
2. Browse all categories on `/products`.
3. Search from the header → results on `/search?query=...`.
4. Click "Add to Cart" on any card to put an item in the cart.
5. On `/cart`: change quantity (+/-), remove items, and see the **Items + Total**
   summary.
6. Create an account on `/signup` (the backend stores a bcrypt-hashed password).
7. Log in on `/login` → the header login/logout state updates.
8. Read the About, Help and Contact pages; an unknown URL shows the error page.

## Current status (honest scope)

| Area | Status |
|---|---|
| Browse + categories | ✅ Working (client-side catalog) |
| Search | ✅ Working (category + product-name matching) |
| Cart + totals | ✅ Working (in-memory — lost on refresh) |
| Signup / Login | ✅ Working (API + Mongo) — but **no session/JWT** |
| Checkout / Payment | ❌ Placeholder page (`/ByNow` — "Sorry, We Are Working On It!!") |
| Products in DB | ❌ Catalog is hardcoded in the frontend |
| Orders / Order history | ❌ Not started |
| Admin panel | ❌ Not started |
| Tests / Lint / CI | ❌ Not set up (the CRA test file is stale) |

These gaps are planned in detail in [`../roadmap/`](../roadmap/).

## Repo layout

```
EC/                      <- git repo root (this workspace)
+-- frontend/            <- React app (Vite) - port 3000
+-- backend/             <- Express API - port 5000
+-- docs/                <- this documentation
+-- old-site/            <- original built site (gitignored, reference only)
+-- .gitignore
+-- README.md
```

## Related docs

- How to install and run → [`../setup/installation.md`](../setup/installation.md)
- Feature list in detail → [`../features/README.md`](../features/README.md)
- Backend endpoints → [`../api/endpoints.md`](../api/endpoints.md)
