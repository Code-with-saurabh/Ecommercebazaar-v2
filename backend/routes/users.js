const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');

const User = require('../models/User');
const Cart = require('../models/Cart');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { validateBody, schemas } = require('../middleware/validate');
const { loginLimiter } = require('../middleware/rateLimit');
const { requireAuth } = require('../middleware/auth');
const { readGuestId, clearGuestCookie } = require('../utils/guestCookie');
const {
  signAccessToken,
  signRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
} = require('../utils/token');
const { EMAIL_RE, PHONE_RE } = require('../utils/validation');

const router = express.Router();

const SALT_ROUNDS = 10;

// Compared against when the user does not exist so response time does not
// reveal whether an account is registered (user-enumeration timing oracle).
const DUMMY_HASH = bcrypt.hashSync('bazaar-timing-equalizer', SALT_ROUNDS);

/**
 * Anonymous cart -> account cart (Phase A3): runs after a successful login
 * or registration. Best effort - a cart hiccup must never fail the auth
 * flow. On success the guest cookie is cleared so later cart calls go
 * straight to the account cart.
 */
async function mergeGuestCart(req, res, userId) {
  try {
    const guestId = readGuestId(req);
    if (!guestId) return;
    const guestCart = await Cart.findOne({ guestId, status: 'active' });
    if (!guestCart) return;
    await Cart.mergeIntoUser(guestCart, userId);
    clearGuestCookie(res);
  } catch (err) {
    console.warn('[users] guest cart merge failed:', err.message);
  }
}

// POST /api/users/register
router.post(
  '/register',
  validateBody(schemas.register),
  asyncHandler(async (req, res) => {
    // zod already trimmed/lower-cased every field and dropped unknown keys,
    // and rejected objects (NoSQL operators) with 400 + field details.
    const { username, email, phone, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ username }, { email }, { phone }],
    });

    if (existingUser) {
      const normalized = { username, email, phone };
      const fields = ['username', 'email', 'phone'].filter(
        field => existingUser[field] === normalized[field]
      );
      throw ApiError.conflict(
        `Account already exists for: ${fields.join(', ') || 'that data'}`,
        { fields }
      );
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    let user;
    try {
      user = await User.create({ username, email, phone, password: hashedPassword });
    } catch (err) {
      if (err && err.code === 11000) {
        const fields = Object.keys(err.keyPattern || err.keyValue || {});
        throw ApiError.conflict(`Account already exists for: ${fields.join(', ')}`, { fields });
      }
      throw err;
    }

    // Issue the token pair right away so the client can log in without a
    // second round trip. `role` is taken from the document (never the body -
    // zod strips unknown keys, so register can not self-promote).
    setRefreshCookie(res, signRefreshToken(user));
    await mergeGuestCart(req, res, user._id);

    return ApiResponse.created(res, 'User registered successfully', {
      id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      accessToken: signAccessToken(user),
    });
  })
);

// POST /api/users/login
router.post(
  '/login',
  loginLimiter,
  validateBody(schemas.login),
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username }).select('+password');

    // Same message + comparable timing whether or not the account exists
    const hash = user ? user.password : DUMMY_HASH;
    const isMatch = await bcrypt.compare(password, hash);

    // Same generic message for unknown user, wrong password and blocked
    // account — the client must not learn which of the three happened.
    if (!user || !isMatch || user.isActive === false) {
      throw ApiError.unauthorized('Invalid username or password');
    }

    // Audit trail for the account page (never blocks a successful login)
    try {
      await User.updateOne(
        { _id: user._id },
        { $set: { lastLoginAt: new Date() }, $inc: { loginCount: 1 } }
      );
    } catch (err) {
      console.warn('[login] could not record lastLoginAt:', err.message);
    }

    // access token in the body (frontend stores it), refresh token in an
    // httpOnly cookie (frontend JS can never touch it)
    setRefreshCookie(res, signRefreshToken(user));
    await mergeGuestCart(req, res, user._id);

    return ApiResponse.ok(res, 'Login successful', {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      accessToken: signAccessToken(user),
    });
  })
);

// ---------------------------------------------------------------------------
// Profile (account page) — /api/auth/me still answers "who am I"; these two
// are the only places that MUTATE the signed-in account.
// ---------------------------------------------------------------------------

const profileSchema = z
  .object({
    name: z.string().trim().min(2, 'name must be at least 2 characters').max(80).optional(),
    email: z.string().trim().toLowerCase().max(254).regex(EMAIL_RE, 'must be a valid email address').optional(),
    phone: z.string().trim().max(20).regex(PHONE_RE, 'phone must be 7-15 digits, optional leading +').optional(),
  })
  .refine(data => Object.keys(data).length > 0, { message: 'Nothing to update' });

const passwordSchema = z.object({
  currentPassword: z.string().trim().min(1, 'current password is required'),
  newPassword: z
    .string()
    .trim()
    .min(8, 'password must be at least 8 characters')
    .max(72, 'password must be at most 72 characters'),
});

// PATCH /api/users/me - edit profile fields (username stays the login handle)
router.patch(
  '/me',
  requireAuth,
  validateBody(profileSchema),
  asyncHandler(async (req, res) => {
    const { name, email, phone } = req.body;

    // Uniqueness excluding yourself: a field you are not changing never
    // trips the check, and someone else's value collides -> 409.
    const clash = await User.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : []),
      ],
      _id: { $ne: req.user._id },
    }).exec();

    if (clash) {
      const fields = ['email', 'phone'].filter(field => req.body[field] && clash[field] === req.body[field]);
      throw ApiError.conflict(`That ${fields.join(' / ')} already belongs to another account`, { fields });
    }

    if (name !== undefined) req.user.name = name;
    if (email !== undefined) req.user.email = email;
    if (phone !== undefined) req.user.phone = phone;
    await req.user.save();

    return ApiResponse.ok(res, 'Profile updated', {
      id: req.user._id,
      username: req.user.username,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
    });
  })
);

// POST /api/users/me/password - change password, revoke every session.
// Bumping tokenVersion kills all outstanding refresh AND access tokens:
// a stolen token dies with the password, not at its natural 15-minute expiry.
router.post(
  '/me/password',
  requireAuth,
  validateBody(passwordSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('+password');

    const ok = await bcrypt.compare(req.body.currentPassword, user.password);
    if (!ok) throw ApiError.unauthorized('Current password is incorrect');

    user.password = await bcrypt.hash(req.body.newPassword, SALT_ROUNDS);
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    clearRefreshCookie(res);
    return ApiResponse.ok(res, 'Password changed - please sign in again', { reauth: true });
  })
);

module.exports = router;
