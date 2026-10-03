import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import './User.css';
import UserIcon from '../../../assets/img/User.png';
import { isLoggedIn, clearSession, subscribeAuth } from '../../../utils/session';
import { post } from '../../../api';
import { useToast } from '../../../components/Toast/Toast.jsx';

const User = () => {
    const history = useHistory();
    const toast = useToast();
    const [loggedIn, setLoggedInState] = useState(isLoggedIn);

    useEffect(() => {
        // the auth event only ever fires here (same tab) - see utils/session
        const unsubscribe = subscribeAuth(() => setLoggedInState(isLoggedIn()));
        return unsubscribe;
    }, []);

    const handleLoginClick = () => {
        if (loggedIn) {
            // instant UI reset, then revoke the refresh cookie server-side
            clearSession();
            post('/auth/logout').catch(() => {}); // fire & forget: cookie may already be gone
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
