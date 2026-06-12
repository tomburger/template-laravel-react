import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    laravel({
      input: 'frontend/main.tsx',
      refresh: true,
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': './frontend',
    },
  },
  server: {
    port: 8011,
    strictPort: true,
    hmr: {
      host: 'localhost',
      port: 8011,
      protocol: 'ws',
    },
  },
  build: {
    outDir: 'public/build',
    manifest: 'manifest.json',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'bootstrap'],
  },
})

