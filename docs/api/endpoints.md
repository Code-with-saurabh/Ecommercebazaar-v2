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
(`[{ "field": "email", "message": "…" }]`) and on duplicate registration
(`{ "fields": ["username", "email"] }`). `stack` may appear on 5xx in
development only.

### Rate limiting

Three limiters (see `backend/middleware/rateLimit.js`), all keyed per IP:

| Limiter | Scope | Limit | Window |
|---|---|---|---|
| `apiLimiter` | every `/api` route **except** `/api/health` | **300** | 15 min |
| `authLimiter` | `/api/users/*` | **20** | 15 min |
| `loginLimiter` | `POST /api/users/login` (key = `ip:username`) | **10** | 15 min |

Headers are attached to all limited responses:

```
X-RateLimit-Limit: 300        (20 on /api/users/* — the strictest limiter wins)
X-RateLimit-Remaining: 299
X-RateLimit-Reset: 2026-09-26T13:11:47.872Z
Retry-After: 899              (only on 429)
```

Limits can be overridden with `RATE_LIMIT_MAX`, `RATE_LIMIT_AUTH_MAX` and
`RATE_LIMIT_LOGIN_MAX` (see `backend/.env.example`).

### Security headers (all responses)

Set by `backend/middleware/security.js`:

```
Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; …
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: … autoplay=(self) …      (the site uses background video)
Strict-Transport-Security (production only)
X-Request-Id: <uuid>                         (correlates access logs)
```

`X-Powered-By` is disabled, API responses carry `Cache-Control: no-store`,
static hashed assets are served with `Cache-Control: public, max-age=31536000, immutable`.

---

## 1. `GET /api/health`

Liveness check used by monitoring and manual testing. **No auth required.**
Not rate limited and no rate-limit headers.

### 200 OK

```json
{
  "status": "ok",
  "db": "connected",
  "uptime": 1696.11,
  "version": "1.0.0"
}
```

| Field | Meaning |
|---|---|
| `status` | Always `"ok"` if the process is alive |
| `db` | `"connected"` when `mongoose.connection.readyState === 1`, else `"disconnected"` |
| `uptime` | Process uptime in seconds (`process.uptime()`) |
| `version` | `package.json` version |

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

| Field | Required | Server-side rules |
|---|---|---|
| `username` | ✅ | trimmed, 3–25 chars, `/^[a-zA-Z0-9_.-]+$/`, unique |
| `email` | ✅ | trimmed, valid email shape, unique (the UI additionally suggests `@gmail.com`) |
| `phone` | ✅ | `/^\+?[0-9]{7,15}$/`, unique |
| `password` | ✅ | **8–72 chars**, stored hashed with bcrypt (10 salt rounds) |

Request bodies are sanitised first (`middleware/sanitize.js` strips any `$`/
`.` keys — MongoDB operators are rejected), and every field must be a string
(`400 "must be a string"` otherwise).

### Responses

| Status | Body | When |
|---|---|---|
| `201` | `{"success":true,"message":"User registered successfully","data":{…}}` | Created (`data` = `{id, username, email, phone}` — never the password) |
| `400` | `{"success":false,"message":"username, email, phone and password are required"}` | Missing field |
| `400` | `{"success":false,"message":"Validation failed","details":[{field,message}]}` | Format rule failed (password length, username charset, …) |
| `409` | `{"success":false,"message":"An account with that username, email or phone already exists","details":{"fields":["username",…]}}` | Duplicate username **or** email **or** phone |
| `429` | `{"success":false,"message":"Too many auth attempts…","details":{"retryAfter":899}}` | Auth/login rate limit hit |
| `500` | `{"success":false,"message":"Internal server error"}` | Unexpected failure |

### Server logic

```js
sanitize(req.body)                       // strips $/. operator keys
validate fields                          // 400 + details on failure
User.findOne({ $or: [{ username }, { email }, { phone }] }).select('+password')
  found -> 409 { details: { fields: [...] } }
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
| `401` | `{"success":false,"message":"Invalid username or password"}` | Unknown username **or** wrong password — same generic message on purpose (no user enumeration), plus a timing equaliser against unknown usernames |
| `400` | `{"success":false,"message":"username and password are required"}` | Missing field |
| `429` | `{"success":false,"message":"Too many login attempts, please try again later","details":{"retryAfter":…}}` | Login limiter (10 / 15 min per `ip:username`) hit |

### Server logic

```js
sanitize(req.body)
User.findOne({ username }).select('+password')
  !user       -> bcrypt.compare(password, DUMMY_HASH)   // timing equaliser
                 -> 401 generic message
  !passwordOk -> 401 generic message
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
| `src/pages/SignUp/Signup.jsx` | `post('/users/register', formData)` (from `src/api.js`) |
| `src/pages/Login/Login.jsx` | `post('/users/login', formData)` (from `src/api.js`) |

`src/api.js` centralises the base URL (`import.meta.env.VITE_API_URL` with a
`http://localhost:5000/api` fallback) and unwraps the envelope into
`ApiError { message, status, details }`.

### Response handling today

- **Login success** → `setLoggedIn(true)` (`src/utils/session.js`), redirect `/`.
- **Login failure** → inline `role="alert"` message from `ApiError.message`
  (401 → "Invalid username or password").
- **Register success** → clear the form, **then** redirect to `/login`
  (the old code redirected before the response arrived — fixed).
- **Register failure** → inline message; `400` shows the per-field
  `details` list, `409` shows the duplicate message.
- Both forms disable their submit button while the request is in flight.

---

## Status code summary

| Code | Meaning in this API |
|---|---|
| `200` | Login OK, health OK |
| `201` | User created |
| `400` | Missing fields / validation details / bad JSON / non-string field |
| `401` | Invalid credentials (generic — no enumeration) |
| `404` | Unknown route: `{"success":false,"message":"Route GET /x not found"}` |
| `409` | Duplicate username/email/phone on register |
| `429` | Rate limit exceeded (see `middleware/rateLimit.js`) |
| `500` | Server or DB error |

There are no `403` responses yet and no endpoint requires a token — they
arrive with JWT support.

## Server structure

```
server.js          entry: connect DB -> listen -> uncaughtException guard
app.js             express app (see pipeline below)
config/env.js      loads .env, typed config, TRUST_PROXY, production validation
config/db.js       mongoose connect/disconnect + connection events
middleware/
  security.js      CSP + HSTS + nosniff + frame/referrer/permissions headers
  sanitize.js      strips $/. keys from body/query (NoSQL injection guard)
  cache.js         Cache-Control: no-store for API responses
  rateLimit.js     apiLimiter / authLimiter / loginLimiter (sweeping windows)
  error.js         404 + error handler (envelope)
utils/             ApiError, APIResponse (envelope), asyncHandler
routes/users.js    register + login (field validation, 409, timing equaliser)
models/User.js     schema (trim/lowercase/match, password select:false)
```

Request pipeline (`app.js`, in order):

```
trust proxy -> x-powered-by off -> CORS -> security headers -> request id
-> access log (morgan, prod) -> express.json -> sanitize
-> compression -> static frontend/dist (+ immutable /assets, SPA fallback)
-> apiCache + apiLimiter on /api (health excluded)
-> authLimiter + users router -> 404 -> error handler
```

Start with `npm start` (or `npm run dev` for `node --watch`).

---

## Gaps in the API

| Gap | Why it matters | Roadmap |
|---|---|---|
| No products endpoint | Catalog is frontend-only | `commerce-core` |
| No orders/checkout endpoint | Cannot purchase | `commerce-core` |
| No token/refresh on login | Nothing to authorise later | `quality-security` |
| No dedicated validation library | Hand-rolled checks in `routes/users.js` | `quality-security` |
| ~~No rate limiting~~ | ✅ done — api/auth/login limiters | — |
| ~~CORS open to all origins~~ | ✅ done — allow-list via `CORS_ORIGIN` env | — |
| No pagination/filter/sort | Fine for a seed catalog only | `commerce-core` |
| No structured error codes | Only free-text `message` strings | `quality-security` |
| No API versioning | Add `/v1` before external use | `scale-deploy` |
