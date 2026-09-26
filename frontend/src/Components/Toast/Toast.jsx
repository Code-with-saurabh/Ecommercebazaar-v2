import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import './Toast.css';

const ToastContext = createContext(null);

let toastId = 0;

/**
 * Usage:
 *   <ToastProvider> ...app... </ToastProvider>   (already wired in index.jsx)
 *
 *   const toast = useToast();
 *   toast.success('Added to cart');
 *   toast.error(err.message);          // ApiError works directly
 *   toast.info('Saved', { duration: 5000 });
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback(id => {
    setToasts(list => list.filter(item => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (message, type = 'info', { duration = 3500 } = {}) => {
      const id = ++toastId;
      setToasts(list => [...list, { id, message: String(message), type }]);
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration)
        );
      }
      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      show,
      dismiss,
      success: (message, options) => show(message, 'success', options),
      error: (message, options) => show(message, 'error', { duration: 6000, ...options }),
      info: (message, options) => show(message, 'info', options),
      warning: (message, options) => show(message, 'warning', options),
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container" role="region" aria-live="polite" aria-label="Notifications">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast--${toast.type}`} role="status">
            <span className="toast__message">{toast.message}</span>
            <button
              type="button"
              className="toast__close"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return context;
}

export default ToastProvider;
