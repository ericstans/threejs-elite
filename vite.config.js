import { defineConfig } from 'vite'

export default defineConfig({
  base: './', // Use relative paths for assets
  assetsInclude: ['**/*.mid'], // Include MIDI files as assets
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
