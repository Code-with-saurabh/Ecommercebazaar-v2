import { defineConfig, loadEnv } from 'vite';
import { URL } from 'node:url';
import react from '@vitejs/plugin-react';

let sitemapOrigin;

// Project ke saare component files .jsx hain (JSX .js me nahi),
// isliye Vite ke default parser se hi sab chal jata hai.
export default defineConfig({
  plugins: [react(), {
    name: 'bazaar-public-sitemap', apply: 'build',
    configResolved(config) {
      const site = loadEnv(config.mode, config.envDir, 'VITE_SITE_URL').VITE_SITE_URL;
      if (site) {
        const url = new URL(site);
        if (!['http:', 'https:'].includes(url.protocol) || url.hostname.endsWith('.example')) throw new Error('VITE_SITE_URL must be the storefront origin');
        sitemapOrigin = url.origin;
      }
    },
    generateBundle() {
      // Without a deployment domain there is no valid absolute sitemap URL.
      const origin = sitemapOrigin;
      if (!origin) return;
      const pages = ['/', '/products', '/products/tshirt', '/products/shoes', '/products?category=shirts', '/products?category=pants', '/about', '/help', '/contact'];
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(path => `<url><loc>${origin}${path}</loc></url>`).join('')}</urlset>` });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n` });
    },
  }],
  server: {
    port: 3000,
    open: false,
  },
  preview: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        // Split long-lived vendor code out of the app chunks: the vendor
        // bundle almost never changes, so returning users skip re-downloading
        // react/redux/axios (browser caching works harder).
        // Vite 8 (rolldown) requires the function form of manualChunks.
        manualChunks(id) {
          const parts = id.replace(/\\/g, '/').split('/node_modules/');
          if (parts.length < 2) return undefined; // app code -> default chunks
          const seg = parts[parts.length - 1].split('/');
          const pkg = seg[0].startsWith('@') ? `${seg[0]}/${seg[1]}` : seg[0];

          if (
            pkg === 'react' ||
            pkg === 'react-dom' ||
            pkg === 'react-is' ||
            pkg === 'scheduler' ||
            pkg.startsWith('react-router')
          ) {
            return 'vendor-react';
          }
          if (pkg.startsWith('@reduxjs/') || pkg === 'react-redux' || pkg === 'redux' || pkg === 'immer' || pkg === 'reselect') {
            return 'vendor-redux';
          }
          if (pkg === 'axios') return 'vendor-http';
          return undefined;
        },
      },
    },
  },
});
