# Customer reviews

**Implemented:** 2026-11-26

## Shopper experience

Product detail pages now include **Customer reviews**, immediately above
Recently viewed. Visitors can read published reviews, see the server-computed
average/count, sort by newest/most helpful/highest rated, and browse five
reviews per page. Loading, empty, failed-request, and retry states are included.

Signed-in shoppers can:

- Post one review per product: an integer rating from 1–5, an optional title
  up to 100 characters, and a comment of 3–2,000 characters after trimming.
- Edit or delete their own review. Deletion requires confirmation.
- Manage their own review even when it is on another page or hidden by
  moderation. Editing a hidden review does not publish it.
- Mark another author's published review helpful once. The server prevents
  duplicate/concurrent votes and author self-votes.

Sign-in links return to the product's `#reviews` section. The form uses
Formik/Yup, labeled keyboard-operable rating radios, inline errors, and pending
button states. Failed saves retain the draft; account changes discard private
drafts and results. Review text is rendered as plain React text. A verified
purchase badge appears only when the server supplies `verified: true`.

## API contract

All paths below are relative to `/api/products/:productId` and use a MongoDB
product ID, not a slug. Responses use the existing success/data/meta envelope.

| Method | Path | Authentication | Result |
|---|---|---|---|
| GET | `/reviews?page=1&limit=5&sort=newest` | Optional | Published reviews; pagination and rating aggregate in `meta`; per-viewer `helpfulVoted` on each review |
| GET | `/reviews/mine` | Required | `data: { review: <document or null> }`, including an owner's hidden review |
| POST | `/reviews` | Required | Create the current user's review; duplicate returns 409 |
| PUT | `/reviews/mine` | Required | Edit only the current user's review |
| DELETE | `/reviews/mine` | Required | Delete only the current user's review; recompute product rating |
| POST | `/reviews/:reviewId/helpful` | Required | `{ helpfulCount, helpfulVoted: true }`; repeated votes return the existing count |

List limits remain 1–50; supported sorts are `newest`, `helpful`, and `rating`.
Public lists, creation, and helpful votes require an active product. Own-review
operations derive ownership from the session. Clients cannot assign an author,
verification badge, moderation status, or helpful count.

## Implementation and integrity

- UI: `frontend/src/components/ProductReviews/`.
- Integration: `ProductDetail.jsx` mounts `ProductReviews`, supplies
  `setReviewRating`, and uses its returned aggregate in the product header.
- Successful saves/deletions invalidate the catalog list cache through
  `invalidateProductsCache()` in `hooks/useProducts.js`.
- The review query hook tags requests and aborts obsolete reads, preventing
  old page/account responses from replacing current results.
- `Review.helpfulVoters` is private, excluded by default, and removed by JSON
  serialization. An atomic conditional update adds the voter and increments
  the count together. Legacy counts are retained; pre-existing votes without
  voter records cannot be attributed retroactively.
- A `findOneAndDelete` model hook fixes the stale aggregate left by the
  existing own-review deletion route.
- No new project dependency was required.

## Verification

From `backend/`, with local MongoDB running:

```bash
node --test tests/reviews.test.cjs
npm run lint
```

The 20 integration tests use a unique `bazaar_reviews_test_*` database and an
ephemeral HTTP port. The fixture verifies its database name before creating
data, then drops only that database and closes its server on completion.
`REVIEWS_TEST_MONGO_URI` optionally selects a test MongoDB server; the unique
database name is still enforced.

From `frontend/`:

```bash
node --test tests/product-reviews.test.mjs tests/recently-viewed.test.mjs
npm run lint
npm run build
```

Results: 20 API tests and 19 frontend logic tests passed. Headless Edge checks
also passed against the real API and isolated MongoDB for sign-in return,
validation, keyboard ratings, post/edit/delete, escaped text, failed-save draft
preservation, helpful vote persistence, account switching, pagination/sorting,
hidden reviews, retry, and mobile layout. Network failures were deliberately
injected for recovery tests. No uncaught browser errors were observed.
