const express = require('express');
const { z } = require('zod');

const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { validateQuery } = require('../middleware/validate');

const router = express.Router();

/**
 * Public catalog. Read-only: every response is isActive-only (drafts never
 * leak), priced from the database (never the client), and validated with zod
 * so `?page=-1&limit=9999` dies at 400 instead of an expensive query.
 *
 * Admin CRUD lives in routes/admin.js - this router stays GET-only so no
 * amount of routing confusion can write through it.
 */

const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: -1 },
  rating: { 'rating.avg': -1, 'rating.count': -1, _id: -1 },
  popular: { soldCount: -1, _id: -1 },
  name: { name: 1, _id: 1 },
};

const CATEGORIES = ['tshirts', 'shirts', 'pants', 'shoes'];

const listQuerySchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  q: z.string().trim().max(100).optional(),
  brand: z.string().trim().max(60).optional(),
  tag: z.string().trim().max(40).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.enum(['true', 'false']).optional(),
  featured: z.enum(['true', 'false']).optional(),
  sort: z.enum(Object.keys(SORTS)).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** User input goes into RegExp - escape everything, or don't build the pattern. */
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/products?category=&q=&brand=&tag=&minPrice=&maxPrice=
//                  &inStock=&featured=&sort=&page=&limit=
router.get(
  '/',
  validateQuery(listQuerySchema),
  asyncHandler(async (req, res) => {
    const { category, q, brand, tag, minPrice, maxPrice, inStock, featured, sort, page, limit } = req.query;

    const filter = { isActive: true };
    if (category) filter.category = category;
    if (brand) filter.brand = { $regex: `^${escapeRegex(brand)}$`, $options: 'i' };
    if (tag) filter.tags = tag.trim().toLowerCase();
    if (featured === 'true') filter.isFeatured = true;
    if (inStock === 'true') filter.stock = { $gt: 0 };
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }
    if (q) {
      const safe = escapeRegex(q);
      filter.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { brand: { $regex: safe, $options: 'i' } },
        { tags: { $regex: safe, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort(SORTS[sort] || SORTS.newest)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      Product.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, { items, total, page, limit, message: 'OK' });
  })
);

// GET /api/products/brands - filter chips / autocomplete (before /:id!)
router.get(
  '/brands',
  asyncHandler(async (_req, res) => {
    const brands = await Product.distinct('brand', { isActive: true });
    brands.sort((a, b) => a.localeCompare(b));
    return ApiResponse.ok(res, 'OK', brands);
  })
);

// GET /api/products/categories - the four fixed buckets (before /:id!)
router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    // counts come from the DB so a disabled product stops inflating the chip
    const rows = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const counts = Object.fromEntries(CATEGORIES.map(c => [c, 0]));
    for (const row of rows) counts[row._id] = row.count;
    return ApiResponse.ok(res, 'OK', counts);
  })
);

// GET /api/products/:id - accepts the mongo id OR the shareable slug
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const key = req.params.id;
    const looksLikeId = /^[0-9a-fA-F]{24}$/.test(key);
    const product = await Product.findOne(
      looksLikeId ? { _id: key, isActive: true } : { slug: key.toLowerCase(), isActive: true }
    );
    if (!product) throw ApiError.notFound('Product not found');
    return ApiResponse.ok(res, 'OK', product);
  })
);

module.exports = router;
