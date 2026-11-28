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
function NewArrivals() {
  const params = { limit: 4, sort: 'newest' };
  const { items, loading, error, refetch } = useProducts(params);

  return (
    <section className="bz-section">
      <div className="bz-shell">
        <header className="bz-section__head">
          <div>
            <h2 className="bz-title bz-section__title">New arrivals</h2>
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
          items?.length ? <div className="bz-grid">
            {(items || []).map(product => (
              <Card key={product._id} product={product} />
            ))}
          </div> : <p>No new arrivals are listed right now.</p>
        )}
      </div>
    </section>
  );
}

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
          <h2 className="bz-title bz-news__title">Notes from Bazaar</h2>
          <p className="bz-news__sub">New arrivals and restocks, occasionally.</p>
        </div>
        {done ? (
          <p className="bz-news__done">
            <span className="material-symbols-outlined" aria-hidden="true">
              check_circle
            </span>
             You&rsquo;re subscribed.
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
      <NewArrivals />
      <Newsletter />
    </>
  );
}

export default Home;
