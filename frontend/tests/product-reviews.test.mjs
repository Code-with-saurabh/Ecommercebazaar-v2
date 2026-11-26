import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewPayload, reviewSchema } from '../src/components/ProductReviews/reviewValidation.js';

test('a valid review normalizes the form fields without accepting protected server fields', async () => {
  const values = { rating: '4', title: '  Good fit  ', comment: '  Comfortable after a full day.  ',
    user: 'other-user', verified: true, helpfulCount: 500, status: 'published' };
  await reviewSchema.validate(values);
  assert.deepEqual(reviewPayload(values), { rating: 4, title: 'Good fit', comment: 'Comfortable after a full day.' });
});

test('rating is required and must be a whole number from one to five', async () => {
  for (const rating of ['', undefined, null, 0, 6, 2.5, 'bad', Infinity]) {
    await assert.rejects(reviewSchema.validate({ rating, title: '', comment: 'Valid text' }));
  }
  for (const rating of [1, 2, 3, 4, 5]) {
    await assert.doesNotReject(reviewSchema.validate({ rating, title: '', comment: 'Valid text' }));
  }
});

test('comments are validated after trimming and cannot exceed the API length limit', async () => {
  for (const comment of ['', '   ', '  ab  ', 'x'.repeat(2001)]) {
    await assert.rejects(reviewSchema.validate({ rating: 5, title: '', comment }));
  }
  for (const comment of ['  abc  ', 'x'.repeat(2000), 'Comfortable\nGood stitching']) {
    await assert.doesNotReject(reviewSchema.validate({ rating: 5, title: '', comment }));
  }
});

test('title is optional but bounded to the server’s 100-character limit', async () => {
  for (const title of [undefined, '', 'x'.repeat(100)]) {
    await assert.doesNotReject(reviewSchema.validate({ rating: 5, title, comment: 'Valid comment' }));
  }
  await assert.rejects(reviewSchema.validate({ rating: 5, title: 'x'.repeat(101), comment: 'Valid comment' }));
  assert.equal(reviewPayload({ rating: 5, comment: 'Valid comment' }).title, '');
});
