import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  publicDir: fileURLToPath(new URL('../../../public', import.meta.url)),
  server: { host: '0.0.0.0', port: 4184, strictPort: true },
  cacheDir: '/tmp/codeyears-life-vite-cache',
  build: { outDir: '/tmp/codeyears-life-preview', emptyOutDir: true },
});
