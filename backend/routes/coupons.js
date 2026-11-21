const express = require('express');
const { z } = require('zod');

const Coupon = require('../models/Coupon');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const { validateBody } = require('../middleware/validate');
const { optionalAuth } = require('../middleware/auth');
const { readGuestId } = require('../utils/guestCookie');

const router = express.Router();

/**
 * Coupon validation preview (Phase 2.10).
 *
 *   POST /api/coupons/validate { code }
 *   -> 200 { valid, reason, discount, subtotal, message }
 *
 * The server reads its OWN cart (Bearer or guest cookie) and re-prices the
 * lines against live Product docs - the client never sends a total, so it
 * cannot talk a code into applying. Evaluation is a successful operation
 * even when the verdict is "no", hence 200 + `valid: false` instead of a
 * 4xx: the caller asked a question and got an answer.
 *
 * Admin CRUD for codes lives in routes/admin.js.
 */

const validateSchema = z.object({
  code: z.string().trim().min(1, 'coupon code is required').max(40),
});

/** Stable reason codes -> sentence (kept in sync with routes/orders.js). */
const MESSAGES = {
  INVALID: 'This coupon code does not exist',
  INACTIVE: 'This coupon is no longer active',
  NOT_STARTED: 'This coupon is not active yet',
  EXPIRED: 'This coupon has expired',
  GLOBAL_LIMIT: 'This coupon has reached its usage limit',
  USER_LIMIT: 'You have already used this coupon',
  MIN_CART: 'Your cart does not meet the minimum for this coupon',
  CATEGORY: 'This coupon does not apply to items in your cart',
  INVALID_AMOUNT: 'Your cart is empty',
};

function verdict(valid, reason, discount = 0, subtotal = 0) {
  return { valid, reason, discount, subtotal, message: MESSAGES[reason] || (valid ? 'Coupon applied' : 'Coupon rejected') };
}

router.post(
  '/validate',
  validateBody(validateSchema),
  optionalAuth, // logged-out visitors get a preview too (guest cookie cart)
  asyncHandler(async (req, res) => {
    const code = req.body.code.toUpperCase();

    const userId = req.user ? req.user._id : null;
    const guestId = readGuestId(req);
    const cart = userId
      ? await Cart.findOne({ user: userId, status: 'active' })
      : guestId
        ? await Cart.findOne({ guestId, status: 'active' })
        : null;

    // No cart / empty cart: the code cannot possibly apply.
    if (!cart || cart.items.length === 0) {
      return ApiResponse.ok(res, 'OK', verdict(false, 'INVALID_AMOUNT'));
    }

    // Re-price against live products (same rule as checkout).
    const ids = [...new Set(cart.items.map(item => String(item.product)))];
    const products = await Product.find({ _id: { $in: ids }, isActive: true });
    const byId = new Map(products.map(product => [String(product._id), product]));

    let subtotal = 0;
    const categories = [];
    for (const item of cart.items) {
      const product = byId.get(String(item.product));
      if (!product) continue;
      subtotal += product.price * item.qty;
      categories.push(product.category);
    }
    subtotal = Math.round(subtotal * 100) / 100;

    const coupon = await Coupon.findByCode(code);
    if (!coupon) return ApiResponse.ok(res, 'OK', verdict(false, 'INVALID', 0, subtotal));

    const result = coupon.evaluate({
      userId,
      subtotal,
      categories: [...new Set(categories)],
    });

    if (!result.ok) return ApiResponse.ok(res, 'OK', verdict(false, result.reason, 0, subtotal));

    return ApiResponse.ok(res, 'OK', verdict(true, null, result.discount, subtotal));
  })
);

module.exports = router;
