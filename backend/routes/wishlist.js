const express = require('express');
const { z } = require('zod');

const User = require('../models/User');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { validateBody, validateParams } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const ID_RE = /^[0-9a-fA-F]{24}$/;

/**
 * Wishlist / "save for later" (Phase 2.9) — account-only.
 *
 *   GET    /api/wishlist            saved products (active only, newest first)
 *   POST   /api/wishlist { productId }   add (idempotent)
 *   DELETE /api/wishlist/:productId      remove (idempotent)
 *
 * Idempotent by design: a double-tap or a retried request never 500s, and
 * the response always carries the current `count` so the header badge can
 * re-render without a second GET. Inactive/deleted products are filtered
 * out of the list (they vanish from the book, not into a broken card).
 */

const router = express.Router();
router.use(requireAuth);

const addSchema = z.object({
  productId: z.string().regex(ID_RE, 'productId must be a valid id'),
});

const idParams = z.object({ productId: z.string().regex(ID_RE, 'productId must be a valid id') });

/** The wishlist as populated product docs, drafts and delisted hidden. */
async function populatedWishlist(userId) {
  const user = await User.findById(userId).populate({
    path: 'wishlist',
    match: { isActive: true },
    select: 'name slug brand price mrp category images thumbnail stock rating tags sku',
  });
  // keep save-order (newest first) while dropping filtered-out nulls
  return (user.wishlist || []).filter(Boolean);
}

// GET /api/wishlist
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await populatedWishlist(req.user._id);
    return ApiResponse.ok(res, 'OK', { items, count: items.length });
  })
);

// POST /api/wishlist - add one product (already-saved is a no-op, not a 409).
// Deliberately NOT toggleWishlist(): an add endpoint must never remove.
router.post(
  '/',
  validateBody(addSchema),
  asyncHandler(async (req, res) => {
    const { productId } = req.body;

    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) throw ApiError.notFound('Product not found');

    const user = await User.findById(req.user._id);
    const added = !user.wishlist.some(item => String(item) === productId);
    if (added) {
      user.wishlist.push(productId);
      await user.save();
    }

    const items = await populatedWishlist(req.user._id);
    return ApiResponse.ok(res, added ? 'Added to wishlist' : 'Already in wishlist', {
      added,
      count: items.length,
      items,
    });
  })
);

// DELETE /api/wishlist/:productId - remove (removing a missing one still 200s)
router.delete(
  '/:productId',
  validateParams(idParams),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const index = user.wishlist.findIndex(item => String(item) === req.params.productId);
    const removed = index !== -1;
    if (removed) {
      user.wishlist.splice(index, 1);
      await user.save();
    }

    const items = await populatedWishlist(req.user._id);
    return ApiResponse.ok(res, removed ? 'Removed from wishlist' : 'Not in wishlist', {
      removed,
      count: items.length,
      items,
    });
  })
);

module.exports = router;
