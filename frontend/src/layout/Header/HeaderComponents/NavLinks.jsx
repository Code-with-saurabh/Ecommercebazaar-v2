import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { isAdmin, subscribeAuth } from '../../../utils/session';
import { CATEGORIES } from '../../../utils/catalog';
import './NavLinks.css';

/**
 * Editorial nav row. Category links go through the catalog's query params
 * (/products?category=Shirts&brand=…&sale=true) so every item is a real,
 * shareable filter — not a dead anchor.
 */
const LINKS = [
  { to: '/products', label: 'Shop all' },
  ...CATEGORIES,
  { to: '/products?sale=true', label: 'Sale', sale: true },
];

function current(link, { pathname, search }) {
  if (!['/products', '/products/shoes', '/products/tshirt'].includes(pathname)) return false;
  const query = new URLSearchParams(search);
  if (query.get('sale') === 'true') return Boolean(link.sale);
  const category = query.get('category') || ({ '/products/shoes': 'shoes', '/products/tshirt': 'tshirts' })[pathname];
  return category ? link.key === category : link.to === '/products';
}

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
              isActive={(_match, location) => current(link, location)}
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
