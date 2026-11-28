import { useState } from 'react';
import { useHistory, useLocation, Link } from 'react-router-dom';
import { post } from '../../api';
import { flushCart } from '../../store/cartSync';
import { setSession } from '../../utils/session';
import { validateLogin, trimmedCredentials } from '../../utils/validation';
import { useToast } from '../../components/Toast/Toast.jsx';
import FormField from '../../components/FormField/FormField';
import AuthLayout from '../../layout/AuthLayout';

/** "Too many attempts. Try again in 15 min." from the limiter envelope. */
function rateLimitMessage(error) {
  const seconds = Number(error.details && error.details.retryAfter);
  if (!Number.isFinite(seconds)) return 'Too many attempts. Please try again later.';
  const minutes = Math.ceil(seconds / 60);
  return minutes >= 1
    ? `Too many attempts. Try again in ${minutes} min.`
    : 'Too many attempts. Try again in a few seconds.';
}

function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const history = useHistory();
  const location = useLocation();
  const toast = useToast();

  function handleInputChange(e) {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    // clear the field's error as soon as the user starts fixing it
    setFieldErrors(prev => (prev[id] ? { ...prev, [id]: '' } : prev));
    if (errorMessage) setErrorMessage('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return; // guard against double submit

    const values = trimmedCredentials(formData);
    const errors = validateLogin(values);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setErrorMessage('');
      const first = document.getElementById(Object.keys(errors)[0]);
      if (first) first.focus();
      return;
    }

    setErrorMessage('');
    setFieldErrors({});
    setSubmitting(true);
    try {
      await flushCart(); // include the latest guest edit in the server's merge
      const session = await post('/users/login', values); // accessToken + profile
      setSession(session);
      toast.success(session && session.username ? `Welcome back, ${session.username}` : 'Welcome back');
      // admins land straight on their panel; everyone else goes where they came from
      if (session && session.role === 'admin') {
        history.push('/admin');
        return;
      }
      const from = location.state && location.state.from;
      history.push(typeof from === 'string' ? from : '/');
    } catch (error) {
      if (error.status === 429) {
        // rate limited: never shows the field detail, always the wait time
        setErrorMessage(rateLimitMessage(error));
        return;
      }

      const mapped = error.fieldErrors; // 400 -> { field: message }
      if (mapped) {
        setFieldErrors(mapped);
        setErrorMessage(Object.values(mapped).join(' '));
      } else {
        // 401 stays deliberately generic (no user enumeration), network -> own text
        setErrorMessage(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Sign in" description="Return to your saved pieces, addresses and order receipts.">
        <form className="auth-form" onSubmit={handleSubmit}>
          <FormField
            id="username"
            label="Username"
            value={formData.username}
            onChange={handleInputChange}
            error={fieldErrors.username}
            autoComplete="username"
            maxLength={25}
            autoFocus
            required
          />

          <FormField
            id="password"
            label="Password"
            type="password"
            reveal
            value={formData.password}
            onChange={handleInputChange}
            error={fieldErrors.password}
            autoComplete="current-password"
            maxLength={72}
            required
          />

          <button type="submit" className="bz-btn bz-btn--primary" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="account-prompt">
            <p>
              New to Bazaar? <Link className="bz-link" to={{ pathname: '/signup', state: location.state }}>Create an account</Link>.
            </p>
          </div>
        </form>

        {errorMessage && (
          <div className="form-error" role="alert">
            <p>{errorMessage}</p>
          </div>
        )}
    </AuthLayout>
  );
}

export default Login;
