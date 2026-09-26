import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import './User.css';
import UserIcon from '../../../assets/img/User.png';
import { isLoggedIn, setLoggedIn, subscribeAuth } from '../../../utils/session';

const User = () => {
    const history = useHistory();
    const [loggedIn, setLoggedInState] = useState(isLoggedIn);

    useEffect(() => {
        // Fires for same-tab changes and (via the storage event) other tabs
        const unsubscribe = subscribeAuth(() => setLoggedInState(isLoggedIn()));
        return unsubscribe;
    }, []);

    const handleLoginClick = () => {
        if (loggedIn) {
            setLoggedIn(false);
            setLoggedInState(false);
        }
        history.push('/login');
    };

    return (
        <div className="user">
            <button type="button" onClick={handleLoginClick}>
                <img src={UserIcon} alt="" aria-hidden="true" width="20" height="20" className="user-icon" />
                {loggedIn ? 'Logout' : 'Login'}
            </button>
        </div>
    );
};

export default User;
