import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import './User.css';
import UserIcon from '../../../assets/img/User.png';
import { isLoggedIn, setLoggedIn, subscribeAuth } from '../../../utils/session';
import { useToast } from '../../../components/Toast/Toast.jsx';

const User = () => {
    const history = useHistory();
    const toast = useToast();
    const [loggedIn, setLoggedInState] = useState(isLoggedIn);

    useEffect(() => {
        // sessionStorage is per-tab, so the auth event only ever fires here
        const unsubscribe = subscribeAuth(() => setLoggedInState(isLoggedIn()));
        return unsubscribe;
    }, []);

    const handleLoginClick = () => {
        if (loggedIn) {
            // Logging out means "end the session", not "show the login form"
            setLoggedIn(false);
            setLoggedInState(false);
            toast.info('Logged out');
            return;
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
