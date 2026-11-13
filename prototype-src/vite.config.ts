import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the build works under /<repo>/prototype/ on GitHub Pages.
// fs.allow lets the dev server read ../shared (tokens) and ../handoff/data (copy, code).
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5173, fs: { allow: ['..'] } },
  build: { outDir: 'dist', assetsInlineLimit: 0 },
});
