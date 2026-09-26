# Phase 4 — Scale, Deploy & Polish

Production readiness: performance, hosting, SEO, accessibility, monitoring.

---

## 4.1 Performance

| Problem today | Fix |
|---|---|
| `BGVideo.mp4` ≈ **23 MB** sits in the bundle; other videos add tens of MB | Convert to H.264/H.265 MP4 (≤ 2–3 MB) or WebM, use `preload="none"`, poster image, or host on a CDN/YouTube embed |
| All images ship unoptimised (some 1–4 MB JPEG/PNG) | Emit WebP/AVIF, responsive `srcset`/`sizes`, lazy-load below the fold (`loading="lazy"`) |
| Single JS bundle (~259 kB) loads everything | Route-level code splitting: `React.lazy` + `<Suspense>` for each page |
| 60 products rendered at once | Virtualise long lists or paginate once the catalog grows |
| No font subsetting | Subset Roboto/Material icons to used glyphs; `font-display: swap` |
| No caching strategy | Hashed asset filenames already good — add long-lived `Cache-Control` headers |

**Targets:** First Contentful Paint < 1.5 s, Total page weight < 5 MB,
Lighthouse Performance ≥ 90.

**Verify:** `npm run build` output sizes, Lighthouse report, WebPageTest.

---

## 4.2 Code splitting & bundle budget

```jsx
const Cart = React.lazy(() => import('./pages/Cart/Cart'));
// wrap routes in <Suspense fallback={<Spinner />}>
```

Add a CI check that fails if the JS bundle grows beyond a set budget
(e.g. 300 kB raw / 100 kB gzip).

---

## 4.3 PWA / offline

Two options:

1. Delete the CRA leftovers (`serviceWorker.jsx`,
   `serviceWorkerRegistration.jsx`, `unregister()` call) — simplest.
2. Add `vite-plugin-pwa` (Workbox): precache the shell, cache-first for images,
   offline fallback page, install prompt.

Pick one; do not leave dead CRA code in place.

---

## 4.4 Deployment

| Piece | Suggested host | Notes |
|---|---|---|
| Frontend | **Vercel** / **Netlify** / GitHub Pages | Build: `npm run build`, output: `frontend/dist`, SPA rewrite → `index.html` |
| Backend | **Render** / **Railway** / Fly.io | `npm start`, set `PORT` + `mongoURL` env vars |
| Database | **MongoDB Atlas** (free tier) | Old cluster is dead — create a new one, store the URI as a secret |
| Media | **Cloudinary / S3 / CDN** | Move videos and heavy images out of the repo |

Environment matrix:

| Env | Frontend | Backend | DB |
|---|---|---|---|
| local | `localhost:3000` | `localhost:5000` | local Mongo |
| staging | staging URL | staging URL | Atlas staging DB |
| production | production URL | production URL | Atlas production DB |

Pre-deploy checklist:

- [ ] `VITE_API_URL` set for the target environment (no hardcoded localhost)
- [ ] CORS allow-list includes the frontend origin
- [ ] `mongoURL` is a secret, not committed
- [ ] `npm run build` passes; SPA rewrite configured
- [ ] Health check `GET /api/health` monitored

---

## 4.5 SEO

React SPA — needs explicit work:

- Unique `<title>` and `<meta name="description">` per route
  (add `react-helmet-async`, or a tiny custom hook).
- Canonical URLs, Open Graph and Twitter card tags.
- Product structured data (`JSON-LD` Product/Offer) once products have detail pages.
- Generate a `sitemap.xml` + `robots.txt`.
- Server-side rendering (Next.js) is the long-term option if SEO becomes
  critical — note this would be a framework migration, not a small task.

---

## 4.6 Accessibility (a11y)

- Real landmarks: `<header> <nav> <main> <footer>` instead of `<div>`s.
- Descriptive `alt` text for product images; `alt=""`/`aria-hidden` for
  decorative stars/icons.
- Visible focus styles; skip-to-content link.
- Keyboard operation for the cart quantity controls and search.
- Announce dynamic updates (cart added, search results) via `aria-live`.
- Respect `prefers-reduced-motion` — pause autoplay videos.
- Colour contrast audit (WCAG AA).
- Run Lighthouse a11y + axe DevTools on every page.

---

## 4.7 Internationalisation (i18n) & currency

- Add `react-i18next` with English + Hindi (or your target languages).
- Currency formatting via `Intl.NumberFormat` (currently raw `$` + `toFixed(2)`).
- Localise date/time and phone validation (the current pattern is India-specific).

---

## 4.8 Analytics & product insight

- Privacy-friendly analytics: **Plausible** / **Umami** (or GA4).
- Events to track: `view_product`, `add_to_cart`, `begin_checkout`,
  `purchase`, `search`, `signup`, `login`.
- Funnel: where do users drop off between cart and payment?

---

## 4.9 Monitoring & logging

| Layer | Tool |
|---|---|
| Frontend errors | **Sentry** browser SDK |
| Backend errors | Sentry Node SDK + structured logs (pino) |
| Uptime | Health-check ping on `/api/health` (UptimeRobot/BetterStack) |
| Performance | Sentry tracing / OpenTelemetry |
| Logs | Centralised (Render/Railway logs, or Grafana/Loki) |

Alert on: error rate spike, `/api/health` failing, DB disconnected, payment failures.

---

## 4.10 Infrastructure as code

- **Docker:** `frontend/Dockerfile` (build → nginx serving `dist`),
  `backend/Dockerfile` (node alpine), `docker-compose.yml` with mongo + both apps.
- Benefits: identical local/prod environments, one-command onboarding.
- Optional: Terraform/Ansible once you have real infra.

---

## 4.11 Backup, privacy & compliance

- Automated DB backups (Atlas snapshots or daily dumps).
- GDPR-ish basics: privacy policy, data export/delete for users.
- Retention rules for orders/logs.
- `.env` rotation; secret scanning in CI (gitleaks).

---

## Definition of done (Phase 4)

- [ ] Lighthouse ≥ 90 on performance/a11y/SEO for Home and Products
- [ ] Page weight < 5 MB; no multi-MB videos in the bundle
- [ ] Frontend + backend deployed with CI/CD and health monitoring
- [ ] Error tracking in place; no unhandled crashes in production
- [ ] Per-route meta tags, sitemap, robots.txt live
- [ ] a11y issues from the audit resolved
