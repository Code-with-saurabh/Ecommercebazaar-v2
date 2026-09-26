import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, info: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (typeof fallback === 'function') {
        return fallback({ error, reset: this.handleReset });
      }
      if (fallback) return fallback;

      return (
        <div className="error-boundary" role="alert">
          <h1>Something went wrong</h1>
          <p>The app hit an unexpected error. You can try again or reload the page.</p>
          {error && error.message && <pre className="error-boundary__detail">{error.message}</pre>}
          <div className="error-boundary__actions">
            <button type="button" onClick={this.handleReset}>
              Try again
            </button>
            <button type="button" onClick={this.handleReload}>
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
