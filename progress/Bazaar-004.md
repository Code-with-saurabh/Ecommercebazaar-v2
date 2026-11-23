# Bazaar-004 — JWT auth, refresh rotation, admin API, frontend session, ESLint

**Date:** 2026-10-03 · **Commits:** `0446dd0`, `e3ef455`, `d3e1642`

## Objective

Full authentication story: short-lived access tokens, rotating refresh tokens
in httpOnly cookies, role guards, an admin surface, silent refresh on the
frontend, and lint infrastructure to keep it all honest.

## What changed

- `0446dd0` — backend auth:
  - `middleware/auth.js`: `requireAuth`, `requireRole('admin')`, refresh
    verification with **tokenVersion** revocation (password change bumps it,
    killing every session),
  - `routes/auth.js`: register/login/refresh/logout,
  - `routes/admin.js`: role-guarded admin endpoints,
  - `scripts/seed-admin.js`: creates the `admin` / `Admin@12345` user,
  - auth tests added to `api.test.cjs`.
- `e3ef455` — frontend session:
  - `utils/session.js`: token storage, `subscribeAuth` change bus,
    **silent refresh** interceptor in `api.js` (single-flight refresh on 401),
  - header shows Login/Account state, `Admin` link only for role=admin,
  - admin panel page with role guards (bounces non-admins to `/login`).
- `d3e1642` — ESLint flat config for backend and frontend, `lint` scripts,
  repo-wide error cleanup, unused `React` imports stripped.

## Verification

- Auth tests: register → login → refresh rotation → revoke on password
  change → role guards (403 for users on admin routes).
- `npm run lint` clean in both packages.

## State left behind

A usable identity layer: sessions survive refresh via silent renewal, admin
area is gated twice (route + page), and CI-able lint scripts exist.
