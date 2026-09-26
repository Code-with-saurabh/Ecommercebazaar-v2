# Authentication (Signup / Login / Logout)

## Overview

| Aspect | Implementation |
|---|---|
| Transport | `axios` POST to `http://localhost:5000/api/users/...` |
| Storage | MongoDB `users` collection via Mongoose |
| Passwords | `bcryptjs` hash, 10 salt rounds (never stored in plain text) |
| Session | **None** — `sessionStorage.isLoggedIn = 'true'` boolean only |
| Client validation | HTML5 attributes (`required`, `pattern`, `maxLength`) |

## Signup — `/signup`

`Pages/SignUp/Signup.jsx`

### Form fields & validation (all client-side, HTML5)

| Field | Rules |
|---|---|
| `username` | required, `maxLength=25` |
| `email` | required, `type=email`, **must match `[a-zA-Z0-9._%+-]+@gmail\.com`** (Gmail only) |
| `phone` | required, `type=tel`, `maxLength=10`, pattern `[789][0-9]{9}` (Indian 10-digit starting 7/8/9) |
| `password` | required, **`maxLength=8`** |

### Submit flow

```
Submit
  -> client duplicate check against Redux state.Data.data
       (username / email / phone match?) 
       -> if duplicate: history.push('/error?message=Duplicate data found...')
  -> dispatch(AddToDB(formData))          # remembers it in Redux for this session
  -> axios POST /api/users/register
       -> success: clear the form
       -> error:   history.push('/error?message=<server message>')
  -> history.push('/login')               # fires immediately, before the API responds
```

> **Bug to know:** `history.push('/login')` is called synchronously after
> dispatching the axios request, so the user is redirected **before** the server
> answers. A failed registration can still land you on the login page. The fix
> (move the redirect into `.then()`) is a roadmap quick win.

### Server side (`backend/routes/users.js` → `POST /register`)

```js
{ username, email, phone, password }
  -> User.findOne({ $or: [{username},{email},{phone}] })
       exists -> 400 { message: 'Duplicate data' }
  -> bcrypt.hash(password, 10)
  -> new User({...}).save()
  -> 201 { message: 'User registered successfully' }
```

Model (`backend/models/User.js`):

```js
{ username: String (required, unique),
  email:    String (required, unique),
  phone:    String (required, unique),
  password: String (required) }   // hashed
```

## Login — `/login`

`Pages/Login/Login.jsx`

```
Submit -> axios POST /api/users/login { username, password }
  success -> sessionStorage.setItem('isLoggedIn', 'true')
             window.dispatchEvent(new Event('storage'))   # synthetic event
             history.push('/')
  failure -> errorMessage = 'Invalid username or password. Please try again.'
```

Server side: `User.findOne({ username })` → `bcrypt.compare(password, user.password)`
→ `200 { message: 'Login successful' }` or `400 { message: 'Invalid username or password' }`.

Note: the server returns **no token, no user object, no expiry**.

## Logout & header state

`Header/HeaderComponents/User.jsx`:

- On mount and on the `storage` event, reads
  `sessionStorage.getItem('isLoggedIn') === 'true'`.
- Shows a **Login** link when logged out, a **Logout** control when logged in.
- Logout sets `isLoggedIn = 'false'` (and the header re-renders).

Because the app dispatches a **synthetic** `storage` event manually, the header
updates immediately after login — `storage` normally only fires across tabs.

## Security assessment (why this is not production-ready)

| Issue | Risk |
|---|---|
| No JWT / session cookie | Anyone can set `sessionStorage.isLoggedIn=true` in devtools and appear logged in |
| No server-side session | The API cannot authorise anything (there are no protected endpoints yet) |
| Login state is per-tab and lost on refresh | User appears logged out after reload |
| CORS fully open (`cors()`) | Any origin can call the API |
| No rate limiting / lockout | Brute-force possible |
| No password strength rule (only `maxLength=8`) | Very weak passwords allowed |
| Gmail-only email pattern | Blocks legitimate non-Gmail users |
| `password` maxLength 8 in the UI only | Server accepts anything |
| No email verification / password reset | Account recovery impossible |
| Error messages leak little but are generic | OK, keep it that way |
| Client "duplicate" check uses memory only | Duplicates only caught server-side after reload |

Fix plan: JWT (or httpOnly cookies) + auth middleware + protected routes —
see [`../roadmap/quality-security.md`](../roadmap/quality-security.md).

## Known gaps / quick wins

| Gap | Fix |
|---|---|
| Redirect to `/login` happens before API response | Move into `.then()` / `.catch()` |
| No visible "account created" confirmation | Add a success toast/message |
| Password field `maxLength=8` | Raise it, add strength rules, show/hide toggle |
| Formik + Yup are installed but unused | Use them for validation + error messages |
| No "forgot password" | Needs email service (later phase) |
| Login errors are always the same message | Keep (good practice), but log details server-side |

## Related docs

- API contract → [`../api/endpoints.md`](../api/endpoints.md)
- Security roadmap → [`../roadmap/quality-security.md`](../roadmap/quality-security.md)
