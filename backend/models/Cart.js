const mongoose = require('mongoose');

/**
 * CART — server-side cart (Phase 2.3).
 *
 * Relations
 *   Cart.user    -> User      (one active cart per logged-in user)
 *   Cart.guestId -> (cookie)  anonymous carts, merged into the user cart
 *                              at login (see `mergeIntoUser`)
 *   Cart.items[].product -> Product
 *
 * Design notes
 *   - `items[].price` is a *snapshot* so the badge does not change while the
 *     admin edits a product; `POST /api/orders` re-reads the live price and
 *     recomputes every total (never trust the client, never trust the cart).
 *   - Guest carts carry `expiresAt` and are dropped by a MongoDB TTL index,
 *     so abandoned anonymous carts do not accumulate forever.
 */

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'cart item product is required'],
    },

    // denormalised so the cart page renders without populating 50 products
    name: { type: String, required: true, trim: true },
    image: { type: String, default: '' },
    price: { type: Number, required: [true, 'cart item price is required'], min: [0, 'price cannot be negative'] },

    // same product in another size/colour is a different line
    size: { type: String, trim: true, maxlength: 24, default: null },
    color: { type: String, trim: true, maxlength: 24, default: null },

    qty: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'quantity must be at least 1'],
      max: [99, 'quantity must be at most 99'],
    },

    addedAt: { type: Date, default: Date.now },
  },
  { _id: false } // line identity = product + size + color (see `hasLine`)
);

const cartSchema = new mongoose.Schema(
  {
    // null for guests — the partial unique index below only sees real users
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: undefined,
    },

    // opaque id from the `guest_cart` cookie (set by the cart route)
    guestId: {
      type: String,
      trim: true,
      maxlength: [80, 'guest id must be at most 80 characters'],
      default: undefined,
      index: true,
    },

    items: {
      type: [cartItemSchema],
      default: [],
    },

    couponCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [40, 'coupon code must be at most 40 characters'],
      default: null,
    },

    currency: { type: String, default: 'USD', uppercase: true, minlength: 3, maxlength: 3 },

    // lifecycle: 'converted' = an order was placed from this cart
    status: {
      type: String,
      enum: { values: ['active', 'converted'], message: '{VALUE} is not a valid cart status' },
      default: 'active',
      index: true,
    },

    // TTL target for anonymous carts only (null = never auto-deleted)
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt / updatedAt (roadmap: "updatedAt" on cart)
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

// One cart per user. partialFilterExpression => guest carts (user missing)
// are not part of the index, so they can never collide with each other.
cartSchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } }
);

// cart page query: who owns this cart?
cartSchema.index({ status: 1, updatedAt: -1 });

// MongoDB removes the whole document when `expiresAt` passes (60s sweep)
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { expiresAt: { $type: 'date' } } });

// ---------------------------------------------------------------------------
// Virtuals
// ---------------------------------------------------------------------------

/** Number of distinct lines in the cart. */
cartSchema.virtual('lineCount').get(function lineCount() {
  return this.items.length;
});

/** Total item quantity across all lines (the header badge number). */
cartSchema.virtual('totalQty').get(function totalQty() {
  return this.items.reduce((sum, item) => sum + item.qty, 0);
});

/** True when the cart is an anonymous (guest) cart. */
cartSchema.virtual('isGuest').get(function isGuest() {
  return !this.user;
});

// ---------------------------------------------------------------------------
// Instance methods
// ---------------------------------------------------------------------------

/**
 * Line identity: the same product in a different size/colour is a new line.
 *
 *   cart.hasLine(productId, 'M', 'Black') -> boolean
 */
cartSchema.methods.hasLine = function hasLine(productId, size = null, color = null) {
  const id = String(productId);
  return this.items.some(
    item => String(item.product) === id && (item.size || null) === size && (item.color || null) === color
  );
};

/**
 * Add `qty` of a product (or bump an existing line, capped at 99).
 *
 *   const line = cart.addLine(productDoc, { qty: 2, size: 'M' });
 *
 * Returns the affected line so the route can answer with the new quantity.
 */
cartSchema.methods.addLine = function addLine(product, { qty = 1, size = null, color = null } = {}) {
  const quantity = Math.max(1, Math.min(99, Number(qty) || 1));
  const existing = this.items.find(
    item =>
      String(item.product) === String(product._id) &&
      (item.size || null) === size &&
      (item.color || null) === color
  );

  if (existing) {
    existing.qty = Math.min(99, existing.qty + quantity);
    // refresh the snapshot: price/name may have changed since it was added
    existing.price = product.price;
    existing.name = product.name;
    existing.image = product.thumbnail || existing.image;
    return existing;
  }

  const line = {
    product: product._id,
    name: product.name,
    image: product.thumbnail || '',
    price: product.price,
    size,
    color,
    qty: quantity,
    addedAt: new Date(),
  };
  this.items.push(line);
  return line;
};

/**
 * Money summary computed from the snapshots in the cart.
 * Display only — checkout recomputes against live product prices.
 *
 *   cart.summary() -> { lines: 3, qty: 7, subtotal: 249.5 }
 */
cartSchema.methods.summary = function summary() {
  return this.items.reduce(
    (acc, item) => {
      acc.lines += 1;
      acc.qty += item.qty;
      acc.subtotal += item.qty * item.price;
      return acc;
    },
    { lines: 0, qty: 0, subtotal: 0 }
  );
};

// ---------------------------------------------------------------------------
// Static methods
// ---------------------------------------------------------------------------

/** The caller's cart: by user id, else by guest cookie, else a fresh one. */
cartSchema.statics.getOrCreate = async function getOrCreate({ user, guestId, ttlDays = 30 } = {}) {
  const filter = user ? { user } : guestId ? { guestId, status: 'active' } : null;
  if (filter) {
    const found = await this.findOne(filter);
    if (found) return found;
  }
  const doc = { items: [] };
  if (user) {
    doc.user = user;
    doc.expiresAt = null; // user carts live forever
  } else if (guestId) {
    doc.guestId = guestId;
    doc.expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
  }
  return this.create(doc);
};

/** Set quantity for one line. qty <= 0 removes the line. */
cartSchema.statics.setQty = async function setQty(cartId, { productId, size = null, color = null, qty }) {
  const cart = await this.findById(cartId);
  if (!cart) return null;
  const amount = Number(qty);

  const line = cart.items.find(
    item =>
      String(item.product) === String(productId) &&
      (item.size || null) === size &&
      (item.color || null) === color
  );
  if (!line) return cart;

  if (!Number.isFinite(amount) || amount <= 0) {
    cart.items = cart.items.filter(item => item !== line);
  } else {
    line.qty = Math.min(99, Math.round(amount));
  }
  await cart.save();
  return cart;
};

/** Remove one line (by product id, optionally narrowed by size/colour). */
cartSchema.statics.removeLine = async function removeLine(cartId, { productId, size = null, color = null }) {
  const cart = await this.findById(cartId);
  if (!cart) return null;
  cart.items = cart.items.filter(
    item =>
      !(
        String(item.product) === String(productId) &&
        (item.size || null) === size &&
        (item.color || null) === color
      )
  );
  await cart.save();
  return cart;
};

/** Empty the cart (called after a successful order). */
cartSchema.statics.clear = async function clear(cartId) {
  return this.findByIdAndUpdate(cartId, { $set: { items: [], couponCode: null } }, { returnDocument: 'after' });
};

/**
 * Login merge (Phase 2.3): move every line of the anonymous cart into the
 * user's cart, summing quantities of identical lines (capped at 99), then
 * delete the guest cart so no duplicate document is left behind.
 *
 *   const merged = await Cart.mergeIntoUser(guestCart, userId);
 *
 * Returns the user cart (or the guest cart untouched when there is nothing
 * to merge).
 */
cartSchema.statics.mergeIntoUser = async function mergeIntoUser(guestCart, userId) {
  if (!guestCart) return null;

  const userCart = (await this.findOne({ user: userId })) || (await this.create({ user: userId, items: [] }));

  for (const line of guestCart.items) {
    const same = userCart.items.find(
      item =>
        String(item.product) === String(line.product) &&
        (item.size || null) === (line.size || null) &&
        (item.color || null) === (line.color || null)
    );
    if (same) same.qty = Math.min(99, same.qty + line.qty);
    else userCart.items.push(line.toObject ? line.toObject() : line);
  }

  // adopt the guest's coupon choice if the user has none
  if (!userCart.couponCode && guestCart.couponCode) userCart.couponCode = guestCart.couponCode;

  await userCart.save();
  await guestCart.deleteOne();
  return userCart;
};

module.exports = mongoose.models.Cart || mongoose.model('Cart', cartSchema);
