const ApiError = require('../utils/ApiError');
const { env } = require('../config/env');

/**
 * Dependency-free sliding-window rate limiter.
 * Swap for `express-rate-limit` if you need a store shared across instances.
 *
 *   app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
 */
function rateLimit(options = {}) {
  const {
    windowMs = env.rateLimit.windowMs,
    max = env.rateLimit.max,
    message = 'Too many requests, please try again later',
    keyGenerator = req => req.ip,
    skip = req => req.method === 'OPTIONS',
  } = options;

  const hits = new Map();

  // Drop entries whose window has expired (fixes the old condition that never fired)
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (now - entry.start >= windowMs) hits.delete(key);
    }
  }, Math.min(windowMs, 60 * 1000));
  if (typeof sweep.unref === 'function') sweep.unref();

  return function rateLimitMiddleware(req, res, next) {
    if (skip(req)) return next();

    const key = keyGenerator(req);
    const now = Date.now();

    let entry = hits.get(key);
    if (!entry || now - entry.start >= windowMs) {
      entry = { start: now, count: 0 };
      hits.set(key, entry);
    }

    entry.count += 1;
    const remaining = Math.max(0, max - entry.count);
    const resetAt = entry.start + windowMs;

    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', new Date(resetAt).toISOString());

    if (entry.count > max) {
      const retryAfter = Math.max(1, Math.ceil((resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      return next(ApiError.tooMany(message, { retryAfter }));
    }

    return next();
  };
}

/** General API traffic: generous limit for normal browsing. */
const apiLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  message: 'Too many API requests, please slow down',
});

/**
 * Auth endpoints: strict per-IP limit. Keyed by IP only - the old
 * `ip:username` key let attackers reset the bucket with every new username.
 */
const authLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.authMax,
  message: 'Too many auth attempts, please try again later',
  keyGenerator: req => req.ip,
});

/**
 * Login brute-force shield: per IP + username. Stops targeted password
 * guessing even when the attacker rotates source IPs slowly.
 */
const loginLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.loginMax,
  message: 'Too many login attempts for this account, please try again later',
  keyGenerator: req => {
    const username = req.body && typeof req.body.username === 'string' ? req.body.username : '';
    return `login:${req.ip}:${username.toLowerCase()}`;
  },
});

module.exports = { rateLimit, apiLimiter, authLimiter, loginLimiter };
