# Roadmap — Future Improvements

What to build next, in priority order. Each phase is a separate document with
concrete tasks, suggested implementation and acceptance criteria.

## Phases

| Phase | Doc | Theme | Effort | Impact |
|---|---|---|---|---|
| **1** | [`quick-wins.md`](quick-wins.md) | Fix bugs, polish, small quality-of-life wins | Small (hours each) | High — makes the existing app correct |
| **2** | [`commerce-core.md`](commerce-core.md) | Real commerce: products in DB, cart persistence, orders, payments, admin | Medium–Large | Very high — makes it a real store |
| **3** | [`quality-security.md`](quality-security.md) | Tests, lint, CI, security hardening, code quality | Medium | High — makes it safe and maintainable |
| **4** | [`scale-deploy.md`](scale-deploy.md) | Performance, deployment, SEO, a11y, monitoring, i18n | Medium | Medium–High — makes it production-grade |

## Priority matrix

```
        HIGH IMPACT
             |
   Phase 2   |   Phase 1
 (commerce)  |  (quick wins)   <- start here
             |
 LOW EFFORT -+---------------------------- HIGH EFFORT
             |
   Phase 3   |   Phase 4
 (quality)   |  (scale/deploy)
             |
        LOW IMPACT
```

**Recommended order:** Phase 1 → Phase 2 (core) → Phase 3 (security/tests) → Phase 4.

Phase 3 items marked **security-critical** should be pulled forward as soon as
the API is exposed to the internet (do not deploy publicly before them).

## Top 10 things to do first

1. Persist the cart (`redux-persist` + `localStorage`) — users currently lose it on refresh.
2. Move the API base URL to `import.meta.env.VITE_API_URL` (+ `.env.example`).
3. Fix `/products/tshirt` and `/products/shoes` actually filtering (prop is ignored today).
4. Fix signup redirecting to `/login` before the API responds.
5. Add a 404 catch-all route.
6. Improve search (category-only results, brand search, remove `console.log`).
7. Move products into MongoDB with a `GET /api/products` endpoint.
8. Implement real sessions (JWT or httpOnly cookies) + protected routes.
9. Add Vitest + a couple of smoke tests, and set up ESLint.
10. Build checkout: address → order → payment → order history.

## How to use these docs

- Pick a phase, open its doc, take **one task** at a time.
- Every task lists: what, where (file paths), how, and how to verify.
- Update this status table as you finish things.

| Phase | Status |
|---|---|
| 1 — Quick wins | ⬜ Not started |
| 2 — Commerce core | ⬜ Not started |
| 3 — Quality & security | ⬜ Not started |
| 4 — Scale & deploy | ⬜ Not started |

## Ideas backlog (not yet scoped)

- Wishlist and "save for later"
- Size / colour / variant selection
- Related products and "customers also bought"
- Coupons, referral credits, loyalty points
- Email notifications (order confirmation, password reset)
- Multi-vendor / seller accounts
- Wishlist sharing and social login (Google OAuth)
- AI-assisted search / recommendations
- Mobile app (React Native) reusing the same API
