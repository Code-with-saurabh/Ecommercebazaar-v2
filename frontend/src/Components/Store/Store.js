import { configureStore } from '@reduxjs/toolkit';
import Counter from '../Redux/Counter.js';
 
import ForCart from '../Redux/ForCart.js';

import Shirt_P from '../Redux/ForShirt.js';

import Product from '../Redux/ForSearch.js';

import AllFormData from '../Redux/AllFormData.js';
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
