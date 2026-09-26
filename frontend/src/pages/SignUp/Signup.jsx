import React, { useState } from 'react';
import './Signup.css';
import BGV2 from '../../assets/video/background2.mp4';
import { useHistory, Link } from 'react-router-dom';
import { AddToDB } from '../../store/slices/AllFormData.jsx';
import { useDispatch } from 'react-redux';
import { post } from '../../api';
import LazyVideo from '../../components/LazyVideo/LazyVideo';

function Signup() {
  const dispatch = useDispatch();
  const history = useHistory();

  const [fromData, setfromData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handalAlldata(e) {
    const { id, value } = e.target;
    setfromData(prev => ({
      ...prev,
      [id]: value,
    }));
  }

  async function Submit(e) {
    e.preventDefault();
    if (submitting) return;
    setErrorMessage('');

    // Basic client-side guard (the API validates again server-side)
    if (fromData.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await post('/users/register', {
        username: fromData.username.trim(),
        email: fromData.email.trim(),
        phone: fromData.phone.trim(),
        password: fromData.password,
      });

      // Keep the session-local duplicate check working
      dispatch(AddToDB(fromData));

      setfromData({ username: '', email: '', phone: '', password: '' });
      // Navigate only AFTER the API confirmed success (the old code redirected
      // immediately, so failures landed on /login anyway)
      history.push('/login');
      return created;
    } catch (error) {
      const details = error.details;
      const fieldErrors = Array.isArray(details)
        ? details.map(item => item.message).join(', ')
        : '';
      setErrorMessage(fieldErrors || error.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="form-container">
      <LazyVideo src={BGV2} className="background-video" />
      <div className="form-content">
        <form className="login-form" onSubmit={Submit}>
          <div className="input-wrapper">
            <input
              type="text"
              id="username"
              className="floating-input"
              placeholder=" "
              maxLength={25}
              value={fromData.username}
              onChange={handalAlldata}
              autoComplete="username"
              required
            />
            <label htmlFor="username">Username</label>
          </div>

          <div className="input-wrapper">
            <input
              type="email"
              id="email"
              className="floating-input"
              placeholder=" "
              value={fromData.email}
              onChange={handalAlldata}
              autoComplete="email"
              required
              title="Enter a valid email address"
            />
            <label htmlFor="email">Email</label>
          </div>

          <div className="input-wrapper">
            <input
              type="tel"
              id="phone"
              className="floating-input"
              placeholder=" "
              maxLength={10}
              value={fromData.phone}
              onChange={handalAlldata}
              autoComplete="tel"
              required
              pattern="[789][0-9]{9}"
              title="Phone number must start with 7, 8, or 9 and be 10 digits long"
            />
            <label htmlFor="phone">Phone No.</label>
          </div>

          <div className="input-wrapper">
            <input
              type="password"
              id="password"
              className="floating-input"
              placeholder=" "
              minLength={8}
              maxLength={64}
              value={fromData.password}
              onChange={handalAlldata}
              autoComplete="new-password"
              required
              title="At least 8 characters"
            />
            <label htmlFor="password">Password (min 8 chars)</label>
          </div>

          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Submit'}
          </button>
          <div className="account-prompt">
            <p>Already have an account? <Link to="/login">Login</Link>.</p>
          </div>
        </form>

        {errorMessage && (
          <div className="error-message" role="alert">
            <p>{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Signup;
