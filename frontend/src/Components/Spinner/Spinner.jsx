import React from 'react';
import './Spinner.css';

/**
 * <Spinner />            default size
 * <Spinner size={48} />  custom px
 * <Spinner label="Loading cart..." />  accessible text
 */
function Spinner({ size = 32, label = 'Loading...', className = '' }) {
  return (
    <span
      className={`spinner ${className}`.trim()}
      style={{ width: `${size}px`, height: `${size}px` }}
      role="status"
      aria-live="polite"
      aria-label={label}
    />
  );
}

/** Centred spinner block for full-page / section loading states. */
export function SpinnerBlock({ label = 'Loading...', size = 40 }) {
  return (
    <div className="spinner-block">
      <Spinner size={size} label={label} />
      <p className="spinner-block__label">{label}</p>
    </div>
  );
}

export default Spinner;
