import PropTypes from 'prop-types';
import ProfilePic from '../../assets/img/profile.jpg';
import Stars from '../../assets/img/star.png';
import { useDispatch, useSelector } from 'react-redux';
import { additems } from '../../store/slices/ForShirt.jsx';
import { useToast } from '../Toast/Toast.jsx';
import LazyImage from '../LazyImage/LazyImage.jsx';

import './ProductCard.css';

const Card = ({
  id = 0,
  BrandName = 'Guest',
  ProductName = 'No Data...',
  Price = '0',
  Imgs = ProfilePic,
}) => {
  const dispatch = useDispatch();
  const toast = useToast();

  // Boolean selector: this card re-renders only when *its* membership flips,
  // not on every cart change (the old selector re-rendered every card).
  const alreadyInCart = useSelector(state =>
    state.Shirt.products.some(product => product.id === id)
  );

  const handleAddToCart = () => {
    if (alreadyInCart) {
      toast.info('This item is already in your cart');
      return;
    }
    dispatch(additems({ id, Bname: BrandName, name: ProductName, price: Price, image: Imgs }));
    toast.success('Added to cart');
  };

  function short_name(str, maxlength) {
    if (str.length > maxlength) {
      return str.substring(0, maxlength) + '...';
    }
    return str;
  }

  return (
    <div className="card">
      <div className="Pro">
        <LazyImage
          src={Imgs}
          alt={ProductName}
          className="PDF"
          wrapperClassName="lazy-image--square"
          width="1100"
          height="1100"
        />
        <div className="desc">
          <span>{short_name(BrandName, 8)}</span>
          <h5>{short_name(ProductName, 70)}</h5>

          <div className="start">
            <img src={Stars} alt="" aria-hidden="true" width="20" height="20" loading="lazy" />
            <img src={Stars} alt="" aria-hidden="true" width="20" height="20" loading="lazy" />
            <img src={Stars} alt="" aria-hidden="true" width="20" height="20" loading="lazy" />
            <img src={Stars} alt="" aria-hidden="true" width="20" height="20" loading="lazy" />
            <img src={Stars} alt="" aria-hidden="true" width="20" height="20" loading="lazy" />
          </div>
          <h4>{Price}$</h4>
        </div>
        <button type="button" onClick={handleAddToCart}>
          {alreadyInCart ? 'In Cart' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

Card.propTypes = {
  id: PropTypes.number,
  BrandName: PropTypes.string,
  ProductName: PropTypes.string,
  Price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  Imgs: PropTypes.string,
};

export default Card;
