import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'dnp-rework/resources/js'),
      '@domain': path.resolve(__dirname, 'src/domain'),
    },
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 2000,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/jobs': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        bypass: (req) => {
          if (!req.headers['x-inertia'] && req.method === 'GET') {
            return '/index.html';
          }
        },
      },
      '/notifications': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/kanban': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        bypass: (req) => {
          if (!req.headers['x-inertia']) {
            return '/index.html';
          }
        },
      },
      '/stage-rail': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        bypass: (req) => {
          if (!req.headers['x-inertia']) {
            return '/index.html';
          }
        },
      },
    },
  },
})

