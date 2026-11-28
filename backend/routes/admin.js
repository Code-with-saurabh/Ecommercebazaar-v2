const express = require('express');
const mongoose = require('mongoose');
const z = require('zod');

const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateBody, validateQuery, validateParams } = require('../middleware/validate');

const router = express.Router();

/**
 * /api/admin/* - admin panel API (role === 'admin' only).
 *
 * Every route is behind requireAuth + requireRole('admin'); the router
 * itself is mounted under the general API limiter, so probing costs the
 * attacker the same rate-limit budget as normal traffic.
 */

const statusSchema = z.object({ isActive: z.boolean() });
const roleSchema = z.object({ role: z.enum(['user', 'admin']) });

// --- schemas: catalog, orders, coupons, moderation ---------------------------

const CATEGORIES = ['tshirts', 'shirts', 'pants', 'shoes'];

const productImageSchema = z.object({
  url: z.string().trim().min(1, 'image url is required').max(500),
  alt: z.string().trim().max(120).optional().default(''),
  isPrimary: z.boolean().optional().default(false),
});

const productWriteSchema = z.object({
  name: z.string().trim().min(2, 'name must be at least 2 characters').max(140),
  brand: z.string().trim().min(1, 'brand is required').max(60),
  description: z.string().trim().min(1, 'description is required').max(5000),
  price: z.number().min(0, 'price cannot be negative'),
  mrp: z.number().min(0, 'mrp cannot be negative').nullable().optional(),
  category: z.enum(CATEGORIES),
  images: z.array(productImageSchema).max(12, 'a product can have at most 12 images').optional().default([]),
  sizes: z.array(z.string().trim().max(24)).max(30).optional().default([]),
  colors: z.array(z.string().trim().max(24)).max(30).optional().default([]),
  stock: z.number().int().min(0, 'stock cannot be negative'),
  lowStockThreshold: z.number().int().min(0).optional(),
  tags: z.array(z.string().trim().max(40)).max(20).optional().default([]),
  isFeatured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

const productPatchSchema = productWriteSchema.partial();

const productQuerySchema = z.object({
  query: z.string().trim().max(100).optional(),
  category: z.enum(CATEGORIES).optional(),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const orderStatusSchema = z.object({
  status: z.enum(['placed', 'packed', 'shipped', 'delivered', 'cancelled']),
  note: z.string().trim().max(200).optional().default(''),
});

const orderQuerySchema = z.object({
  status: z.enum(['placed', 'packed', 'shipped', 'delivered', 'cancelled']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const couponBaseSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, 'coupon code must be at least 3 characters')
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, 'coupon code may only contain letters, numbers, _ and -'),
  description: z.string().trim().max(200).optional().default(''),
  type: z.enum(['percent', 'flat']),
  value: z.number().min(0, 'coupon value cannot be negative'),
  minCart: z.number().min(0).optional().default(0),
  maxDiscount: z.number().min(0).nullable().optional(),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  usageLimit: z.number().int().min(0).nullable().optional(),
  perUserLimit: z.number().int().min(0).optional().default(1),
  applicableCategories: z.array(z.enum(CATEGORIES)).optional().default([]),
  active: z.boolean().optional().default(true),
});

// full schema carries the cross-field rule; .partial() must run on the raw
// object (zod v4 refuses to partial a refined schema)
const couponWriteSchema = couponBaseSchema.refine(data => data.type !== 'percent' || (data.value > 0 && data.value <= 100), {
  message: 'percent coupons must have a value between 1 and 100',
  path: ['value'],
});

const couponPatchSchema = couponBaseSchema.partial();

const reviewStatusSchema = z.object({ status: z.enum(['published', 'hidden']) });

const reviewQuerySchema = z.object({
  status: z.enum(['published', 'hidden']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const idParams = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'id must be a valid id') });

router.use(requireAuth, requireRole('admin'));

/** User search: username/e-mail contains, optional role/status filters. */
router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
    const role = ['user', 'admin'].includes(req.query.role) ? req.query.role : null;
    const status = ['active', 'disabled'].includes(req.query.status) ? req.query.status : null;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const filter = {};
    if (query) {
      // escape regex metacharacters - this is user input, not a free-for-all
      const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [{ username: { $regex: safe, $options: 'i' } }, { email: { $regex: safe, $options: 'i' } }];
    }
    if (role) filter.role = role;
    if (status) filter.isActive = status === 'active';

    const [items, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      User.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, { items, total, page, limit, message: 'OK' });
  })
);

/** One dashboard payload: account counts + order/product/review volume. */
router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, admins, disabled, newUsers7d, totalOrders, orderStatuses, totalProducts, totalReviews] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'admin' }),
        User.countDocuments({ isActive: false }),
        User.countDocuments({ createdAt: { $gte: weekAgo } }),
        Order.countDocuments(),
        Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Product.countDocuments(),
        Review.countDocuments(),
      ]);

    const ordersByStatus = {};
    for (const row of orderStatuses) ordersByStatus[row._id || 'unknown'] = row.count;

    return ApiResponse.ok(res, 'OK', {
      users: { total: totalUsers, admins, disabled, newLast7d: newUsers7d },
      orders: { total: totalOrders, byStatus: ordersByStatus },
      products: totalProducts,
      reviews: totalReviews,
    });
  })
);

/** Enable / disable an account (the same switch login checks). */
router.patch(
  '/users/:id/status',
  validateBody(statusSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) throw ApiError.notFound('User not found');

    if (String(req.user._id) === id && req.body.isActive === false) {
      throw ApiError.forbidden('You cannot disable your own account');
    }

    const user = await User.findByIdAndUpdate(id, { $set: { isActive: req.body.isActive } }, { new: true });
    if (!user) throw ApiError.notFound('User not found');

    return ApiResponse.ok(res, user.isActive ? 'Account enabled' : 'Account disabled', {
      id: user._id,
      username: user.username,
      isActive: user.isActive,
    });
  })
);

/** Promote / demote, with last-admin and self-demotion guards. */
router.patch(
  '/users/:id/role',
  validateBody(roleSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) throw ApiError.notFound('User not found');

    if (String(req.user._id) === id) {
      throw ApiError.forbidden('You cannot change your own role');
    }

    const target = await User.findById(id);
    if (!target) throw ApiError.notFound('User not found');

    if (target.role === 'admin' && req.body.role === 'user') {
      const admins = await User.countDocuments({ role: 'admin' });
      if (admins <= 1) throw ApiError.forbidden('Cannot demote the last admin');
    }

    target.role = req.body.role;
    await target.save();

    return ApiResponse.ok(res, `Role set to ${target.role}`, {
      id: target._id,
      username: target.username,
      role: target.role,
    });
  })
);

// ---------------------------------------------------------------------------
// Catalog CRUD (routes/products.js stays GET-only - writes live here)
// ---------------------------------------------------------------------------

/** Admin product list: drafts included, unlike the public catalog. */
router.get(
  '/products',
  validateQuery(productQuerySchema),
  asyncHandler(async (req, res) => {
    const { query, category, status, page, limit } = req.query;

    const filter = {};
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    if (category) filter.category = category;
    if (query) {
      const safe = escapeRegex(query);
      filter.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { brand: { $regex: safe, $options: 'i' } },
        { sku: { $regex: safe, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      Product.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, { items, total, page, limit, message: 'OK' });
  })
);

// POST /api/admin/products - sku + slug are generated by the model's hooks
router.post(
  '/products',
  validateBody(productWriteSchema),
  asyncHandler(async (req, res) => {
    const product = await Product.create(req.body);
    return ApiResponse.created(res, 'Product created', product);
  })
);

// PATCH /api/admin/products/:id - partial update; model validates price <= mrp
router.patch(
  '/products/:id',
  validateParams(idParams),
  validateBody(productPatchSchema, { suppliedOnly: true }),
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound('Product not found');

    const product = await Product.findById(req.params.id);
    if (!product) throw ApiError.notFound('Product not found');

    Object.assign(product, req.body);
    await product.save();

    return ApiResponse.ok(res, 'Product updated', product);
  })
);

// DELETE /api/admin/products/:id - soft delete: catalog rows are referenced
// by orders/wishlist, so the row must outlive the listing.
router.delete(
  '/products/:id',
  validateParams(idParams),
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound('Product not found');

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );
    if (!product) throw ApiError.notFound('Product not found');

    return ApiResponse.ok(res, 'Product delisted', { id: product._id, isActive: product.isActive });
  })
);

// ---------------------------------------------------------------------------
// Order queue (status moves through the Order model's state machine)
// ---------------------------------------------------------------------------

router.get(
  '/orders',
  validateQuery(orderQuerySchema),
  asyncHandler(async (req, res) => {
    const { status, page, limit } = req.query;
    const filter = status ? { status } : {};

    const [items, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', 'username email')
        .exec(),
      Order.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, { items, total, page, limit, message: 'OK' });
  })
);

router.get(
  '/orders/:id',
  validateParams(idParams),
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound('Order not found');
    const order = await Order.findById(req.params.id).populate('user', 'username email');
    if (!order) throw ApiError.notFound('Order not found');
    return ApiResponse.ok(res, 'OK', order);
  })
);

/** Advance the state machine; cancelling restocks the shelves. */
router.patch(
  '/orders/:id/status',
  validateParams(idParams),
  validateBody(orderStatusSchema),
  asyncHandler(async (req, res) => {
    const { status, note } = req.body;
    if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound('Order not found');

    const order = await Order.findById(req.params.id);
    if (!order) throw ApiError.notFound('Order not found');
    if (order.status === status) return ApiResponse.ok(res, 'Order unchanged', order);

    try {
      await order.advanceStatus(status, { by: req.user._id, note });
    } catch (err) {
      // domain Error from the state machine -> 409, message is the reason
      throw ApiError.conflict(err.message);
    }

    if (status === 'cancelled') await Order.restock(order);

    return ApiResponse.ok(res, `Order marked ${status}`, order);
  })
);

// ---------------------------------------------------------------------------
// Coupons (evaluate/apply lives in routes/coupons.js + routes/orders.js)
// ---------------------------------------------------------------------------

router.get(
  '/coupons',
  validateQuery(
    z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(50).default(20),
    })
  ),
  asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const [items, total] = await Promise.all([
      Coupon.find()
        .sort({ usedCount: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-usedBy') // audit rows are heavy and never shown in the list
        .exec(),
      Coupon.countDocuments(),
    ]);
    return ApiResponse.paginated(res, { items, total, page, limit, message: 'OK' });
  })
);

router.post(
  '/coupons',
  validateBody(couponWriteSchema),
  asyncHandler(async (req, res) => {
    try {
      const coupon = await Coupon.create(req.body);
      return ApiResponse.created(res, 'Coupon created', coupon);
    } catch (err) {
      if (err && err.code === 11000) throw ApiError.conflict('That coupon code already exists');
      throw err;
    }
  })
);

router.patch(
  '/coupons/:id',
  validateParams(idParams),
  validateBody(couponPatchSchema, { suppliedOnly: true }),
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound('Coupon not found');
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) throw ApiError.notFound('Coupon not found');

    Object.assign(coupon, req.body);
    if (coupon.type === 'percent' && (coupon.value <= 0 || coupon.value > 100)) {
      throw ApiError.badRequest('Percent coupons must have a value between 1 and 100');
    }
    try {
      await coupon.save();
    } catch (err) {
      if (err && err.code === 11000) throw ApiError.conflict('That coupon code already exists');
      throw err;
    }

    return ApiResponse.ok(res, 'Coupon updated', coupon);
  })
);

// Soft kill switch: codes with redemptions stay for audit, just switch off.
router.delete(
  '/coupons/:id',
  validateParams(idParams),
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound('Coupon not found');
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, { $set: { active: false } }, { new: true });
    if (!coupon) throw ApiError.notFound('Coupon not found');
    return ApiResponse.ok(res, 'Coupon deactivated', { id: coupon._id, active: coupon.active });
  })
);

// ---------------------------------------------------------------------------
// Review moderation (setStatus refreshes Product.rating via model hooks)
// ---------------------------------------------------------------------------

router.get(
  '/reviews',
  validateQuery(reviewQuerySchema),
  asyncHandler(async (req, res) => {
    const { status, page, limit } = req.query;
    const filter = status ? { status } : {};

    const [items, total] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', 'username email')
        .populate('product', 'name slug')
        .exec(),
      Review.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, { items, total, page, limit, message: 'OK' });
  })
);

router.patch(
  '/reviews/:id/status',
  validateParams(idParams),
  validateBody(reviewStatusSchema),
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound('Review not found');
    const review = await Review.setStatus(req.params.id, req.body.status);
    if (!review) throw ApiError.notFound('Review not found');
    return ApiResponse.ok(res, `Review ${review.status}`, review);
  })
);

module.exports = router;
