/**
 * Central place for the client-side login flag.
 *
 * The old code wrote `sessionStorage.isLoggedIn` and synthesised a fake
 * `storage` event from the same tab (real storage events only fire in OTHER
 * tabs), which was fragile and spread across every consumer. One module now
 * owns the key, the event and the reads.
 */
const KEY = 'isLoggedIn';
const EVENT = 'bazaar:auth';

export function isLoggedIn() {
  try {
    return sessionStorage.getItem(KEY) === 'true';
  } catch {
    return false;
  }
}

export function setLoggedIn(value) {
  try {
    sessionStorage.setItem(KEY, String(Boolean(value)));
  } catch {
    // Private mode / storage disabled - state just will not persist
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Returns an unsubscribe function. */
export function subscribeAuth(callback) {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}
