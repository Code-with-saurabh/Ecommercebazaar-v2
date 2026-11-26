import { useEffect, useId, useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { get } from '../../api';
import { recentlyViewedStore } from '../../utils/recentlyViewed';
import Card from '../ProductCard/ProductCard';
import { ProductCardSkeleton } from '../Skeleton/Skeleton';
import loadRecentProducts from './loadRecentProducts';
import './RecentlyViewed.css';

const DISPLAY_LIMIT = 4;

function RecentProducts({ idsKey }) {
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const current = result?.attempt === attempt ? result : null;

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    loadRecentProducts(idsKey.split(','), get, controller.signal).then(data => {
      if (active) setResult({ ...data, attempt });
    });
    return () => {
      active = false;
      controller.abort();
    };
  }, [idsKey, attempt]);

  if (!current) {
    return (
      <div role="status" aria-label="Loading recently viewed products">
        <div className="recently-viewed__grid">
          {idsKey.split(',').map(id => <ProductCardSkeleton key={id} />)}
        </div>
        <span className="sr-only">Loading recently viewed products…</span>
      </div>
    );
  }

  return (
    <>
      {current.products.length > 0 && (
        <div className="recently-viewed__grid">
          {current.products.map(product => <Card key={product._id} product={product} />)}
        </div>
      )}
      {current.failedCount > 0 ? (
        <div className="recently-viewed__notice" role="status">
          <p>Some recently viewed products could not be loaded. Please try again.</p>
          <button
            type="button"
            className="bz-btn bz-btn--outline"
            onClick={() => setAttempt(value => value + 1)}
          >
            Retry recently viewed
          </button>
        </div>
      ) : current.products.length === 0 ? (
        <p className="recently-viewed__notice" role="status">
          These products are no longer available. <Link to="/products">Explore the catalog</Link>.
        </p>
      ) : null}
    </>
  );
}

/** Mount only after a product resolves, so loading/error pages never become history. */
export default function RecentlyViewed({ currentProductId }) {
  const history = useSyncExternalStore(
    recentlyViewedStore.subscribe,
    recentlyViewedStore.getSnapshot,
    recentlyViewedStore.getServerSnapshot
  );
  const headingId = useId();
  const [clearMessage, setClearMessage] = useState('');
  const idsKey = history.filter(id => id !== currentProductId).slice(0, DISPLAY_LIMIT).join(',');

  useEffect(() => {
    recentlyViewedStore.record(currentProductId);
  }, [currentProductId]);

  function handleClear() {
    const persisted = recentlyViewedStore.clear();
    setClearMessage(persisted
      ? 'Your recently viewed history has been cleared.'
      : 'History hidden for this tab. Your browser blocked clearing saved history.');
  }

  if (!idsKey && !clearMessage) return null;

  return (
    <section className="bz-shell recently-viewed" aria-labelledby={headingId}>
      <div className="recently-viewed__heading">
        <div>
          <p className="bz-caps recently-viewed__eyebrow">Pick up where you left off</p>
          <h2 id={headingId} className="bz-title">Recently viewed</h2>
          <p className="recently-viewed__description">Recently opened on this browser.</p>
        </div>
        {history.length > 0 && (
          <button type="button" className="recently-viewed__clear" onClick={handleClear}>
            Clear history
          </button>
        )}
      </div>
      {idsKey
        ? <RecentProducts key={idsKey} idsKey={idsKey} />
        : <p className="recently-viewed__notice" role="status">{clearMessage}</p>}
    </section>
  );
}
