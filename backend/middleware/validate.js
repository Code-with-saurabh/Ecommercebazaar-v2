const { z } = require('zod');

const ApiError = require('../utils/ApiError');
const { USERNAME_RE, EMAIL_RE, PHONE_RE } = require('../utils/validation');

/**
 * Phase 3 - request validator built on zod -> 400 with per-field details.
 *
 *   router.post('/register', validateBody(schemas.register), handler);
 *
 * On failure the middleware calls next(ApiError.badRequest(...)) so the
 * shared error handler emits the standard envelope:
 *
 *   400 { success: false, message: "Validation failed",
 *         details: [{ field: "email", message: "…" }, …] }
 *
 * The frontend (Signup.jsx / Login.jsx) maps `details[].message` straight to
 * the inline error list, so message wording is part of the contract.
 */

// ---------------------------------------------------------------------------
// zod issue -> { field, message }
// ---------------------------------------------------------------------------

/**
 * Walk the raw input along the issue path so the *actual* value is known.
 *   { username: {} } + path ["username"] -> {}
 *   {            } + path ["username"] -> undefined
 * zod issues only carry a human message, never the offending value, so the
 * source object is needed to tell "missing" from "wrong type".
 */
function valueAtPath(source, path) {
  let cursor = source;
  for (const key of path || []) {
    if (cursor === null || cursor === undefined || typeof cursor !== 'object') return undefined;
    cursor = cursor[key];
  }
  return cursor;
}

/**
 * Turn a zod issue path into the dotted field name clients expect.
 *   ['items', 0, 'qty'] -> "items.0.qty"
 *   []                   -> <where>  (the whole body/query was wrong)
 */
function toFieldPath(issue, where) {
  const path = (issue.path || []).map(segment => String(segment)).join('.');
  return path || where;
}

/**
 * One zod issue -> one client-facing field error.
 *
 * zod's own wording is "Invalid input: expected string, received object",
 * which is developer-speak. Everything here is rewritten to the sentence
 * style the API has used since Phase 1:
 *
 *   invalid_type + field absent  -> "email is required"
 *   invalid_type + field present -> "username must be a string"
 *                                   ("…must be a number/object/array/…")
 *   anything else (regex, min)   -> the custom message given in the schema
 *
 * `typeError` stays on the object so `headlineFor` can react to it; it is
 * stripped before the details reach the client.
 */
function toFieldError(issue, where, source) {
  const field = toFieldPath(issue, where);

  if (issue.code === 'invalid_type') {
    const value = valueAtPath(source, issue.path);
    if (value === undefined || value === null) return { field, message: `${field} is required`, typeError: true };
    return { field, message: `${field} must be a ${issue.expected}`, typeError: true };
  }

  return { field, message: issue.message, typeError: false };
}

/**
 * Whole zod error -> the internal error list (one entry per input, the first
 * issue of each field only — ten rules failing on one field is one line).
 */
function collectErrors(error, where, source) {
  const seen = new Set();
  const errors = [];

  for (const issue of error.issues || []) {
    const detail = toFieldError(issue, where, source);
    const key = `${detail.field}::${detail.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    errors.push(detail);
  }

  // a body that is not an object at all has no field path - report it once
  if (errors.length === 0) {
    errors.push({ field: where, message: `${where} must be an object`, typeError: true });
  }

  return errors;
}

/** Same list without the internal `typeError` flag (this is the API shape). */
function toDetails(error, where, source) {
  return collectErrors(error, where, source).map(({ field, message }) => ({ field, message }));
}

/**
 * Headline `message` of the 400 response:
 *
 *   one broken input          -> its own message ("password must be at least
 *                                8 characters") - the client can show it as-is
 *   only wrong-typed inputs   -> the first one ("username must be a string"),
 *                                so no handler can ever receive an object
 *   mixed format errors       -> generic "Validation failed" + full details
 */
function headlineFor(errors) {
  const first = errors[0];
  const sameField = errors.every(error => error.field === first.field);
  const allTypeErrors = errors.every(error => error.typeError);
  if (sameField || allTypeErrors) return first.message;
  return 'Validation failed';
}

// ---------------------------------------------------------------------------
// Middleware factory
// ---------------------------------------------------------------------------

/**
 * Builds an Express middleware that parses `read(req)` with `schema`,
 * then writes the *cleaned* result back through `write(req, data)`.
 *
 * What "cleaned" means: zod strips unknown keys (no mass-assignment), applies
 * `.trim()` / `.toLowerCase()` and converts declared types - so handlers can
 * trust `req.body` without re-checking anything.
 *
 * Error shape decision: one broken input becomes the headline message
 * ("username must be a string"), several broken inputs fall back to the
 * generic "Validation failed" and let the client render `details`.
 */
function createValidator({ read, write, where }) {
  return function validateWith(schema) {
    return function zodValidate(req, _res, next) {
      const source = read(req) || {};
      const parsed = schema.safeParse(source);

      if (!parsed.success) {
        const errors = collectErrors(parsed.error, where, source);
        const details = errors.map(({ field, message }) => ({ field, message }));
        return next(ApiError.badRequest(headlineFor(errors), details));
      }

      write(req, parsed.data);
      return next();
    };
  };
}

/** `POST /api/...` - validates and replaces `req.body`. */
const validateBody = createValidator({
  read: req => req.body,
  write: (req, data) => {
    req.body = data;
  },
  where: 'body',
});

/** `GET /api/...?page=2` - validates and replaces `req.query`. */
const validateQuery = createValidator({
  read: req => req.query,
  write: (req, data) => {
    req.query = data;
  },
  where: 'query',
});

/** `/api/products/:id` - validates and replaces `req.params`. */
const validateParams = createValidator({
  read: req => req.params,
  write: (req, data) => {
    req.params = data;
  },
  where: 'params',
});

// ---------------------------------------------------------------------------
// Endpoint schemas
// ---------------------------------------------------------------------------

/**
 * POST /api/users/register.
 *
 * Regexes are imported from utils/validation.js so the API, the User model
 * (`match:`) and this middleware can never disagree about what is valid.
 * Every string is trimmed first, e-mail is lower-cased (a@b.com === A@B.com).
 */
const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'username must be at least 3 characters')
    .max(25, 'username must be at most 25 characters')
    .regex(USERNAME_RE, '3-25 chars: letters, numbers, _ . - only'),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, 'email must be at most 254 characters')
    .regex(EMAIL_RE, 'must be a valid email address'),

  phone: z
    .string()
    .trim()
    .max(20, 'phone must be at most 20 characters')
    .regex(PHONE_RE, '7-15 digits, optional leading +'),

  password: z
    .string()
    .trim()
    .min(8, 'password must be at least 8 characters')
    .max(72, 'password must be at most 72 characters'),
});

/**
 * POST /api/users/login.
 * Only shape checks live here - "does the password match" is the handler's
 * job (it needs the timing equaliser, see routes/users.js).
 */
const loginSchema = z.object({
  username: z.string().trim().min(1, 'username is required'),
  password: z.string().trim().min(1, 'password is required'),
});

/** Handy lookup used by `validateQuery(schemas.productQuery)`-style calls. */
const schemas = {
  register: registerSchema,
  login: loginSchema,
};

module.exports = {
  validateBody,
  validateQuery,
  validateParams,
  schemas,
  registerSchema,
  loginSchema,
  toDetails, // exported for unit tests
};
