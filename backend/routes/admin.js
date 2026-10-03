const express = require('express');
const mongoose = require('mongoose');
const z = require('zod');

const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

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

module.exports = router;
