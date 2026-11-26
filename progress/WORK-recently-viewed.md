# Recently viewed products — parallel-session work

**Date:** 2026-11-26 · **Status:** Implemented and verified; uncommitted

## Scope and coordination

This session added a browser-local recently viewed product shelf. The
working tree was clean apart from the pre-existing untracked `opencode.ai`
when work began, at `3260d9e`.

Files owned by this task:

- `frontend/src/components/RecentlyViewed/` (new component, styles, data loader)
- `frontend/src/utils/recentlyViewed.js` (new bounded history store)
- `frontend/tests/recently-viewed.test.mjs` (new standalone Node tests)
- `docs/features/recently-viewed.md` (new feature guide)
- Small guide links in `docs/features/README.md` and `progress/README.md`
- This work note

The only edit this task made to an existing source file is an import and
`<RecentlyViewed currentProductId={product._id} />` in
`frontend/src/pages/ProductDetail/ProductDetail.jsx`, after the related-products
section. If another session redesigns that page, preserve that integration
inside the successful-product render. The component records only resolved
product IDs, not route names or failed requests. The other session was actively
redesigning ProductDetail when integration began; a patch against the old
layout was rejected before any source changes applied. Integration was then
added to the latest editorial layout. ProductDetail's broader JSX/CSS changes
and the concurrent Cart/Checkout redesigns belong to the other session.

## Implemented behavior

- Keep the eight most recently opened product IDs in this browser, newest first.
- Show up to four previous products, excluding the currently open product.
- Re-fetch product data so saved history never supplies cached prices or stock.
- Include clear-history, loading, retry, and unavailable-product states.
- Synchronize history across tabs; fall back to memory if storage is blocked.
- Reuse the existing product cards and editorial design tokens.

## Documentation findings

Read all 40 Markdown files present at task start, including all ten journal
milestones, the setup/contributing/API/feature/roadmap trees, and design briefs.
Many documents in `docs/` describe the early recovery snapshot rather than the
current implementation. The journal is newer but stops before the editorial
redesign, newsletter, and URL-driven catalog commits. Current source and recent
commits therefore determine feature availability.

## Verification

- `node --test tests/recently-viewed.test.mjs` from `frontend/`: **15/15 pass**.
- Frontend `npm run lint`: **0 errors, 11 pre-existing warnings** in other files.
- Targeted ESLint for the new component, store, loader, and tests with
  `--max-warnings 0`: **passes**.
- Frontend `npm run build`: **passes**, including the integrated shelf.
- `git diff --check`: **passes**, including the documentation changes.
- Headless Edge smoke checks against a separate Vite server with intercepted
  API fixtures: **pass** for browsing and SPA navigation, reload persistence,
  current-product exclusion, live price refresh, 375px layout, Quick Add,
  cross-tab updates/clear, cart preservation, four-card display cap, failed-page
  exclusion, partial failures, retry, all-removed state, and clear during pending
  requests. **No uncaught browser errors.**
- Browser tooling and fixture script were installed in an isolated temporary
  directory; project manifests and lockfiles were not changed. The temporary
  browser and server were closed after verification.

Normal dev servers on ports 3000/5000 were not running during the browser check;
the smoke test used fixtures rather than a live database. Backend code was not
changed by this task. No commit has been requested or created by this session.

Feature documentation: [`docs/features/recently-viewed.md`](../docs/features/recently-viewed.md).
