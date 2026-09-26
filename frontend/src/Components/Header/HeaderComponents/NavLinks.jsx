import React from 'react';
import { Link } from 'react-router-dom'; // If using react-router for navigation
import './NavLinks.css';
const NavLinks = () => {
    return (
        <nav className="nav-links">
            <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/products">Products</Link></li>
                <li><Link to="/about">About</Link></li>
                
            </ul>
        </nav>
		
    );
}

export default NavLinks;

