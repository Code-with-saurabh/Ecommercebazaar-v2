import React from 'react'
import Card from './Card.js';

 

import Hero from './Hero.js';

import Prodouct1 from '../../../assets/img/products/f1.jpg';
import Prodouct2 from '../../../assets/img/products/f2.jpg';
import Prodouct3 from '../../../assets/img/products/f3.jpg';
import Prodouct4 from '../../../assets/img/products/f4.jpg';

import Prodouct5 from '../../../assets/img/products/f5.jpg';
import Prodouct6 from '../../../assets/img/products/f6.jpg';
// import Prodouct7 from '../../../assets/img/products/f7.jpg';
// import Prodouct8 from '../../../assets/img/products/f8.jpg';
import Prodouct002 from '../../../assets/img/IMGs/IMGS lummi.ai/Shoes/New White Sneakers on Pink Background.jpg';
import Prodouct7 from '../../../assets/img/products/f6-2.jpg';
import Prodouct15 from '../../../assets/img/products/f7.jpg';
 
// E:\React\Ecommearc\src\assets\img\Shose\Prodcuts.jpg
import './Home.css';
function Home(){
	 
	 
	 
	return(<>
	<Hero/>
	<div className="recomneded inDiv">
		<h1>Recommended</h1>
		<div className="divIMG">
		<Card 
			id={101}
			BrandName="Supreme Comfort Tee"
			ProductName="Perfection in Every Thread Premium Shirts Crafted for Unmatched Comfort and Style"
			Price="223" 
			Imgs={Prodouct1} 
			 />
		
		<Card 
			id={102} 
			BrandName="Street Smart Tees"
			ProductName="Elegance Redefined High-Quality Shirts Featuring Superior Materials and Craftsmanship" 
			Price="323" 
			Imgs={Prodouct2}/>
			
		<Card 
			id={103} 
			BrandName="Downtown Designs"
			ProductName="Urban Chic Premium  Shirts Combining Contemporary Design with Exceptional Comfort" 
			Price="123" 
			Imgs={Prodouct3}/>
		<Card 
			id={104} 
			BrandName="Metro Essentials"
			ProductName="Summit Style Elevated  Shirts Made with Premium Fabrics for Peak Comfort and Durabilitys"
			Price="423" 
			Imgs={Prodouct4}/>
		</div>
	</div>
	<div className="featuures inDiv">
		<h1>Features</h1>
		<div className="divIMG">
		<Card 
			id={105} 
			BrandName="Pinnacle Prints"
			ProductName="Highland Hues Distinctive  Shirts Crafted from Top-Quality Materials for a Luxe Feel"
			Price="423" 
			Imgs={Prodouct5}/>
			<Card 
			id={1010} 
			BrandName="Threaded Elegance"
			ProductName="Percehes the best coirdten T-shirts with height qualtiy in defing withc primiunm matirual..."
			Price="223" 
			Imgs={Prodouct7}/>
			<Card 
			id={1001} 
			BrandName="Elevated Essentials"
			ProductName="High-Quality Pants Designed with Superior Fabrics for All-Day Comfort"
			Price="89" 
			Imgs={Prodouct15 }/>
			
			 <Card 
			id={1001} 
			BrandName="Vivid Threads"
			ProductName="Discover T-Shirts Made with Exceptional Quality and Unique Design"
			Price="923" 
			Imgs={Prodouct6}/>
			
			  <Card 
			id={1001} 
			BrandName="Vivid Threads"
			ProductName="Discover T-Shirts Made with Exceptional Quality and Unique Design"
			Price="923" 
			Imgs={Prodouct002}/>
			
			 
		 
		 
		</div>
	</div>
	
	</>);
}
export default Home;
