/**
 * Client-side mirror of the API's zod schemas
 * (backend/middleware/validate.js + backend/utils/validation.js).
 *
 * Why this exists: the browser's native constraints (required / pattern /
 * minLength) run on the *raw* value, so " ab " passes `minLength=3` in the
 * browser and then fails on the server after zod trims it. These helpers trim
 * first and reuse the exact regexes + wording of the API, so the user sees
 * the same message the server would return - before any round-trip.
 *
 * Each function returns `{ field: message }`; an empty object means valid.
 */

export const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,25}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_RE = /^\+?[0-9]{7,15}$/;

export const LIMITS = {
  usernameMin: 3,
  usernameMax: 25,
  emailMax: 254,
  phoneMax: 20,
  passwordMin: 8,
  passwordMax: 72,
};

/** POST /api/users/login - shape checks only (see loginSchema). */
export function validateLogin({ username = '', password = '' } = {}) {
  const errors = {};
  if (!username.trim()) errors.username = 'username is required';
  if (!password.trim()) errors.password = 'password is required';
  return errors;
}

/** POST /api/users/register - checks in the same order zod applies them. */
export function validateRegister({ username = '', email = '', phone = '', password = '' } = {}) {
  const errors = {};

  const u = username.trim();
  if (!u) errors.username = 'username is required';
  else if (u.length < LIMITS.usernameMin) errors.username = 'username must be at least 3 characters';
  else if (u.length > LIMITS.usernameMax) errors.username = 'username must be at most 25 characters';
  else if (!USERNAME_RE.test(u)) errors.username = '3-25 chars: letters, numbers, _ . - only';

  const e = email.trim();
  if (e.length > LIMITS.emailMax) errors.email = 'email must be at most 254 characters';
  else if (!EMAIL_RE.test(e)) errors.email = 'must be a valid email address';

  const p = phone.trim();
  if (p.length > LIMITS.phoneMax) errors.phone = 'phone must be at most 20 characters';
  else if (!PHONE_RE.test(p)) errors.phone = '7-15 digits, optional leading +';

  // zod trims before checking, so the length test must use the trimmed value
  const pw = password.trim();
  if (pw.length < LIMITS.passwordMin) errors.password = 'password must be at least 8 characters';
  else if (pw.length > LIMITS.passwordMax) errors.password = 'password must be at most 72 characters';

  return errors;
}

/** Trim the payload once, right before it goes on the wire. */
export function trimmedCredentials(values) {
  const out = {};
  Object.keys(values).forEach(key => {
    out[key] = typeof values[key] === 'string' ? values[key].trim() : values[key];
  });
  return out;
}
