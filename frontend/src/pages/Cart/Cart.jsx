import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { removeitems } from '../../store/slices/ForShirt.jsx';
import './Cart.css';
import backgroundVideo from '../../assets/video/background.mp4';
import LazyVideo from '../../components/LazyVideo/LazyVideo';

const MIN_QTY = 1;
const MAX_QTY = 99;

function Cart() {
  const products = useSelector(state => state.Shirt.products);
  const [quantities, setQuantities] = useState({});
  const dispatch = useDispatch();

  // quantity set na ho to 1 maano (warna NaN dikhta tha)
  const getQty = id => {
    const value = quantities[id];
    if (value === undefined || Number.isNaN(value)) return MIN_QTY;
    return Math.min(MAX_QTY, Math.max(MIN_QTY, value));
  };

  const totalItems = products.reduce((sum, product) => sum + getQty(product.id), 0);
  const totalPrice = products.reduce(
    (sum, product) => sum + getQty(product.id) * Number(product.price),
    0
  );

  function setQuantity(productId, quantity) {
    if (Number.isNaN(quantity)) return; // input cleared -> ignore, keep old
    setQuantities(prevQuantities => ({
      ...prevQuantities,
      [productId]: Math.min(MAX_QTY, Math.max(MIN_QTY, quantity)),
    }));
  }

  const incrementQuantity = productId => {
    // getQty guards against undefined/NaN (quantities[productId] + 1 was NaN
    // the first time +/- was pressed for a product added in another session)
    setQuantity(productId, getQty(productId) + 1);
  };

  const decrementQuantity = productId => {
    setQuantity(productId, getQty(productId) - 1);
  };

  function remove(id) {
    // ForCart derives its badge from this id list - no manual addCart/removeCart
    dispatch(removeitems(id));
  }

  if (products.length === 0) {
    return (
      <div className="empty-cart-message-CCc">
        {/* 1.3MB background video instead of the 22.5MB BGVideo, and it only
            loads when visible (LazyVideo) */}
        <LazyVideo src={backgroundVideo} className="background-video-CCc" />
        <div className="content-CCc">
          <h1>Your Cart is Empty</h1>
          <p>Looks like you haven't added any items to your cart yet.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {products.map(product => {
        const qty = getQty(product.id);
        const finalPrice = qty * Number(product.price);
        return (
          <div key={product.id} className="IMGS-CC">
            <img
              src={product.image}
              alt={product.name}
              width="1100"
              height="1100"
              loading="lazy"
              decoding="async"
            />
            <div className="desc-CC">
              <h4>{product.name}</h4>
              <h5>${finalPrice.toFixed(2)}</h5>
            </div>
            <div className="btn-CC">
              <button
                type="button"
                className="P-CC"
                aria-label={`Increase quantity of ${product.name}`}
                onClick={() => incrementQuantity(product.id)}
              >
                +
              </button>
              <input
                className="I-CC"
                type="number"
                min={MIN_QTY}
                max={MAX_QTY}
                value={qty}
                onChange={e => setQuantity(product.id, parseInt(e.target.value, 10))}
                aria-label={`Quantity of ${product.name}`}
              />
              <button
                type="button"
                className="M-CC"
                aria-label={`Decrease quantity of ${product.name}`}
                onClick={() => decrementQuantity(product.id)}
              >
                -
              </button>
            </div>
            <div className="remove">
              {/* Styled Link instead of <Link><button></button></Link>
                  (nested interactive elements are invalid HTML) */}
              <Link to="/ByNow" className="css-button-3d--blue">
                By Now
              </Link>
              <button
                type="button"
                onClick={() => remove(product.id)}
                className="css-button-3d--red"
              >
                Remove
              </button>
            </div>
          </div>
        );
      })}
      <div className="cart-summary-CC">
        <div className="cart-summary-row-CC">
          <span>Items: {totalItems}</span>
          <span className="cart-total-CC">Total: ${totalPrice.toFixed(2)}</span>
        </div>
      </div>
    </>
  );
}

export default Cart;
