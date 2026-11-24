const express = require('express');
const { z } = require('zod');

const Newsletter = require('../models/Newsletter');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const { validateBody } = require('../middleware/validate');
const { EMAIL_RE } = require('../utils/validation');

const router = express.Router();

/**
 * POST /api/newsletter { email } - public homepage/footer capture.
 *
 * Idempotent: a double-tap answers 200 `already:true` instead of 409, so
 * the UI can always show the same calm success state. Inherits the global
 * apiLimiter from app.js - no dedicated limiter needed for one field.
 */
const subscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .regex(EMAIL_RE, 'must be a valid email address'),
});

router.post(
  '/',
  validateBody(subscribeSchema),
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    const existing = await Newsletter.findOne({ email });
    if (existing) return ApiResponse.ok(res, 'Already subscribed', { subscribed: true, already: true });

    await Newsletter.create({ email });
    return ApiResponse.created(res, 'Subscribed', { subscribed: true, already: false });
  })
);

module.exports = router;
