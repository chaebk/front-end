import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'distDev',
    chunkSizeWarningLimit: 2500  // KB 단위
  },
})
