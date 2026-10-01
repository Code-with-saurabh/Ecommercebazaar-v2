const rawUrl = import.meta.env.VITE_SITE_URL || 'https://your-domain.example';

export const SITE = {
  // ============================================================
  // ✏️ EDIT HERE — your real site identity (SEO brain of the app)
  // Set VITE_SITE_URL in frontend/.env, then fix the same
  // placeholder in: index.html, public/robots.txt, public/sitemap.xml
  // ============================================================
  name: 'Bazaar',
  tagline: 'Online Shopping for Shirts, T-Shirts, Pants & Shoes',
  url: rawUrl.replace(/\/+$/, ''),
  author: 'Saurabh',
  locale: 'en_US',
  currency: 'USD',
  image: '/logo512.png',
  twitter: '', // ✏️ EDIT: your @twitter_handle (optional)
  socials: [
    // ✏️ EDIT: real profile URLs — used by Organization JSON-LD
    'https://github.com/Code-with-saurabh',
  ],
};

export const absUrl = path => `${SITE.url}${!path || path === '/' ? '/' : path}`;

export const absAsset = value => {
  if (typeof value !== 'string' || !value) return undefined;
  if (/^https?:\/\//.test(value)) return value;
  return `${SITE.url}${value.startsWith('/') ? '' : '/'}${value}`;
};
