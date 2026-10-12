import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// En tests (jsdom) el módulo virtual del service worker no existe:
// se resuelve a un stub que no registra nada. En dev/build real
// (VITEST no definido) vite-plugin-pwa resuelve el módulo virtual.
const pwaRegisterStub = fileURLToPath(
  new URL('./src/test/pwa-register-react-stub.js', import.meta.url),
);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Aviso en la UI ante nueva versión (sin recarga automática:
      // no interrumpe formularios).
      registerType: 'prompt',
      includeAssets: ['icons/icon-48.png'],
      manifest: {
        name: 'Buñuelos Yanelys',
        short_name: 'Buñuelos Yanelys',
        description:
          'Prototipo de gestión local. Demo sin autenticación real.',
        lang: 'es',
        // Relativos: funcionan en cualquier origen (localhost o URL
        // del tunnel, que cambia en cada sesión).
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
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Shell de la app (solo activos estáticos same-origin del
        // build: HTML/JS/CSS/iconos) para la vista offline. Nunca
        // se precachean rutas de /api, credenciales ni datos.
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/],
        // /api: NetworkOnly en TODAS las rutas: la API nunca se
        // cachea (ni POST de login ni datos del tablero).
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
    // La API del backend (Spring Boot) corre en 127.0.0.1:8080.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
  preview: {
    // Sirve la build de producción (dist/) SOLO en loopback.
    // El tunnel (cloudflared) reenvía con Host: localhost (ver
    // scripts/3-start-tunnel), que Vite permite por defecto:
    // NO se usa allowedHosts: true ni comodines.
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
    // Preview es solo para esta demo temporal; no es hosting de producción.
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
