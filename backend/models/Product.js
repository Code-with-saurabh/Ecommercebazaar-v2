const mongoose = require('mongoose');

/**
 * PRODUCT — the catalog source of truth (Phase 2.1).
 *
 * Relations
 *   Order.items[]  -> product   (ref, snapshot of name/price copied at buy time)
 *   Cart.items[]   -> product   (ref, price re-read on every cart render)
 *   Review.product -> product   (ref, rating written back here by Review hooks)
 *   User.wishlist[]-> product   (ref)
 *
 * Money rules
 *   price  = what the customer pays today
 *   mrp    = compare-at ("was") price, only used to render a discount badge
 *   Money is stored as a Number (never a string, never cents-invisible floats
 *   rounded in the client). The server is the only place that computes totals.
 */

// ---------------------------------------------------------------------------
// Value objects (embedded, _id:false — they are data, not documents)
// ---------------------------------------------------------------------------

/** One image of the gallery. `isPrimary` drives card/thumbnail rendering. */
const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, 'image url is required'],
      trim: true,
    },
    alt: {
      type: String,
      trim: true,
      maxlength: [120, 'image alt text must be at most 120 characters'],
      default: '',
    },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false }
);

/** Aggregate that Review.js writes back after every save/delete. */
const ratingSchema = new mongoose.Schema(
  {
    // average shown to the customer (0 = unrated)
    avg: { type: Number, default: 0, min: [0, 'rating avg cannot be negative'], max: [5, 'rating avg cannot exceed 5'] },
    // number of published reviews behind `avg`
    count: { type: Number, default: 0, min: [0, 'rating count cannot be negative'] },
    // running sum kept on purpose: avg of avgs drifts, avg of sums does not
    sum: { type: Number, default: 0, min: [0, 'rating sum cannot be negative'] },
  },
  { _id: false }
);

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, 'sku is required'],
      trim: true,
      uppercase: true,
      unique: true, // one document per stock keeping unit (unique => index)
    },

    // URL segment: /products/<slug> is stable even if the display name changes
    slug: {
      type: String,
      required: [true, 'slug is required'],
      trim: true,
      lowercase: true,
      unique: true,
    },

    name: {
      type: String,
      required: [true, 'product name is required'],
      trim: true,
      minlength: [2, 'product name must be at least 2 characters'],
      maxlength: [140, 'product name must be at most 140 characters'],
      index: true,
    },

    brand: {
      type: String,
      required: [true, 'brand is required'],
      trim: true,
      maxlength: [60, 'brand must be at most 60 characters'],
      index: true,
    },

    description: {
      type: String,
      required: [true, 'description is required'],
      trim: true,
      maxlength: [5000, 'description must be at most 5000 characters'],
    },

    price: {
      type: Number,
      required: [true, 'price is required'],
      min: [0, 'price cannot be negative'],
      // cannot sell for more than the printed MRP (typo guard on admin input)
      validate: {
        validator(value) {
          if (this.mrp === undefined || this.mrp === null) return true;
          return value <= this.mrp;
        },
        message: 'price cannot be higher than mrp',
      },
    },

    // compare-at price, optional: drives the "-20%" badge in the storefront
    mrp: {
      type: Number,
      min: [0, 'mrp cannot be negative'],
      default: null,
    },

    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },

    // fixed catalog buckets — must stay in sync with the frontend
    // CATEGORY_ALIASES (frontend/src/pages/Products/Products.jsx)
    category: {
      type: String,
      required: [true, 'category is required'],
      enum: {
        values: ['tshirts', 'shirts', 'pants', 'shoes'],
        message: '{VALUE} is not a supported category',
      },
      index: true,
    },

    subcategory: {
      type: String,
      trim: true,
      maxlength: [60, 'subcategory must be at most 60 characters'],
      default: '',
    },

    images: {
      type: [imageSchema],
      default: [],
      validate: {
        validator(images) {
          return images.length <= 12;
        },
        message: 'a product can have at most 12 images',
      },
    },

    // free-form option labels (rendered as chips); stock lives in `stock`
    sizes: {
      type: [String],
      default: [],
      validate: {
        validator(list) {
          return list.length <= 30 && list.every(s => s.length <= 24);
        },
        message: 'sizes must be at most 30 entries of 24 characters',
      },
    },

    colors: {
      type: [String],
      default: [],
      validate: {
        validator(list) {
          return list.length <= 30 && list.every(c => c.length <= 24);
        },
        message: 'colors must be at most 30 entries of 24 characters',
      },
    },

    stock: {
      type: Number,
      required: [true, 'stock is required'],
      default: 0,
      min: [0, 'stock cannot be negative'],
    },

    // below this the admin dashboard flags a low-stock alert
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: [0, 'low stock threshold cannot be negative'],
    },

    soldCount: {
      type: Number,
      default: 0,
      min: [0, 'sold count cannot be negative'],
    },

    rating: {
      type: ratingSchema,
      default: () => ({}),
    },

    tags: {
      type: [String],
      default: [],
      set(list) {
        // lowercase + de-dup so `filter by tag` never misses on case
        return Array.from(new Set(list.map(t => String(t).trim().toLowerCase()).filter(Boolean)));
      },
    },

    // merchandising switches (admin CRUD, Phase 2.7)
    isActive: {
      type: Boolean,
      default: true, // false = draft/hidden from the storefront
      index: true,
    },
    isFeatured: {
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

// list page: WHERE category = ? AND isActive = ? ORDER BY createdAt DESC
productSchema.index({ category: 1, isActive: 1, createdAt: -1 });
// filter chips + brand page
productSchema.index({ brand: 1, isActive: 1 });
// price sort on the products page
productSchema.index({ category: 1, isActive: 1, price: 1 });
// `?q=` search (Mongo text search; weights = ranking)
productSchema.index(
  { name: 'text', brand: 'text', description: 'text', tags: 'text' },
  { name: 'product_text_search', weights: { name: 5, brand: 4, tags: 2, description: 1 } }
);

// ---------------------------------------------------------------------------
// Virtuals (read-only derived fields, never stored)
// ---------------------------------------------------------------------------

/** Thumbnail URL: the primary image, else the first one, else ''. */
productSchema.virtual('thumbnail').get(function thumbnail() {
  if (!this.images || this.images.length === 0) return '';
  return (this.images.find(img => img.isPrimary) || this.images[0]).url;
});

/** Discount badge, e.g. `20` for price 80 / mrp 100. 0 when there is no MRP. */
productSchema.virtual('discountPercent').get(function discountPercent() {
  if (!this.mrp || this.mrp <= this.price) return 0;
  return Math.round(((this.mrp - this.price) / this.mrp) * 100);
});

/** Boolean stock flag used by the "notify me" button. */
productSchema.virtual('inStock').get(function inStock() {
  return this.stock > 0;
});

/** True when stock is at/below the configured threshold. */
productSchema.virtual('isLowStock').get(function isLowStock() {
  return this.stock > 0 && this.stock <= this.lowStockThreshold;
});

// ---------------------------------------------------------------------------
// Document hooks
// ---------------------------------------------------------------------------

/**
 * Helper: URL-safe slug. Duplicated here (not a shared util) on purpose —
 * slug rules are a product concern and must never drift with a shared util.
 *
 *   "Air Max 270!" -> "air-max-270"
 */
function slugify(input) {
  return String(input)
    .toLowerCase()
    .normalize('NFKD') // split accents: é -> e + combining mark
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

/**
 * Fill in slug + sku before validation so callers may omit them
 * (admin form, seed script). Existing values are never overwritten —
 * changing a slug would break links that are already shared.
 *
 * Mongoose 9 hooks are promise/sync based: never pass a `next` callback.
 */
productSchema.pre('validate', function ensureIdentifiers() {
  const base = slugify(this.name || 'product');

  if (!this.slug) this.slug = base || 'product';
  if (!this.sku) {
    const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
    this.sku = `${(this.category || 'gen').slice(0, 3).toUpperCase()}-${suffix}`;
  }

  // Exactly one primary image: force the first entry primary when nothing is.
  if (this.images && this.images.length > 0 && !this.images.some(img => img.isPrimary)) {
    this.images[0].isPrimary = true;
  }
});

/**
 * Keep `slug` unique when two products share a name ("air-max-270" twice).
 * Runs only on create, so published URLs never change afterwards.
 * Rejected promise -> validation error, exactly like a failed validator.
 */
productSchema.pre('validate', async function ensureUniqueSlug() {
  if (!this.isNew || !this.slug) return;
  const clash = await this.constructor.findOne({ slug: this.slug, _id: { $ne: this._id } });
  if (clash) this.slug = `${this.slug}-${Math.random().toString(36).slice(2, 6)}`;
});

// ---------------------------------------------------------------------------
// Instance methods
// ---------------------------------------------------------------------------

/**
 * Can we take `qty` more units right now?
 * Used by the cart/order handlers before writing anything to the database.
 *
 *   product.canFulfil(3) -> true | false
 */
productSchema.methods.canFulfil = function canFulfil(qty = 1) {
  return this.stock >= Number(qty) && Number(qty) > 0;
};

// ---------------------------------------------------------------------------
// Static methods (safe, atomic inventory helpers)
// ---------------------------------------------------------------------------

/**
 * Atomically remove `qty` units.
 *
 * The filter carries `stock: { $gte: qty }`, so two concurrent checkouts can
 * never both succeed on the last unit — MongoDB applies the update to one
 * document at a time and the other gets `null` (=> "out of stock").
 *
 *   const updated = await Product.decrementStock(id, 2);
 *   if (!updated) throw ApiError.conflict('Not enough stock');
 */
productSchema.statics.decrementStock = function decrementStock(productId, qty) {
  const amount = Number(qty);
  if (!Number.isInteger(amount) || amount <= 0) return Promise.resolve(null);
  return this.findOneAndUpdate(
    { _id: productId, stock: { $gte: amount } },
    { $inc: { stock: -amount, soldCount: amount } },
    { returnDocument: 'after' }
  );
};

/** Put units back (order cancelled / returned). Never lets stock go negative. */
productSchema.statics.incrementStock = function incrementStock(productId, qty) {
  const amount = Number(qty);
  if (!Number.isInteger(amount) || amount <= 0) return Promise.resolve(null);
  return this.findOneAndUpdate(
    { _id: productId },
    { $inc: { stock: amount } },
    { returnDocument: 'after' }
  );
};

/**
 * Called by Review.js after every review save/delete so the storefront can
 * sort/filter by rating without an aggregation on every request.
 *
 *   await Product.applyRating(productId, { avg: 4.5, count: 2, sum: 9 });
 */
productSchema.statics.applyRating = function applyRating(productId, stats) {
  return this.updateOne(
    { _id: productId },
    {
      $set: {
        'rating.avg': Number(stats.avg) || 0,
        'rating.count': Number(stats.count) || 0,
        'rating.sum': Number(stats.sum) || 0,
      },
    }
  ).exec();
};

/** Active products only — the storefront must never see drafts. */
productSchema.statics.findActive = function findActive(filter = {}) {
  return this.find({ ...filter, isActive: true });
};

// ---------------------------------------------------------------------------
// Export (model cache guard: safe under `node --watch` restarts / re-requires)
// ---------------------------------------------------------------------------

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
