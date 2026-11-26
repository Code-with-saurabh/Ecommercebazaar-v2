const express = require('express');
const mongoose = require('mongoose');
const { z } = require('zod');

const Review = require('../models/Review');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { validateBody, validateParams, validateQuery } = require('../middleware/validate');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const ID_RE = /^[0-9a-fA-F]{24}$/;

/**
 * Product reviews (Phase 2.8) — mounted under /api/products so the resource
 * path reads naturally: /api/products/:productId/reviews.
 *
 *   GET    /:productId/reviews              published reviews (paginated)
 *   GET    /:productId/reviews/mine         my review, including moderation status
 *   POST   /:productId/reviews              write mine (one per product)
 *   PUT    /:productId/reviews/mine         edit mine
 *   DELETE /:productId/reviews/mine         delete mine
 *   POST   /:productId/reviews/:reviewId/helpful   "was this helpful?"
 *
 * The {product, user} unique index rejects a second review even under a
 * race (mapped to 409 here). `verified` purchase and the Product.rating
 * aggregate are maintained by the Review model's hooks - routes never
 * touch rating numbers directly. Moderation (hide/unhide) is admin-only
 * in routes/admin.js.
 */

const router = express.Router();

// Mounted at /api/products (app.js) - paths below are relative to that.
const productParams = z.object({ productId: z.string().regex(ID_RE, 'productId must be a valid id') });
const reviewParams = productParams.extend({
  reviewId: z.string().regex(ID_RE, 'reviewId must be a valid id'),
});

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(['newest', 'helpful', 'rating']).default('newest'),
});

const writeSchema = z.object({
  rating: z.coerce.number().int().min(1, 'rating must be at least 1').max(5, 'rating cannot exceed 5'),
  title: z.string().trim().max(100, 'review title must be at most 100 characters').optional().default(''),
  comment: z
    .string()
    .trim()
    .min(3, 'review comment must be at least 3 characters')
    .max(2000, 'review comment must be at most 2000 characters'),
});

const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  helpful: { helpfulCount: -1, createdAt: -1, _id: -1 },
  rating: { rating: -1, createdAt: -1, _id: -1 },
};

/** Public listing and new reviews must not expose inactive catalog products. */
async function requireProduct(productId) {
  const product = await Product.findOne({ _id: productId, isActive: true }).select('_id name');
  if (!product) throw ApiError.notFound('Product not found');
  return product;
}

// GET /api/products/:productId/reviews
router.get(
  '/:productId/reviews',
  optionalAuth,
  validateParams(productParams),
  validateQuery(listQuery),
  asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { page, limit, sort } = req.query;
    await requireProduct(productId);

    const filter = { product: productId, status: 'published' };
    const matchId = mongoose.Types.ObjectId.createFromHexString(productId);
    const [items, total, stats] = await Promise.all([
      Review.find(filter)
        .select('+helpfulVoters')
        .sort(SORTS[sort])
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', 'username name avatar')
        .exec(),
      Review.countDocuments(filter),
      Review.aggregate([
        { $match: { product: matchId, status: 'published' } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
    ]);

    const aggregate = stats[0] || { avg: 0, count: 0 };
    const visibleItems = items.map(review => ({
      ...review.toJSON(),
      helpfulVoted: Boolean(req.user && (review.helpfulVoters || []).some(id => String(id) === String(req.user._id))),
    }));
    return ApiResponse.success(res, 200, 'OK', visibleItems, {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNext: page * limit < total,
      rating: { avg: Math.round((aggregate.avg || 0) * 10) / 10, count: aggregate.count },
    });
  })
);

// Ownership comes from the session, never a supplied user id or public page.
router.get(
  '/:productId/reviews/mine',
  requireAuth,
  validateParams(productParams),
  asyncHandler(async (req, res) => {
    const review = await Review.findOne({ product: req.params.productId, user: req.user._id })
      .populate('user', 'username name avatar');
    return ApiResponse.ok(res, 'OK', { review });
  })
);

// POST /api/products/:productId/reviews - write my review
router.post(
  '/:productId/reviews',
  requireAuth,
  validateParams(productParams),
  validateBody(writeSchema),
  asyncHandler(async (req, res) => {
    const { productId } = req.params;
    await requireProduct(productId);

    try {
      const review = await Review.create({
        product: productId,
        user: req.user._id,
        rating: req.body.rating,
        title: req.body.title,
        comment: req.body.comment,
      });
      const populated = await review.populate('user', 'username name avatar');
      return ApiResponse.created(res, 'Review posted', populated);
    } catch (err) {
      if (err && err.code === 11000) {
        throw ApiError.conflict('You have already reviewed this product');
      }
      throw err;
    }
  })
);

// PUT /api/products/:productId/reviews/mine - edit my review
router.put(
  '/:productId/reviews/mine',
  requireAuth,
  validateParams(productParams),
  validateBody(writeSchema),
  asyncHandler(async (req, res) => {
    const review = await Review.findOne({ product: req.params.productId, user: req.user._id });
    if (!review) throw ApiError.notFound('You have not reviewed this product yet');

    review.rating = req.body.rating;
    review.title = req.body.title;
    review.comment = req.body.comment;
    await review.save(); // post-save hook refreshes Product.rating

    const populated = await review.populate('user', 'username name avatar');
    return ApiResponse.ok(res, 'Review updated', populated);
  })
);

// DELETE /api/products/:productId/reviews/mine
router.delete(
  '/:productId/reviews/mine',
  requireAuth,
  validateParams(productParams),
  asyncHandler(async (req, res) => {
    const review = await Review.findOneAndDelete({ product: req.params.productId, user: req.user._id });
    if (!review) throw ApiError.notFound('You have not reviewed this product yet');
    // findOneAndDelete hook recomputes Product.rating
    return ApiResponse.ok(res, 'Review deleted', { id: review._id });
  })
);

// POST /api/products/:productId/reviews/:reviewId/helpful - idempotent upvote
router.post(
  '/:productId/reviews/:reviewId/helpful',
  requireAuth,
  validateParams(reviewParams),
  asyncHandler(async (req, res) => {
    await requireProduct(req.params.productId);
    const review = await Review.findOneAndUpdate(
      {
        _id: req.params.reviewId,
        product: req.params.productId,
        status: 'published',
        user: { $ne: req.user._id },
        helpfulVoters: { $ne: req.user._id },
      },
      { $addToSet: { helpfulVoters: req.user._id }, $inc: { helpfulCount: 1 } },
      { returnDocument: 'after' }
    ).select('helpfulCount user');
    if (review) {
      return ApiResponse.ok(res, 'Marked helpful', { helpfulCount: review.helpfulCount, helpfulVoted: true });
    }

    const existing = await Review.findOne({
      _id: req.params.reviewId, product: req.params.productId, status: 'published',
    }).select('helpfulCount user');
    if (!existing) throw ApiError.notFound('Review not found');
    if (String(existing.user) === String(req.user._id)) {
      throw ApiError.forbidden('You cannot mark your own review as helpful');
    }
    return ApiResponse.ok(res, 'Already marked helpful', {
      helpfulCount: existing.helpfulCount, helpfulVoted: true,
    });
  })
);

module.exports = router;
