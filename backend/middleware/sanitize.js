/**
 * NoSQL injection guard.
 *
 * express.json() happily accepts `{ "username": { "$gt": "" } }` which MongoDB
 * would treat as a query operator. Strip any key that starts with `$` (or `.`)
 * from body / query / params before any handler sees them.
 */
const FORBIDDEN_KEY = /^\$|^\./;

function deepSanitize(value) {
  if (Array.isArray(value)) {
    for (const item of value) deepSanitize(item);
    return value;
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (FORBIDDEN_KEY.test(key)) {
        delete value[key];
      } else {
        deepSanitize(value[key]);
      }
    }
  }
  return value;
}

function sanitize(req, _res, next) {
  if (req.body) deepSanitize(req.body);
  if (req.query) deepSanitize(req.query);
  if (req.params) deepSanitize(req.params);
  next();
}

module.exports = { sanitize, deepSanitize };
