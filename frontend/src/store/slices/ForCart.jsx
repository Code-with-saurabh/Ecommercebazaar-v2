import { createSlice } from '@reduxjs/toolkit';
import { additems, removeitems } from './ForShirt.jsx';

/**
 * Cart badge counter.
 *
 * The old version incremented on every dispatch, so pressing "Add to Cart"
 * twice for the same product made the badge drift away from reality. The
 * count is now derived from the unique product ids seen in the cart slice,
 * so badge === state.Shirt.products.length always holds.
 */
const CartSlice = createSlice({
  name: 'cart',
  initialState: {
    value: 0,
    ids: [],
  },
  reducers: {
    // Kept for backwards compatibility with older callers: no-op, the value
    // is derived from the id list below.
    addCart: () => {},
    removeCart: () => {},
  },
  extraReducers: builder => {
    builder
      .addCase(additems, (state, action) => {
        const id = action.payload && action.payload.id;
        if (id !== undefined && !state.ids.includes(id)) {
          state.ids.push(id);
        }
        state.value = state.ids.length;
      })
      .addCase(removeitems, (state, action) => {
        state.ids = state.ids.filter(existing => existing !== action.payload);
        state.value = state.ids.length;
      });
  },
});

export const { addCart, removeCart } = CartSlice.actions;

export default CartSlice.reducer;
