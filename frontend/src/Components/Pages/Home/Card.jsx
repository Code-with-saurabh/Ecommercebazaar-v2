import React, {useState } from 'react'; 
import PropTypes from 'prop-types';
import ProfilePic from '../../../assets/img/profile.jpg';
import Stars from '../../../assets/img/star.png';
import { useDispatch, useSelector } from 'react-redux';
import { additems } from '../../Redux/ForShirt.jsx';
import { addCart } from '../../Redux/ForCart.jsx';

import './Card.css';

const Card = ({ id = 0, 
				BrandName = "Guest", 
				ProductName = "No Data...", 
				Price = "0", 
				Imgs = ProfilePic }) => {
	
  const [count_NUm, setCount1] = useState(1);
  
  const products = useSelector(state => state.Shirt.products);
  // const products1 = useSelector(state => state.Shirt.duplicate);
  
  const dispatch = useDispatch();  
	
  const addCartFunc = () => {
    dispatch(additems({ 
	id,
	Bname:BrandName ,
	name: ProductName,
	price: Price, 
	image: Imgs })
	);
	 
	 
      dispatch(addCart());
    
    setCount1(count_NUm+ 1);
	console.log(products);
	
  };

   
  function short_name(str, maxlength) {
    if (str.length > maxlength) {
      return str.substring(0, maxlength) + "...";
    }
    return str;
  }
	
 
  return (
    <div className="card">
      <div className="Pro">
        <img src={Imgs} alt="Product" className="PDF"/>
        <div className="desc">
          <span>{short_name(BrandName, 8)}</span>
				<h5>{short_name(ProductName,70)}</h5>
          
          <div className="start">
            <img src={Stars} alt="star"/>
            <img src={Stars} alt="star"/>
            <img src={Stars} alt="star"/>
            <img src={Stars} alt="star"/>
            <img src={Stars} alt="star"/>
          </div>
          <h4>{Price}$</h4>
        </div>
        <button onClick={addCartFunc}>Add to Cart</button>
      </div>
    </div>
  );
};

Card.propTypes = {
  id: PropTypes.number,
  BrandName: PropTypes.string,
  ProductName: PropTypes.string,
  Price: PropTypes.string,
  Imgs: PropTypes.string,
};

export default Card;
