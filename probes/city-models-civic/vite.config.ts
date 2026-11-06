import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({root:fileURLToPath(new URL('.',import.meta.url)),publicDir:fileURLToPath(new URL('../../public',import.meta.url)),server:{host:'127.0.0.1',port:4187,strictPort:true},build:{outDir:'/tmp/codeyears-civic-build',emptyOutDir:false}});
