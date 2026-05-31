import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: [
      'disciplined-gratitude-production-0812.up.railway.app',
      'localhost'
    ]
  }
})