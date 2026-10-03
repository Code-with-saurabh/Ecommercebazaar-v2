import { createSlice } from '@reduxjs/toolkit';

const MIN_QTY = 1;
const MAX_QTY = 99;

/**
 * Local cart (redux + localStorage). Product-level lines - no size/color
 * yet (detail page variants are cosmetic). `qty` lives here so the header
 * badge, totals and the server sync (hooks/useCartSync.js) all read the
 * single source of truth.
 */
const initialState = {
  products: [], // { id, Bname, name, price, image, qty }
};

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
      const { id, Bname, name, price, image, qty } = action.payload;
      if (!id) return;
      const existing = state.products.find(product => product.id === id);
      if (existing) {
        existing.qty = Math.min(MAX_QTY, existing.qty + clampQty(qty));
        return;
      }
      state.products.push({ id, Bname, name, price, image, qty: clampQty(qty) });
    },

    removeitems: (state, action) => {
      state.products = state.products.filter(product => product.id !== action.payload);
    },

    // one line's quantity; qty < 1 removes the line (matches server PATCH)
    updateQty: (state, action) => {
      const { id, qty } = action.payload;
      const existing = state.products.find(product => product.id === id);
      if (!existing) return;
      const value = Math.round(Number(qty));
      if (!Number.isFinite(value) || value < MIN_QTY) {
        state.products = state.products.filter(product => product.id !== id);
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
        const existing = state.products.find(product => product.id === item.id);
        if (existing) {
          existing.qty = Math.min(MAX_QTY, existing.qty + clampQty(item.qty));
        } else {
          state.products.push({ ...item, qty: clampQty(item.qty) });
        }
      }
    },
  },
});

export const { additems, removeitems, updateQty, hydrateItems } = ForProducts.actions;

export default ForProducts.reducer;
