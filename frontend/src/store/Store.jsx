import { configureStore } from '@reduxjs/toolkit';
import Counter from './slices/Counter.jsx';
 
import ForCart from './slices/ForCart.jsx';

import Shirt_P from './slices/ForShirt.jsx';

import Product from './slices/ForSearch.jsx';

import AllFormData from './slices/AllFormData.jsx';
// E:\React\Ecommearc\src\Components\Redux\ForShirt.js
export const Store = configureStore({
    reducer: {
        counter: Counter,
        CartValue: ForCart,
		Shirt : Shirt_P,
		Data : AllFormData,
		AllProduct:Product,
		
    },
});
