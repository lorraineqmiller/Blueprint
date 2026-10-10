import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Reachable from another device on the same Wi-Fi (e.g. testing on a
    // phone at http://<your-mac's-LAN-IP>:5173) as well as localhost.
    host: true,
    // The preview tool assigns a free port via PORT; plain `npm run dev`
    // still uses Vite's default 5173.
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
  },
})
