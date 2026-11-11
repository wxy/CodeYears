import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, mkdtemp, rm, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify, parseArgs } from 'node:util';

const { values } = parseArgs({options:{outDir:{type:'string'},catalog:{type:'string'}}});
if(!values.outDir||!values.catalog)throw new Error('请指定 --outDir 和 --catalog。');
const root=fileURLToPath(new URL('..',import.meta.url)),out=resolve(values.outDir),catalogPath=resolve(values.catalog);
const ids=['natural-ground','town-stone','town-earth','town-paving'];
const source=resolve(root,'docs/design/ancient-town-concepts/2026-11-11/terrain/material-atlas-v1.png');
// 只裁出四个等大材料并镜像接续，生成固定512px缓存；不在运行时切源图。
const page=`<!doctype html><meta charset="utf-8"><script>
(async()=>{
 const image=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src='/atlas.png'});
 const results=[];
 for(let i=0;i<4;i++){
  const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.imageSmoothingQuality='high';
  const w=image.width/2,h=image.height/2;
  for(let x=0;x<2;x++)for(let y=0;y<2;y++){
   g.save();g.translate(x?512:0,y?512:0);g.scale(x?-1:1,y?-1:1);
   g.drawImage(image,(i%2)*w,Math.floor(i/2)*h,w,h,0,0,256,256);g.restore();
  }
  results.push(c.toDataURL('image/png').split(',')[1]);
 }
 await fetch('/result',{method:'POST',body:JSON.stringify(results)});document.title='READY';
})().catch(async e=>{await fetch('/error',{method:'POST',body:String(e.stack||e)});});
</script>`;
let result,error;
const server=createServer(async(req,res)=>{
 if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end(page);return}
 if(req.url==='/atlas.png'){res.setHeader('Content-Type','image/png');res.end(await readFile(source));return}
 if(req.method==='POST'&&(req.url==='/result'||req.url==='/error')){
  const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=Buffer.concat(chunks).toString();
  if(req.url==='/result')result=JSON.parse(body);else error=body;res.end('ok');return;
 }
 res.writeHead(404).end();
});
const temporary=await mkdtemp(join(tmpdir(),'codeyears-town-ground-'));
try{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const {stdout}=await promisify(execFile)('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',[
  '--headless=new','--no-first-run','--disable-background-networking','--disable-sync',
  '--user-data-dir='+join(temporary,'profile'),'--virtual-time-budget=8000','--dump-dom',
  'http://127.0.0.1:'+server.address().port,
 ],{timeout:60000,maxBuffer:1024*1024});
 if(error)throw new Error(error);if(!result)throw new Error('浏览器没有返回地面材料：'+stdout.slice(-1800));
 await mkdir(out,{recursive:true});const catalog=JSON.parse(await readFile(catalogPath,'utf8'));
 for(let i=0;i<ids.length;i++){
  const id=ids[i],width=i===0?16:i===2?3:2.4;
  await writeFile(join(out,id+'.png'),Buffer.from(result[i],'base64'));
  catalog[id]={file:id+'.png',left:0,top:0,width,height:width,nativeWidth:width,nativeDepth:width,baselineHeight:0,sampleId:id};
 }
 const city=JSON.parse(await readFile(resolve(root,'src/renderers/city-baked-catalog.json'),'utf8'));
 for(const id of ['outskirts-forest','outskirts-hills']){
  await copyFile(resolve(root,'public/assets/city-runtime',city[id].file),join(out,city[id].file));catalog[id]=city[id];
 }
 await writeFile(catalogPath,JSON.stringify(catalog,null,2)+'\n');
 console.log('已烘焙4张512px地面材料，复用2张已标定林丘PNG。');
}finally{await new Promise(resolve=>server.close(resolve));await rm(temporary,{recursive:true,force:true})}
