import React, { useState } from 'react';
import {Link} from 'react-router-dom';
import { useSelector ,useDispatch} from 'react-redux';
import  {removeitems} from '../../Redux/ForShirt.jsx';
import  {removeCart} from '../../Redux/ForCart.jsx';
import './Cart.css';
import BGVideo from '../../../assets/video/BGVideo.mp4';
function Cart() {
  const products = useSelector(state => state.Shirt.products);
 
  const [quantities, setQuantities] = useState({});
	
const dispatch = useDispatch();

  // quantity set na ho to 1 maano (warna NaN dikhta tha)
  const getQty = (id) => (quantities[id] === undefined || isNaN(quantities[id]) ? 1 : quantities[id]);

  const totalItems = products.reduce((sum, product) => sum + getQty(product.id), 0);
  const totalPrice = products.reduce((sum, product) => sum + getQty(product.id) * Number(product.price), 0);
  
  useState(() => {
    const initialQuantities = {};
    products.forEach(product => {
      initialQuantities[product.id] = 1;  
    });
    setQuantities(initialQuantities);
  }, [products]);

  function setQuantity(productId, quantity) {
    setQuantities(prevQuantities => ({
      ...prevQuantities,
      [productId]: quantity
    }));
  }
  
  function handalBy(){
	 console.log("BY NOw Clicked");
  }

  const incrementQuantity = (productId) => {
    setQuantity(productId, quantities[productId] + 1);
  };

  const decrementQuantity = (productId) => {
    setQuantity(productId, Math.max(0, quantities[productId] - 1));
  };


	function remove(id){
		console.log("removed");
		console.log(id);
		dispatch(removeitems(id));
		dispatch(removeCart());
	}
	

	 if (products.length === 0) {
        return (
          <div className="empty-cart-message-CCc">
    <video autoPlay muted loop className="background-video-CCc">
        <source src={BGVideo} type="video/mp4" />
        Your browser does not support the video tag.
    </video>
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
            <img src={product.image} alt={product.name} />
            <div className="desc-CC">
              <h4>{product.name}</h4>
              <h5>${finalPrice.toFixed(2)}</h5>  
            </div>
            <div className="btn-CC">
              <button className="P-CC" onClick={() => incrementQuantity(product.id)}>+</button>
              <input
                className="I-CC"
                type="number"
                value={qty}
                onChange={(e) => setQuantity(product.id, parseInt(e.target.value))}
                placeholder="Quantity"
              />
              <button className="M-CC" onClick={() => decrementQuantity(product.id)}>-</button>
			</div>
			  <div className="remove">
				<Link to="/ByNow"><button onClick={handalBy} className="css-button-3d--blue">
				 By Now</button></Link>	
				<button onClick={()=>remove(product.id)} className="css-button-3d--red">
				Remove</button>		
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
