import './Navbar.css'; // Assuming you have a separate CSS file for styling

import NavLinks from '../HeaderComponents/NavLinks.jsx';
import Logo from '../HeaderComponents/Logo.jsx';
import Search from '../HeaderComponents/Search.jsx';
import Cart from '../HeaderComponents/Cart.jsx';
import User from '../HeaderComponents/User.jsx';
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
