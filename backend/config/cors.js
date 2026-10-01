const cors = require('cors');

/**
 * Allow-list comes from CORS_ORIGIN (comma separated); '*' = any origin.
 * Credentials are only allowed when a concrete allow-list is configured.
 */
function createCors(env) {
  const allowAll = env.corsOrigins.includes('*');

  return cors({
    origin: allowAll ? true : env.corsOrigins,
    credentials: !allowAll,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    maxAge: 600,
  });
}

module.exports = { createCors };
