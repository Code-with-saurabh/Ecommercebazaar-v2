import { createSlice } from '@reduxjs/toolkit';

const MIN_QTY = 1;
const MAX_QTY = 99;

/**
 * Local cart (redux + localStorage). A line is a product, size and color.
 * Older carts and Quick Add have no selected variant. `qty` lives here so the header
 * badge, totals and the server sync (hooks/useCartSync.js) all read the
 * single source of truth.
 */
const initialState = {
  products: [], // { id, Bname, name, price, image, qty, size, color }
};

export const cartLineKey = ({ id, size, color }) => JSON.stringify([id, size || null, color || null]);
const sameLine = (a, b) => a.id === b.id && (a.size || null) === (b.size || null) && (a.color || null) === (b.color || null);

function clampQty(qty) {
  const value = Math.round(Number(qty));
  if (!Number.isFinite(value) || value < MIN_QTY) return MIN_QTY;
  return Math.min(MAX_QTY, value);
}

const ForProducts = createSlice({
  name: 'Products',
  initialState,
  reducers: {
    // add -> new line; already there -> bump its quantity (capped at 99)
    additems: (state, action) => {
      const { id, Bname, name, price, image, qty, size, color } = action.payload;
      if (!id) return;
      const existing = state.products.find(product => sameLine(product, action.payload));
      if (existing) {
        existing.qty = Math.min(MAX_QTY, existing.qty + clampQty(qty));
        return;
      }
      state.products.push({ id, Bname, name, price, image, size: size || null, color: color || null, qty: clampQty(qty) });
    },

    removeitems: (state, action) => {
      state.products = state.products.filter(product => !sameLine(product, action.payload));
    },

    // one line's quantity; qty < 1 removes the line (matches server PATCH)
    updateQty: (state, action) => {
      const { qty } = action.payload;
      const existing = state.products.find(product => sameLine(product, action.payload));
      if (!existing) return;
      const value = Math.round(Number(qty));
      if (!Number.isFinite(value) || value < MIN_QTY) {
        state.products = state.products.filter(product => !sameLine(product, action.payload));
        return;
      }
      existing.qty = Math.min(MAX_QTY, value);
    },

    // server -> local (login merge / second device); merges, never wipes
    hydrateItems: (state, action) => {
      const incoming = Array.isArray(action.payload) ? action.payload : [];
      if (incoming.length === 0) return;
      for (const item of incoming) {
        if (!item || !item.id) continue;
        const existing = state.products.find(product => sameLine(product, item));
        if (existing) {
          existing.qty = Math.min(MAX_QTY, existing.qty + clampQty(item.qty));
        } else {
          state.products.push({ ...item, qty: clampQty(item.qty) });
        }
      }
    },

    // checkout succeeded: wipe locally so useCartSync's next push sends an
    // empty cart instead of resurrecting the placed order's lines
    clearCart: state => {
      state.products = [];
    },
  },
});

export const { additems, removeitems, updateQty, hydrateItems, clearCart } = ForProducts.actions;

export default ForProducts.reducer;
