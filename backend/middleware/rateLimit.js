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
  } = options;

  const hits = new Map();

  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (now - entry.start + windowMs <= 0) hits.delete(key);
    }
  }, Math.min(windowMs, 60 * 1000));
  if (typeof sweep.unref === 'function') sweep.unref();

  return function rateLimitMiddleware(req, res, next) {
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

/** Auth endpoints: strict limit to slow down credential stuffing. */
const authLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.authMax,
  message: 'Too many auth attempts, please try again later',
  keyGenerator: req => `${req.ip}:${(req.body && req.body.username) || ''}`,
});

module.exports = { rateLimit, apiLimiter, authLimiter };
