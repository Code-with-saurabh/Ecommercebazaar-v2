import { Link, useLocation } from "react-router-dom";
import "./ErrorPage.css"; // Import the custom CSS file

/**
 * Serves two routes:
 *  - /error?message=...  -> explicit error raised by the app
 *  - <Route component={ErrorPage} /> (catch-all) -> 404 for unknown URLs
 */
const ErrorPage = () => {
  const location = useLocation();
  const isNotFound = location.pathname !== "/error";
  const message =
    new URLSearchParams(location.search).get("message") ||
    (isNotFound
      ? "The page you are looking for does not exist or has been moved."
      : "An unexpected error occurred.");

  return (
    <div className="error-container">
      <div className="error-content">
        <h2 className="error-heading">
          {isNotFound ? "Page not found (404)" : "Something went wrong"}
        </h2>
        <p className="error-message">
          <strong>{isNotFound ? "404:" : "Error:"}</strong> {message}
        </p>
        <div className="button-container">
          {/* Link keeps the SPA alive - <a href> forced a full reload */}
          <Link to="/" className="go-back-button">
            Go Back Home
          </Link>
        </div>
        <div className="support-text">
          <p>If you continue to experience issues, please contact support.</p>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
