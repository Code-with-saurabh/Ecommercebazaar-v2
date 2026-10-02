const mongoose = require('mongoose');

/**
 * ORDER — an immutable-ish record of a purchase (Phase 2.4 / 2.5 / 2.6).
 *
 * Relations
 *   Order.user      -> User
 *   Order.items[].product -> Product  (ref kept for re-stocking on cancel;
 *                                      name/price/image are COPIED so a
 *                                      later product edit never rewrites an
 *                                      invoice)
 *   Order.shippingAddress               -> snapshot copy of an Address document
 *   Order.coupon                        -> snapshot of the applied Coupon
 *   Review.verified                     <- set from Order.items[] (see Review)
 *
 * Money rules (utils/pricing.js computes these — never the client):
 *   subtotal + discount + shipping + tax = total, all >= 0
 */

// ---------------------------------------------------------------------------
// Value objects
// ---------------------------------------------------------------------------

/** One purchased line. `_id:false` — the line key is `product + size + color`. */
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'order item product is required'],
    },

    // snapshots ------------------------------------------------------------
    name: { type: String, required: true, trim: true },
    brand: { type: String, default: '', trim: true },
    image: { type: String, default: '' },
    sku: { type: String, default: '', trim: true, uppercase: true },

    // what one unit cost at placement time (excludes coupon/shipping/tax)
    price: { type: Number, required: [true, 'order item price is required'], min: [0, 'price cannot be negative'] },

    qty: {
      type: Number,
      required: true,
      min: [1, 'order item quantity must be at least 1'],
      max: [999, 'order item quantity must be at most 999'],
    },

    size: { type: String, trim: true, maxlength: 24, default: null },
    color: { type: String, trim: true, maxlength: 24, default: null },
  },
  {
    _id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/** `price * qty` for one line — never stored, always derived. */
orderItemSchema.virtual('lineTotal').get(function lineTotal() {
  return Math.round(this.price * this.qty * 100) / 100;
});

/** Denormalised copy of the delivery address (see Address.js). */
const addressSnapshotSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true, default: '' },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, default: 'IN', trim: true },
  },
  { _id: false }
);

/** Applied discount, copied from Coupon at placement time. */
const couponSnapshotSchema = new mongoose.Schema(
  {
    code: { type: String, trim: true, uppercase: true },
    type: { type: String, enum: ['percent', 'flat'] },
    value: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

/** Payment state — filled by the gateway webhook / verify route (Phase 2.5). */
const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: { values: ['cod', 'razorpay', 'stripe'], message: '{VALUE} is not a supported payment method' },
      default: 'cod',
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'paid', 'failed', 'refunded'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'pending',
    },
    // gateway ids (Razorpay order_id / Stripe PaymentIntent id)
    provider: { type: String, trim: true, default: '' },
    transactionId: { type: String, trim: true, default: '' },
    signature: { type: String, trim: true, default: '' },
    paidAt: { type: Date, default: null },
  },
  { _id: false }
);

/** One step of the status timeline shown on /account/orders. */
const statusEventSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, trim: true, maxlength: 200, default: '' },
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: false }
);

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const orderSchema = new mongoose.Schema(
  {
    // human reference printed on invoices: BZR-6M3KQ2
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'order owner is required'],
    },

    items: {
      type: [orderItemSchema],
      validate: [
        {
          validator: items => items.length > 0,
          message: 'an order needs at least one item',
        },
        {
          validator: items => items.length <= 100,
          message: 'an order can contain at most 100 lines',
        },
      ],
    },

    // ---- money (all computed server-side by utils/pricing.js) -------------
    currency: { type: String, default: 'USD', uppercase: true, minlength: 3, maxlength: 3 },
    subtotal: { type: Number, required: true, min: [0, 'subtotal cannot be negative'], default: 0 },
    discount: { type: Number, required: true, min: [0, 'discount cannot be negative'], default: 0 },
    shipping: { type: Number, required: true, min: [0, 'shipping cannot be negative'], default: 0 },
    tax: { type: Number, required: true, min: [0, 'tax cannot be negative'], default: 0 },
    total: { type: Number, required: true, min: [0, 'total cannot be negative'], default: 0 },

    coupon: { type: couponSnapshotSchema, default: null },

    // ---- delivery ---------------------------------------------------------
    shippingAddress: {
      type: addressSnapshotSchema,
      required: [true, 'shipping address is required'],
    },

    // optional customer note ("leave at the front desk")
    customerNote: {
      type: String,
      trim: true,
      maxlength: [300, 'customer note must be at most 300 characters'],
      default: '',
    },

    // ---- state machine ----------------------------------------------------
    status: {
      type: String,
      enum: {
        values: ['placed', 'packed', 'shipped', 'delivered', 'cancelled'],
        message: '{VALUE} is not a valid order status',
      },
      default: 'placed',
      index: true,
    },

    statusHistory: {
      type: [statusEventSchema],
      default: [],
    },

    payment: {
      type: paymentSchema,
      default: () => ({}),
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

// order history page: newest first for one customer
orderSchema.index({ user: 1, createdAt: -1 });
// admin queue: "all shipments waiting to go out"
orderSchema.index({ status: 1, createdAt: -1 });
// webhook / invoice lookups by the printed number
orderSchema.index({ 'payment.transactionId': 1 }, { sparse: true });

// ---------------------------------------------------------------------------
// Virtuals
// ---------------------------------------------------------------------------

/** Payment shortcut used by the order list badge. */
orderSchema.virtual('isPaid').get(function isPaid() {
  return this.payment && this.payment.status === 'paid';
});

/** Money still to be collected (0 once paid or cancelled). */
orderSchema.virtual('balanceDue').get(function balanceDue() {
  if (this.isPaid || this.status === 'cancelled') return 0;
  return Math.round(this.total * 100) / 100;
});

/** Everything the status timeline can move to next. */
orderSchema.virtual('nextStatuses').get(function nextStatuses() {
  return ORDER_TRANSITIONS[this.status] || [];
});

/**
 * Allowed status transitions — the single source of truth for the state
 * machine (admin panel, shipping integration and tests all read this).
 */
const ORDER_TRANSITIONS = {
  placed: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

// ---------------------------------------------------------------------------
// Document hooks
// ---------------------------------------------------------------------------

/** Generate the printed order number + seed the timeline on first save. */
orderSchema.pre('validate', function seedOrder() {
  if (!this.orderNumber) {
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    this.orderNumber = `BZR-${suffix}`;
  }

  if (this.isNew && this.statusHistory.length === 0) {
    this.statusHistory.push({ status: this.status, note: 'Order placed', at: new Date() });
  }
});

/**
 * Totals sanity check: total must equal what the parts add up to.
 * Catches a caller that hand-crafts a document instead of using
 * utils/pricing.js (the client is never trusted with money).
 * Mongoose 9 hooks are promise based — throw instead of `next(err)`.
 */
orderSchema.pre('validate', function checkTotals() {
  if (!this.items || this.items.length === 0) return;

  const expected =
    Math.round((this.subtotal - this.discount + this.shipping + this.tax) * 100) / 100;
  const given = Math.round(this.total * 100) / 100;

  if (Math.abs(expected - given) > 0.01) {
    throw new Error(`order total ${given} does not match subtotal/discount/shipping/tax (${expected})`);
  }
});

// ---------------------------------------------------------------------------
// Instance methods
// ---------------------------------------------------------------------------

/** Is moving from the current status to `next` allowed? */
orderSchema.methods.canTransitionTo = function canTransitionTo(next) {
  return (ORDER_TRANSITIONS[this.status] || []).includes(next);
};

/**
 * Move the order forward and append to the timeline.
 *
 *   await order.advanceStatus('packed', { by: adminId, note: 'picked' });
 *
 * Returns the saved document; throws (domain Error) when the transition is
 * illegal so the route can map it to 409/422 without re-implementing rules.
 */
orderSchema.methods.advanceStatus = async function advanceStatus(next, { by = null, note = '' } = {}) {
  if (!this.canTransitionTo(next)) {
    throw new Error(`cannot move order from "${this.status}" to "${next}"`);
  }

  this.status = next;
  this.statusHistory.push({ status: next, note, at: new Date(), by });
  await this.save();
  return this;
};

/** What the customer sees on the tracking page (derived from history). */
orderSchema.methods.statusSince = function statusSince(status) {
  const event = [...this.statusHistory].reverse().find(entry => entry.status === status);
  return event ? event.at : null;
};

// ---------------------------------------------------------------------------
// Static methods
// ---------------------------------------------------------------------------

/** Order history for one customer, newest first (paginated). */
orderSchema.statics.findForUser = function findForUser(userId, { page = 1, limit = 20 } = {}) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

/** Admin queue for one status (`Order.findByStatus('shipped')`). */
orderSchema.statics.findByStatus = function findByStatus(status, { page = 1, limit = 20 } = {}) {
  return this.find({ status })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('user', 'username email');
};

/** Look an order up for a specific customer (404-safe ownership check). */
orderSchema.statics.findForUserById = function findForUserById(userId, orderId) {
  return this.findOne({ _id: orderId, user: userId });
};

/**
 * Restore stock for every line — called when an order is cancelled.
 * Delegates to Product.incrementStock so inventory rules live in one place.
 */
orderSchema.statics.restock = async function restock(order) {
  const Product = mongoose.models.Product;
  if (!Product || !order) return null;
  await Promise.all(order.items.map(item => Product.incrementStock(item.product, item.qty)));
  return order;
};

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
