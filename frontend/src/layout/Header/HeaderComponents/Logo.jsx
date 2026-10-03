import React from 'react';
import { Link } from 'react-router-dom';
import './Logo.css'; // file name is Logo.css - lowercase breaks case-sensitive builds

const Logo = () => {
    return (
        <div className="logo">
            {/* Link instead of <a href>: no full page reload on click */}
            <Link to="/">
{/*} <img src={logoImg} alt="Logo" className="logo-img" />*/}
			<h1 className="logo-img">Bazaar</h1>
            </Link>
        </div>
    );
}

export default Logo;
