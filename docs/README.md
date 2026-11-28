# Bazaar — Project Documentation

Complete documentation for the Bazaar project. Each folder covers one topic:
start with what the project is, then features, then the future roadmap.

## Folder map

| Folder | What it covers | When to read |
|---|---|---|
| [`overview/`](overview/) | About the project, tech stack, architecture | Once, at the start |
| [`setup/`](setup/) | Install, run, dev workflow, troubleshooting | Before running it the first time |
| [`features/`](features/) | Every feature in detail (routing, cart, search, auth, UI) | When you need feature specifics |
| [`api/`](api/) | Backend endpoints, request/response, data model | While working on the backend |
| [`roadmap/`](roadmap/) | Future improvements — 4 phases, prioritised | When deciding what to build next |
| [`contributing/`](contributing/) | Code style, naming rules, git workflow | Before writing code |

## Quick links

- **Continue the commercial redesign** → [`reviews/handoff.md`](reviews/handoff.md) · [audit](roadmap/storefront-review.md) · [photo library](../photos/README.md)
- **What is this project?** → [`overview/about.md`](overview/about.md)
- **How do I run it?** → [`setup/installation.md`](setup/installation.md)
- **What works today?** → [`features/README.md`](features/README.md)
- **What should I add next?** → [`roadmap/README.md`](roadmap/README.md)
- **I hit an error** → [`setup/troubleshooting.md`](setup/troubleshooting.md)

## Project at a glance

- **Name:** Bazaar (repo: `Ecommercebazaar-v2`)
- **Type:** Full-stack e-commerce storefront (React + Express + MongoDB)
- **Frontend:** React 18 + Vite 8, React Router v5, Redux Toolkit — `frontend/`
- **Backend:** Express + Mongoose, MongoDB — `backend/`
- **Shopping:** Mongo-backed catalog and bag, authenticated cash-on-delivery checkout, receipts, tracking, account, reviews and admin operations. See the current [verification and launch gaps](reviews/handoff.md).

## Branches

| Branch | What it is |
|---|---|
| `main` | Current — post-Vite-migration state (source of truth) |
| `master` | Pre-Vite (Create React App) state |
| `v1` | Original recovery snapshot |
