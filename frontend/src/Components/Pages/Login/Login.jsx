import React, { useState } from 'react';
import './Login.css';
import BGV2 from '../../../assets/video/background2.mp4';
import { useHistory ,Link} from 'react-router-dom';  // Use this for routing
import axios from 'axios';

function Login() {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    const [errorMessage, setErrorMessage] = useState('');  // To display errors like invalid credentials
    const history = useHistory();  // This will help to redirect

    // Handle changes in the input fields
    function handleInputChange(e) {
        const { id, value } = e.target;
        setFormData({
            ...formData,
            [id]: value,
        });
    }

    // Handle form submission
    function handleSubmit(e) {
        e.preventDefault();

        // Make an API request to check if the username and password match
        axios.post('http://localhost:5000/api/users/login', formData)
            .then((response) => {
                // If login is successful, redirect to the home page
                console.log('Login successful:', response.data);
				// sessionStorage.setItem('user', JSON.stringify(response.data.user));
				  sessionStorage.setItem('isLoggedIn', 'true');
				  
			const loginEvent = new Event('storage');
            window.dispatchEvent(loginEvent);
				  
				  
                history.push('/');   
            })
            .catch((error) => {
                 
                console.error('Login error:', error);
                setErrorMessage('Invalid username or password. Please try again.');
            });
    }

    return (
        <div className="form-container">
            <video autoPlay muted loop className="background-video">
                <source src={BGV2} type="video/mp4" />
            </video>
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
                            required
                        />
                        <label htmlFor="password">Password</label>
                    </div>

                    <button type="submit" className="submit-btn">Login</button>
					
					<div className="account-prompt">
                    <p>Don't have an account? <Link to="/signup">Sign Up</Link>.</p>
                </div>
                </form>

                
                {errorMessage && (
                    <div className="error-message">
                        <p>{errorMessage}</p>
                    </div>
                )}

               
            </div>
        </div>
    );
}

export default Login;
