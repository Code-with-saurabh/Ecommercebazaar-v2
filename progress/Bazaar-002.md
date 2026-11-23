# Bazaar-002 — API core, configuration pipeline, frontend reorg

**Date:** 2026-09-26 · **Commits:** `249ecf9`, `b7484dc`, `a70106e`

## Objective

Turn the Express skeleton into a production-shaped API core — environment
handling, DB lifecycle, error/rate-limit middleware, response envelopes — and
reorganise the frontend so later features have a predictable home.

## What changed

- `249ecf9` — phase scaffold: placeholder files for every planned model,
  middleware and route, `.env.example`, so the upgrade structure is visible.
- `b7484dc` — real API core:
  - `config/env.js` (typed env access + validation), `config/db.js` (connect,
    graceful disconnect),
  - `middleware/error.js` (central error handler), `middleware/rateLimit.js`,
  - `utils/APIResponse.js` (envelope `{success, message, data, meta}`),
  - `utils/ApiError.js`, `utils/asyncHandler.js`,
  - `server.js` entrypoint separating boot from `app.js`.
- `a70106e` — hardening + perf:
  - `middleware/security.js` (helmet-style headers), `middleware/sanitize.js`
    (mongo-operator stripping), `middleware/cache.js`,
  - frontend reorganisation into `layout/`, `pages/`, `components/`,
    `hooks/`, `store/` with consistent imports,
  - PWA assets and dependency updates.

## Verification

- Envelope shape asserted by the growing `tests/api.test.cjs` suite; rate
  limiter and sanitizer exercised against malformed bodies.

## State left behind

A backend where every new route inherits validation hooks, envelopes and
error handling for free, and a frontend directory structure that later
milestones (catalog, cart, checkout) slot into without reshuffling.
