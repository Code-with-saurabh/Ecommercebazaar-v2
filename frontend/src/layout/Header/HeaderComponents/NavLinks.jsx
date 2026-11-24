import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { isAdmin, subscribeAuth } from '../../../utils/session';
import './NavLinks.css';

/**
 * Editorial nav row. Category links go through the catalog's query params
 * (/products?category=Shirts&brand=…&sale=true) so every item is a real,
 * shareable filter — not a dead anchor.
 */
const LINKS = [
  { to: '/products', label: 'Shop' },
  { to: '/products', label: 'All Products', end: true },
  { to: '/products/tshirt', label: 'T-Shirts' },
  { to: '/products?category=shirts', label: 'Shirts' },
  { to: '/products?category=pants', label: 'Pants' },
  { to: '/products/shoes', label: 'Footwear' },
  { to: '/products?sale=true', label: 'Archive Sale', sale: true },
];

const NavLinks = () => {
  const [admin, setAdmin] = useState(isAdmin);

  useEffect(() => subscribeAuth(() => setAdmin(isAdmin())), []);

  return (
    <nav className="bz-navlinks" aria-label="Primary">
      <ul>
        {LINKS.map(link => (
          <li key={link.label}>
            <NavLink
              to={link.to}
              end={link.end}
              className="bz-navlinks__link"
              activeClassName="is-active"
            >
              {link.sale && <span className="bz-navlinks__dot" aria-hidden="true" />}
              {link.label}
            </NavLink>
          </li>
        ))}
        {admin && (
          <li>
            <NavLink to="/admin" className="bz-navlinks__link" activeClassName="is-active">
              Admin
            </NavLink>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default NavLinks;
