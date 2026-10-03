import { configureStore } from '@reduxjs/toolkit';

import ForCart from './slices/ForCart.jsx';
import Shirt_P from './slices/ForShirt.jsx';
import { loadState, saveState, KEYS } from './persist.js';

/**
 * Cart hydration: the items slice (`Shirt`) is restored from localStorage so a
 * refresh or a new tab doesn't lose the cart. Shape-checked - an old or
 * corrupt blob falls back to an empty cart instead of blowing up in reducers.
 */
function loadCart() {
  const saved = loadState(KEYS.cart);
  if (saved && Array.isArray(saved.products)) {
    return { products: saved.products, duplicate: false };
  }
  return undefined; // let the slice use its own initialState
}

const persistedCart = loadCart();

export const Store = configureStore({
  reducer: {
    CartValue: ForCart,
    Shirt: Shirt_P,
    // catalog lives in Mongo now (hooks/useProducts) - no static products slice
  },
  preloadedState: persistedCart ? { Shirt: persistedCart } : undefined,
});

// Persist only the cart slice, and only when it actually changed (reducers are
// immutable, so reference equality is enough - no deep compare needed).
let lastShirt = Store.getState().Shirt;
Store.subscribe(() => {
  const next = Store.getState().Shirt;
  if (next !== lastShirt) {
    lastShirt = next;
    saveState(KEYS.cart, next);
  }
});
