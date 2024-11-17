import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'process';

// https://vite.dev/config/
export default defineConfig({
  define:{
    'process.env': process.env
  },
  plugins: [
    react()
  ],
})
