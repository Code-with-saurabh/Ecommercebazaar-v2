import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import './User.css';
import { isLoggedIn, clearSession, subscribeAuth } from '../../../utils/session';
import { post } from '../../../api';
import { useToast } from '../../../components/Toast/Toast.jsx';

/**
 * Account control: person icon → /login when signed out, /account when
 * signed in; a compact "Sign out" text button appears next to it for
 * signed-in sessions (logout stays one click, as before the redesign).
 */
const User = () => {
  const history = useHistory();
  const toast = useToast();
  const [loggedIn, setLoggedInState] = useState(isLoggedIn);

  useEffect(() => subscribeAuth(() => setLoggedInState(isLoggedIn())), []);

  const go = () => history.push(loggedIn ? '/account' : '/login');

  const signOut = () => {
    clearSession();
    post('/auth/logout').catch(() => {}); // fire & forget: cookie may be gone
    toast.info('Logged out');
  };

  return (
    <div className="bz-user">
      <button
        type="button"
        className="bz-icon-btn"
        onClick={go}
        aria-label={loggedIn ? 'Account' : 'Sign in'}
        title={loggedIn ? 'Account' : 'Sign in'}
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          person
        </span>
      </button>
      {loggedIn && (
        <button type="button" className="bz-user__out" onClick={signOut}>
          Sign out
        </button>
      )}
    </div>
  );
};

export default User;
