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
  corsOrigins: (process.env.CORS_ORIGIN || '*')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean),

  // database
  mongoURL: process.env.mongoURL || 'mongodb://127.0.0.1:27017/ecommerce',
  mongoOptions: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    autoIndex: true,
  },

  // auth
  jwt: {
    secret: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'bazaar-api',
  },

  // payments (Phase 2 - filled in when payments are implemented)
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  },

  // body limits / rate limits
  jsonLimit: process.env.JSON_LIMIT || '100kb',
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 300,
    authMax: Number(process.env.RATE_LIMIT_AUTH_MAX) || 20,
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
