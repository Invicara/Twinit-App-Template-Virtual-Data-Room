import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      events: 'events',
      stream: 'stream-browserify',
      buffer: 'buffer/'
    }
  },
  define: {
    global: 'globalThis'
  },
  server: {
    port: 8088,
    open: true,
    strictPort: true,
  },
})
