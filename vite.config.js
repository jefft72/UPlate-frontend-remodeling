import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/UPlate-frontend-remodeling/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html')
      }
    }
  }
})
