const express = require('express');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const { env } = require('./config/env');
const { createCors } = require('./config/cors');
const requestId = require('./middleware/requestId');
const { notFound, errorHandler } = require('./middleware/error');
const { apiLimiter, authLimiter } = require('./middleware/rateLimit');
const { securityHeaders } = require('./middleware/security');
const { sanitize } = require('./middleware/sanitize');
const { apiCache } = require('./middleware/cache');
const { mountSpa } = require('./middleware/spa');

// Compile every schema up-front: populate()/refs and the cascade hooks
// (User -> Address/Cart/Review, Review -> Product rating) resolve by name.
require('./models');

const healthRouter = require('./routes/health');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');

const app = express();

// X-Powered-By leaks the framework version - off
app.disable('x-powered-by');
// Only trust X-Forwarded-* when actually behind a proxy (see TRUST_PROXY)
app.set('trust proxy', env.trustProxy);

// --- global middleware (order matters) -------------------------------------

// 1. Security headers on every response, including static HTML
app.use(securityHeaders);

// 2. Correlation id for logs / client bug reports
app.use(requestId);

// 3. CORS
app.use(createCors(env));

// 4. Body parsing (strict: only JSON objects/arrays) + NoSQL key sanitising
app.use(express.json({ limit: env.jsonLimit, strict: true }));
app.use(sanitize);

// 4b. Cookies (refresh token lives in an httpOnly cookie, see utils/token.js)
app.use(cookieParser());

// 5. gzip for JSON payloads and streamed static assets (Critical Rendering Path)
app.use(compression({ threshold: 1024, level: 6 }));

// 6. Request logging (off during tests)
if (!env.isTest) {
  app.use(morgan(env.isProd ? 'combined' : 'dev'));
}

// --- health (before the rate limiter so monitors never get 429) -------------
app.use(`${env.apiPrefix}/health`, healthRouter);

// --- API --------------------------------------------------------------------
app.use(env.apiPrefix, apiCache, apiLimiter);
app.use(`${env.apiPrefix}/users`, authLimiter, usersRouter);
// session endpoints (me/refresh/logout) get their own auth rate-limit bucket
app.use(`${env.apiPrefix}/auth`, authLimiter, authRouter);
// role=admin lives inside the router (middleware/auth.js), budget is apiLimiter
app.use(`${env.apiPrefix}/admin`, adminRouter);

// --- built SPA (production: `npm run build` in frontend/) -------------------
mountSpa(app);

// --- 404 -> ApiError -> shared error handler --------------------------------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
