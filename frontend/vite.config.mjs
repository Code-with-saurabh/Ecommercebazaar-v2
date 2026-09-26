import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Project ke saare component files .jsx hain (JSX .js me nahi),
// isliye Vite ke default parser se hi sab chal jata hai.
export default defineConfig({
  plugins: [react()],
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
