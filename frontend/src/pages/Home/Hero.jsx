import { Link } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import LazyImage from '../../components/LazyImage/LazyImage.jsx';
import './Hero.css';

/**
 * Editorial hero - the real homepage copy set in Playfair, above a
 * full-bleed filmstrip of the six most popular products (real catalog
 * photography, not stock), closed by a hairline strip of the four real
 * commercial claims.
 */
const CLAIMS = [
  'Complimentary delivery over $100',
  '$10 flat shipping below $100',
  'Cash on Delivery available',
  'Server-verified pricing at checkout',
];

const FilmstripTile = ({ product }) => (
  <Link to={`/products/${product.slug}`} className="bz-film__tile">
    <LazyImage
      src={product.thumbnail}
      alt={product.name}
      className="bz-film__img"
      wrapperClassName="lazy-image--3x4"
      width="600"
      height="800"
    />
    <span className="bz-film__caption">
      <span className="bz-caps">{product.brand}</span>
      <span className="bz-film__name">{product.name}</span>
    </span>
  </Link>
);

const Hero = () => {
  const { items, loading } = useProducts({ limit: 6, sort: 'popular' });

  return (
    <section className="bz-hero">
      <div className="bz-shell bz-hero__copy">
        <p className="bz-caps bz-hero__eyebrow">Bazaar — Est. Surat</p>
        <h1 className="bz-hero__title">
          Super value deals
          <br />
          <em>On all products</em>
        </h1>
        <div className="bz-hero__row">
          <p className="bz-hero__sub">Save more with coupons &amp; up to 70% off!</p>
          <div className="bz-hero__ctas">
            <Link to="/products" className="bz-btn bz-btn--primary">
              Shop Now
            </Link>
            <Link to="/products?sale=true" className="bz-btn bz-btn--outline">
              Archive Sale
            </Link>
          </div>
        </div>
      </div>

      <div className="bz-film" aria-label="Most popular right now" aria-busy={loading}>
        {loading
          ? Array.from({ length: 6 }, (_, i) => (
              <div key={`skeleton-${i}`} className="bz-film__tile bz-film__tile--loading" />
            ))
          : (items || []).map(product => <FilmstripTile key={product._id} product={product} />)}
      </div>

      <div className="bz-shell">
        <ul className="bz-hero__claims">
          {CLAIMS.map(claim => (
            <li key={claim} className="bz-caps">
              {claim}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Hero;
