import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': '/src' },
  },
  server: {
    proxy: {
      // En desarrollo, las peticiones a /api se reenvían al backend (evita CORS).
      // Si ves ECONNRESET, comprueba que el backend esté en marcha: cd backend && npm run start:dev
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        timeout: 60000,
        proxyTimeout: 60000,
      },
    },
  },
})
