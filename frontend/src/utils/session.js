import config from '../config';

/**
 * Client session: access token + profile.
 *
 *   accessToken -> localStorage['token']  (api.js attaches it as Bearer)
 *   user        -> localStorage['auth']   (id/username/email/role - no token)
 *   refresh     -> httpOnly cookie bazaar_rt (set by the API, JS can't see it)
 *
 * `isLoggedIn()` is derived from the token instead of a separate flag, so
 * the two can never disagree (the old code had a sessionStorage boolean that
 * survived token loss). Every mutation fires the `bazaar:auth` event so the
 * header re-renders without prop drilling.
 */
const TOKEN_KEY = config.storageKeys.token;
const USER_KEY = config.storageKeys.auth;
const EVENT = 'bazaar:auth';

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // private mode / storage disabled
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // state just will not persist
  }
}

function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function emit() {
  window.dispatchEvent(new Event(EVENT));
}

export function getToken() {
  return read(TOKEN_KEY);
}

export function getUser() {
  try {
    const raw = read(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return Boolean(getToken());
}

export function isAdmin() {
  const user = getUser();
  return Boolean(user && user.role === 'admin');
}

/** Store both halves of the session (login/register/refresh responses). */
export function setSession(payload) {
  if (!payload || !payload.accessToken) return;
  const { accessToken, ...user } = payload;
  write(TOKEN_KEY, accessToken);
  write(USER_KEY, JSON.stringify(user));
  emit();
}

/** Drop the client half of the session (the API call clears the cookie). */
export function clearSession() {
  remove(TOKEN_KEY);
  remove(USER_KEY);
  emit();
}

/** Legacy helper kept for existing call sites: false = log out. */
export function setLoggedIn(value) {
  if (!value) clearSession();
  else emit(); // true is implicit: the token is already stored by setSession
}

/** Returns an unsubscribe function. */
export function subscribeAuth(callback) {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}
