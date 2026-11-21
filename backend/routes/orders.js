const express = require('express');
const { z } = require('zod');

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const Address = require('../models/Address');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { computePricing } = require('../utils/pricing');
const { validateBody, validateParams, validateQuery } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const ID_RE = /^[0-9a-fA-F]{24}$/;

/**
 * Orders (Phase 2.4-2.6) — checkout is account-only and fully server-priced.
 *
 *   POST   /api/orders              place an order from the server cart
 *   GET    /api/orders/me           order history (paginated, newest first)
 *   GET    /api/orders/:id          one order (own orders only)
 *   POST   /api/orders/:id/cancel   cancel while status === 'placed'
 *
 * Money rules: live Product.price is re-read for every line, stock is
 * decremented atomically (decrementStock's $gte filter means two concurrent
 * checkouts can never both take the last unit), utils/pricing.js computes
 * totals, and the client's cart/coupon numbers are ignored entirely.
 */

const router = express.Router();
router.use(requireAuth); // orders belong to an account, never a guest cookie

// --- schemas ---------------------------------------------------------------

const addressSnapshot = z.object({
  fullName: z.string().trim().min(2, 'full name must be at least 2 characters').max(80),
  phone: z.string().trim().min(7, 'phone must be 7-15 digits').max(20),
  line1: z.string().trim().min(1, 'address line 1 is required').max(120),
  line2: z.string().trim().max(120).optional().default(''),
  landmark: z.string().trim().max(80).optional().default(''),
  city: z.string().trim().min(1, 'city is required').max(60),
  state: z.string().trim().min(1, 'state is required').max(60),
  pincode: z.string().trim().regex(/^\d{4,10}$/, 'pincode must be 4-10 digits'),
  country: z.string().trim().max(60).optional().default('IN'),
  type: z.enum(['home', 'work', 'other']).optional().default('home'),
});

const createOrderSchema = z
  .object({
    addressId: z.string().regex(ID_RE, 'addressId must be a valid id').optional(),
    address: addressSnapshot.optional(),
    couponCode: z.string().trim().max(40).optional(),
    customerNote: z.string().trim().max(300).optional().default(''),
    paymentMethod: z.enum(['cod', 'razorpay']).default('cod'),
  })
  .refine(data => data.addressId || data.address, {
    message: 'Choose a saved address or provide a full address',
    path: ['address'],
  });

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const idParams = z.object({ id: z.string().regex(ID_RE, 'id must be a valid id') });

/** Coupon rejection reason -> user-facing sentence (stable reason codes). */
const COUPON_MESSAGES = {
  INACTIVE: 'This coupon is no longer active',
  NOT_STARTED: 'This coupon is not active yet',
  EXPIRED: 'This coupon has expired',
  GLOBAL_LIMIT: 'This coupon has reached its usage limit',
  USER_LIMIT: 'You have already used this coupon',
  MIN_CART: 'Your cart does not meet the minimum for this coupon',
  CATEGORY: 'This coupon does not apply to items in your cart',
  INVALID_AMOUNT: 'Your cart is empty',
};

function snapshotFromAddress(address) {
  return {
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 || '',
    landmark: address.landmark || '',
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    country: address.country || 'IN',
  };
}

/**
 * Resolve the shipping address: a saved Address doc the user owns, or the
 * inline snapshot from the form. Both end up as the same Order snapshot.
 */
async function resolveShippingAddress(req, { addressId, address }) {
  if (addressId) {
    const saved = await Address.findOne({ _id: addressId, user: req.user._id });
    if (!saved) throw ApiError.notFound('Address not found');
    return snapshotFromAddress(saved);
  }
  return snapshotFromAddress(address);
}

/**
 * Live-priced order lines from the caller's server cart.
 * Also enforces availability: inactive/missing product or a stock shortfall
 * rejects the whole order BEFORE anything is written.
 */
async function buildOrderLines(cart) {
  const ids = [...new Set(cart.items.map(item => String(item.product)))];
  const products = ids.length ? await Product.find({ _id: { $in: ids }, isActive: true }) : [];
  const byId = new Map(products.map(product => [String(product._id), product]));

  const lines = [];
  for (const item of cart.items) {
    const product = byId.get(String(item.product));
    if (!product) throw ApiError.conflict(`"${item.name}" is no longer available`);
    if ((Number(product.stock) || 0) < item.qty) {
      throw ApiError.conflict(
        product.stock <= 0
          ? `"${product.name}" is out of stock`
          : `Only ${product.stock} left of "${product.name}"`
      );
    }
    lines.push({
      product: product._id,
      name: product.name,
      brand: product.brand || '',
      image: product.thumbnail || '',
      sku: product.sku || '',
      price: product.price, // LIVE price - the cart snapshot is display-only
      qty: item.qty,
      size: item.size || null,
      color: item.color || null,
      category: product.category,
    });
  }
  return lines;
}

/** Validate a coupon against the live lines; throws 400 on any rejection. */
async function evaluateCoupon(code, { userId, lines }) {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const categories = [...new Set(lines.map(line => line.category))];

  const coupon = await Coupon.findByCode(code);
  if (!coupon) throw ApiError.badRequest('This coupon code does not exist');

  const verdict = coupon.evaluate({ userId, subtotal, categories });
  if (!verdict.ok) {
    throw ApiError.badRequest(COUPON_MESSAGES[verdict.reason] || 'This coupon cannot be applied');
  }
  return { coupon, discount: verdict.discount };
}

/**
 * Atomically reserve stock for every line. On any shortfall the lines
 * already decremented are put back before the error propagates - an order
 * must never half-consume inventory.
 */
async function reserveStock(lines) {
  const taken = [];
  try {
    for (const line of lines) {
      const updated = await Product.decrementStock(line.product, line.qty);
      if (!updated) {
        throw ApiError.conflict(`"${line.name}" just went out of stock, please review your cart`);
      }
      taken.push(line);
    }
  } catch (err) {
    await Promise.all(taken.map(line => Product.incrementStock(line.product, line.qty)));
    throw err;
  }
}

// --- routes ----------------------------------------------------------------

// POST /api/orders - place an order (server-priced, stock-reserved)
router.post(
  '/',
  validateBody(createOrderSchema),
  asyncHandler(async (req, res) => {
    const { addressId, address, couponCode, customerNote, paymentMethod } = req.body;
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId, status: 'active' });
    if (!cart || cart.items.length === 0) throw ApiError.badRequest('Your cart is empty');

    const lines = await buildOrderLines(cart);
    const pricingItems = lines.map(line => ({ price: line.price, qty: line.qty }));

    let couponDoc = null;
    let discount = 0;
    if (couponCode) {
      const evaluated = await evaluateCoupon(couponCode, { userId, lines });
      couponDoc = evaluated.coupon;
      discount = evaluated.discount;
    }

    const totals = computePricing({ items: pricingItems, discount });
    const shippingAddress = await resolveShippingAddress(req, { addressId, address });

    await reserveStock(lines);

    let order;
    try {
      order = await Order.create({
        user: userId,
        items: lines.map(({ category: _category, ...line }) => line), // category was coupon-only
        currency: totals.currency,
        subtotal: totals.subtotal,
        discount: totals.discount,
        shipping: totals.shipping,
        tax: totals.tax,
        total: totals.total,
        coupon: couponDoc
          ? {
              code: couponDoc.code,
              type: couponDoc.type,
              value: couponDoc.value,
              discount: totals.discount,
            }
          : null,
        shippingAddress,
        customerNote,
        payment: { method: paymentMethod, status: 'pending' },
      });
    } catch (err) {
      // Order rejected after stock was reserved -> give the stock back.
      await Promise.all(lines.map(line => Product.incrementStock(line.product, line.qty)));
      throw err;
    }

    // Post-persistence side effects: best effort, never fail the response.
    if (couponDoc) {
      Coupon.recordUsage(couponDoc.code, {
        user: userId,
        orderId: order._id,
        discount: totals.discount,
      }).catch(err => console.warn('[orders] coupon usage not recorded:', err.message));
    }

    cart.status = 'converted';
    cart.items = []; // empty now: GET /api/cart must not show a placed order's lines
    cart.couponCode = null;
    await cart.save();

    return ApiResponse.created(res, 'Order placed successfully', order);
  })
);

// GET /api/orders/me - order history for the signed-in account
router.get(
  '/me',
  validateQuery(listQuery),
  asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const filter = { user: req.user._id };

    const [items, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      Order.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, { items, total, page, limit, message: 'OK' });
  })
);

// GET /api/orders/:id - one order (404 for other people's orders, no probing)
router.get(
  '/:id',
  validateParams(idParams),
  asyncHandler(async (req, res) => {
    const order = await Order.findForUserById(req.user._id, req.params.id);
    if (!order) throw ApiError.notFound('Order not found');
    return ApiResponse.ok(res, 'OK', order);
  })
);

// POST /api/orders/:id/cancel - customer cancels a still-placed order.
// Stock goes back; a paid order would need a gateway refund first (Phase 2.5).
router.post(
  '/:id/cancel',
  validateParams(idParams),
  asyncHandler(async (req, res) => {
    const order = await Order.findForUserById(req.user._id, req.params.id);
    if (!order) throw ApiError.notFound('Order not found');

    if (order.status !== 'placed') {
      throw ApiError.conflict(`A ${order.status} order can no longer be cancelled`);
    }
    if (order.payment && order.payment.status === 'paid') {
      throw ApiError.conflict('Paid orders are refunded by support, not self-cancelled');
    }

    try {
      await order.advanceStatus('cancelled', { by: req.user._id, note: 'Cancelled by customer' });
    } catch (err) {
      throw ApiError.conflict(err.message);
    }
    await Order.restock(order);

    return ApiResponse.ok(res, 'Order cancelled', order);
  })
);

module.exports = router;
