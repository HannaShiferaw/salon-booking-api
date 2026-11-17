import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves the site under /salon-booking-api/.
// HashRouter is used for SPA routing, so no server-side rewrites are needed.
export default defineConfig({
  plugins: [react()],
  base: '/salon-booking-api/',
})
