import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          game: ['./components/GameDescription.jsx'],
          movie: ['./components/MovieDescription.jsx'],
          tv: ['./components/TVDescription.jsx']
        }
      }
    }
  }
})
