import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  publicDir: fileURLToPath(new URL('../../public', import.meta.url)),
  cacheDir: join(tmpdir(), 'codeyears-residential-vite'),
  server: { host: '127.0.0.1', port: 4187, strictPort: true },
});
