import { useCallback, useEffect, useRef } from 'react';

/**
 * requestAnimationFrame-throttled callback: runs at most once per frame and
 * always with the latest arguments. Ideal for scroll/resize handlers (INP).
 */
export function useRafThrottle(callback) {
  const callbackRef = useRef(callback);
  const frameRef = useRef(0);
  const argsRef = useRef([]);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(
    () => () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    },
    []
  );

  return useCallback((...args) => {
    argsRef.current = args;
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      callbackRef.current(...argsRef.current);
    });
  }, []);
}

/**
 * Time-based throttle (leading + trailing edge). Use where rAF cadence is
 * not enough, e.g. expensive work on resize.
 */
export function useThrottle(callback, delay = 200) {
  const callbackRef = useRef(callback);
  const lastRunRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  return useCallback(
    (...args) => {
      const now = Date.now();
      const remaining = delay - (now - lastRunRef.current);
      if (remaining <= 0) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        lastRunRef.current = now;
        callbackRef.current(...args);
      } else if (!timerRef.current) {
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          lastRunRef.current = Date.now();
          callbackRef.current(...args);
        }, remaining);
      }
    },
    [delay]
  );
}

export default useRafThrottle;
