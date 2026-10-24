import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// En tests (VITEST) el módulo virtual del service worker se sustituye por un stub.
const pwaRegisterStub = fileURLToPath(
  new URL('./src/test/pwa-register-react-stub.js', import.meta.url),
);

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'icons/icon-48.png',
        'icons/icon-32.png',
        'icons/apple-touch-icon.png',
        'icons/logo.svg',
      ],
      manifest: {
        name: 'Buñuelos Yanelys',
        short_name: 'Buñuelos Yanelys',
        description:
          'Gestión de pedidos y entregas de Buñuelos Yanelys.',
        lang: 'es',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#f4e3cb',
        theme_color: '#a5631a',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Solo el shell estático se precachea: nunca rutas de /api ni datos.
        importScripts: ['push-sw.js'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/],
        // /api siempre va a la red: nunca se cachea.
        runtimeCaching: [
          {
            urlPattern: /\/api\//,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
  preview: {
    // Sirve dist/ solo en loopback; no se usan allowedHosts: true ni comodines.
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
      'Cache-Control': 'no-store',
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  },
  resolve: {
    alias: process.env.VITEST
      ? { 'virtual:pwa-register/react': pwaRegisterStub }
      : {},
  },
});
