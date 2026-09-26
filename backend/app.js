const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { env, validateEnv } = require('./config/env');
const { isHealthy } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');
const { apiLimiter, authLimiter } = require('./middleware/rateLimit');
const usersRouter = require('./routes/users');

validateEnv();

const app = express();

// Behind a proxy (Render/NGINX) so req.ip / X-Forwarded-For are trusted
app.set('trust proxy', 1);

// CORS - allow-list comes from CORS_ORIGIN (comma separated); '*' = any origin
const allowAll = env.corsOrigins.includes('*');
app.use(
  cors({
    origin: allowAll ? true : env.corsOrigins,
    credentials: !allowAll,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

app.use(express.json({ limit: env.jsonLimit }));

if (!env.isTest) {
  app.use(morgan(env.isProd ? 'combined' : 'dev'));
}

// Health check (kept before the rate limiter so monitors never get 429)
app.get(`${env.apiPrefix}/health`, (req, res) => {
  res.json({
    status: 'ok',
    db: isHealthy() ? 'connected' : 'disconnected',
    uptime: process.uptime(),
  });
});

// Rate limits: general API traffic + stricter bucket for auth endpoints
app.use(env.apiPrefix, apiLimiter);
app.use(`${env.apiPrefix}/users`, authLimiter, usersRouter);

// 404 -> ApiError -> shared error handler
app.use(notFound);
app.use(errorHandler);

module.exports = app;
