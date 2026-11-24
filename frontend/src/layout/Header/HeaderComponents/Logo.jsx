import { Link } from 'react-router-dom';
import './Logo.css';

const Logo = () => (
  <Link to="/" className="bz-logo" aria-label="Bazaar — home">
    <span className="bz-wordmark bz-logo__word">Bazaar</span>
    <span className="bz-caps bz-logo__tag">Est. Surat</span>
  </Link>
);

export default Logo;
