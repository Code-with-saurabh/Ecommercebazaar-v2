import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './Cart.css';

/** Bag icon in the header: line count + live cart total from redux. */
const Cart = () => {
  const { count, total } = useSelector(state =>
    state.Shirt.products.reduce(
      (acc, item) => ({
        count: acc.count + (item.qty || 1),
        total: acc.total + (item.qty || 1) * Number(item.price || 0),
      }),
      { count: 0, total: 0 }
    )
  );

  return (
    <Link to="/cart" className="bz-bag" aria-label={`Bag, ${count} items`}>
      <span className="material-symbols-outlined bz-bag__icon" aria-hidden="true">
        shopping_bag
      </span>
      <span className="bz-bag__meta">
        <span className="bz-caps bz-bag__label">Bag ({count})</span>
        <span className="bz-bag__total">${total.toFixed(2)}</span>
      </span>
    </Link>
  );
};

export default Cart;
