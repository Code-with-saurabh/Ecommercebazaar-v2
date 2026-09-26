import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Returns `value` after it has stopped changing for `delay` ms.
 * Used for search-as-you-type so we do not filter/render on every keystroke.
 */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/**
 * Stable, cancellable debounced callback.
 *   const [onType, cancel] = useDebouncedCallback(v => setQuery(v), 250);
 */
export function useDebouncedCallback(callback, delay = 300) {
  const timerRef = useRef(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const debounced = useCallback(
    (...args) => {
      cancel();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        callbackRef.current(...args);
      }, delay);
    },
    [cancel, delay]
  );

  useEffect(() => cancel, [cancel]);

  return [debounced, cancel];
}

export default useDebouncedValue;
