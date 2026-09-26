const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const { env, validateEnv } = require('./config/env');
const { isHealthy } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');
const { apiLimiter, authLimiter } = require('./middleware/rateLimit');
const { securityHeaders } = require('./middleware/security');
const { sanitize } = require('./middleware/sanitize');
const { apiCache } = require('./middleware/cache');
const usersRouter = require('./routes/users');

validateEnv();

const app = express();

// X-Powered-By leaks the framework version - off
app.disable('x-powered-by');
// Only trust X-Forwarded-* when actually behind a proxy (see TRUST_PROXY)
app.set('trust proxy', env.trustProxy);

// --- global middleware (order matters) -------------------------------------

// 1. Security headers on every response, including static HTML
app.use(securityHeaders);

// 2. Correlation id for logs / client bug reports
app.use((req, res, next) => {
  const header = req.headers['x-request-id'];
  const safe = typeof header === 'string' && /^[A-Za-z0-9._-]{1,64}$/.test(header);
  const id = safe ? header : crypto.randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
});

// 3. CORS - allow-list comes from CORS_ORIGIN (comma separated); '*' = any origin
const allowAll = env.corsOrigins.includes('*');
app.use(
  cors({
    origin: allowAll ? true : env.corsOrigins,
    credentials: !allowAll,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    maxAge: 600,
  })
);

// 4. Body parsing (strict: only JSON objects/arrays) + NoSQL key sanitising
app.use(express.json({ limit: env.jsonLimit, strict: true }));
app.use(sanitize);

// 5. gzip for JSON payloads and streamed static assets (Critical Rendering Path)
app.use(compression({ threshold: 1024, level: 6 }));

// 6. Request logging (off during tests)
if (!env.isTest) {
  app.use(morgan(env.isProd ? 'combined' : 'dev'));
}

// --- health (before the rate limiter so monitors never get 429) -------------
app.get(`${env.apiPrefix}/health`, (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    status: 'ok',
    db: isHealthy() ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    version: require('./package.json').version,
  });
});

// --- API --------------------------------------------------------------------
app.use(env.apiPrefix, apiCache, apiLimiter);
app.use(`${env.apiPrefix}/users`, authLimiter, usersRouter);

// --- built SPA (production: `npm run build` in frontend/) -------------------
const DIST_DIR = path.resolve(__dirname, '..', 'frontend', 'dist');
const hasDist = fs.existsSync(path.join(DIST_DIR, 'index.html'));

if (hasDist) {
  app.use(
    express.static(DIST_DIR, {
      index: false,
      setHeaders(res, filePath) {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          // Vite fingerprints these files - safe to cache forever
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=3600');
        }
      },
    })
  );

  // SPA fallback: any other GET that wants HTML renders the app shell
  app.get('*', (req, res, next) => {
    if (req.path.startsWith(env.apiPrefix) || !req.accepts('html')) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

// --- 404 -> ApiError -> shared error handler --------------------------------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
