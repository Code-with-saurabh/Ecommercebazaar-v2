import axios from 'axios';
import config, { apiUrl } from './config';
import ApiError from './utils/ApiError';
import { getToken, setSession, clearSession } from './utils/session';

export const TOKEN_KEY = config.storageKeys.token;

/**
 * Shared axios instance.
 *
 * Response interceptor unwraps the API envelope:
 *   { success, message, data, meta }  ->  returns the whole envelope
 *   errors                            ->  rejected ApiError (message/status/details)
 *
 * On a 401 it first tries the httpOnly refresh cookie once (POST /auth/refresh)
 * and replays the original request with the new access token - so a 15-minute
 * access token expiring mid-session is invisible to the user.
 *
 *   import api, { get, post } from './api';
 *   const { data } = await get('/products');        // data = envelope.data
 */
const api = axios.create({
  baseURL: apiUrl,
  timeout: config.apiTimeout,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // send the bazaar_rt refresh cookie
});

api.interceptors.request.use(request => {
  const token = getToken();
  if (token) request.headers.Authorization = `Bearer ${token}`;
  return request;
});

// One refresh at a time: several parallel 401s share a single refresh call.
let refreshPromise = null;

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${apiUrl}/auth/refresh`, null, {
        withCredentials: true,
        timeout: config.apiTimeout,
      })
      .then(res => {
        const data = res.data && res.data.data;
        if (data && data.accessToken) {
          setSession(data); // stores new token + refreshed profile
          return data.accessToken;
        }
        return null;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function shouldAttemptRefresh(error) {
  const config_ = error.config;
  if (!config_ || config_._retried) return false; // never loop
  if (!error.response || error.response.status !== 401) return false;
  if (!getToken()) return false; // nothing to restore - real 401
  // wrong password / bad session - not an expired-token situation
  if (/\/users\/login|\/auth\/refresh|\/auth\/logout/.test(config_.url || '')) return false;
  return true;
}

api.interceptors.response.use(
  response => response.data,
  async error => {
    if (shouldAttemptRefresh(error)) {
      error.config._retried = true;
      const freshToken = await refreshSession();
      if (freshToken) {
        error.config.headers = { ...error.config.headers, Authorization: `Bearer ${freshToken}` };
        return api(error.config); // replay with the new token (goes through this same interceptor)
      }
      // refresh cookie dead too -> the session is genuinely over
      clearSession();
    }

    return Promise.reject(normalizeError(error));
  }
);

function normalizeError(error) {
  if (error.response) {
    const { status, data } = error.response;

    // (401 no longer clears the session here: the interceptor above decides,
    //  so a wrong password on the login form cannot log you out of a tab)
    return new ApiError(
      (data && data.message) || `Request failed (${status})`,
      status,
      (data && data.details) || null
    );
  }

  if (error.code === 'ECONNABORTED') {
    return new ApiError('Request timed out. Please try again.', 0);
  }

  return new ApiError('Cannot reach the server. Is the API running?', 0);
}

// Convenience helpers: resolve with envelope.data, reject with ApiError
export async function get(url, options) {
  const envelope = await api.get(url, options);
  return envelope && envelope.data !== undefined ? envelope.data : envelope;
}

export async function post(url, body, options) {
  const envelope = await api.post(url, body, options);
  return envelope && envelope.data !== undefined ? envelope.data : envelope;
}

export async function put(url, body, options) {
  const envelope = await api.put(url, body, options);
  return envelope && envelope.data !== undefined ? envelope.data : envelope;
}

export async function patch(url, body, options) {
  const envelope = await api.patch(url, body, options);
  return envelope && envelope.data !== undefined ? envelope.data : envelope;
}

export async function del(url, options) {
  const envelope = await api.delete(url, options);
  return envelope && envelope.data !== undefined ? envelope.data : envelope;
}

/** Read the raw envelope (message + meta included) when you need it. */
export const raw = api;

export default api;
