const path = require('path');

// Load backend/.env if present (Node >= 20.12 built-in, no dotenv needed)
try {
  process.loadEnvFile(path.join(__dirname, '..', '.env'));
} catch {
  // no .env file -> fall back to process env / defaults below
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

const DEFAULT_JWT_SECRET = 'dev-only-secret-change-me';

const env = {
  nodeEnv,
  isProd,
  isTest: nodeEnv === 'test',

  // server
  port: Number(process.env.PORT) || 5000,
  apiPrefix: '/api',
  // Trust X-Forwarded-For (needed behind Render/NGINX; keep false when the
  // server is directly exposed, otherwise clients could spoof their IP and
  // dodge the rate limiter). Defaults to true in production, false in dev.
  trustProxy: process.env.TRUST_PROXY
    ? !/^(false|0|no)$/i.test(process.env.TRUST_PROXY)
    : isProd,
  corsOrigins: (process.env.CORS_ORIGIN || '*')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean),

  // database
  mongoURL: process.env.mongoURL || 'mongodb://127.0.0.1:27017/ecommerce',
  mongoOptions: {
    // Fail fast when Mongo is unreachable instead of hanging for 30s
    serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_MS) || 5000,
    // Create indexes declared in the schemas (unique email/username/phone)
    autoIndex: true,
  },

  // auth
  // access  -> short-lived JWT, sent as `Authorization: Bearer`
  // refresh -> longer-lived JWT, httpOnly cookie, rotated on every refresh
  //            (signed with a SEPARATE secret when JWT_REFRESH_SECRET is set,
  //            so a leaked access token cannot mint refresh tokens)
  jwt: {
    secret: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
    accessTtl: process.env.JWT_ACCESS_TTL || '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL || '7d',
    refreshCookie: process.env.JWT_REFRESH_COOKIE || 'bazaar_rt',
    issuer: 'bazaar-api',
  },

  // payments (Phase 2 - filled in when payments are implemented)
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  },

  // anonymous carts: id lives in an httpOnly cookie, TTL'd in Mongo
  cart: {
    cookie: process.env.CART_COOKIE || 'guest_cart',
    ttlDays: Number(process.env.CART_TTL_DAYS) || 30,
  },

  // body limits / rate limits
  jsonLimit: process.env.JSON_LIMIT || '100kb',
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 300,
    // 30 covers register + login for one IP inside a window; the /api/auth
    // router gets its own bucket, so session traffic never eats into it.
    authMax: Number(process.env.RATE_LIMIT_AUTH_MAX) || 30,
    loginMax: Number(process.env.RATE_LIMIT_LOGIN_MAX) || 10,
  },
};

function validateEnv() {
  const problems = [];

  if (isProd) {
    if (!process.env.JWT_SECRET) {
      problems.push('JWT_SECRET must be set in production');
    } else if (env.jwt.secret === DEFAULT_JWT_SECRET) {
      problems.push('JWT_SECRET is still the development default');
    }
    if (!process.env.mongoURL) {
      problems.push('mongoURL must be set in production');
    }
    if (env.corsOrigins.includes('*')) {
      problems.push('CORS_ORIGIN must not be "*" in production');
    }
  }

  if (problems.length) {
    throw new Error(`Invalid environment configuration:\n  - ${problems.join('\n  - ')}`);
  }
}

module.exports = { env, validateEnv };
