import { configureStore } from '@reduxjs/toolkit';
import Counter from '../Redux/Counter.jsx';
 
import ForCart from '../Redux/ForCart.jsx';

import Shirt_P from '../Redux/ForShirt.jsx';

import Product from '../Redux/ForSearch.jsx';

import AllFormData from '../Redux/AllFormData.jsx';
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
