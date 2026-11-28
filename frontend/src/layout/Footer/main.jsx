import './main.css';
import { Link } from 'react-router-dom';

/** Brand chips link to real catalog filters (?brand=…). */
const BRANDS = ['ASICS', 'Brooks', 'Hoka One One', 'Dr. Martens', 'Allbirds'];

const CONCIERGE = [
  { to: '/help', label: 'Delivery & payment' },
  { to: '/contact', label: 'Contact Support' },
  { to: '/about', label: 'About Bazaar' },
  { to: '/products', label: 'Full Catalog' },
];

const SOCIAL = [
  { href: 'https://github.com/Code-with-saurabh', label: 'GitHub' },
  { href: 'https://www.linkedin.com/in/saurabh-sharma-64643128b', label: 'LinkedIn' },
  { href: 'https://x.com/Mr_Saurabh_16', label: 'X (Twitter)' },
  {
    href: 'https://www.instagram.com/_mr_sharma__16',
    label: 'Instagram',
  },
];

function Footer() {
  return (
    <footer className="bz-footer">
      <div className="bz-shell bz-footer__grid">
        {/* brand + headquarters */}
        <div className="bz-footer__brand">
          <div>
            <span className="bz-wordmark bz-footer__word">Bazaar</span>
            <span className="bz-caps bz-footer__tag">Surat, India</span>
            <p className="bz-footer__blurb">
              Shirts, tees, pants and footwear for an everyday wardrobe.
            </p>
          </div>
          <div className="bz-footer__hq">
            <p className="bz-caps">Contact</p>
            <p>Gujarat, Surat — India</p>
            <a href="tel:9327115687">+91 93271 15687</a>
            <a href="mailto:saurabh12166@gmail.com">saurabh12166@gmail.com</a>
          </div>
        </div>

        {/* real internal pages only */}
        <div>
          <h4 className="bz-caps bz-footer__head">Customer service</h4>
          <ul className="bz-footer__list">
            {CONCIERGE.map(item => (
              <li key={item.label}>
                <Link to={item.to}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* brand filters are live catalog query params */}
        <div>
          <h4 className="bz-caps bz-footer__head">Browse by brand</h4>
          <div className="bz-footer__brands">
            {BRANDS.map(brand => (
              <Link key={brand} to={`/products?brand=${encodeURIComponent(brand)}`}>
                {brand}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h4 className="bz-caps bz-footer__head">Meet the founder</h4>
          <ul className="bz-footer__list bz-footer__social">
            {SOCIAL.map(item => (
              <li key={item.label}>
                <a href={item.href} target="_blank" rel="noopener noreferrer">
                  <span>{item.label}</span>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    arrow_outward
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bz-shell bz-footer__bottom">
        <div className="bz-footer__trust">
          <span>
            <span className="material-symbols-outlined" aria-hidden="true">
              lock
            </span>
            Account checkout
          </span>
          <span className="bz-footer__sep">·</span>
          <span>
            <span className="material-symbols-outlined" aria-hidden="true">
              local_shipping
            </span>
            Cash on Delivery
          </span>
        </div>
        <p>&copy; {new Date().getFullYear()} Bazaar</p>
      </div>
    </footer>
  );
}

export default Footer;
