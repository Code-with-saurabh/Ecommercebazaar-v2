const { env } = require('../config/env');

/**
 * Server-side money math — the ONLY place order totals are computed.
 *
 *   computePricing({ items, discount })
 *     -> { subtotal, discount, shipping, tax, total, currency }
 *
 * Rules (client totals are NEVER trusted - routes pass live DB prices):
 *   subtotal  = sum(price * qty)                     (live Product.price)
 *   discount  = coupon amount, clamped to [0, subtotal]
 *   shipping  = 0 when subtotal >= FREE_SHIPPING_OVER, else SHIPPING_FLAT
 *   tax       = after-discount subtotal * TAX_RATE
 *   total     = subtotal - discount + shipping + tax   (2-decimal rounded)
 *
 * All knobs are env-driven (config/env.js -> pricing) so a deployment can
 * change them without a code change. Rounding happens once per component,
 * never on an intermediate sum, so Order.checkTotals always matches.
 */

const round2 = value => Math.round((Number(value) || 0) * 100) / 100;

/**
 * @param {Array<{ price: number, qty: number }>} items - live-priced lines
 * @param {number} discount - already-evaluated coupon discount (0 when none)
 * @returns {{ subtotal: number, discount: number, shipping: number,
 *             tax: number, total: number, currency: string }}
 */
function computePricing({ items = [], discount = 0 } = {}) {
  const subtotal = round2(
    items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0), 0)
  );

  const appliedDiscount = round2(Math.min(Math.max(Number(discount) || 0, 0), subtotal));
  const afterDiscount = round2(subtotal - appliedDiscount);

  // Free shipping is judged on the pre-discount subtotal: a coupon must never
  // silently add shipping back by shrinking the basket below the threshold.
  let shipping = 0;
  if (subtotal > 0 && subtotal < env.pricing.freeShippingOver) {
    shipping = env.pricing.shippingFlat;
  }

  const tax = round2(afterDiscount * env.pricing.taxRate);
  const total = round2(afterDiscount + shipping + tax);

  return {
    subtotal,
    discount: appliedDiscount,
    shipping,
    tax,
    total,
    currency: env.pricing.currency,
  };
}

module.exports = { computePricing, round2 };
