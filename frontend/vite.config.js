import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  // ─── Sprint 5: LAN Access Configuration ───────────────
  // server.host = '0.0.0.0' tells Vite to listen on ALL network interfaces,
  // not just localhost. This is what allows other devices on the same
  // Wi-Fi/Ethernet network to access the frontend.
  //
  // Without this: only http://localhost:5173 works
  // With this:    http://192.168.x.x:5173 also works from any LAN device
  //
  // The Vite terminal will show both URLs when it starts:
  //   ➜  Local:   http://localhost:5173/
  //   ➜  Network: http://192.168.1.42:5173/
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
