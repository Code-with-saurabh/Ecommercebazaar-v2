const mongoose = require('mongoose');
const { PHONE_RE } = require('../utils/validation');

/**
 * ADDRESS — where an order gets shipped (Phase 2.4).
 *
 * Relations
 *   Address.user -> User        (owner of the address book)
 *   Order.shippingAddress        is a *snapshot copy* of these fields, never a
 *                                ref: editing an address later must not rewrite
 *                                the address printed on an old invoice.
 *
 * Business rules enforced here (not in the route):
 *   - exactly one `isDefault` address per user
 *   - phone / pincode shape validated at the model layer so every caller
 *     (register form, checkout form, admin tool) gets the same answer
 */

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'address owner is required'],
      index: true,
    },

    fullName: {
      type: String,
      required: [true, 'full name is required'],
      trim: true,
      minlength: [2, 'full name must be at least 2 characters'],
      maxlength: [80, 'full name must be at most 80 characters'],
    },

    phone: {
      type: String,
      required: [true, 'phone is required'],
      trim: true,
      match: [PHONE_RE, 'phone must be 7-15 digits with an optional leading +'],
    },

    line1: {
      type: String,
      required: [true, 'address line 1 is required'],
      trim: true,
      maxlength: [120, 'address line 1 must be at most 120 characters'],
    },

    line2: {
      type: String,
      trim: true,
      maxlength: [120, 'address line 2 must be at most 120 characters'],
      default: '',
    },

    landmark: {
      type: String,
      trim: true,
      maxlength: [80, 'landmark must be at most 80 characters'],
      default: '',
    },

    city: {
      type: String,
      required: [true, 'city is required'],
      trim: true,
      maxlength: [60, 'city must be at most 60 characters'],
    },

    state: {
      type: String,
      required: [true, 'state is required'],
      trim: true,
      maxlength: [60, 'state must be at most 60 characters'],
    },

    pincode: {
      type: String,
      required: [true, 'pincode is required'],
      trim: true,
      match: [/^\d{4,10}$/, 'pincode must be 4-10 digits'],
    },

    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: [60, 'country must be at most 60 characters'],
      default: 'IN',
    },

    // home | work | other -> shown as a chip on the checkout picker
    type: {
      type: String,
      enum: {
        values: ['home', 'work', 'other'],
        message: '{VALUE} is not a valid address type',
      },
      default: 'home',
    },

    // pre-selected during checkout; at most one per user (see pre-save hook)
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt / updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

// "my addresses, default first" — the shape every account page asks for
addressSchema.index({ user: 1, isDefault: -1, updatedAt: -1 });

// ---------------------------------------------------------------------------
// Virtuals
// ---------------------------------------------------------------------------

/** Single-line rendering for order summaries / the picker chip. */
addressSchema.virtual('oneLine').get(function oneLine() {
  const parts = [this.line1, this.line2, this.city, this.state, this.pincode];
  return parts.filter(Boolean).join(', ');
});

// ---------------------------------------------------------------------------
// Document hooks
// ---------------------------------------------------------------------------

/**
 * Only one default address per user.
 *
 * When a document is saved with isDefault = true, every other address of the
 * same user is cleared first. Runs before saving so the invariant holds no
 * matter which code path created the address (checkout, account page, admin).
 *
 * Mongoose 9 hooks are promise based — no `next` callback.
 */
addressSchema.pre('save', async function clearOtherDefaults() {
  if (this.isDefault && (this.isNew || this.isModified('isDefault'))) {
    await this.constructor
      .updateMany({ user: this.user, _id: { $ne: this._id }, isDefault: true }, { $set: { isDefault: false } })
      .exec();
  }
});

// ---------------------------------------------------------------------------
// Static methods
// ---------------------------------------------------------------------------

/** The address checkout should pre-select, or null when the book is empty. */
addressSchema.statics.findDefault = function findDefault(userId) {
  return this.findOne({ user: userId }).sort({ isDefault: -1, updatedAt: -1 });
};

/** All addresses of one user, default first. */
addressSchema.statics.findForUser = function findForUser(userId) {
  return this.find({ user: userId }).sort({ isDefault: -1, updatedAt: -1 });
};

/**
 * Promote one address to default (clears the flag on the rest).
 * Returns the updated document, or null when it does not exist / not owned.
 */
addressSchema.statics.makeDefault = async function makeDefault(userId, addressId) {
  const address = await this.findOne({ _id: addressId, user: userId });
  if (!address) return null;
  await this.updateMany({ user: userId, _id: { $ne: addressId } }, { $set: { isDefault: false } }).exec();
  address.isDefault = true;
  await address.save();
  return address;
};

module.exports = mongoose.models.Address || mongoose.model('Address', addressSchema);
