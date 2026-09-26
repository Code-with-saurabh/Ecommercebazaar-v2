import config from '../config';

const currencyFormatter = new Intl.NumberFormat(config.locale, {
  style: 'currency',
  currency: config.currency,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat(config.locale);

/** '$223.00' - safe for null/NaN/string prices coming from the legacy catalog. */
export function formatMoney(value) {
  const amount = Number(value);
  return currencyFormatter.format(Number.isFinite(amount) ? amount : 0);
}

export function formatNumber(value) {
  const amount = Number(value);
  return numberFormatter.format(Number.isFinite(amount) ? amount : 0);
}

/** '1234.5' -> 1234.5 (returns 0 for anything invalid) */
export function toAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

/**
 * Line total: quantity * price.
 * qty defaults to 1 and negative input is clamped to 0.
 */
export function lineTotal(price, qty = 1) {
  const quantity = Math.max(0, Number(qty) || 0);
  return toAmount(price) * quantity;
}

/** Sum of line totals for a cart array: [{ price, qty }] */
export function cartTotal(items = [], getQty = () => 1) {
  return items.reduce((sum, item) => sum + lineTotal(item.price, getQty(item)), 0);
}
