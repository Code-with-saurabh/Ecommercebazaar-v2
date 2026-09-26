import React from "react";
import { useLocation } from "react-router-dom";
import "./ErrorPage.css"; // Import the custom CSS file

const ErrorPage = () => {
  const location = useLocation();
  const message = new URLSearchParams(location.search).get("message") || "An unexpected error occurred.";

  return (
    <div className="error-container">
      <div className="error-content">
        <h2 className="error-heading">Something went wrong</h2>
        <p className="error-message">
          <strong>Error:</strong> {message}
        </p>
        <div className="button-container">
          <a href="/login" className="go-back-button">
            Go Back to Login
          </a>
        </div>
        <div className="support-text">
          <p>If you continue to experience issues, please contact support.</p>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
