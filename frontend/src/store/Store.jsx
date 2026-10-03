import { configureStore } from '@reduxjs/toolkit';

import Shirt_P from './slices/ForShirt.jsx';
import { loadState, saveState, KEYS } from './persist.js';

/**
 * Cart hydration: the items slice (`Shirt`) is restored from localStorage so a
 * refresh or a new tab doesn't lose the cart. Shape-checked - an old or
 * corrupt blob falls back to an empty cart instead of blowing up in reducers.
 * `qty` is normalized too, so pre-qty carts from an older session become 1.
 */
function loadCart() {
  const saved = loadState(KEYS.cart);
  if (saved && Array.isArray(saved.products)) {
    const products = saved.products
      .filter(item => item && item.id)
      .map(item => ({
        id: item.id,
        Bname: item.Bname || '',
        name: item.name || '',
        price: Number(item.price) || 0,
        image: item.image || '',
        qty: Math.min(99, Math.max(1, Number(item.qty) || 1)),
      }));
    return { products };
  }
  return undefined; // let the slice use its own initialState
}

const persistedCart = loadCart();

export const Store = configureStore({
  reducer: {
    Shirt: Shirt_P,
    // catalog lives in Mongo now (hooks/useProducts) - no static products slice;
    // the header badge reads totals straight from Shirt (no derived slice)
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
