import React from 'react';
import './Navbar.css'; // Assuming you have a separate CSS file for styling

import NavLinks from '../HeaderComponents/NavLinks.js';
import Logo from '../HeaderComponents/logo.js';
import Search from '../HeaderComponents/Search.js';
import Cart from '../HeaderComponents/Cart.js';
import User from '../HeaderComponents/User.js';
// import ImageSlider from '../../Slider/ImageSlider';
const Navbar = () => {
    return (
        <div className="navbar">
            <Logo />
            <NavLinks />
            <Search />
            <Cart/>
            <User />
        </div>
		 );
}

export default Navbar;
