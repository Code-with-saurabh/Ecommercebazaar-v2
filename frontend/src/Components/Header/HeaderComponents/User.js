import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import './User.css';
import UserIcon from '../../../assets/img/User.png';

const User = () => {
    const history = useHistory();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // Function to update state
        const updateLoginState = () => {
            const loggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
            setIsLoggedIn(loggedIn);
        };

        // Initial check
        updateLoginState();

        // Add event listener
        window.addEventListener('storage', updateLoginState);

        return () => {
            window.removeEventListener('storage', updateLoginState);
        };
    }, []);

    const handleLoginClick = () => {
        if (isLoggedIn) {
            sessionStorage.setItem('isLoggedIn', 'false');

            // Dispatch custom event
            const logoutEvent = new Event('storage');
            window.dispatchEvent(logoutEvent);

            setIsLoggedIn(false);
            history.push('/login');
        } else {
            history.push('/login');
        }
    };

    return (
        <div className="user">
            <button onClick={handleLoginClick}>
                <img src={UserIcon} alt="User" className="user-icon" />
                {isLoggedIn ? 'Logout' : 'Login'}
            </button>
        </div>
    );
};

export default User;
