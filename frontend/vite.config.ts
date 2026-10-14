import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Laravel runs locally with `php artisan serve` (http://127.0.0.1:8000).
// The dev server forwards API, CSRF and uploaded-photo requests to it, so the
// browser sees one origin (http://localhost:5173) and the session cookie just works.
const LARAVEL = 'http://127.0.0.1:8000'; // IPv4: `php artisan serve` listens on 127.0.0.1

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': { target: LARAVEL },
      '/sanctum': { target: LARAVEL },
      '/storage': { target: LARAVEL },
    },
  },
});
