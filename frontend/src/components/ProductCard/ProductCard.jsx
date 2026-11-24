import { useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { additems } from '../../store/slices/ForShirt.jsx';
import { post } from '../../api';
import { isLoggedIn } from '../../utils/session';
import { formatMoney } from '../../utils/money';
import { useToast } from '../Toast/Toast.jsx';
import LazyImage from '../LazyImage/LazyImage.jsx';

import './ProductCard.css';

/**
 * Catalog card (Haute Modernist): 3/4 media with SAVE% badge + wishlist
 * heart, brand caps row with rating, editorial title, focal price with
 * strikethrough MRP, stock line, and a Quick Add bar. Add-to-cart keeps
 * the exact slim shape the cart slice has always stored.
 */
const Card = ({ product }) => {
  const {
    _id: id,
    slug,
    name = 'No Data...',
    brand = 'Bazaar',
    price = 0,
    mrp,
    thumbnail,
    discountPercent = 0,
    rating,
    inStock = true,
  } = product || {};

  const dispatch = useDispatch();
  const toast = useToast();
  const history = useHistory();
  const [saved, setSaved] = useState(false);

  // Boolean selector: this card re-renders only when *its* membership flips.
  const alreadyInCart = useSelector(state =>
    state.Shirt.products.some(item => item.id === id)
  );

  const avgRating = rating && typeof rating.avg === 'number' ? rating.avg : 0;
  const ratingCount = rating && typeof rating.count === 'number' ? rating.count : 0;

  const handleAddToCart = () => {
    dispatch(additems({ id, Bname: brand, name, price, image: thumbnail, qty: 1 }));
    toast.success(alreadyInCart ? 'Quantity updated in cart' : 'Added to cart');
  };

  const handleSave = async () => {
    if (!isLoggedIn()) {
      toast.info('Sign in to save items');
      history.push('/login');
      return;
    }
    try {
      await post('/wishlist', { productId: id });
      setSaved(true);
      toast.success('Saved to wishlist');
    } catch (err) {
      toast.error(err.message || 'Could not save to wishlist');
    }
  };

  const shortName = (str, max) => (str && str.length > max ? `${str.slice(0, max)}...` : str);

  return (
    <article className={`bz-card${inStock ? '' : ' bz-card--oos'}`}>
      <div className="bz-card__main">
        <div className="bz-card__media">
          <Link to={`/products/${slug}`} aria-label={name}>
            <LazyImage
              src={thumbnail}
              alt={name}
              className="bz-card__img"
              wrapperClassName="lazy-image--3x4"
              width="1100"
              height="1466"
            />
          </Link>
          {discountPercent > 0 && (
            <span className="bz-card__save bz-caps">Save {discountPercent}%</span>
          )}
          <button
            type="button"
            className={`bz-card__wish${saved ? ' is-saved' : ''}`}
            onClick={handleSave}
            aria-label={saved ? 'Saved to wishlist' : 'Save to Wishlist'}
            aria-pressed={saved}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              favorite
            </span>
          </button>
        </div>

        <div className="bz-card__body">
          <div className="bz-card__meta">
            <span className="bz-caps">{shortName(brand, 16)}</span>
            <span
              className="bz-card__rating"
              title={ratingCount ? `${avgRating.toFixed(1)} / 5 from ${ratingCount} review(s)` : 'No reviews yet'}
            >
              <span
                className="material-symbols-outlined is-star"
                aria-hidden="true"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
              {ratingCount ? `${avgRating.toFixed(1)} (${ratingCount})` : 'New'}
            </span>
          </div>

          <h3 className="bz-card__title">
            <Link to={`/products/${slug}`}>{shortName(name, 64)}</Link>
          </h3>

          <div className="bz-card__price">
            <span className="bz-card__now">{formatMoney(price)}</span>
            {mrp && mrp > price && <s>{formatMoney(mrp)}</s>}
          </div>

          <p className={`bz-card__stock bz-caps${inStock ? '' : ' is-out'}`}>
            {inStock ? 'In Stock — 2-Day Courier' : 'Out of Stock'}
          </p>
        </div>
      </div>

      <div className="bz-card__actions">
        <button
          type="button"
          className="bz-card__add"
          onClick={handleAddToCart}
          disabled={!inStock}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            add
          </span>
          {alreadyInCart ? 'In Cart — Add Another' : 'Quick Add'}
        </button>
      </div>
    </article>
  );
};

Card.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    slug: PropTypes.string,
    name: PropTypes.string,
    brand: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    mrp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    thumbnail: PropTypes.string,
    discountPercent: PropTypes.number,
    rating: PropTypes.shape({
      avg: PropTypes.number,
      count: PropTypes.number,
    }),
    inStock: PropTypes.bool,
  }).isRequired,
};

export default Card;
