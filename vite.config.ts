import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Liebe-in-Bildern---Kolender-s/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          lightbox: ['yet-another-react-lightbox'],
          zip: ['jszip', 'file-saver'],
        },
      },
    },
  },
})
