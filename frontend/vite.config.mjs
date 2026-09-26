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
});
