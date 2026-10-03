import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import ProfilePic from '../../assets/img/profile.jpg';
import Stars from '../../assets/img/star.png';
import { useDispatch, useSelector } from 'react-redux';
import { additems } from '../../store/slices/ForShirt.jsx';
import { useToast } from '../Toast/Toast.jsx';
import LazyImage from '../LazyImage/LazyImage.jsx';

import './ProductCard.css';

/**
 * One catalog card. Takes an API product straight from `useProducts`:
 *
 *   { _id, slug, name, brand, price, mrp, thumbnail, discountPercent, rating, inStock }
 *
 * The image and the title link to the detail page; Add to Cart writes the
 * same slim shape the cart slice has always stored (id/brand/name/price/img).
 */
const Card = ({ product }) => {
  const {
    _id: id,
    slug,
    name = 'No Data...',
    brand = 'Bazaar',
    price = 0,
    mrp,
    thumbnail = ProfilePic,
    discountPercent = 0,
    rating,
    inStock = true,
  } = product || {};

  const dispatch = useDispatch();
  const toast = useToast();

  // Boolean selector: this card re-renders only when *its* membership flips,
  // not on every cart change (the old selector re-rendered every card).
  const alreadyInCart = useSelector(state =>
    state.Shirt.products.some(item => item.id === id)
  );

  const avgRating = rating && typeof rating.avg === 'number' ? rating.avg : 0;
  const ratingCount = rating && typeof rating.count === 'number' ? rating.count : 0;

  const handleAddToCart = () => {
    // slice bumps qty when the line exists - "In Cart" = +1 more
    dispatch(additems({ id, Bname: brand, name, price, image: thumbnail, qty: 1 }));
    toast.success(alreadyInCart ? 'Quantity updated in cart' : 'Added to cart');
  };

  function short_name(str, maxlength) {
    if (str.length > maxlength) {
      return str.substring(0, maxlength) + '...';
    }
    return str;
  }

  return (
    <div className={`card${inStock ? '' : ' card--oos'}`}>
      <div className="Pro">
        <Link to={`/products/${slug}`} className="card-media" aria-label={name}>
          <LazyImage
            src={thumbnail}
            alt={name}
            className="PDF"
            wrapperClassName="lazy-image--square"
            width="1100"
            height="1100"
          />
        </Link>
        <div className="desc">
          <span>{short_name(brand, 8)}</span>
          <h5>
            <Link to={`/products/${slug}`} className="card-title">
              {short_name(name, 70)}
            </Link>
          </h5>

          <div
            className="start"
            aria-label={`Rated ${avgRating.toFixed(1)} out of 5${ratingCount ? ` (${ratingCount} reviews)` : ''}`}
            title={ratingCount ? `${avgRating.toFixed(1)} / 5 from ${ratingCount} review(s)` : 'No reviews yet'}
          >
            {[0, 1, 2, 3, 4].map(index => (
              <img
                key={index}
                src={Stars}
                alt=""
                aria-hidden="true"
                width="20"
                height="20"
                loading="lazy"
                style={{ opacity: index < Math.round(avgRating) ? 1 : 0.25 }}
              />
            ))}
          </div>
          <h4>
            {Number(price).toFixed(2)}$
            {mrp && mrp > price ? <s className="card-mrp">{Number(mrp).toFixed(0)}$</s> : null}
            {discountPercent > 0 ? <em className="card-off">-{discountPercent}%</em> : null}
          </h4>
        </div>
        <button type="button" onClick={handleAddToCart} disabled={!inStock}>
          {!inStock ? 'Out of Stock' : alreadyInCart ? 'In Cart' : 'Add to Cart'}
        </button>
      </div>
    </div>
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
