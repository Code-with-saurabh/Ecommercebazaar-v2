import { Link } from 'react-router-dom';
import '../assets/styles/Auth.css';

export default function AuthLayout({ title, description, children }) {
  return (
    <div className="bz-shell bz-page auth-layout">
      <figure className="auth-plate">
        <img src="/products/minimalist-elegance-in-cream-and-navy.jpg" alt="Cream and navy pieces from the Bazaar catalog" />
        <figcaption><span className="bz-caps">From the collection</span><Link className="bz-link" to="/products">Browse the catalog</Link></figcaption>
      </figure>
      <section className="auth-panel" aria-labelledby="auth-title">
        <header className="bz-lead"><p className="bz-caps">Customer account</p><h1 id="auth-title">{title}</h1><p>{description}</p></header>
        {children}
      </section>
    </div>
  );
}
