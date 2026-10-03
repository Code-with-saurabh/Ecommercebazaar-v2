const { env } = require('../config/env');

/**
 * The anonymous-cart cookie (`guest_cart`): an opaque id, httpOnly so scripts
 * cannot read it, SameSite=Lax so the browser sends it on same-site XHR
 * (localhost:3000 -> localhost:5000 is same-site - ports are not part of the
 * site). Cleared when the guest cart is merged into a user account at login.
 */

function guestCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: env.cart.ttlDays * 24 * 60 * 60 * 1000,
  };
}

function readGuestId(req) {
  const raw = req.cookies && req.cookies[env.cart.cookie];
  return typeof raw === 'string' && raw.trim() ? raw.trim().slice(0, 80) : null;
}

function setGuestCookie(res, guestId) {
  res.cookie(env.cart.cookie, guestId, guestCookieOptions());
}

function clearGuestCookie(res) {
  const { maxAge: _maxAge, ...rest } = guestCookieOptions();
  res.clearCookie(env.cart.cookie, rest);
}

module.exports = { readGuestId, setGuestCookie, clearGuestCookie };
