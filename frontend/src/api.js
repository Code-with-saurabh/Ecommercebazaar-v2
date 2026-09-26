import axios from 'axios';
import config, { apiUrl } from './config';
import ApiError from './utils/ApiError';

export const TOKEN_KEY = config.storageKeys.token;

/**
 * Shared axios instance.
 *
 * Response interceptor unwraps the API envelope:
 *   { success, message, data, meta }  ->  returns the whole envelope
 *   errors                            ->  rejected ApiError (message/status/details)
 *
 *   import api, { get, post } from './api';
 *   const { data } = await get('/products');        // data = envelope.data
 */
const api = axios.create({
  baseURL: apiUrl,
  timeout: config.apiTimeout,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(request => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) request.headers.Authorization = `Bearer ${token}`;
  return request;
});

api.interceptors.response.use(
  response => response.data,
  error => Promise.reject(normalizeError(error))
);

function normalizeError(error) {
  if (error.response) {
    const { status, data } = error.response;

    // Token expired / invalid -> drop it so the header UI resets
    if (status === 401) localStorage.removeItem(TOKEN_KEY);

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
