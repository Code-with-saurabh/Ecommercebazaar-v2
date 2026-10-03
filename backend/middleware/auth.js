const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/token');

/**
 * Bearer-token auth (Phase 2).
 *
 *   router.get('/me', requireAuth, handler)      // must be signed in
 *   router.get('/x',  requireAuth, requireRole('admin'), handler)
 *   router.get('/y',  optionalAuth, handler)     // attaches req.user if present
 *
 * Failure modes, deliberately uniform: missing/garbage/expired token ->
 * 401 "Invalid or expired token" (the same answer for all three, so the
 * client learns nothing about which part failed). Signed-in but disabled
 * account -> 403, because the token itself was fine.
 */

function bearerToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token || !token.includes('.')) return null;
  return token;
}

async function attachUser(req, token) {
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  const user = await User.findById(payload.sub);
  // Deleted account -> same message as a bad token (no account probing)
  if (!user) throw ApiError.unauthorized('Invalid or expired token');
  if (user.isActive === false) throw ApiError.forbidden('Account disabled');
  // tokenVersion mismatch = logged out everywhere since this token was issued
  if (typeof payload.tv === 'number' && payload.tv !== user.tokenVersion) {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  req.user = user;
}

async function requireAuth(req, _res, next) {
  try {
    const token = bearerToken(req);
    if (!token) throw ApiError.unauthorized('Authentication required');
    await attachUser(req, token);
    next();
  } catch (err) {
    next(err);
  }
}

/** Same as requireAuth but anonymous requests simply continue without req.user. */
async function optionalAuth(req, _res, next) {
  try {
    const token = bearerToken(req);
    if (token) await attachUser(req, token);
    next();
  } catch {
    next(); // an invalid token must not break an optional endpoint
  }
}

function requireRole(role) {
  return function requireRoleMiddleware(req, _res, next) {
    if (!req.user) return next(ApiError.unauthorized('Authentication required'));
    if (req.user.role !== role) return next(ApiError.forbidden(`Requires ${role} role`));
    return next();
  };
}

module.exports = { requireAuth, optionalAuth, requireRole };
