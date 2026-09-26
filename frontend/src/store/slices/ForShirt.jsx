// import { createSlice } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';


const initialState = {
  products: [],
  duplicate:false,
  
};

const ForProducts = createSlice(
	{
  name: "Products",
  initialState,
  reducers: {
    additems: (state, action) => {
		
      const { id, Bname,name, price, image } = action.payload;
	  
	const existingProduct = state.products.find(product => product.id === id);
	  
	  if(!existingProduct){
		  state.products.push({ id, Bname,name, price, image });
	  }else{
		   state.duplicate =true;
		   console.warn("Duplicate product!",state.duplicate);
	  }
	
	},
	
	removeitems:(state,action)=>{
		state.products = state.products.filter(obj  => obj.id !== action.payload)
	}
	
  },
});

export const { additems ,removeitems} = ForProducts.actions;

export default ForProducts.reducer;


/*state.products.forEach((i)=>{
			if(action.payload === i.id){
				delete state.products[i.id];
			}
		});*/


/*
setCount : (state)=>{
		state.count+=1;
	},
	mainprice : (state)=>{
		state.main_price = state.products.map((value)=>{
			return value.price;
		});
	},
*/
/*if(state.products.length !== 0){
      state.products.push({ id, Bname,name, price, image });
	}else{
		state.products.map((product)=>{
			if(product.id !== id ){
				return(state.products.push({ id, Bname,name, price, image }));
			}else{
				alert("Duplicate");
			}
		});
	}*/
	  