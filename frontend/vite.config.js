import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost/oilreport/backend',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/sors/api': {
        target: 'http://localhost/oilreport/backend',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sors\/api/, ''),
      },
    },
  },
})
