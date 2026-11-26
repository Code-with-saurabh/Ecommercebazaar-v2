const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startReviewFixture } = require('./helpers/reviews-fixture.cjs');

let fixture;
let root;
let firstReview;
let secondReview;

before(async () => {
  fixture = await startReviewFixture();
  root = `/api/products/${fixture.product._id}/reviews`;
});
after(async () => { await fixture?.stop(); });

async function request(path, { method = 'GET', user, body } = {}) {
  const response = await fetch(fixture.baseUrl + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(user ? { Authorization: `Bearer ${user.token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

test('published reviews are public and begin with an honest zero aggregate', async () => {
  const result = await request(root);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.data, []);
  assert.deepEqual(result.body.meta.rating, { avg: 0, count: 0 });
});

test('own-review reads and all review writes require authentication', async () => {
  for (const [path, method] of [
    [`${root}/mine`, 'GET'], [root, 'POST'], [`${root}/mine`, 'PUT'],
    [`${root}/mine`, 'DELETE'], [`${root}/000000000000000000000001/helpful`, 'POST'],
  ]) {
    assert.equal((await request(path, { method })).status, 401);
  }
});

test('a signed-in shopper without a review receives review:null', async () => {
  const result = await request(`${root}/mine`, { user: fixture.users[0] });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.data, { review: null });
});

test('rating, title, and comment boundaries are enforced by the server', async () => {
  for (const body of [
    { rating: 0, comment: 'Valid text' }, { rating: 6, comment: 'Valid text' },
    { rating: 4.5, comment: 'Valid text' }, { rating: 'bad', comment: 'Valid text' },
    { rating: 5, comment: '  ab ' }, { rating: 5, comment: 'x'.repeat(2001) },
    { rating: 5, title: 'x'.repeat(101), comment: 'Valid text' },
  ]) {
    const result = await request(root, { method: 'POST', user: fixture.users[0], body });
    assert.equal(result.status, 400);
    assert.ok(Array.isArray(result.body.details));
  }
  assert.equal(await fixture.Review.countDocuments(), 0);
});

test('creating a review ignores client ownership, verification, moderation, and vote fields', async () => {
  const result = await request(root, { method: 'POST', user: fixture.users[0], body: {
    rating: 5, title: '  Comfortable  ', comment: '  Fits well and feels comfortable.  ',
    user: String(fixture.users[1].user._id), verified: true, status: 'hidden',
    helpfulCount: 100, helpfulVoters: [String(fixture.users[1].user._id)],
  } });
  assert.equal(result.status, 201);
  firstReview = result.body.data;
  assert.equal(firstReview.user._id, String(fixture.users[0].user._id));
  assert.equal(firstReview.title, 'Comfortable');
  assert.equal(firstReview.comment, 'Fits well and feels comfortable.');
  assert.equal(firstReview.status, 'published');
  assert.equal(firstReview.verified, false);
  assert.equal(firstReview.helpfulCount, 0);
  assert.equal('helpfulVoters' in firstReview, false);
  const product = await fixture.Product.findById(fixture.product._id);
  assert.equal(product.rating.avg, 5);
  assert.equal(product.rating.count, 1);
});

test('duplicate reviews are rejected and published aggregates include all reviewers', async () => {
  const duplicate = await request(root, { method: 'POST', user: fixture.users[0], body: { rating: 1, comment: 'Another review' } });
  assert.equal(duplicate.status, 409);
  const result = await request(root, { method: 'POST', user: fixture.users[1], body: { rating: 3, comment: 'Good but not perfect.' } });
  assert.equal(result.status, 201);
  secondReview = result.body.data;
  assert.deepEqual((await request(root)).body.meta.rating, { avg: 4, count: 2 });
});

test('own-review reads are scoped to the authenticated author', async () => {
  const mine = await request(`${root}/mine?user=${fixture.users[1].user._id}`, { user: fixture.users[0] });
  assert.equal(mine.body.data.review._id, firstReview._id);
  assert.equal('helpfulVoters' in mine.body.data.review, false);
  const other = await request(`${root}/mine`, { user: fixture.users[2] });
  assert.equal(other.body.data.review, null);
});

test('self-voting is rejected and repeated helpful votes are idempotent', async () => {
  const path = `${root}/${firstReview._id}/helpful`;
  assert.equal((await request(path, { method: 'POST', user: fixture.users[0] })).status, 403);
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await request(path, { method: 'POST', user: fixture.users[1] });
    assert.equal(result.status, 200);
    assert.deepEqual(result.body.data, { helpfulCount: 1, helpfulVoted: true });
  }
});

test('concurrent duplicate votes increment the count only once', async () => {
  const results = await Promise.all(Array.from({ length: 8 }, () => request(`${root}/${firstReview._id}/helpful`, {
    method: 'POST', user: fixture.users[2],
  })));
  assert.ok(results.every(result => result.status === 200 && result.body.data.helpfulCount === 2));
  const review = await fixture.Review.findById(firstReview._id).select('+helpfulVoters');
  assert.equal(review.helpfulCount, 2);
  assert.equal(review.helpfulVoters.length, 2);
});

test('list responses expose only the viewer vote flag, never voter IDs or private user fields', async () => {
  for (const user of [undefined, fixture.users[0], fixture.users[1]]) {
    const result = await request(root, { user });
    const review = result.body.data.find(item => item._id === firstReview._id);
    assert.equal(review.helpfulVoted, user === fixture.users[1]);
    assert.equal('helpfulVoters' in review, false);
    assert.equal('email' in review.user, false);
    assert.equal('phone' in review.user, false);
    assert.equal('password' in review.user, false);
  }
});

test('a review cannot be voted on through a different product path', async () => {
  const another = await fixture.createProduct();
  const result = await request(`/api/products/${another._id}/reviews/${firstReview._id}/helpful`, {
    method: 'POST', user: fixture.users[2],
  });
  assert.equal(result.status, 404);
});

test('editing updates only the owner review, keeps votes, and refreshes the rating', async () => {
  const result = await request(`${root}/mine`, { method: 'PUT', user: fixture.users[0], body: {
    rating: 4, title: 'Updated opinion', comment: 'Still comfortable after another wear.',
    user: String(fixture.users[1].user._id), reviewId: secondReview._id,
  } });
  assert.equal(result.status, 200);
  assert.equal(result.body.data._id, firstReview._id);
  assert.equal('helpfulVoters' in result.body.data, false);
  const other = await fixture.Review.findById(secondReview._id);
  assert.equal(other.rating, 3);
  const mine = await fixture.Review.findById(firstReview._id).select('+helpfulVoters');
  assert.equal(mine.helpfulVoters.length, 2);
  assert.deepEqual((await request(root)).body.meta.rating, { avg: 3.5, count: 2 });
  assert.equal((await fixture.Product.findById(fixture.product._id)).rating.avg, 3.5);
});

test('authors without a review cannot edit or delete another author’s review', async () => {
  assert.equal((await request(`${root}/mine`, { method: 'PUT', user: fixture.users[2],
    body: { rating: 1, comment: 'Not mine', reviewId: firstReview._id } })).status, 404);
  assert.equal((await request(`${root}/mine`, { method: 'DELETE', user: fixture.users[2] })).status, 404);
});

test('hidden reviews remain manageable by their owner but absent from public lists and votes', async () => {
  await fixture.Review.setStatus(firstReview._id, 'hidden');
  const list = await request(root);
  assert.equal(list.body.data.length, 1);
  assert.deepEqual(list.body.meta.rating, { avg: 3, count: 1 });
  const mine = await request(`${root}/mine`, { user: fixture.users[0] });
  assert.equal(mine.body.data.review.status, 'hidden');
  const edited = await request(`${root}/mine`, { method: 'PUT', user: fixture.users[0],
    body: { rating: 5, comment: 'Updated while hidden.', status: 'published' } });
  assert.equal(edited.status, 200);
  assert.equal(edited.body.data.status, 'hidden');
  assert.deepEqual((await request(root)).body.meta.rating, { avg: 3, count: 1 });
  assert.equal((await request(`${root}/${firstReview._id}/helpful`, { method: 'POST', user: fixture.users[2] })).status, 404);
});

test('deleting the final published review resets the product aggregate even with a hidden review', async () => {
  assert.equal((await request(`${root}/mine`, { method: 'DELETE', user: fixture.users[1] })).status, 200);
  const product = await fixture.Product.findById(fixture.product._id);
  assert.equal(product.rating.avg, 0);
  assert.equal(product.rating.count, 0);
  assert.equal(product.rating.sum, 0);
  assert.deepEqual((await request(root)).body.meta.rating, { avg: 0, count: 0 });
  assert.equal((await request(`${root}/mine`, { method: 'DELETE', user: fixture.users[0] })).status, 200);
  assert.equal((await request(`${root}/mine`, { method: 'DELETE', user: fixture.users[0] })).status, 404);
});

test('inactive products cannot expose public reviews, accept new reviews, or receive votes', async () => {
  const product = await fixture.createProduct({ isActive: false });
  const review = await fixture.Review.create({ product: product._id, user: fixture.users[0].user._id, rating: 5, comment: 'Private draft product.' });
  const path = `/api/products/${product._id}/reviews`;
  assert.equal((await request(path)).status, 404);
  assert.equal((await request(path, { method: 'POST', user: fixture.users[1], body: { rating: 4, comment: 'Not public.' } })).status, 404);
  assert.equal((await request(`${path}/${review._id}/helpful`, { method: 'POST', user: fixture.users[2] })).status, 404);
});

test('review sorting and pagination have stable pages and enforce query limits', async () => {
  const ratings = [1, 2, 3, 4, 5, 4, 3];
  for (let index = 0; index < ratings.length; index++) {
    const author = await fixture.createUser();
    await fixture.Review.create({ product: fixture.product._id, user: author.user._id,
      rating: ratings[index], comment: `Pagination review ${index}`, helpfulCount: index,
      createdAt: new Date('2026-11-26T10:00:00Z'),
    });
  }
  const first = await request(`${root}?page=1&limit=5&sort=newest`);
  const second = await request(`${root}?page=2&limit=5&sort=newest`);
  assert.equal(first.body.data.length, 5);
  assert.equal(second.body.data.length, 2);
  assert.equal(first.body.meta.total, 7);
  assert.equal(first.body.meta.totalPages, 2);
  assert.equal(first.body.meta.hasNext, true);
  assert.equal(second.body.meta.hasNext, false);
  assert.equal(new Set([...first.body.data, ...second.body.data].map(item => item._id)).size, 7);
  const highest = await request(`${root}?sort=rating`);
  assert.deepEqual(highest.body.data.map(item => item.rating), [5, 4, 4, 3, 3, 2, 1]);
  const helpful = await request(`${root}?sort=helpful`);
  assert.deepEqual(helpful.body.data.map(item => item.helpfulCount), [6, 5, 4, 3, 2, 1, 0]);
  for (const query of ['limit=51', 'page=0', 'sort=unknown']) assert.equal((await request(`${root}?${query}`)).status, 400);
});

test('legacy reviews without stored voter IDs remain readable and deduplicate new votes', async () => {
  const legacy = await fixture.Review.findOne({ product: fixture.product._id });
  await fixture.Review.updateOne({ _id: legacy._id }, { $unset: { helpfulVoters: 1 }, $set: { helpfulCount: 10 } });
  assert.equal((await request(root)).status, 200);
  const path = `${root}/${legacy._id}/helpful`;
  const first = await request(path, { method: 'POST', user: fixture.users[0] });
  const again = await request(path, { method: 'POST', user: fixture.users[0] });
  assert.equal(first.body.data.helpfulCount, 11);
  assert.equal(again.body.data.helpfulCount, 11);
});

test('an owner review is available even when it is beyond the current public page', async () => {
  const review = await fixture.Review.create({ product: fixture.product._id, user: fixture.users[0].user._id,
    rating: 4, comment: 'An older review.', createdAt: new Date('2020-01-01T00:00:00Z') });
  const first = await request(`${root}?limit=5&sort=newest`);
  assert.equal(first.body.data.some(item => item._id === String(review._id)), false);
  const mine = await request(`${root}/mine`, { user: fixture.users[0] });
  assert.equal(mine.body.data.review._id, String(review._id));
});

test('concurrent submissions from the same account still create only one review', async () => {
  const product = await fixture.createProduct();
  const results = await Promise.all([4, 5].map(rating => request(`/api/products/${product._id}/reviews`, {
    method: 'POST', user: fixture.users[0], body: { rating, comment: 'A concurrent submission.' },
  })));
  assert.deepEqual(results.map(result => result.status).sort(), [201, 409]);
  assert.equal(await fixture.Review.countDocuments({ product: product._id }), 1);
  assert.equal((await fixture.Product.findById(product._id)).rating.count, 1);
});
