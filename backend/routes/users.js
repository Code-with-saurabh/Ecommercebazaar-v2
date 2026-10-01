const express = require('express');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { validateRegistration } = require('../utils/validation');
const { loginLimiter } = require('../middleware/rateLimit');

const router = express.Router();

const SALT_ROUNDS = 10;

// Compared against when the user does not exist so response time does not
// reveal whether an account is registered (user-enumeration timing oracle).
const DUMMY_HASH = bcrypt.hashSync('bazaar-timing-equalizer', SALT_ROUNDS);

/** Field must be a plain string - objects would be MongoDB operators. */
function asString(value, field) {
  if (typeof value !== 'string') {
    throw ApiError.badRequest(`${field} must be a string`, [
      { field, message: `${field} must be a string` },
    ]);
  }
  return value.trim();
}

// POST /api/users/register
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const username = asString(body.username, 'username');
    const email = asString(body.email, 'email').toLowerCase();
    const phone = asString(body.phone, 'phone');
    const password = asString(body.password, 'password');

    const errors = validateRegistration({ username, email, phone, password });
    if (errors.length) throw ApiError.badRequest('Validation failed', errors);

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

    return ApiResponse.created(res, 'User registered successfully', {
      id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
    });
  })
);

// POST /api/users/login
router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const username = asString(body.username, 'username');
    const password = asString(body.password, 'password');

    if (!username || !password) {
      throw ApiError.badRequest('username and password are required');
    }

    const user = await User.findOne({ username }).select('+password');

    // Same message + comparable timing whether or not the account exists
    const hash = user ? user.password : DUMMY_HASH;
    const isMatch = await bcrypt.compare(password, hash);

    if (!user || !isMatch) {
      throw ApiError.unauthorized('Invalid username or password');
    }

    return ApiResponse.ok(res, 'Login successful', {
      id: user._id,
      username: user.username,
      email: user.email,
    });
  })
);

module.exports = router;
