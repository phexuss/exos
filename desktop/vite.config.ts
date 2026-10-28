import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `vite build --mode prototype` produces one self-contained HTML file with
// mock data (used for the design preview). Tauri uses the normal build.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'prototype' ? [viteSingleFile()] : [])],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  clearScreen: false,
  server: { port: 1420, strictPort: true },
  envPrefix: ['VITE_', 'TAURI_ENV_'],
  build: {
    target: 'es2021',
    outDir: mode === 'prototype' ? 'dist-prototype' : 'dist',
    assetsInlineLimit: mode === 'prototype' ? 100_000_000 : 4096,
  },
}));
