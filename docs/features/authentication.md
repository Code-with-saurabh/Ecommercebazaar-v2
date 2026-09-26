# Authentication (Signup / Login / Logout)

## Overview

| Aspect | Implementation |
|---|---|
| Transport | shared axios instance `src/api.js` → `POST /api/users/...` |
| Storage | MongoDB `users` collection via Mongoose (mongoose 9) |
| Passwords | `bcryptjs` hash, 10 salt rounds, **8–72 chars** (never stored in plain text) |
| Session | **None** — `sessionStorage.isLoggedIn = 'true'` boolean only (`src/utils/session.js`) |
| Client validation | HTML5 attributes (`required`, `pattern`, `minLength`) + inline server-error display |
| Server hardening | NoSQL-key sanitiser, field type guards, generic 401, 409 on duplicates, per-IP + per-`ip:username` rate limits |

## Signup — `/signup`

`pages/SignUp/Signup.jsx`

### Form fields & validation

| Field | Client rules | Server rules |
|---|---|---|
| `username` | required, `maxLength=25` | 3–25, `/^[a-zA-Z0-9_.-]+$/`, unique |
| `email` | required, `type=email` | valid shape, unique |
| `phone` | `type=tel`, `maxLength=10`, pattern `[789][0-9]{9}` | `/^\+?[0-9]{7,15}$/`, unique |
| `password` | **`minLength=8`, `maxLength=64`** + hint in the label | 8–72 chars |

### Submit flow

```
Submit (button disabled while in flight)
  -> client guard: password < 8 chars -> inline error, no request
  -> await post('/users/register', { username, email, phone, password })
       success -> dispatch(AddToDB(formData))   # session-local duplicate check
                  clear the form
                  history.push('/login')        # AFTER the API confirms
       failure -> inline role="alert" message
                  400 -> join details[].message (field errors)
                  409 -> "An account with that username, email or phone already exists"
```

> The old flow redirected to `/login` synchronously before the response
> arrived, so failed registrations still landed on the login page. Fixed.

### Server side (`backend/routes/users.js` → `POST /register`)

```js
sanitize(req.body)                     // strips any $/. operator keys
require string fields                  // 400 "must be a string"
validate format (username/email/phone/password 8-72)
                                       // 400 + details [{field,message}]
User.findOne({ $or: [{username},{email},{phone}] }).select('+password')
  exists -> 409 { details: { fields: [...] } }   // was 400 "Duplicate data"
bcrypt.hash(password, 10) -> new User(...).save() -> 201
```

Model (`backend/models/User.js`):

```js
{ username: String (required, unique, trim, lowercase, 3-25, match),
  email:    String (required, unique, trim, lowercase),
  phone:    String (required, unique, match),
  password: String (required, select: false) }   // hashed, hidden by default
```

## Login — `/login`

`pages/Login/Login.jsx`

```
Submit (button disabled while in flight)
  -> await post('/users/login', { username, password })
       success -> setLoggedIn(true)     # utils/session.js, notifies listeners
                  history.push('/')
       failure -> inline role="alert" from ApiError.message
                  401 -> "Invalid username or password" (generic, no enumeration)
                  429 -> rate-limit message from the API
```

Server side: `sanitize` → `User.findOne({ username }).select('+password')`
→ unknown user still runs a **timing-equalising** `bcrypt.compare` against a
dummy hash → `401 { message: 'Invalid username or password' }` (same message
and similar timing for both failure modes). `bcrypt.compare` failure → `401`.

Rate limits on login:

- `authLimiter`: 20 requests / 15 min per IP (all `/api/users/*`),
- `loginLimiter`: **10 attempts / 15 min per `ip:username`** (slows targeted
  brute force without locking out the whole NAT).

Note: the server returns **no token, no user object, no expiry**.

## Logout & header state

`layout/Header/HeaderComponents/User.jsx`:

- Reads login state through `isLoggedIn()` from `src/utils/session.js`.
- Subscribes to the module's custom `bazaar:auth` event, so Login, Signup and
  the header stay in sync **in the same tab** (the old code synthesised a
  `storage` event, which only fires in *other* tabs).
- Shows a **Login** control when logged out, **Logout** when logged in.
- Logout: `setLoggedIn(false)` → navigate `/login`.

## Security assessment (why this is not production-ready)

| Issue | Status |
|---|---|
| No JWT / session cookie | open — anyone can set `sessionStorage.isLoggedIn=true` in devtools |
| No server-side session | open — the API cannot authorise anything yet |
| Login state is per-tab and lost on refresh | open |
| ~~CORS fully open~~ | done — `CORS_ORIGIN` allow-list env |
| ~~No rate limiting~~ | done — api/auth/login limiters (see API docs) |
| ~~No password strength rule~~ | done — server enforces 8–72 chars |
| Gmail-only email pattern | loosened to `type=email` (server accepts any valid address) |
| No email verification / password reset | open — needs email service |
| User enumeration | mitigated — generic 401 + timing equaliser |
| Client "duplicate" check uses memory only | kept as a fast-path hint; server is the source of truth (409) |

Fix plan: JWT (or httpOnly cookies) + auth middleware + protected routes —
see [`../roadmap/quality-security.md`](../roadmap/quality-security.md).

## Known gaps / quick wins

| Gap | Fix |
|---|---|
| No visible "account created" confirmation | Add a success toast/message |
| Formik + Yup are installed but unused | Use them for validation + error messages |
| No "forgot password" | Needs email service (later phase) |
| Login errors are always the same message | Keep (good practice), details go to server logs |

## Related docs

- API contract → [`../api/endpoints.md`](../api/endpoints.md)
- Security roadmap → [`../roadmap/quality-security.md`](../roadmap/quality-security.md)
