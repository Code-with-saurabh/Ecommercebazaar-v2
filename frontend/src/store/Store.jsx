import { configureStore } from '@reduxjs/toolkit';

import ForCart from './slices/ForCart.jsx';
import Shirt_P from './slices/ForShirt.jsx';
import Product from './slices/ForSearch.jsx';

export const Store = configureStore({
  reducer: {
    CartValue: ForCart,
    Shirt: Shirt_P,
    AllProduct: Product,
  },
});
