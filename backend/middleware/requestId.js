const crypto = require('crypto');

const SAFE_ID = /^[A-Za-z0-9._-]{1,64}$/;

/** Correlation id: reuse a safe client X-Request-Id or mint a new one. */
function requestId(req, res, next) {
  const header = req.headers['x-request-id'];
  const id = typeof header === 'string' && SAFE_ID.test(header) ? header : crypto.randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}

module.exports = requestId;
