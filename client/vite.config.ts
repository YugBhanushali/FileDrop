import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    // resolved the global not found error
    alias: {
      "simple-peer": "simple-peer/simplepeer.min.js",
    },
  },
})
