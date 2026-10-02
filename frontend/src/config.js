const config = {
  appName: 'Bazaar',

  // API - dev server talks to the local backend; in a production build the
  // backend serves this bundle itself, so same-origin '/api' is the default.
  // (The old default pointed every deployed visitor at *their* localhost:5000.)
  // Set VITE_API_URL when the API lives somewhere else.
  apiBaseUrl: (import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:5000')).replace(/\/+$/, ''),
  apiPrefix: '/api',
  apiTimeout: 10000,

  // formatting
  locale: import.meta.env.VITE_LOCALE || 'en-US',
  currency: import.meta.env.VITE_CURRENCY || 'USD',

  // localStorage keys (namespaced in persist.js)
  storageKeys: {
    cart: 'cart',
    wishlist: 'wishlist',
    auth: 'auth',
    token: 'token',
    ui: 'ui',
  },

  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};

export const apiUrl = `${config.apiBaseUrl}${config.apiPrefix}`;

export default config;
