const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

/**
 * Token pair.
 *
 *   access  - 15m, JSON body of login/register, sent as Bearer header.
 *             Carries { sub, role, tv } and is verified on every request
 *             WITHOUT a database round trip for the signature itself.
 *   refresh - 7d, httpOnly cookie (bazaar_rt), carries { sub, tv } where tv
 *             is the user's tokenVersion. Bumping tokenVersion (logout,
 *             password change) instantly kills every refresh token issued
 *             before it - the revocation lever for stateless JWTs.
 *
 * `tv` is copied into the refresh token, never into the access token's
 * version-independent checks: requireAuth re-reads isActive from Mongo so a
 * disabled account dies on its next request even with a valid access token.
 */

function signAccessToken(user) {
  return jwt.sign(
    { role: user.role, tv: user.tokenVersion },
    env.jwt.secret,
    {
      subject: String(user._id),
      expiresIn: env.jwt.accessTtl,
      issuer: env.jwt.issuer,
    }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { tv: user.tokenVersion },
    env.jwt.refreshSecret,
    {
      subject: String(user._id),
      expiresIn: env.jwt.refreshTtl,
      issuer: env.jwt.issuer,
    }
  );
}

/** Returns the decoded payload or throws (JsonWebTokenError/TokenExpiredError). */
function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.secret, { issuer: env.jwt.issuer });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret, { issuer: env.jwt.issuer });
}

/** Cookie flags shared by set/refresh/clear so they can never drift. */
function refreshCookieOptions() {
  return {
    httpOnly: true, // JS can never read it -> XSS cannot exfiltrate it
    secure: env.isProd, // Secure in prod (https); localhost dev is http
    sameSite: 'lax', // sent for same-site XHR (localhost:3000 -> :5000), not cross-site POSTs
    path: '/', // available to the whole API
    maxAge: ttlToMs(env.jwt.refreshTtl),
  };
}

function setRefreshCookie(res, token) {
  res.cookie(env.jwt.refreshCookie, token, refreshCookieOptions());
}

function clearRefreshCookie(res) {
  // options minus maxAge: a clear must match name/path/domain/sameSite/secure
  const { maxAge: _maxAge, ...rest } = refreshCookieOptions();
  res.clearCookie(env.jwt.refreshCookie, rest);
}

/** '15m' / '7d' / '3600' -> milliseconds (jwt accepts these formats). */
function ttlToMs(ttl) {
  const match = /^(\d+)([smhd])?$/.exec(String(ttl).trim());
  if (!match) return 0;
  const value = Number(match[1]);
  const unit = match[2] || 's';
  const factor = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit];
  return value * factor;
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
  refreshCookieOptions,
  ttlToMs,
};
