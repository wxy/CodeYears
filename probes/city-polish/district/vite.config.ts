import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
export default defineConfig({root:fileURLToPath(new URL('.',import.meta.url)),publicDir:fileURLToPath(new URL('../../../public',import.meta.url)),server:{host:'0.0.0.0',port:4186,strictPort:true},build:{outDir:'/tmp/codeyears-district-preview',emptyOutDir:false}});
