import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Reachable from another device on the same Wi-Fi (e.g. testing on a
    // phone at http://<your-mac's-LAN-IP>:5173) as well as localhost.
    host: true,
  },
})
