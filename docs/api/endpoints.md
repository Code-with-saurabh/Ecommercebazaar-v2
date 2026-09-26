# API Endpoints (reference)

Base URL: `http://localhost:5000` · Content type: `application/json`

## Response envelope

Every endpoint (health included) returns a consistent envelope:

```json
// success
{ "success": true,  "message": "…", "data": { … }, "meta": { … } }

// failure
{ "success": false, "message": "…", "details": [ … ] }
```

`data` and `meta` are omitted when empty; `details` appears on validation errors
(`[{ "field": "email", "message": "…" }]`). `stack` may appear on 5xx in
development only.

Rate-limit headers are attached to all `/api` responses except `/api/health`:

```
X-RateLimit-Limit: 300        (20 for /api/users/*)
X-RateLimit-Remaining: 299
X-RateLimit-Reset: 2026-09-26T13:11:47.872Z
Retry-After: 899              (only on 429)
```

---

## 1. `GET /api/health`

Liveness check used by monitoring and manual testing. **No auth required.**

### 200 OK

```json
{
  "status": "ok",
  "db": "connected",
  "uptime": 1696.11
}
```

| Field | Meaning |
|---|---|
| `status` | Always `"ok"` if the process is alive |
| `db` | `"connected"` when `mongoose.connection.readyState === 1`, else `"disconnected"` |
| `uptime` | Process uptime in seconds (`process.uptime()`) |

### Test

```bash
curl http://localhost:5000/api/health
```

---

## 2. `POST /api/users/register`

Creates a new user. **No auth required.**

### Request

```json
{
  "username": "saurabh",
  "email": "saurabh@gmail.com",
  "phone": "9876543210",
  "password": "secret123"
}
```

| Field | Required | Notes |
|---|---|---|
| `username` | ✅ | unique in DB |
| `email` | ✅ | unique in DB (frontend restricts to `@gmail.com` via HTML5 `pattern`) |
| `phone` | ✅ | unique in DB (frontend restricts to 10 digits starting 7/8/9) |
| `password` | ✅ | stored **hashed** with bcrypt (10 salt rounds) |

### Responses

| Status | Body | When |
|---|---|---|
| `201` | `{"success":true,"message":"User registered successfully","data":{…}}` | Created (`data` = `{id, username, email, phone}` — never the password) |
| `400` | `{"success":false,"message":"Duplicate data"}` | username **or** email **or** phone already exists |
| `400` | `{"success":false,"message":"username, email, phone and password are required"}` | Missing field |
| `400` | `{"success":false,"message":"Validation failed","details":[…]}` | Schema validation error |
| `429` | `{"success":false,"message":"Too many auth attempts…","details":{"retryAfter":899}}` | Auth rate limit hit |
| `500` | `{"success":false,"message":"Internal server error"}` | Unexpected failure |

### Server logic

```js
User.findOne({ $or: [{ username }, { email }, { phone }] })
  if found -> 400 "Duplicate data"
bcrypt.hash(password, 10) -> new User(...).save() -> 201
```

### Test

```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","email":"demo@gmail.com","phone":"9876543210","password":"secret123"}'
```

---

## 3. `POST /api/users/login`

Verifies credentials. **No auth required** (and no token is issued).

### Request

```json
{ "username": "saurabh", "password": "secret123" }
```

### Responses

| Status | Body | When |
|---|---|---|
| `200` | `{"success":true,"message":"Login successful","data":{…}}` | Username exists and bcrypt matches (`data` = `{id, username}`) |
| `400` | `{"success":false,"message":"Invalid username or password"}` | Unknown username **or** wrong password (same message on purpose) |
| `400` | `{"success":false,"message":"username and password are required"}` | Missing field |
| `429` | `{"success":false,"message":"Too many auth attempts, please try again later","details":{"retryAfter":899}}` | Auth rate limit hit |
| `500` | `{"success":false,"message":"Internal server error"}` | DB/exception failure |

### Server logic

```js
User.findOne({ username })
  if !user -> 400
bcrypt.compare(password, user.password)
  if !match -> 400
200
```

### Test

```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"secret123"}'
```

---

## Frontend usage

| Frontend file | Call |
|---|---|
| `src/Components/Pages/SignUp/Signup.jsx` | `axios.post('http://localhost:5000/api/users/register', formData)` |
| `src/Components/Pages/Login/Login.jsx` | `axios.post('http://localhost:5000/api/users/login', formData)` |

Both URLs are **hardcoded**. Replace with `import.meta.env.VITE_API_URL` before
any deployment (roadmap quick win).

### Response handling today

- **Login success** → store `sessionStorage.isLoggedIn = 'true'`, dispatch a
  synthetic `storage` event, redirect to `/`.
- **Login failure** → show "Invalid username or password. Please try again."
- **Register success** → clear the form, redirect to `/login` (redirect happens
  before the response arrives — bug, see
  [`../features/authentication.md`](../features/authentication.md)).
- **Register failure** → redirect to `/error?message=<server message>`.

---

## Status code summary

| Code | Meaning in this API |
|---|---|
| `200` | Login OK, health OK |
| `201` | User created |
| `400` | Duplicate data / invalid credentials / missing fields / bad JSON |
| `401` / `403` | Reserved for JWT auth (Phase 2 — `middleware/auth.js`) |
| `404` | Unknown route: `{"success":false,"message":"Route GET /x not found"}` |
| `429` | Rate limit exceeded (see `middleware/rateLimit.js`) |
| `500` | Server or DB error |

There are currently **no** `401`/`403` API responses, because no endpoint
requires authentication yet — they arrive with JWT support.

## Server structure

```
server.js          entry: connect DB -> listen -> graceful shutdown
app.js             express app: cors, json, morgan, routes, 404, error handler
config/env.js      loads .env, exposes typed config, validates in production
config/db.js       mongoose connect/disconnect + connection events
middleware/        rateLimit.js (sliding window), error.js (404 + handler)
utils/             ApiError, APIResponse (envelope), asyncHandler
routes/users.js    register + login
```

Start with `npm start` (or `npm run dev` for `node --watch`).

---

## Gaps in the API

| Gap | Why it matters | Roadmap |
|---|---|---|
| No products endpoint | Catalog is frontend-only | `commerce-core` |
| No orders/checkout endpoint | Cannot purchase | `commerce-core` |
| No token/refresh on login | Nothing to authorise later | `quality-security` |
| No request validation library | Relies on mongoose errors | `quality-security` |
| No rate limiting | Brute force possible | `quality-security` |
| CORS open to all origins | Any site can call the API | `quality-security` |
| No pagination/filter/sort | Fine for a seed catalog only | `commerce-core` |
| No structured error codes | Only free-text `message` strings | `quality-security` |
| No API versioning | Add `/v1` before external use | `scale-deploy` |
