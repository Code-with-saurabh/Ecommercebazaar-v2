import './Navbar.css';

import { Link } from 'react-router-dom';

import NavLinks from '../HeaderComponents/NavLinks.jsx';
import Logo from '../HeaderComponents/Logo.jsx';
import Search from '../HeaderComponents/Search.jsx';
import Cart from '../HeaderComponents/Cart.jsx';
import User from '../HeaderComponents/User.jsx';

/**
 * Site chrome: dark announcement bar (real shipping/COD/pricing claims)
 * over the main nav row. All interactive pieces stay in HeaderComponents.
 */
const Navbar = () => (
  <header className="bz-header">
    <div className="bz-announce">
      <div className="bz-shell bz-announce__inner">
        <p className="bz-caps">
           Apparel &amp; footwear from Surat <span className="bz-announce__sep">/</span> Cash on delivery
        </p>
      </div>
    </div>

    <div className="bz-shell bz-nav">
      <Logo />
      <NavLinks />
      <Search />
      <div className="bz-nav__tools">
        <span className="bz-nav__currency bz-caps" title="Prices are charged in USD">
          USD
        </span>
        <Link to="/wishlist" className="bz-icon-btn" aria-label="Wishlist" title="Wishlist">
          <span className="material-symbols-outlined" aria-hidden="true">
            favorite
          </span>
        </Link>
        <Cart />
        <User />
      </div>
    </div>
  </header>
);

export default Navbar;
