import React from 'react';
 
import './logo.css'; // Import CSS file for styling

const Logo = () => {
    return (
        <div className="logo">
            <a href="/">
{/*} <img src={logoImg} alt="Logo" className="logo-img" />*/}
			<h1 className="logo-img">Bazaar</h1>
            </a>
        </div>
    );
}

export default Logo;
