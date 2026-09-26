# Contributing

How to work on this project without breaking it.

## Before you start

1. Read [`../overview/architecture.md`](../overview/architecture.md) — know where things live.
2. Read [`code-style.md`](code-style.md) — naming, file and state conventions.
3. Keep [`../setup/troubleshooting.md`](../setup/troubleshooting.md) open — it
   covers the errors you will actually hit (`.jsx` requirement, encoding, ports).

## Getting set up

```bash
# terminal 1
cd backend && npm install && npm start        # :5000

# terminal 2
cd frontend && npm install && npm run dev     # :3000
```

Details: [`../setup/installation.md`](../setup/installation.md).

## Branching

| Branch | Rule |
|---|---|
| `main` | Default. Everything lands here. |
| `master`, `v1` | **History only** — never commit to them. |
| `feature/…` | New work: `feature/cart-persist`, `feature/products-api` |
| `fix/…` | Bug fixes: `fix/signup-redirect` |
| `docs/…` | Documentation only |
| `chore/…` | Tooling, deps, config |

```bash
git checkout main
git pull
git checkout -b feature/your-change
```

## The commit loop

1. **Write code** following [`code-style.md`](code-style.md).
2. **Test manually** in the browser (both servers running).
3. **Build must pass** — this is the project's only automated gate today:

   ```bash
   cd frontend && npm run build     # must end with: ✓ built in ...
   ```

4. **Check git status** — nothing unintended (no `node_modules`, no `dist/`,
   no `.env`, no stray temp scripts):

   ```bash
   git status --short
   ```

5. **Commit** with a clear message:

   ```
   Add localStorage persistence for the cart

   - store Shirt + CartValue slices on every dispatch
   - hydrate the store on boot
   - keeps badge count in sync after refresh
   ```

6. **Push your branch**, open a PR against `main`.

```bash
git add -A
git commit -m "Short imperative summary"
git push -u origin feature/your-change
```

## Commit message style

- Imperative mood, lowercase start, no trailing period:
  `add cart persistence`, `fix signup redirect race`, `update docs`
- Subject ≤ ~72 characters.
- Body explains **what** and **why** (wrap at ~72 chars).
- One logical change per commit; do not mix a feature with a reformat.

## What not to commit

- `node_modules/`, `dist/`, `build/`
- `.env` files and secrets (use `.env.example` with dummy values)
- `old-site/` (gitignored reference copy)
- Editor/OS junk (`.DS_Store`, `Thumbs.db`)
- Temporary debug scripts

## Review checklist (for the PR author)

- [ ] `npm run build` passes in `frontend/`
- [ ] Manual test of the touched flow (e.g. add → cart → totals)
- [ ] No `console.log` left behind
- [ ] No hardcoded `localhost` URLs added
- [ ] New files use the correct extension (`.jsx` for JSX!)
- [ ] Docs updated if behaviour changed (`docs/`)
- [ ] `git status` clean, nothing unintended staged

## Reporting issues

Include:

1. What you did (exact route / steps).
2. What you expected.
3. What happened (error text, console screenshot).
4. Environment: OS, Node version, branch/commit.
5. Backend health output: `curl http://localhost:5000/api/health`.

## Security reports

Do not open a public issue for vulnerabilities (weak auth, exposed secrets).
Contact the maintainer privately first; see
[`../roadmap/quality-security.md`](../roadmap/quality-security.md) for the
hardening plan.
