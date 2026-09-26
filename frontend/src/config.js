const config = {
  appName: 'Bazaar',

  // API
  apiBaseUrl: (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, ''),
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
