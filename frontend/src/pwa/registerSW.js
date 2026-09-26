/**
 * Registers the production service worker (offline shell + asset caching).
 *
 * - Dev is skipped on purpose: a worker serving stale modules fights Vite HMR.
 * - Failures are non-fatal; the app works fully without the worker.
 */
export default function registerServiceWorker() {
  if (!import.meta.env.PROD) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(registration => {
        // Look for a new deploy once an hour (the SW skip-waits on install)
        setInterval(() => registration.update(), 60 * 60 * 1000);
      })
      .catch(err => console.warn('[sw] registration failed:', err));
  });
}
