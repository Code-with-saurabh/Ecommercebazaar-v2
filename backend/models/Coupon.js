const mongoose = require('mongoose');

/**
 * COUPON — discount codes validated server-side (Phase 2.10).
 *
 * Relations
 *   Coupon.usedBy[].user   -> User    (per-user usage cap)
 *   Coupon.usedBy[].orderId-> Order   (audit trail of what a code discounted)
 *   Order.coupon           -> snapshot copy of { code, type, value, discount }
 *                              taken at placement time (see Order.js)
 *
 * Rule of thumb: the *route* decides nothing about money — it calls
 * `coupon.evaluate(...)` and applies whatever number comes back.
 */

const usageEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    usedAt: { type: Date, default: Date.now },
    // what this single use actually discounted (audit/debug)
    discount: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'coupon code is required'],
      trim: true,
      uppercase: true, // "save10" and "SAVE10" are the same code
      minlength: [3, 'coupon code must be at least 3 characters'],
      maxlength: [40, 'coupon code must be at most 40 characters'],
      match: [/^[A-Z0-9_-]+$/, 'coupon code may only contain letters, numbers, _ and -'],
      unique: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [200, 'description must be at most 200 characters'],
      default: '',
    },

    // percent => value is 1-100, flat => value is a money amount
    type: {
      type: String,
      required: [true, 'coupon type is required'],
      enum: { values: ['percent', 'flat'], message: '{VALUE} must be percent or flat' },
    },

    value: {
      type: Number,
      required: [true, 'coupon value is required'],
      min: [0, 'coupon value cannot be negative'],
      validate: {
        validator(value) {
          if (this.type !== 'percent') return true;
          return value > 0 && value <= 100;
        },
        message: 'percent coupons must have a value between 1 and 100',
      },
    },

    // cart subtotal must reach this before the code applies (0 = no floor)
    minCart: {
      type: Number,
      default: 0,
      min: [0, 'minCart cannot be negative'],
    },

    // safety cap for percent codes, e.g. "20% off, up to $50"
    maxDiscount: {
      type: Number,
      default: null,
      min: [0, 'maxDiscount cannot be negative'],
    },

    startsAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      default: null, // null = never expires
    },

    // null => unlimited redemptions overall
    usageLimit: {
      type: Number,
      default: null,
      min: [0, 'usageLimit cannot be negative'],
    },

    // how many times one account may use it (null/0 => unlimited)
    perUserLimit: {
      type: Number,
      default: 1,
      min: [0, 'perUserLimit cannot be negative'],
    },

    usedCount: {
      type: Number,
      default: 0,
      min: [0, 'usedCount cannot be negative'],
    },

    // [] => the code works for every category
    applicableCategories: {
      type: [
        {
          type: String,
          enum: { values: ['tshirts', 'shirts', 'pants', 'shoes'], message: '{VALUE} is not a category' },
        },
      ],
      default: [],
    },

    // admin kill switch (kept separate from expiry dates)
    active: {
      type: Boolean,
      default: true,
      index: true,
    },

    usedBy: {
      type: [usageEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

// lookup by code at checkout + "is it still running" sweep
couponSchema.index({ active: 1, expiresAt: 1 });
// admin list "most used first"
couponSchema.index({ usedCount: -1 });

// ---------------------------------------------------------------------------
// Virtuals
// ---------------------------------------------------------------------------

/** Remaining global redemptions (null when the code is unlimited). */
couponSchema.virtual('remaining').get(function remaining() {
  if (this.usageLimit === null || this.usageLimit === undefined) return null;
  return Math.max(0, this.usageLimit - this.usedCount);
});

/** Time window still open right now (server clock, not the client's). */
couponSchema.virtual('isInWindow').get(function isInWindow() {
  const now = Date.now();
  if (this.startsAt && this.startsAt.getTime() > now) return false;
  if (this.expiresAt && this.expiresAt.getTime() < now) return false;
  return true;
});

// ---------------------------------------------------------------------------
// Document hooks
// ---------------------------------------------------------------------------

/** Trim + upper-case the code before it can hit the unique index. */
couponSchema.pre('validate', function normalizeCode() {
  if (typeof this.code === 'string') this.code = this.code.trim().toUpperCase();
});

/** A percent code can never have a 0/150 value (belt & braces on top of the
 *  validator, which only runs when `value` itself was modified). */
couponSchema.pre('validate', function clampValue() {
  if (this.type === 'percent' && this.value > 100) this.value = 100;
});

// ---------------------------------------------------------------------------
// Instance methods
// ---------------------------------------------------------------------------

/**
 * Full rule check + money computation in one call.
 *
 *   const verdict = coupon.evaluate({
 *     userId, subtotal: 120, categories: ['shoes', 'pants'],
 *   });
 *   verdict -> { ok: true,  reason: null,             discount: 24 }
 *          or { ok: false, reason: 'MIN_CART',        discount: 0 }
 *
 * Reasons (stable strings the route maps to user-facing messages):
 *   INACTIVE | NOT_STARTED | EXPIRED | GLOBAL_LIMIT | USER_LIMIT |
 *   MIN_CART | CATEGORY | INVALID_AMOUNT
 *
 * `categories` is optional — omit it only when the caller cannot know the
 * cart contents (the minCart/global checks still run).
 */
couponSchema.methods.evaluate = function evaluate({ userId = null, subtotal = 0, categories = null } = {}) {
  const fail = reason => ({ ok: false, reason, discount: 0 });
  const amount = Number(subtotal) || 0;

  if (!this.active) return fail('INACTIVE');
  if (this.startsAt && this.startsAt.getTime() > Date.now()) return fail('NOT_STARTED');
  if (this.expiresAt && this.expiresAt.getTime() < Date.now()) return fail('EXPIRED');

  if (this.usageLimit !== null && this.usageLimit !== undefined && this.usedCount >= this.usageLimit) {
    return fail('GLOBAL_LIMIT');
  }

  if (userId && this.perUserLimit > 0) {
    const used = this.usedBy.filter(entry => String(entry.user) === String(userId)).length;
    if (used >= this.perUserLimit) return fail('USER_LIMIT');
  }

  if (amount < this.minCart) return fail('MIN_CART');

  if (this.applicableCategories.length > 0) {
    const list = Array.isArray(categories) ? categories : [];
    if (!list.some(cat => this.applicableCategories.includes(cat))) return fail('CATEGORY');
  }

  if (amount <= 0) return fail('INVALID_AMOUNT');

  let discount;
  if (this.type === 'percent') {
    discount = (amount * this.value) / 100;
    if (this.maxDiscount !== null && this.maxDiscount !== undefined) {
      discount = Math.min(discount, this.maxDiscount);
    }
  } else {
    discount = Math.min(this.value, amount); // a flat $50 off a $30 cart = $30
  }

  // round to 2 decimals: never hand floating point noise to the money path
  discount = Math.round(discount * 100) / 100;

  return { ok: true, reason: null, discount };
};

// ---------------------------------------------------------------------------
// Static methods
// ---------------------------------------------------------------------------

/** Case-insensitive lookup by code (route may receive it untrimmed). */
couponSchema.statics.findByCode = function findByCode(code) {
  return this.findOne({ code: String(code || '').trim().toUpperCase() });
};

/**
 * Write one redemption after the order was persisted.
 *
 *   await Coupon.recordUsage('SAVE10', { user, orderId, discount: 24 });
 *
 * `usedCount` and `usedBy` move together in one atomic update, so two
 * parallel checkouts cannot both take the "last" redemption.
 */
couponSchema.statics.recordUsage = function recordUsage(code, { user = null, orderId = null, discount = 0 } = {}) {
  return this.updateOne(
    { code: String(code || '').trim().toUpperCase() },
    {
      $inc: { usedCount: 1 },
      $push: { usedBy: { user, orderId, discount, usedAt: new Date() } },
    }
  ).exec();
};

module.exports = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);
