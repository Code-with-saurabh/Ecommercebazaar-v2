const express = require('express');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { requireAuth } = require('../middleware/auth');
const { env } = require('../config/env');
const {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
} = require('../utils/token');

const router = express.Router();

/** Shape handed to the client after login/refresh/me - never the raw doc. */
function sessionPayload(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive !== false,
  };
}

// GET /api/auth/me - who am I? (the header UI calls this on boot)
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    return ApiResponse.ok(res, 'OK', sessionPayload(req.user));
  })
);

// POST /api/auth/refresh - exchange the httpOnly refresh cookie for a new
// access token. No body, no Bearer: the cookie is the credential.
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = req.cookies && req.cookies[env.jwt.refreshCookie];
    if (!token) throw ApiError.unauthorized('Authentication required');

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw ApiError.unauthorized('Invalid or expired session');
    }

    const user = await User.findById(payload.sub);
    if (!user || user.isActive === false || payload.tv !== user.tokenVersion) {
      // deleted / disabled / logged-out-everywhere -> cookie is dead weight
      clearRefreshCookie(res);
      throw ApiError.unauthorized('Invalid or expired session');
    }

    // Rotate: new refresh cookie + new access token (same tokenVersion, so
    // parallel tabs keep working; logout is what bumps the version)
    setRefreshCookie(res, signRefreshToken(user));

    return ApiResponse.ok(res, 'Session refreshed', {
      ...sessionPayload(user),
      accessToken: signAccessToken(user),
    });
  })
);

// POST /api/auth/logout - revoke every refresh token and drop the cookie.
// Works with just the cookie (a lapsed access token must not trap you in).
router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token = req.cookies && req.cookies[env.jwt.refreshCookie];

    if (token) {
      try {
        const payload = verifyRefreshToken(token);
        await User.updateOne({ _id: payload.sub }, { $inc: { tokenVersion: 1 } });
      } catch {
        // garbage/expired cookie: nothing to revoke, still clear it below
      }
    }

    clearRefreshCookie(res);
    return ApiResponse.ok(res, 'Logged out', null);
  })
);

module.exports = router;
