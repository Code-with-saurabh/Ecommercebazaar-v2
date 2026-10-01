const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,25}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9]{7,15}$/;

/** Field-level errors for POST /users/register (empty array = valid). */
function validateRegistration({ username, email, phone, password }) {
  const errors = [];

  if (!USERNAME_RE.test(username)) {
    errors.push({ field: 'username', message: '3-25 chars: letters, numbers, _ . - only' });
  }
  if (!EMAIL_RE.test(email)) {
    errors.push({ field: 'email', message: 'must be a valid email address' });
  }
  if (!PHONE_RE.test(phone)) {
    errors.push({ field: 'phone', message: '7-15 digits, optional leading +' });
  }
  if (password.length < 8) {
    errors.push({ field: 'password', message: 'password must be at least 8 characters' });
  }
  if (password.length > 72) {
    errors.push({ field: 'password', message: 'password must be at most 72 characters' });
  }

  return errors;
}

module.exports = { USERNAME_RE, EMAIL_RE, PHONE_RE, validateRegistration };
