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
          game: ['./src/components/GameDescription.jsx'],
          movie: ['./src/components/MovieDescription.jsx'],
          tv: ['./src/components/TVDescription.jsx']
        }
      }
    }
  }
})
