const express = require('express');
const crypto = require('crypto');
const { z } = require('zod');

const { env } = require('../config/env');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { validateBody, validateParams } = require('../middleware/validate');
const { optionalAuth } = require('../middleware/auth');
const { readGuestId, setGuestCookie } = require('../utils/guestCookie');

/**
 * Server cart (Phase A3). One active cart per caller:
 *   - Bearer token  -> the account's cart (survives devices)
 *   - `guest_cart` cookie -> anonymous cart (TTL'd, merged at login)
 *
 * Money rules: every write re-reads the live Product price/stock - the
 * client only ever sends ids and quantities. `POST /api/orders` (A4)
 * recomputes totals again against live prices.
 */

const router = express.Router();

// Bearer identifies the account when present; anonymous visitors are first
// class here (optionalAuth never throws - it only attaches req.user).
router.use(optionalAuth);

const ID_RE = /^[0-9a-fA-F]{24}$/;

const lineSchema = z.object({
  productId: z.string().regex(ID_RE, 'productId must be a valid id'),
  qty: z.number().int().min(1).max(99, 'quantity must be between 1 and 99').default(1),
  size: z.string().trim().max(24).nullish(),
  color: z.string().trim().max(24).nullish(),
});

const putSchema = z.object({
  items: z.array(lineSchema).max(60, 'cart is too large'),
});

const patchSchema = z.object({
  productId: z.string().regex(ID_RE, 'productId must be a valid id'),
  qty: z.number().int().min(0).max(99, 'quantity must be between 0 and 99'),
  size: z.string().trim().max(24).nullish(),
  color: z.string().trim().max(24).nullish(),
});

const productIdParams = z.object({
  productId: z.string().regex(ID_RE, 'productId must be a valid id'),
});

/** Resolve (and, for fresh visitors, mint) the caller's active cart. */
async function resolveCart(req, res) {
  const userId = req.user ? req.user._id : null;
  let guestId = readGuestId(req);
  const issueCookie = !userId && !guestId;
  if (issueCookie) guestId = crypto.randomUUID();

  const cart = await Cart.getOrCreate({ user: userId, guestId, ttlDays: env.cart.ttlDays });
  if (issueCookie) setGuestCookie(res, guestId);
  return cart;
}

function cartPayload(cart) {
  return { ...cart.toJSON(), summary: cart.summary() };
}

/** Stock-capped quantity: never let more than the shelf holds into a line. */
function capToStock(qty, stock) {
  const onHand = Number(stock) || 0;
  if (onHand <= 0) return Math.min(qty, 1); // keep the line visible, order check fails later
  return Math.min(qty, onHand);
}

// GET /api/cart - current cart + money summary
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const cart = await resolveCart(req, res);
    return ApiResponse.ok(res, 'Cart fetched', cartPayload(cart));
  })
);

// POST /api/cart/items - add one line (live price + stock re-read)
router.post(
  '/items',
  validateBody(lineSchema),
  asyncHandler(async (req, res) => {
    const { productId, qty, size, color } = req.body;

    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) throw ApiError.notFound('Product not found');
    if ((Number(product.stock) || 0) <= 0) throw ApiError.conflict('This product is out of stock');

    const cart = await resolveCart(req, res);
    cart.addLine(product, {
      qty: capToStock(qty, product.stock),
      size: size || null,
      color: color || null,
    });
    cart.status = 'active'; // re-open a cart that previously converted to an order
    await cart.save();

    return ApiResponse.ok(res, 'Added to cart', cartPayload(cart));
  })
);

// PUT /api/cart/items - replace all lines (local -> server sync).
// Unknown/draft products are dropped quietly: a stale local id must never
// brick the whole sync.
router.put(
  '/items',
  validateBody(putSchema),
  asyncHandler(async (req, res) => {
    const entries = req.body.items;
    const ids = [...new Set(entries.map(entry => entry.productId))];
    const products = ids.length
      ? await Product.find({ _id: { $in: ids }, isActive: true })
      : [];
    const byId = new Map(products.map(product => [String(product._id), product]));

    // defensive merge of duplicate product+size+color lines
    const merged = new Map();
    for (const entry of entries) {
      const product = byId.get(entry.productId);
      if (!product) continue;
      const size = entry.size || null;
      const color = entry.color || null;
      const key = `${entry.productId}|${size}|${color}`;
      const line = merged.get(key) || {
        product: product._id,
        name: product.name,
        image: product.thumbnail || '',
        price: product.price,
        size,
        color,
        qty: 0,
        addedAt: new Date(),
      };
      line.qty = Math.min(99, line.qty + entry.qty, capToStock(line.qty + entry.qty, product.stock));
      merged.set(key, line);
    }

    const cart = await resolveCart(req, res);
    cart.items = [...merged.values()];
    cart.status = 'active';
    await cart.save();

    return ApiResponse.ok(res, 'Cart updated', cartPayload(cart));
  })
);

// PATCH /api/cart/items - one line's quantity (0 removes the line)
router.patch(
  '/items',
  validateBody(patchSchema),
  asyncHandler(async (req, res) => {
    const { productId, qty, size, color } = req.body;
    const cart = await resolveCart(req, res);

    const updated = await Cart.setQty(cart._id, {
      productId,
      qty,
      size: size || null,
      color: color || null,
    });
    if (!updated) throw ApiError.notFound('Cart not found');

    return ApiResponse.ok(res, 'Cart updated', cartPayload(updated));
  })
);

// DELETE /api/cart/items/:productId?size=&color= - drop one line
router.delete(
  '/items/:productId',
  validateParams(productIdParams),
  asyncHandler(async (req, res) => {
    const size = typeof req.query.size === 'string' && req.query.size ? req.query.size : null;
    const color = typeof req.query.color === 'string' && req.query.color ? req.query.color : null;
    const cart = await resolveCart(req, res);

    const updated = await Cart.removeLine(cart._id, {
      productId: req.params.productId,
      size,
      color,
    });
    if (!updated) throw ApiError.notFound('Cart not found');

    return ApiResponse.ok(res, 'Item removed', cartPayload(updated));
  })
);

// DELETE /api/cart - empty the cart
router.delete(
  '/',
  asyncHandler(async (req, res) => {
    const cart = await resolveCart(req, res);
    const cleared = await Cart.clear(cart._id);
    return ApiResponse.ok(res, 'Cart cleared', cartPayload(cleared || cart));
  })
);

module.exports = router;
