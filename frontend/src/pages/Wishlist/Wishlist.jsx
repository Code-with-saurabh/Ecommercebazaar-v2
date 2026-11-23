import { useCallback, useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { get, del } from '../../api';
import { isLoggedIn } from '../../utils/session';
import { additems } from '../../store/slices/ForShirt.jsx';
import { formatMoney } from '../../utils/money';
import { useToast } from '../../components/Toast/Toast.jsx';
import Spinner from '../../components/Spinner/Spinner';
import LazyImage from '../../components/LazyImage/LazyImage.jsx';
import './Wishlist.css';

/**
 * /wishlist - saved products ("save for later"), account-only.
 *
 * Cards reuse the same slim cart shape as ProductCard, so "Move to cart"
 * is one local dispatch: useCartSync pushes it to the server cart on the
 * next tick, exactly like clicking Add to Cart on a catalog card. Removing
 * from the wishlist is independent (DELETE /wishlist/:id) - moving an item
 * must not silently unsave it unless the user asked.
 */
function Wishlist() {
  const history = useHistory();
  const toast = useToast();
  const dispatch = useDispatch();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const allowed = isLoggedIn();
  useEffect(() => {
    if (!allowed) history.replace('/login', { from: '/wishlist' });
  }, [allowed, history]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await get('/wishlist');
      setItems((data && data.items) || []);
    } catch (err) {
      setError(err.message || 'Could not load your wishlist');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load() updates state only after await get(...)
    if (allowed) load();
  }, [allowed, load]);

  const moveToCart = product => {
    dispatch(
      additems({
        id: product._id,
        Bname: product.brand,
        name: product.name,
        price: product.price,
        image: product.thumbnail || (product.images && product.images[0] && product.images[0].url) || '',
        qty: 1,
      })
    );
    toast.success('Added to cart');
  };

  const remove = async product => {
    setBusyId(product._id);
    try {
      const data = await del(`/wishlist/${product._id}`);
      setItems((data && data.items) || []);
      toast.info('Removed from wishlist');
    } catch (err) {
      toast.error(err.message || 'Could not update wishlist');
    } finally {
      setBusyId(null);
    }
  };

  if (!allowed) return null;

  if (loading) {
    return (
      <div className="wishlist-page wishlist-loading" aria-busy="true">
        <Spinner label="Loading wishlist…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="wishlist-page">
        <p className="wishlist-error" role="alert">
          {error}
        </p>
        <button type="button" className="wl-btn" onClick={load}>
          Try again
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-empty">
          <h1>Your wishlist is empty</h1>
          <p>Tap the save button on any product to keep it here for later.</p>
          <Link to="/products" className="wl-btn wl-btn--primary">
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <header className="wishlist-head">
        <h1>My Wishlist</h1>
        <p>
          {items.length} saved item{items.length === 1 ? '' : 's'}
        </p>
      </header>

      <ul className="wishlist-grid">
        {items.map(product => {
          const image =
            product.thumbnail || (product.images && product.images[0] && product.images[0].url) || '';
          const oos = typeof product.inStock === 'boolean' ? !product.inStock : (product.stock ?? 1) <= 0;
          return (
            <li key={product._id} className="wl-card">
              <Link to={`/products/${product.slug || product._id}`} className="wl-media" aria-label={product.name}>
                <LazyImage
                  src={image}
                  alt={product.name || ''}
                  className="wl-img"
                  wrapperClassName="lazy-image--square"
                  width={600}
                  height={600}
                />
                {oos && <span className="wl-oos">Out of stock</span>}
              </Link>
              <div className="wl-body">
                <span className="wl-brand">{product.brand}</span>
                <h2>
                  <Link to={`/products/${product.slug || product._id}`} className="wl-title">
                    {product.name}
                  </Link>
                </h2>
                <p className="wl-price">
                  {formatMoney(product.price)}
                  {product.mrp && product.mrp > product.price ? (
                    <s>{formatMoney(product.mrp)}</s>
                  ) : null}
                </p>
              </div>
              <div className="wl-actions">
                <button
                  type="button"
                  className="wl-btn wl-btn--primary"
                  onClick={() => moveToCart(product)}
                  disabled={oos}
                >
                  {oos ? 'Out of stock' : 'Move to cart'}
                </button>
                <button
                  type="button"
                  className="wl-btn wl-btn--danger"
                  onClick={() => remove(product)}
                  disabled={busyId === product._id}
                >
                  {busyId === product._id ? 'Removing…' : 'Remove'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Wishlist;
