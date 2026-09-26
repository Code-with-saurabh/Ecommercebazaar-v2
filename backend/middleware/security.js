/**
 * Security response headers (helmet-style, hand-rolled so we control every directive).
 *
 * Applies: CSP, HSTS (prod), nosniff, frame options, referrer & permissions policy,
 * COOP/CORP and a few legacy headers. X-Powered-By is disabled in app.js.
 */
const { env } = require('../config/env');

function buildCsp() {
  const scriptSrc = ["'self'"];
  const connectSrc = ["'self'"];
  const styleSrc = ["'self'", "'unsafe-inline'"]; // React inline style attributes
  const imgSrc = ["'self'", 'data:', 'blob:'];
  const fontSrc = ["'self'", 'data:'];
  const mediaSrc = ["'self'", 'blob:'];
  const workerSrc = ["'self'", 'blob:'];

  // Allow the browser to talk back to every configured API origin
  for (const origin of env.corsOrigins) {
    if (origin && origin !== '*') connectSrc.push(origin);
  }

  if (!env.isProd) {
    // Vite dev: inline preamble script + HMR websocket
    scriptSrc.push("'unsafe-inline'", "'unsafe-eval'");
    connectSrc.push('ws:', 'wss:', 'http://localhost:*', 'http://127.0.0.1:*');
  }

  const directives = {
    'default-src': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'script-src': scriptSrc,
    'style-src': styleSrc,
    'img-src': imgSrc,
    'font-src': fontSrc,
    'connect-src': connectSrc,
    'media-src': mediaSrc,
    'worker-src': workerSrc,
    'manifest-src': ["'self'"],
  };

  const parts = Object.entries(directives).map(([name, sources]) =>
    sources.length ? `${name} ${sources.join(' ')}` : name
  );
  if (env.isProd) parts.push('upgrade-insecure-requests');
  return parts.join('; ');
}

const PERMISSIONS_POLICY = [
  'accelerometer=()',
  'autoplay=(self)',
  'camera=()',
  'display-capture=()',
  'encrypted-media=()',
  'fullscreen=(self)',
  'geolocation=()',
  'gyroscope=()',
  'magnetometer=()',
  'microphone=()',
  'payment=()',
  'usb=()',
  'xr-spatial-tracking=()',
].join(', ');

function securityHeaders(req, res, next) {
  // Content Security Policy - blocks inline script execution, XSS payloads, framing
  res.setHeader('Content-Security-Policy', buildCsp());
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', PERMISSIONS_POLICY);
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('X-XSS-Protection', '0'); // modern browsers: opt out of the legacy filter
  if (env.isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
}

module.exports = { securityHeaders, buildCsp };
