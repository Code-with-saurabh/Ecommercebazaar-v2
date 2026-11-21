const express = require('express');
const { z } = require('zod');

const Address = require('../models/Address');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { validateBody, validateParams } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { PHONE_RE } = require('../utils/validation');

const ID_RE = /^[0-9a-fA-F]{24}$/;

/**
 * Address book (Phase 2.4) — account-only CRUD behind the checkout picker.
 *
 *   GET    /api/addresses           my addresses (default first)
 *   POST   /api/addresses           add one (first one becomes default)
 *   PUT    /api/addresses/:id       edit mine
 *   DELETE /api/addresses/:id       remove mine
 *   POST   /api/addresses/:id/default  promote to default
 *
 * The one-default-per-user invariant is enforced by the model's pre-save
 * hook, so no route has to remember to clear the other flags.
 */

const router = express.Router();
router.use(requireAuth);

const addressSchema = z.object({
  fullName: z.string().trim().min(2, 'full name must be at least 2 characters').max(80),
  phone: z.string().trim().max(20).regex(PHONE_RE, 'phone must be 7-15 digits with an optional leading +'),
  line1: z.string().trim().min(1, 'address line 1 is required').max(120),
  line2: z.string().trim().max(120).optional().default(''),
  landmark: z.string().trim().max(80).optional().default(''),
  city: z.string().trim().min(1, 'city is required').max(60),
  state: z.string().trim().min(1, 'state is required').max(60),
  pincode: z.string().trim().regex(/^\d{4,10}$/, 'pincode must be 4-10 digits'),
  country: z.string().trim().max(60).optional().default('IN'),
  type: z.enum(['home', 'work', 'other']).optional().default('home'),
  isDefault: z.boolean().optional().default(false),
});

const idParams = z.object({ id: z.string().regex(ID_RE, 'id must be a valid id') });

// GET /api/addresses
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await Address.findForUser(req.user._id);
    return ApiResponse.ok(res, 'OK', items);
  })
);

// POST /api/addresses
router.post(
  '/',
  validateBody(addressSchema),
  asyncHandler(async (req, res) => {
    // First address in the book is always the default - checkout needs a
    // pre-selected target and an empty list must not have one.
    const existing = await Address.countDocuments({ user: req.user._id });
    const doc = await Address.create({
      ...req.body,
      user: req.user._id,
      isDefault: req.body.isDefault || existing === 0,
    });
    return ApiResponse.created(res, 'Address saved', doc);
  })
);

// PUT /api/addresses/:id
router.put(
  '/:id',
  validateParams(idParams),
  validateBody(addressSchema),
  asyncHandler(async (req, res) => {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!address) throw ApiError.notFound('Address not found');

    // owner is immutable: a body can never move an address to another account
    Object.assign(address, req.body);
    await address.save();

    return ApiResponse.ok(res, 'Address updated', address);
  })
);

// DELETE /api/addresses/:id
router.delete(
  '/:id',
  validateParams(idParams),
  asyncHandler(async (req, res) => {
    const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!address) throw ApiError.notFound('Address not found');

    // Deleted the default? Promote the next newest so checkout stays usable.
    if (address.isDefault) {
      const next = await Address.findOne({ user: req.user._id }).sort({ updatedAt: -1 });
      if (next) await Address.makeDefault(req.user._id, next._id);
    }

    return ApiResponse.ok(res, 'Address removed', { id: req.params.id });
  })
);

// POST /api/addresses/:id/default
router.post(
  '/:id/default',
  validateParams(idParams),
  asyncHandler(async (req, res) => {
    const address = await Address.makeDefault(req.user._id, req.params.id);
    if (!address) throw ApiError.notFound('Address not found');
    return ApiResponse.ok(res, 'Default address set', address);
  })
);

module.exports = router;
