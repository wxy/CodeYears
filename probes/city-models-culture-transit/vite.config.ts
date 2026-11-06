import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
export default defineConfig(({command})=>{
 const {values}=parseArgs({options:{outDir:{type:'string'}},strict:false,allowPositionals:true});
 if(command==='build'&&!values.outDir)throw new Error('请用 --outDir 指定系统临时目录');
 return {root:fileURLToPath(new URL('.',import.meta.url)),publicDir:fileURLToPath(new URL('../../public',import.meta.url)),server:{host:'127.0.0.1',port:4187,strictPort:true,fs:{allow:[fileURLToPath(new URL('../..',import.meta.url))]}},build:{outDir:typeof values.outDir==='string'?values.outDir:undefined,emptyOutDir:false,copyPublicDir:false}};
});
