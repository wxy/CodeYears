import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
export default defineConfig({root:fileURLToPath(new URL('.',import.meta.url)),publicDir:fileURLToPath(new URL('../../../public',import.meta.url)),cacheDir:tmpdir()+'/codeyears-art-vite',server:{host:'0.0.0.0',port:4192,strictPort:true},build:{outDir:tmpdir()+'/codeyears-art-build',emptyOutDir:false}});
