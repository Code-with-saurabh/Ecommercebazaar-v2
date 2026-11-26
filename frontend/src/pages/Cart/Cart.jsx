import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { cartLineKey, removeitems, updateQty } from '../../store/slices/ForShirt.jsx';
import { formatMoney } from '../../utils/money';
import LazyVideo from '../../components/LazyVideo/LazyVideo';
import backgroundVideo from '../../assets/video/background.mp4';
import './Cart.css';

const MIN_QTY = 1;
const MAX_QTY = 99;

// Same knobs the server prices with (backend/config/env.js: FREE_SHIPPING_OVER,
// SHIPPING_FLAT) - the summary preview mirrors them, the API still has the
// final word at checkout.
const FREE_SHIPPING_OVER = 100;
const SHIPPING_FLAT = 10;

function Cart() {
  const products = useSelector(state => state.Shirt.products);
  const dispatch = useDispatch();

  // quantity lives in the slice now (server sync + header badge read it)
  const getQty = product => {
    const value = Number(product.qty);
    if (!Number.isFinite(value)) return MIN_QTY;
    return Math.min(MAX_QTY, Math.max(MIN_QTY, value));
  };

  const totalItems = products.reduce((sum, product) => sum + getQty(product), 0);
  const totalPrice = products.reduce(
    (sum, product) => sum + getQty(product) * Number(product.price),
    0
  );

  const shipping = totalPrice > 0 && totalPrice < FREE_SHIPPING_OVER ? SHIPPING_FLAT : 0;
  const shipFree = totalPrice >= FREE_SHIPPING_OVER;
  const progress = Math.min(100, Math.round((totalPrice / FREE_SHIPPING_OVER) * 100));

  function setQuantity({ id, size, color }, quantity) {
    if (Number.isNaN(quantity)) return; // input cleared -> ignore, keep old
    dispatch(updateQty({ id, size, color, qty: quantity }));
  }

  const incrementQuantity = product => {
    setQuantity(product, getQty(product) + 1);
  };

  const decrementQuantity = product => {
    setQuantity(product, getQty(product) - 1);
  };

  function remove({ id, size, color }) {
    dispatch(removeitems({ id, size, color }));
  }

  if (products.length === 0) {
    return (
      <div className="bz-cart__empty">
        {/* 1.3MB background video instead of the 22.5MB BGVideo, and it only
            loads when visible (LazyVideo) */}
        <LazyVideo src={backgroundVideo} className="bz-cart__video" />
        <div className="bz-cart__empty-content">
          <p className="bz-caps">Shopping bag</p>
          <h1>Your Cart is Empty</h1>
          <p>Looks like you haven't added any items to your cart yet.</p>
          <div className="bz-cart__empty-actions">
            <Link to="/products" className="bz-btn bz-btn--primary">
              Browse the catalog
            </Link>
            <Link to="/" className="bz-btn bz-btn--outline">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bz-cart">
      <header className="bz-shell bz-cart__head">
        <p className="bz-caps bz-cart__eyebrow">Shopping bag</p>
        <div className="bz-cart__head-row">
          <div>
            <h1 className="bz-cart__title">Your Shopping Bag</h1>
            <p className="bz-cart__sub">
              {totalItems} item{totalItems === 1 ? '' : 's'} selected · totals are re-priced
              server-side before you pay
            </p>
          </div>
          <Link to="/products" className="bz-link">
            Continue shopping
            <span className="material-symbols-outlined" aria-hidden="true">
              arrow_forward
            </span>
          </Link>
        </div>
      </header>

      <div className="bz-shell">
        <div className="bz-cart__ship">
          <span className="material-symbols-outlined bz-cart__ship-icon" aria-hidden="true">
            local_shipping
          </span>
          <div className="bz-cart__ship-body">
            <strong>
              {shipFree
                ? 'Free shipping unlocked'
                : `${formatMoney(FREE_SHIPPING_OVER - totalPrice)} away from free shipping`}
            </strong>
            <p>Free shipping on orders over $100 · $10 flat rate below that.</p>
            <div
              className="bz-cart__bar"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label="Progress toward free shipping"
            >
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
          <span className="bz-cart__ship-pct">{progress}%</span>
        </div>

        <div className="bz-cart__layout">
          <section className="bz-cart__list" aria-label="Cart items">
            {products.map(product => {
              const qty = getQty(product);
              const finalPrice = qty * Number(product.price);
              return (
                <article key={cartLineKey(product)} className="bz-line">
                  <Link to={`/products/${product.id}`} className="bz-line__media" aria-label={product.name}>
                    <img
                      src={product.image}
                      alt={product.name}
                      width="220"
                      height="220"
                      loading="lazy"
                      decoding="async"
                    />
                  </Link>

                  <div className="bz-line__body">
                    <div className="bz-line__top">
                      <div className="bz-line__id">
                        {product.Bname && <span className="bz-caps">{product.Bname}</span>}
                        <h2 className="bz-line__name">
                          <Link to={`/products/${product.id}`}>{product.name}</Link>
                        </h2>
                        {(product.size || product.color) && <p>{[product.size && `Size ${product.size}`, product.color].filter(Boolean).join(' · ')}</p>}
                      </div>
                      <div className="bz-line__price">
                        <span className="bz-line__total">{formatMoney(finalPrice)}</span>
                        {qty > 1 && (
                          <span className="bz-line__each">{formatMoney(product.price)} each</span>
                        )}
                      </div>
                    </div>

                    <div className="bz-line__controls">
                      <div className="bz-cart__qty">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${product.name}`}
                          onClick={() => decrementQuantity(product)}
                          disabled={qty <= MIN_QTY}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={MIN_QTY}
                          max={MAX_QTY}
                          value={qty}
                          onChange={event => setQuantity(product, parseInt(event.target.value, 10))}
                          aria-label={`Quantity of ${product.name}`}
                        />
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${product.name}`}
                          onClick={() => incrementQuantity(product)}
                          disabled={qty >= MAX_QTY}
                        >
                          +
                        </button>
                      </div>

                      <div className="bz-line__actions">
                        {/* Styled link instead of <Link><button></button></Link>
                            (nested interactive elements are invalid HTML) */}
                        <Link to="/checkout" className="bz-line__checkout">
                          Go to checkout
                        </Link>
                        <button
                          type="button"
                          onClick={() => remove(product)}
                          className="bz-line__remove"
                        >
                          <span className="material-symbols-outlined" aria-hidden="true">
                            delete
                          </span>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="bz-cart__summary" aria-label="Order summary">
            <h2 className="bz-cart__summary-title">Order summary</h2>

            <dl className="bz-cart__rows">
              <div>
                <dt>Items</dt>
                <dd>{totalItems}</dd>
              </div>
              <div>
                <dt>Subtotal</dt>
                <dd>{formatMoney(totalPrice)}</dd>
              </div>
              <div>
                <dt>Shipping (est.)</dt>
                <dd className={shipping === 0 ? 'is-free' : ''}>
                  {shipping === 0 ? 'Free' : formatMoney(shipping)}
                </dd>
              </div>
            </dl>

            <div className="bz-cart__est">
              <div>
                <strong>Estimated total</strong>
                <span className="bz-caps">Tax & coupons at checkout</span>
              </div>
              <span className="bz-cart__est-value">{formatMoney(totalPrice + shipping)}</span>
            </div>

            <Link to="/checkout" className="bz-cart__cta">
              <span>Proceed to Checkout</span>
              <span className="material-symbols-outlined" aria-hidden="true">
                lock
              </span>
            </Link>

            <Link to="/products" className="bz-cart__continue">
              Continue shopping
            </Link>

            <ul className="bz-cart__notes">
              <li>
                <span className="material-symbols-outlined" aria-hidden="true">
                  local_shipping
                </span>
                Free shipping over $100 · $10 flat below
              </li>
              <li>
                <span className="material-symbols-outlined" aria-hidden="true">
                  payments
                </span>
                Cash on delivery available
              </li>
              <li>
                <span className="material-symbols-outlined" aria-hidden="true">
                  verified
                </span>
                Coupons validated server-side
              </li>
            </ul>

            <div className="bz-cart__concierge">
              <p className="bz-caps">Concierge</p>
              <a href="tel:9327115687">9327115687</a>
              <a href="mailto:saurabh12166@gmail.com">saurabh12166@gmail.com</a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Cart;
