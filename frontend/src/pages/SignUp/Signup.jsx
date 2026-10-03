import { useState } from 'react';
import { useHistory, Link } from 'react-router-dom';
import BGV2 from '../../assets/video/background2.mp4';
import { post } from '../../api';
import { setSession } from '../../utils/session';
import { validateRegister, trimmedCredentials } from '../../utils/validation';
import { useToast } from '../../components/Toast/Toast.jsx';
import FormField from '../../components/FormField/FormField';
import LazyVideo from '../../components/LazyVideo/LazyVideo';
import '../../assets/styles/Auth.css';

function Signup() {
  const history = useHistory();
  const toast = useToast();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    // clear the field's error as soon as the user starts fixing it
    setFieldErrors(prev => (prev[id] ? { ...prev, [id]: '' } : prev));
    if (errorMessage) setErrorMessage('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return; // guard against double submit

    // trim first - the browser validates the raw value, zod validates the
    // trimmed one, so " ab " used to pass here and fail on the server
    const values = trimmedCredentials(formData);
    values.email = values.email.toLowerCase(); // zod lower-cases it anyway

    const errors = validateRegister(values);
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
      const created = await post('/users/register', values);
      setFormData({ username: '', email: '', phone: '', password: '' });

      // The API issues the token pair on register -> straight into the app,
      // no second trip through the login form
      if (created && created.accessToken) setSession(created);
      toast.success('Account created. Welcome to Bazaar!');
      // Navigate only AFTER the API confirmed success (the old code redirected
      // immediately, so failures landed on /login anyway)
      history.push('/');
    } catch (error) {
      const mapped = error.fieldErrors; // 400 -> { field: message }
      if (mapped) {
        setFieldErrors(mapped);
        setErrorMessage(Object.values(mapped).join(' '));
      } else if (error.status === 429) {
        setErrorMessage('Too many attempts. Please try again later.');
      } else {
        // 409 comes through as "Account already exists for: email" etc.
        setErrorMessage(error.message || 'Registration failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="form-container">
      <LazyVideo src={BGV2} className="background-video" />
      <div className="form-content">
        <form className="auth-form" onSubmit={handleSubmit}>
          <FormField
            id="username"
            label="Username"
            value={formData.username}
            onChange={handleChange}
            error={fieldErrors.username}
            autoComplete="username"
            minLength={3}
            maxLength={25}
            pattern="[a-zA-Z0-9_.\-]{3,25}"
            title="3-25 chars: letters, numbers, _ . - only"
            autoFocus
            required
          />

          <FormField
            id="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={fieldErrors.email}
            autoComplete="email"
            maxLength={254}
            title="Enter a valid email address"
            required
          />

          <FormField
            id="phone"
            label="Phone No."
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            error={fieldErrors.phone}
            autoComplete="tel"
            maxLength={16}
            pattern="\+?[0-9]{7,15}"
            title="7-15 digits, optional leading +"
            required
          />

          <FormField
            id="password"
            label="Password (min 8 chars)"
            type="password"
            reveal
            value={formData.password}
            onChange={handleChange}
            error={fieldErrors.password}
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            title="At least 8 characters"
            required
          />

          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Submit'}
          </button>

          <div className="account-prompt">
            <p>
              Already have an account? <Link to="/login">Login</Link>.
            </p>
          </div>
        </form>

        {errorMessage && (
          <div className="form-error" role="alert">
            <p>{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Signup;
