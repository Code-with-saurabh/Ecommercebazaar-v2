const express = require('express');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const APIResponse = require('../utils/APIResponse');
const ApiError = require('../utils/ApiError');

const router = express.Router();

const SALT_ROUNDS = 10;

// POST /api/users/register
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { username, email, phone, password } = req.body || {};

    if (!username || !email || !phone || !password) {
      throw ApiError.badRequest('username, email, phone and password are required');
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }, { phone }],
    });

    if (existingUser) {
      throw ApiError.badRequest('Duplicate data');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({ username, email, phone, password: hashedPassword });

    return APIResponse.created(res, 'User registered successfully', {
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
  asyncHandler(async (req, res) => {
    const { username, password } = req.body || {};

    if (!username || !password) {
      throw ApiError.badRequest('username and password are required');
    }

    const user = await User.findOne({ username });

    if (!user) {
      throw ApiError.badRequest('Invalid username or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw ApiError.badRequest('Invalid username or password');
    }

    // Phase 2: replace with a signed JWT (see utils/token.js)
    return APIResponse.ok(res, 'Login successful', {
      id: user._id,
      username: user.username,
    });
  })
);

module.exports = router;
