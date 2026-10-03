import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // If using react-router for navigation
import { isAdmin, subscribeAuth } from '../../../utils/session';
import './NavLinks.css';

const NavLinks = () => {
    // the Admin link only exists for role=admin sessions
    const [admin, setAdmin] = useState(isAdmin);

    useEffect(() => subscribeAuth(() => setAdmin(isAdmin())), []);

    return (
        <nav className="nav-links">
            <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/products">Products</Link></li>
                <li><Link to="/about">About</Link></li>
                {admin && <li><Link to="/admin">Admin</Link></li>}
            </ul>
        </nav>
		
    );
}

export default NavLinks;
