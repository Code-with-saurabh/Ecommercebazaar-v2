const mongoose = require('mongoose');

const { EMAIL_RE } = require('../utils/validation');

/**
 * Newsletter opt-ins (homepage band + footer capture).
 *
 * One row per email - the unique index makes a double-submit a cheap
 * no-op instead of a duplicate row, and the route answers idempotently.
 */
const newsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'email is required'],
      trim: true,
      lowercase: true,
      unique: true,
      match: [EMAIL_RE, 'must be a valid email address'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Newsletter', newsletterSchema);
