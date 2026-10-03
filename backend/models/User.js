const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { USERNAME_RE, EMAIL_RE, PHONE_RE } = require('../utils/validation');

/**
 * USER — accounts, roles and the wishlist (Phase 1 + 2.6/2.7/2.9).
 *
 * Relations
 *   Address.user   -> User    (deleted together, see cascade hook below)
 *   Cart.user      -> User    (one active cart per user, partial unique index)
 *   Order.user     -> User
 *   Review.user    -> User
 *   Coupon.usedBy[].user -> User
 *   User.wishlist[] -> Product (Phase 2.9 "save for later")
 *
 * Contract with routes/users.js (do not break):
 *   - register: username/email/phone unique + trimmed/lower-cased e-mail
 *   - password is stored as a bcrypt hash, `select: false`,
 *     and is stripped from every JSON response by the toJSON transform
 *   - login compares with bcrypt and never reveals which field was wrong
 */

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'username is required'],
      trim: true,
      minlength: [3, 'username must be at least 3 characters'],
      maxlength: [25, 'username must be at most 25 characters'],
      match: [USERNAME_RE, 'username may only contain letters, numbers, _ . -'],
      unique: true,
    },

    email: {
      type: String,
      required: [true, 'email is required'],
      trim: true,
      lowercase: true, // "A@B.com" and "a@b.com" are the same account
      maxlength: [254, 'email must be at most 254 characters'],
      match: [EMAIL_RE, 'email must be a valid address'],
      unique: true,
    },

    phone: {
      type: String,
      required: [true, 'phone is required'],
      trim: true,
      match: [PHONE_RE, 'phone must be 7-15 digits with an optional leading +'],
      maxlength: [20, 'phone must be at most 20 characters'],
      unique: true,
    },

    password: {
      type: String,
      required: true,
      minlength: [8, 'password must be at least 8 characters'],
      select: false, // never returned unless a handler explicitly asks for it
    },

    // optional profile fields (account area, Phase 2.6)
    name: {
      type: String,
      trim: true,
      maxlength: [80, 'name must be at most 80 characters'],
      default: '',
    },
    avatar: {
      type: String,
      trim: true,
      default: '',
    },

    // Phase 2.7 admin panel: 'admin' can reach /api/admin/*
    role: {
      type: String,
      enum: { values: ['user', 'admin'], message: '{VALUE} is not a valid role' },
      default: 'user',
      index: true,
    },

    // admin kill switch — checked at login (`isActive === false` only, so
    // accounts written before this field existed keep working)
    isActive: {
      type: Boolean,
      default: true,
    },

    // Phase 2.9 wishlist: product ids only, order = when they were saved
    wishlist: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
      default: [],
      index: true,
    },

    // audit trail for the account page / suspicious-login alerts
    lastLoginAt: {
      type: Date,
      default: null,
    },
    loginCount: {
      type: Number,
      default: 0,
      min: [0, 'login count cannot be negative'],
    },

    // Revocation counter for refresh tokens: every refresh JWT embeds the
    // tokenVersion it was born with, and logout/password change increments
    // this number, instantly invalidating all of them.
    tokenVersion: {
      type: Number,
      default: 0,
      min: [0, 'token version cannot be negative'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password; // belt & braces on top of select:false
        delete ret.tokenVersion; // internal revocation counter, not API surface
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// ---------------------------------------------------------------------------
// Virtuals
// ---------------------------------------------------------------------------

/** Used by admin-only middleware: `if (req.user.isAdmin) …` */
userSchema.virtual('isAdmin').get(function isAdmin() {
  return this.role === 'admin';
});

/** Safe subset for lists/feeds (no e-mail, no phone). */
userSchema.virtual('publicProfile').get(function publicProfile() {
  return { id: this._id, username: this.username, avatar: this.avatar, name: this.name };
});

// ---------------------------------------------------------------------------
// Document hooks
// ---------------------------------------------------------------------------

/**
 * Hash the password automatically — but only when it is not already a hash.
 *
 * routes/users.js pre-hashes with bcrypt before `User.create()`, and the
 * `$2a$`/`$2b$` prefix makes this hook skip that value, so no double hash is
 * ever produced. Any other caller may pass plain text and still be safe.
 * Mongoose 9 hooks are promise based — no `next` callback.
 */
userSchema.pre('validate', async function hashPasswordIfPlain() {
  if (!this.isModified('password') || !this.password) return;
  if (/^\$2[aby]\$/.test(this.password)) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Referential integrity for a schema-less database: deleting a user also
 * deletes everything that only makes sense while the account exists.
 *
 * Mongo has no foreign keys, so this lives in the model — every code path
 * that deletes a *document* (`user.deleteOne()` / `User.findOneAndDelete()`)
 * gets the same cleanup. Bulk `deleteMany` skips hooks by design; callers of
 * that API are expected to cascade manually.
 */
userSchema.pre('deleteOne', { document: true, query: false }, async function cascade() {
  await cascadeFor(this._id);
});

userSchema.pre('findOneAndDelete', async function cascade() {
  const filter = this.getFilter();
  if (filter && filter._id) await cascadeFor(filter._id);
});

/**
 * Remove dependent documents. `mongoose.models` only contains what has been
 * required, so a lean script that loads just User.js simply skips the rest
 * instead of throwing "Schema hasn't been registered".
 */
async function cascadeFor(userId) {
  const targets = [
    ['Address', { user: userId }],
    ['Cart', { user: userId }],
    ['Review', { user: userId }],
  ];

  await Promise.all(
    targets.map(([name, filter]) => {
      const model = mongoose.models[name];
      if (!model) return Promise.resolve(null);
      return model.deleteMany(filter).exec();
    })
  );
}

// ---------------------------------------------------------------------------
// Instance methods
// ---------------------------------------------------------------------------

/**
 * bcrypt compare against the stored hash.
 *
 *   const ok = await user.comparePassword('Password123');
 */
userSchema.methods.comparePassword = async function comparePassword(candidate) {
  if (!this.password) return false;
  return bcrypt.compare(String(candidate), this.password);
};

/**
 * Add a product to the wishlist (idempotent, keeps insertion order).
 * Returns true when the product was newly added.
 */
userSchema.methods.toggleWishlist = function toggleWishlist(productId) {
  const id = String(productId);
  const index = this.wishlist.findIndex(item => String(item) === id);

  if (index === -1) {
    this.wishlist.push(productId);
    return true;
  }
  this.wishlist.splice(index, 1);
  return false;
};

// ---------------------------------------------------------------------------
// Static methods
// ---------------------------------------------------------------------------

/** Login helper: fetch an account together with its password hash. */
userSchema.statics.findByUsernameWithPassword = function findByUsernameWithPassword(username) {
  return this.findOne({ username }).select('+password');
};

/** Wipe the credentials of a user without deleting the document (support tool). */
userSchema.statics.disable = function disable(userId) {
  return this.updateOne({ _id: userId }, { $set: { isActive: false } }).exec();
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
