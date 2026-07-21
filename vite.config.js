// vite.config.js
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    open: false
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        smile: path.resolve(__dirname, 'src/features/smile/smile.html')
      }
    }
  },
  resolve: {
    alias: {
      '@widev': path.resolve(__dirname, './src/core/widev/widev.js'),
      '@wii': path.resolve(__dirname, './src/wii.js'),
      '@core': path.resolve(__dirname, './src/core'),
      '@features': path.resolve(__dirname, './src/features')
    }
  }
});