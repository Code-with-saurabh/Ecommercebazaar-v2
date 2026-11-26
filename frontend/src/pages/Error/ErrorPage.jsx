import { Link, useLocation } from "react-router-dom";

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
    <div className="bz-shell bz-page">
      <header className="bz-lead">
        <p className="bz-caps">{isNotFound ? '404 / Bazaar directory' : 'Bazaar support'}</p>
        <h1>{isNotFound ? 'Page not found' : 'Something went wrong'}</h1>
        <p>{message}</p>
      </header>
      <Link to="/" className="bz-btn bz-btn--primary">Back to home</Link>{' '}
      <Link to="/help" className="bz-btn bz-btn--outline">Get help</Link>
    </div>
  );
};

export default ErrorPage;
