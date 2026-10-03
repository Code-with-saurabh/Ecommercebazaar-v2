const express = require('express');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { validateBody, schemas } = require('../middleware/validate');
const { loginLimiter } = require('../middleware/rateLimit');
const {
  signAccessToken,
  signRefreshToken,
  setRefreshCookie,
} = require('../utils/token');

const router = express.Router();

const SALT_ROUNDS = 10;

// Compared against when the user does not exist so response time does not
// reveal whether an account is registered (user-enumeration timing oracle).
const DUMMY_HASH = bcrypt.hashSync('bazaar-timing-equalizer', SALT_ROUNDS);

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

    return ApiResponse.ok(res, 'Login successful', {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      accessToken: signAccessToken(user),
    });
  })
);

module.exports = router;
