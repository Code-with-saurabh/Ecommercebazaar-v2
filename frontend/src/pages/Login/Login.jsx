import React, { useState } from 'react';
import './Login.css';
import BGV2 from '../../assets/video/background2.mp4';
import { useHistory, Link } from 'react-router-dom';
import { post } from '../../api';
import { setLoggedIn } from '../../utils/session';
import LazyVideo from '../../components/LazyVideo/LazyVideo';

function Login() {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [errorMessage, setErrorMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const history = useHistory();

    function handleInputChange(e) {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value,
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (submitting) return; // guard against double submit

        setErrorMessage('');
        setSubmitting(true);
        try {
            const data = await post('/users/login', {
                username: formData.username.trim(),
                password: formData.password,
            });
            setLoggedIn(true);
            history.push('/');
            return data;
        } catch (error) {
            // ApiError: message comes from the API envelope
            setErrorMessage(error.message || 'Login failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="form-container">
            <LazyVideo src={BGV2} className="background-video" />
            <div className="form-content">
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="input-wrapper">
                        <input
                            type="text"
                            id="username"
                            className="floating-input"
                            placeholder=" "
                            value={formData.username}
                            onChange={handleInputChange}
                            autoComplete="username"
                            maxLength={25}
                            required
                        />
                        <label htmlFor="username">Username</label>
                    </div>

                    <div className="input-wrapper">
                        <input
                            type="password"
                            id="password"
                            className="floating-input"
                            placeholder=" "
                            value={formData.password}
                            onChange={handleInputChange}
                            autoComplete="current-password"
                            maxLength={72}
                            required
                        />
                        <label htmlFor="password">Password</label>
                    </div>

                    <button type="submit" className="submit-btn" disabled={submitting}>
                        {submitting ? 'Logging in…' : 'Login'}
                    </button>

                    <div className="account-prompt">
                        <p>Don't have an account? <Link to="/signup">Sign Up</Link>.</p>
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

export default Login;
