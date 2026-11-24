import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

import Hero from './Hero.jsx';
import Card from '../../components/ProductCard/ProductCard.jsx';
import { ProductGridSkeleton } from '../../components/Skeleton/Skeleton';
import { useProducts } from '../../hooks/useProducts';
import { post } from '../../api';
import { useToast } from '../../components/Toast/Toast.jsx';

/** One API-backed row; loading/error stay local so the other row is untouched. */
function CardRow({ eyebrow, heading, params, align = 'left' }) {
  const { items, loading, error, refetch } = useProducts(params);

  return (
    <section className={`bz-section bz-section--${align}`}>
      <div className="bz-shell">
        <header className="bz-section__head">
          <div>
            <p className="bz-caps bz-section__eyebrow">{eyebrow}</p>
            <h2 className="bz-title bz-section__title">{heading}</h2>
          </div>
          <Link to="/products" className="bz-link">
            View all
            <span className="material-symbols-outlined" aria-hidden="true">
              arrow_forward
            </span>
          </Link>
        </header>

        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : error ? (
          <div className="bz-section__error">
            <p>Could not load products.</p>
            <button type="button" className="bz-btn bz-btn--outline" onClick={refetch}>
              Retry
            </button>
          </div>
        ) : (
          <div className="bz-grid">
            {(items || []).map(product => (
              <Card key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** Representative image per category comes from a limit:1 rating query. */
const CATEGORIES = [
  { key: 'shoes', label: 'Footwear', to: '/products/shoes', className: 'bz-cat--tall' },
  { key: 'tshirts', label: 'T-Shirts', to: '/products/tshirt', className: 'bz-cat--mid' },
  { key: 'shirts', label: 'Shirts', to: '/products?category=shirts', className: '' },
  { key: 'pants', label: 'Pants', to: '/products?category=pants', className: 'bz-cat--wide' },
];

function CategoryTile({ category }) {
  const { items, loading } = useProducts({ category: category.key, limit: 1, sort: 'rating' });
  const thumb = items && items[0] ? items[0].thumbnail : null;

  return (
    <Link to={category.to} className={`bz-cat ${category.className}`}>
      {thumb && !loading && (
        <img className="bz-cat__img" src={thumb} alt="" aria-hidden="true" loading="lazy" />
      )}
      <span className="bz-cat__scrim" aria-hidden="true" />
      <span className="bz-cat__label">
        <span className="bz-title">{category.label}</span>
        <span className="bz-caps bz-cat__cta">
          Shop
          <span className="material-symbols-outlined" aria-hidden="true">
            arrow_forward
          </span>
        </span>
      </span>
    </Link>
  );
}

/** Teal promo band - the real coupon claim, with the discount as display type. */
const PromoBand = () => (
  <section className="bz-promo">
    <div className="bz-shell bz-promo__inner">
      <div className="bz-promo__copy">
        <p className="bz-caps">Archive Sale</p>
        <h2 className="bz-title">
          Coupons worth up to <em>70% off</em>, checked before you pay.
        </h2>
        <p className="bz-promo__sub">
          Every coupon code is validated server-side at checkout - the discount you see
          is the discount you get.
        </p>
        <Link to="/products?sale=true" className="bz-btn bz-btn--ink">
          Shop the Archive Sale
        </Link>
      </div>
      <p className="bz-promo__numeral" aria-hidden="true">
        70<span>%</span>
      </p>
    </div>
  </section>
);

/** Newsletter - POST /api/newsletter, idempotent, calm success state. */
function Newsletter() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const toast = useToast();

  const handleSubmit = async event => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      await post('/newsletter', { email });
      setDone(true);
      toast.success("You're on the list");
    } catch (err) {
      toast.error(err.message || 'Could not subscribe');
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="bz-news">
      <div className="bz-shell bz-news__inner">
        <div>
          <p className="bz-caps bz-news__eyebrow">Stay in the loop</p>
          <h2 className="bz-title bz-news__title">Notes from the archive</h2>
          <p className="bz-news__sub">New arrivals and restocks, occasionally.</p>
        </div>
        {done ? (
          <p className="bz-news__done">
            <span className="material-symbols-outlined" aria-hidden="true">
              check_circle
            </span>
            You&rsquo;re subscribed - watch your inbox.
          </p>
        ) : (
          <form className="bz-news__form" onSubmit={handleSubmit}>
            <input
              type="email"
              required
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="you@example.com"
              aria-label="Email address"
            />
            <button type="submit" className="bz-btn bz-btn--primary" disabled={pending}>
              {pending ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function Home() {
  return (
    <>
      <Hero />
      <section className="bz-section bz-section--cats">
        <div className="bz-shell">
          <header className="bz-section__head">
            <div>
              <p className="bz-caps bz-section__eyebrow">Browse the edit</p>
              <h2 className="bz-title bz-section__title">Shop by category</h2>
            </div>
          </header>
          <div className="bz-cats">
            {CATEGORIES.map(category => (
              <CategoryTile key={category.key} category={category} />
            ))}
          </div>
        </div>
      </section>

      <CardRow
        eyebrow="Newest first"
        heading="Recommended"
        params={{ limit: 4, sort: 'newest' }}
      />
      <PromoBand />
      <CardRow
        eyebrow="Featured"
        heading="Features"
        params={{ featured: 'true', limit: 5 }}
        align="right"
      />
      <Newsletter />
    </>
  );
}

export default Home;
