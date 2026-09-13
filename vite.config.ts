/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Lets imports read `@/components/...` instead of `../../../components/...`
    alias: { '@': path.resolve(__dirname, './src') }
  },
  server: {
    port: 5173,
    // Calls to /api are forwarded to the Node server, so no CORS in development.
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true }
    }
  },
  build: {
    rollupOptions: {
      output: {
        // Charts are the heaviest dependency and only some pages need them.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts']
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
});

