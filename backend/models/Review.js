const mongoose = require('mongoose');

/**
 * REVIEW — product reviews & star ratings (Phase 2.8).
 *
 * Relations
 *   Review.product -> Product   (rating aggregate is written *back* here)
 *   Review.user    -> User      (one review per user per product — enforced
 *                                by a unique compound index, not by a query)
 *   Review.verified is set automatically when the reviewer actually bought
 *   the product (checked against Order.items[].product in pre-save).
 *
 * Consistency: `Product.rating` is a denormalised cache. Every write path in
 * this file ends in `recomputeProductRating()`, so avg/count/sum can never
 * drift away from the review documents.
 */

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'review product is required'],
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'review author is required'],
    },

    rating: {
      type: Number,
      required: [true, 'rating is required'],
      min: [1, 'rating must be at least 1'],
      max: [5, 'rating cannot exceed 5'],
      validate: {
        validator: Number.isInteger,
        message: 'rating must be a whole number of stars',
      },
    },

    title: {
      type: String,
      trim: true,
      maxlength: [100, 'review title must be at most 100 characters'],
      default: '',
    },

    comment: {
      type: String,
      required: [true, 'review comment is required'],
      trim: true,
      minlength: [3, 'review comment must be at least 3 characters'],
      maxlength: [2000, 'review comment must be at most 2000 characters'],
    },

    // true when the author has an order containing this product
    verified: {
      type: Boolean,
      default: false,
    },

    // admin moderation (Phase 2.7): hidden reviews leave the rating aggregate)
    status: {
      type: String,
      enum: { values: ['published', 'hidden'], message: '{VALUE} is not a valid review status' },
      default: 'published',
      index: true,
    },

    helpfulCount: {
      type: Number,
      default: 0,
      min: [0, 'helpful count cannot be negative'],
    },
  },
  {
    timestamps: true, // createdAt / updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

// THE business rule of Phase 2.8: one review per user per product.
// The database rejects the second insert (E11000) even under a race.
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// product page: "most helpful / newest" review lists
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });

// "my reviews" page
reviewSchema.index({ user: 1, createdAt: -1 });

// ---------------------------------------------------------------------------
// Document hooks
// ---------------------------------------------------------------------------

/**
 * Badge check: did this reviewer actually buy the product?
 * Runs before validation, silently stays false when no Order model is
 * registered (unit tests, seeding) or no matching order exists.
 * Mongoose 9 hooks are promise based — no `next` callback.
 */
reviewSchema.pre('save', async function markVerifiedPurchase() {
  const Order = mongoose.models.Order;
  if (Order && !this.verified) {
    const purchased = await Order.exists({
      user: this.user,
      'items.product': this.product,
      status: { $in: ['placed', 'packed', 'shipped', 'delivered'] },
    });
    if (purchased) this.verified = true;
  }
});

/**
 * Every mutation of a review ends by refreshing Product.rating.
 * Kept in a helper so save / delete / moderation all take the same path.
 */
reviewSchema.post('save', async function refreshRating() {
  await safeRecompute(this.constructor, this.product);
});

reviewSchema.post('deleteOne', { document: true, query: false }, async function refreshRatingOnDelete() {
  await safeRecompute(this.constructor, this.product);
});

/**
 * Query-style deletes (`Review.deleteOne(...)`, `Review.deleteMany(...)`)
 * skip document middleware entirely — and bulk deletes are exactly what the
 * user-cascade hook in User.js uses. Remember which products are affected
 * while the rows still exist, then rebuild their aggregates afterwards.
 */
reviewSchema.pre('deleteMany', async function captureProducts() {
  this._touchedProducts = await this.model.distinct('product', this.getFilter());
});

reviewSchema.post('deleteMany', async function recomputeAfterBulkDelete() {
  await recomputeAll(this, this._touchedProducts);
});

reviewSchema.pre('deleteOne', { query: true, document: false }, async function captureProduct() {
  this._touchedProducts = await this.model.distinct('product', this.getFilter());
});

reviewSchema.post('deleteOne', { query: true, document: false }, async function recomputeAfterDelete() {
  await recomputeAll(this, this._touchedProducts);
});

/** Refresh every product in `ids` (errors logged, never thrown). */
async function recomputeAll(query, ids = []) {
  for (const id of ids || []) {
    await safeRecompute(query.model, id);
  }
}

/** Swallow-and-log: a denormalised cache must never fail the user's request. */
async function safeRecompute(ReviewModel, productId) {
  try {
    await ReviewModel.recomputeProductRating(productId);
  } catch (err) {
    console.error('[review] rating recompute failed:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Static methods
// ---------------------------------------------------------------------------

/**
 * Rebuild `Product.rating` from the published reviews of one product.
 *
 *   const { avg, count, sum } = await Review.recomputeProductRating(id);
 *
 * sum is kept next to avg on purpose: averaging averages is mathematically
 * wrong as soon as a batch of reviews is hidden/unhidden.
 */
reviewSchema.statics.recomputeProductRating = async function recomputeProductRating(productId) {
  const Product = mongoose.models.Product;
  if (!Product || !productId) return { avg: 0, count: 0, sum: 0 };

  const [stats] = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)), status: 'published' } },
    {
      $group: {
        _id: '$product',
        sum: { $sum: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const count = stats ? stats.count : 0;
  const sum = stats ? stats.sum : 0;
  const avg = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;

  await Product.applyRating(productId, { avg, count, sum });
  return { avg, count, sum };
};

/** The current user's review of a product (for edit/permission checks). */
reviewSchema.statics.findByUserAndProduct = function findByUserAndProduct(userId, productId) {
  return this.findOne({ user: userId, product: productId });
};

/** Published reviews of a product, newest first. */
reviewSchema.statics.findForProduct = function findForProduct(productId, { limit = 20, skip = 0 } = {}) {
  return this.find({ product: productId, status: 'published' })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'username avatar');
};

/**
 * Admin moderation: flip visibility and refresh the aggregate.
 * Returns the updated review, or null when it does not exist.
 */
reviewSchema.statics.setStatus = async function setStatus(reviewId, status) {
  const review = await this.findById(reviewId);
  if (!review) return null;
  review.status = status;
  await review.save(); // post-save hook recomputes the rating
  return review;
};

module.exports = mongoose.models.Review || mongoose.model('Review', reviewSchema);
