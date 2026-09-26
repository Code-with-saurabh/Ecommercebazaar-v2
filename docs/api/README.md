# API

The Express backend that the frontend talks to.

- **Base URL (local):** `http://localhost:5000`
- **Source:** `backend/app.js`, `backend/routes/users.js`, `backend/models/User.js`
- **Format:** JSON in, JSON out
- **Auth:** none yet (no tokens, no protected routes)

## Endpoints

| Method | Path | Purpose | Doc |
|---|---|---|---|
| `GET` | `/api/health` | Liveness + DB status | [`endpoints.md`](endpoints.md#1-get-apihealth) |
| `POST` | `/api/users/register` | Create an account | [`endpoints.md`](endpoints.md#2-post-apiusersregister) |
| `POST` | `/api/users/login` | Verify credentials | [`endpoints.md`](endpoints.md#3-post-apiuserslogin) |

Full request/response examples, status codes and curl commands:
**[`endpoints.md`](endpoints.md)**.

## Middleware stack (`backend/app.js`)

```js
app.use(cors());            // all origins, all methods
app.use(bodyParser.json()); // JSON bodies
```

> `cors()` is called with no options, so **any** origin can call the API. Before
> production, restrict it to your frontend origin and add rate limiting — see
> [`../roadmap/quality-security.md`](../roadmap/quality-security.md).

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `mongoURL` | `mongodb://127.0.0.1:27017/ecommerce` | MongoDB connection |
| `PORT` | `5000` | API port |

## Data model

```js
// backend/models/User.js  -> collection: users
{
  username: String,  // required, unique
  email:    String,  // required, unique
  phone:    String,  // required, unique
  password: String,  // required, bcrypt hash (cost 10)
}
```

Mongoose timestamps are **not** enabled; there is no `createdAt`/`updatedAt`.

## What is missing (future API surface)

Products, cart, orders, payments, reviews, coupons and admin endpoints do not
exist yet. The planned design is documented in
[`../roadmap/commerce-core.md`](../roadmap/commerce-core.md) — it includes a
suggested REST surface such as:

```
GET    /api/products            GET /api/products/:id
POST   /api/orders              GET /api/orders/me
POST   /api/payments/verify     GET/POST /api/reviews
POST   /api/cart                ...and admin variants
```
