import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // tauri dev probes 127.0.0.1; Vite 8 otherwise binds IPv6 ::1 on Windows
  server: {
    host: '127.0.0.1',
    port: 1420,
    strictPort: false
  },
})
