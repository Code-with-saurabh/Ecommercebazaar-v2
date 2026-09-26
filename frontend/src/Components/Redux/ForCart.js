import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    value: 0, // Initial value for the cart
};

const CartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addCart: (state) => {
			
            state.value += 1;
			
        },
        removeCart: (state) => {
            state.value -= 1;
        },
    },
});

export const { addCart, removeCart } = CartSlice.actions;

export default CartSlice.reducer;
