 
import { createSlice } from '@reduxjs/toolkit';
 
 

import Prodouct1 from '../../assets/img/products/f1.jpg';
import Prodouct2 from '../../assets/img/products/f2.jpg';
import Prodouct3 from '../../assets/img/products/f3.jpg';
import Prodouct4 from '../../assets/img/products/f4.jpg';

import Prodouct5 from '../../assets/img/products/f5.jpg';
import Prodouct6 from '../../assets/img/products/f6.jpg';
import Prodouct7 from '../../assets/img/products/f6-2.jpg';


import Prodouct8 from '../../assets/img/products/n1.jpg';
import Prodouct9 from '../../assets/img/products/n2.jpg';
import Prodouct10 from '../../assets/img/products/n3.jpg';
import Prodouct11 from '../../assets/img/products/n4.jpg';
import Prodouct12 from '../../assets/img/products/n5.jpg';
import Prodouct13 from '../../assets/img/products/n7.jpg';
import Prodouct14 from '../../assets/img/products/n8.jpg';

import Prodouct15 from '../../assets/img/products/f7.jpg';
import Prodouct16 from '../../assets/img/products/n6.jpg';
 

import Prodouct0_1 from '../../assets/img/IMGs/IMGS lummi.ai/Colorful_Cartoon_Cats_Sweatshirt.jpg';

import Prodouct0_2 from '../../assets/img/IMGs/IMGS lummi.ai/Vibrant_Orange_Crewneck_Sweater.jpg';

import Prodouct0_3 from '../../assets/img/IMGs/IMGS lummi.ai/Vintage_Olive Crewneck_with Leather_Shield Patch.jpg';

import Prodouct0_4 from '../../assets/img/IMGs/IMGS lummi.ai/Vintage Shield Graphic Crew Neck Sweatshirt in Light Grey.jpg';

import Prodouct0_5 from '../../assets/img/IMGs/IMGS lummi.ai/Dynamic Sketches Sports Illustrated Sweatshirt.jpg';

import Prodouct0_6 from '../../assets/img/IMGs/IMGS lummi.ai/Confident Casual in Contemporary Striped Sweatshirt.jpg';
import Prodouct0_7 from '../../assets/img/IMGs/IMGS lummi.ai/Minimalist Elegance in Cream and Navy.jpg';
import Prodouct0_8 from '../../assets/img/IMGs/IMGS lummi.ai/Serene Woman in Monochrome Attire.jpg';

//shoes
import Prodouct001 from '../../assets/img/IMGs/IMGS lummi.ai/Shoes/Ethereal Glide White Sneakers.jpg';
import Prodouct002 from '../../assets/img/IMGs/IMGS lummi.ai/Shoes/New White Sneakers on Pink Background.jpg';
import Prodouct003 from '../../assets/img/IMGs/IMGS lummi.ai/Shoes/Pristine White Sneakers (1).jpg';
import Prodouct004 from '../../assets/img/IMGs/IMGS lummi.ai/Shoes/Pristine White Sneakers on Aqua Blue.jpg';
import Prodouct006 from '../../assets/img/IMGs/IMGS lummi.ai/Shoes/Pristine White Sneakers on Gray Surface.jpg';
import Prodouct005 from '../../assets/img/IMGs/IMGS lummi.ai/Shoes/Pristine White Sneakers with Soft Shadows.jpg';
import Prodouct007 from '../../assets/img/IMGs/IMGS lummi.ai/Shoes/Pristine White Sneakers.jpg';


// import Prodouct007 from '../../assets/img/IMGs/yead.png ';
// assets\img\IMGs\yead.png

import Prodouct127 from '../../assets/img/frd/pants/yead.png';
import Prodouct128 from '../../assets/img/frd/pants/garybagg.png';
import Prodouct130 from '../../assets/img/frd/pants/gry.png';
import Prodouct131 from '../../assets/img/frd/pants/pant.png';
import Prodouct132 from '../../assets/img/frd/pants/printedblackpan.png';
import Prodouct133 from '../../assets/img/frd/pants/sweatpants.png';
 
import Prodouct134 from 
'../../assets/img/frd/tsirt/wh.png';

import Prodouct135 from 
'../../assets/img/frd/shirt/shirt.jpg';

import Prodouct008 from '../../assets/img/IMGs/IMGS lummi.ai/Shoes/Vibrant Footwear Showcase.jpg';

import Prodouct009 from '../../assets/img/IMGs/IMGS lummi.ai/Shoes/White Sneakers and Blue Jeans Street Style.jpg';
import Prodouct010 from '../../assets/img/IMGs/IMGS lummi.ai/Shoes/Pristine White Sneakers and Blue Jeans.jpg';
import Prodouct011 from '../../assets/img/IMGs/1.jpg';
import Prodouct012 from '../../assets/img/IMGs/2.jpg';
import Prodouct013 from '../../assets/img/IMGs/7.jpg';
import Prodouct014 from '../../assets/img/IMGs/4.jpg';
// import Prodouct021 from '../../assets/img/IMGs/5.jpg';
import Prodouct015 from '../../assets/img/IMGs/6.jpg';
import Prodouct022 from '../../assets/img/IMGs/3.jpg';
import Prodouct016 from '../../assets/img/IMGs/8.jpg';
import Prodouct017 from '../../assets/img/IMGs/9.jpg';
// import Prodouct018 from '../../assets/img/IMGs/10.jpg';
import Prodouct019 from '../../assets/img/IMGs/11.jpg';
import Prodouct020 from '../../assets/img/IMGs/12.jpg';

import Prodouct101 from '../../assets/img/products/pants/Pant1.jpg';
import Prodouct102 from '../../assets/img/products/pants/Pant2.jpg';
import Prodouct103 from '../../assets/img/frd/pants/baggyflower.png';
import Prodouct104 from '../../assets/img/products/pants/Pant4.jpg';
import Prodouct105 from '../../assets/img/products/pants/Pant5.jpg';
import Prodouct106 from '../../assets/img/products/pants/Pant6.jpg';
import Prodouct107 from '../../assets/img/products/pants/Pant7.jpg';
 
const initialState = {
  productCategories: { 
  tshirts: [
    {
      id: 1010,
      BrandName: "Threaded Elegance",
      ProductName:
        "Percehes the best coirdten T-shirts with height qualtiy in defing withc primiunm matirual...",
      Price: "223",
      Imgs: Prodouct7,
    },
    {
      id: 1020,
      BrandName: "Peak Threads",
      ProductName:
        "Premium T-Shirts Crafted with Precision and Elegance",
      Price: "523",
      Imgs: Prodouct0_2,
    },
    {
      id: 1030,
      BrandName: "Urban Loom",
      ProductName:
        "T-Shirts That Combine Premium Materials with Unparalleled Craftsmanship",
      Price: "623",
      Imgs: Prodouct0_1,
    },
    {
      id: 1040,
      BrandName: "Supreme Stitches",
      ProductName:
        "T-Shirts That Combine High-Caliber Materials with Expert Craftsmanship",
      Price: "723",
      Imgs: Prodouct0_3,
    },
    {
      id: 1050,
      BrandName: "Silk & Stitch",
      ProductName:
        "Discover T-Shirts Made with the Finest Fabrics and Meticulous Attention to Detail",
      Price: "823",
      Imgs: Prodouct0_4,
    },
    {
      id: 1060,
      BrandName: "PrimeWear Tees",
      ProductName:
        "High-Quality T-Shirts That Redefine Style and Durability",
      Price: "923",
      Imgs: Prodouct0_5,
    },
    {
      id: 1070,
      BrandName: "EliteFabric Co.",
      ProductName:
        "Premium T-Shirts Engineered for Unmatched Quality and Sophistication",
      Price: "923",
      Imgs: Prodouct0_6,
    },
    {
      id: 1080,
      BrandName: "Vivid Threads",
      ProductName:
        "T-Shirts That Offer Superior Comfort and Timeless Style",
      Price: "923",
      Imgs: Prodouct0_7,
    },
    {
      id: 1090,
      BrandName: "Modern Weave",
      ProductName:
        " Discover T-Shirts Made with Exceptional Quality and Unique Design",
      Price: "923",
      Imgs: Prodouct0_8,
    },
	{
      id: 1100,
      BrandName: "Modern Weave",
      ProductName:
        " Discover T-Shirts Made with Exceptional Quality and Unique Design",
      Price: "923",
      Imgs: Prodouct134,
    },
  ],
  shirts: [
    {
      id: 101,
      BrandName: "Supreme Comfort Tee",
      ProductName: "Perfection in Every Thread Premium Shirts Crafted for Unmatched Comfort and Style",
      Price: "223",
      Imgs: Prodouct1,
    },
    {
      id: 102,
      BrandName: "Street Smart Tees",
      ProductName: "Elegance Redefined High-Quality Shirts Featuring Superior Materials and Craftsmanship",
      Price: "323",
      Imgs: Prodouct2,
    },
    {
      id: 103,
      BrandName: "Downtown Designs",
      ProductName: "Urban Chic Premium  Shirts Combining Contemporary Design with Exceptional Comfort",
      Price: "423",
      Imgs: Prodouct3,
    },
    {
      id: 104,
      BrandName: "Metro Essentials",
      ProductName: "Summit Style Elevated  Shirts Made with Premium Fabrics for Peak Comfort and Durabilitys",
      Price: "199",
      Imgs: Prodouct4,
    },
    {
	  id: 105,
      BrandName: "Pinnacle Prints",
      ProductName: "Highland Hues Distinctive  Shirts Crafted from Top-Quality Materials for a Luxe Feel",
      Price: "599",
      Imgs: Prodouct5,
    },
    {
      id: 106,
      BrandName: "Highland Hues",
      ProductName: "Pinnacle Prints Premium  Shirts Designed with the Finest Fabrics for Superior Style",
      Price: "129",
      Imgs: Prodouct6,
    },
    {
      id: 107,
      BrandName: "Summit Style Tee",
      ProductName: "Metro Essentials High-Quality  Shirts Featuring Modern Designs and Superior Comfort",
      Price: "249",
      Imgs: Prodouct7,
    },
    {
      id: 108,
      BrandName: "Urban Chic",
      ProductName: "Downtown Designs Premium  Shirts Crafted with the Best Materials for Urban Sophistication",
      Price: "349",
      Imgs: Prodouct8,
    },
    {
      id: 109,
      BrandName: "Elegance in Pastels",
      ProductName: "Street Smart Tees Top-Tier  Shirts Combining Cutting-Edge Style with Unmatched Quality",
      Price: "179",
      Imgs: Prodouct9,
    },
    {
      id: 110,
      BrandName: "Signature Comfort Tee",
      ProductName: "Elegance Defined Premium Shirts Made with Top-Quality Fabrics for a Timeless Look",
      Price: "169",
      Imgs: Prodouct10,
    },
    {
      id: 111,
      BrandName: "Stitch Perfection",
      ProductName: "Silken Touch Luxe Shirts Crafted from the Finest Materials for an Ultra-Soft Feel",
      Price: "199",
      Imgs: Prodouct11,
    },
    {
      id: 112,
      BrandName: "Elegance Defined",
      ProductName: "Stitch & Shine Premium Shirts Featuring Exceptional Quality and Modern Design Elements",
      Price: "499",
      Imgs: Prodouct12,
    },
    {
      id: 113,
      BrandName: "Silken Touch Tee",
      ProductName: "Luxe Layers High-Quality Shirts Made from Premium Fabrics for Ultimate Comfort and Style",
      Price: "299",
      Imgs: Prodouct13,
    },
    {
      id: 114,
      BrandName: "Luxe Layers",
      ProductName: "Elegance Defined Premium Shirts Made with Top-Quality Fabrics for a Timeless Look",
      Price: "89",
      Imgs: Prodouct14,
    },
	{
      id: 115,
      BrandName: "Luxe Layers",
      ProductName: "Elegance Defined Premium Shirts Made with Top-Quality Fabrics for a Timeless Look",
      Price: "89",
      Imgs: Prodouct135,
    },
	
  ],
  pants: [
    { 
	id: 1021, 
	BrandName: "Elevated Essentials", 
	ProductName: " High-Quality Pants Designed with Superior Fabrics for All-Day Comfort", 
	Price: "89", 
	Imgs: Prodouct15 },
	
    { id: 1022,
	BrandName: "Stitch & Shine",
	ProductName: " Featuring Contemporary Premium Pants Design and Featuring Contemporary Exceptional Fit",
	Price: "129", 
	Imgs: Prodouct16 },
	
	
	
	{ id: 1024,
	BrandName: "Elegance in Pastels",
	ProductName: "Men Slim Mid Rise Blue Jeans",
	Price: "129", 
	Imgs: Prodouct102 },
	
	{ id: 1029,
	BrandName: "Lee Cooper",
	ProductName: "Premium Pants Featuring Contemporary Design and Exceptional Fit",
	Price: "229", 
	Imgs: Prodouct107 },
	
	{ id: 1025,
	BrandName: "Lee Jeans",
	ProductName: "Relaxed Fit Mid Rise baggyflower",
	Price: "199", 
	Imgs: Prodouct103 },
	
	{ id: 1026,
	BrandName: "Levi's",
	ProductName: "Premium Pants Featuring Contemporary Design and Exceptional Fit",
	Price: "149", 
	Imgs: Prodouct104 },
	
	{ id: 1027,
	BrandName: "Stitch & Shine",
	ProductName: "Premium Pants Featuring Contemporary Design and Exceptional Fit",
	Price: "189", 
	Imgs: Prodouct105 },
	
	{ id: 1028,
	BrandName: "Flying Machine",
	ProductName: "Men Jogger Fit Mid Rise Black Jeans",
	Price: "129", 
	Imgs: Prodouct106 },
	
	{ id: 1023,
	BrandName: "Stitch & Shine",
	ProductName: "Classic Tailored Pants with Premium Fit",
	Price: "249", 
	Imgs: Prodouct101 },
	
	{ id: 1030,
	BrandName: "Stitch & Shine",
	ProductName: "Pants Combine High-Caliber Materials with Expert Craftsmanship",
	Price: "224", 
	Imgs: Prodouct127 },
	
	{ id: 1031,
	BrandName: "Stitch & Shine",
	ProductName: "Chino Pants for Comfort and Style",
	Price: "224", 
	Imgs: Prodouct128 },
	
	{ id: 1032,
	BrandName: "Stitch & Shine",
	ProductName: "Sleek Slim-Fit Formal Pants for Business Wear",
	Price: "279", 
	Imgs: Prodouct132 },
	
	{ id: 1033,
	BrandName: "Stitch & Shine",
	ProductName: "Sporty Athletic Pants for Movement",
	Price: "229", 
	Imgs: Prodouct130 },
	
	{ id: 1034,
	BrandName: "Stitch & Shine",
	ProductName: "Cotton Casual Pants for Everyday Comfort",
	Price: "294", 
	Imgs: Prodouct131 },
	
	{ id: 1035,
	BrandName: "Stitch & Shine",
	ProductName: "Elegant Tapered Pants for Evening Wear",
	Price: "229", 
	Imgs: Prodouct133 },
	
	 
	
	
	
	
  ],
shoes: [
    {
      id: 1001,
      BrandName: "Nike",
      ProductName: "Air Max 270",
      Price: "499",
      Imgs: Prodouct001,
    },
    {
      id: 1002,
      BrandName: "Adidas",
      ProductName: "Ultraboost 21",
      Price: "299",
      Imgs: Prodouct002,
    },
    {
      id: 1003,
      BrandName: "Puma",
      ProductName: "RS-X3",
      Price: "89",
      Imgs: Prodouct003,
    },
    {
      id: 1004,
      BrandName: "Reebok",
      ProductName: "Club C 85",
      Price: "168",
      Imgs: Prodouct004,
    },
    {
      id: 1005,
      BrandName: "New Balance",
      ProductName: "990v5",
      Price: "143",
      Imgs: Prodouct005,
    },
    {
      id: 1006,
      BrandName: "Under Armour",
      ProductName: "HOVR Phantom 2",
      Price: "134",
      Imgs: Prodouct006,
    },
    {
      id: 1007,
      BrandName: "ASICS",
      ProductName: "Gel-Kayano 27",
      Price: "179",
      Imgs: Prodouct007,
    },
    {
      id: 1008,
      BrandName: "Saucony",
      ProductName: "Endorphin Speed 2",
      Price: "159",
      Imgs: Prodouct008,
    },
    {
      id: 1009,
      BrandName: "Brooks",
      ProductName: "Ghost 14",
      Price: "129",
      Imgs: Prodouct009,
    },
    {
      id: 10010,
      BrandName: "Hoka One One",
      ProductName: "Clifton 7",
      Price: "389",
      Imgs: Prodouct010,
    },
    {
      id: 10011,
      BrandName: "Vans",
      ProductName: "Old Skool",
      Price: "299",
      Imgs: Prodouct011,
    },
    {
      id: 10012,
      BrandName: "Converse",
      ProductName: "Chuck Taylor All Star",
      Price: "289",
      Imgs: Prodouct012,
    },
    {
      id: 10013,
      BrandName: "Fila",
      ProductName: "Disruptor II",
      Price: "199",
      Imgs: Prodouct013,
    },
    {
      id: 10014,
      BrandName: "Skechers",
      ProductName: "D'Lites",
      Price: "189",
      Imgs: Prodouct014,
    },
    {
      id: 10015,
      BrandName: "Timberland",
      ProductName: "6-Inch Premium Waterproof Boots",
      Price: "159",
      Imgs: Prodouct015,
    },
    
    {
      id: 10017,
      BrandName: "Merrell",
      ProductName: "Moab 2 Waterproof",
      Price: "349",
      Imgs: Prodouct017,
    },
	{
      id: 10016,
      BrandName: "Salomon",
      ProductName: "6-Inch Premium Aedcross Speedcross 1890 Smooth Leather  peed  Fastpack IV ",
      Price: "79",
      Imgs: Prodouct016,
    },
    {
      id: 10019,
      BrandName: "The North Face",
      ProductName: "Ultra Fastpack IV Disruptor II Moab 2 Waterproof Premium Aedcross Speedcross ",
      Price: "149",
      Imgs: Prodouct019,
    },
    {
      id: 10020,
      BrandName: "Dr. Martens",
      ProductName: "1460 Smooth Leather Boots",
      Price: "239",
      Imgs: Prodouct020,
    },
    {
      id: 10022,
      BrandName: "Allbirds",
      ProductName: "Wool Formal",
      Price: "189",
      Imgs: Prodouct022,
    }, 
    
  ],}
};
const productsData = createSlice({
  name: 'products',
  initialState,
  reducers: {
    // Reducer to add a T-shirt
    addTshirt: (state, action) => {
      const { id, BrandName, ProductName, Price, Imgs } = action.payload;
      state.productCategories.tshirts.push({ id, BrandName, ProductName, Price, Imgs });
    },

    // Reducer to add a shirt
    addShirt: (state, action) => {
      const { id, BrandName, ProductName, Price, Imgs } = action.payload;
      state.productCategories.shirts.push({ id, BrandName, ProductName, Price, Imgs });
    },

    // Reducer to add pants
    addPants: (state, action) => {
      const { id, BrandName, ProductName, Price, Imgs } = action.payload;
      state.productCategories.pants.push({ id, BrandName, ProductName, Price, Imgs });
    },

    // Reducer to add shoes
    addShoes: (state, action) => {
      const { id, BrandName, ProductName, Price, Imgs } = action.payload;
      state.productCategories.shoes.push({ id, BrandName, ProductName, Price, Imgs });
    },
    
    // General function to add products to any category
    addProducts: (state, action) => {
      const { category, product } = action.payload;
      if (state.productCategories[category]) {
        state.productCategories[category].push(product);
      }
    }
  }
});

export const { addTshirt, addShirt, addPants, addShoes, addProducts } = productsData.actions;
export default productsData.reducer;