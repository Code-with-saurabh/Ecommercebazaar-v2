import { Link } from 'react-router-dom';  
import CartIMG from '../../../assets/img/Cart.png';
import './Cart.css';  

import { useSelector } from 'react-redux';  
const Cart = () => {
    const itemValue = useSelector(state => state.CartValue.value);  
    const cartEmpty = itemValue === 0;  

    return (
        <Link to="/cart" className="cart-link"> {/* Wrap cart content with Link */}
            <div className="cart">
                <div className="cart-image-container">
                    <img src={CartIMG} alt="Cart" className="cart-image" width="40" height="40" />
                    {!cartEmpty && <span className="badge">{itemValue}</span>}
                    {cartEmpty && <span className="empty-badge">0</span>}
                </div>
                <div className="cart-info">
                    <p className="cart-text">Your Cart</p>
                </div>
            </div>
        </Link>
    );
}

export default Cart;
