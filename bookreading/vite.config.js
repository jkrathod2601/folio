import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    // The API is proxied rather than called cross-origin so that the auth
    // cookies are same-origin. That is what lets them stay SameSite=Lax over
    // plain http in dev, exactly as they will be behind one domain in
    // production. Calling :4000 directly would force SameSite=None; Secure,
    // which browsers reject over http.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
})
