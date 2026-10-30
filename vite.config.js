import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/* === CONFIGURAÇÃO DO BUILD === */
// Evita a remoção de backdrop-filter durante a minificação do CSS.
export default defineConfig({
  plugins: [react()],
  build: {
    cssMinify: false,
  },
});