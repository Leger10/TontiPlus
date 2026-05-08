// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Supprimez ou commentez ce plugin
// import iframeRouteRestorationPlugin from './path-to-plugin'

export default defineConfig({
  plugins: [
    react(),
    // iframeRouteRestorationPlugin() // ❌ À supprimer pour Netlify
  ],
  server: {
    port: 3000,
    host: true
  }
})