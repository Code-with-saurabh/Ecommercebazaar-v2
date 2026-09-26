// src/Components/Pages/Products/Products.js

import React from 'react';
import Card from  '../Home/Card.jsx';
 
import {useSelector} from 'react-redux';

 


import './Products.css';
function Products() {
	 
	 
	
   const productCategories = useSelector(state => state.AllProduct.productCategories);

	return (
    <>
{/*} Object.entries , this tack an obj and conver it in to array just like {" Object.entries({name:"Saurabh"})"} then the array will be ["name","Saurabh"]*/}
{Object.entries(productCategories).map(([category, products])=>(
	 <section key={category} className={`for-${category} forH`}>
		   <h1>{category.charAt(0).toUpperCase() + category.slice(1)}</h1> 
		  <hr/>
	 <div className={`${category} Hadding`} >
		 <div className="GridStyle">
		 {
			 products.map(product=>(
				 <Card 
				 key={product.id}
				 id={product.id}
				 BrandName={product.BrandName}
				 ProductName={product.ProductName}
				 Price={product.Price}
				 Imgs={product.Imgs}
				 />
			 ))
		 }
		 </div>
	 </div>
	</section>
))}
    </>
  );
 
}

export default Products;
 // 