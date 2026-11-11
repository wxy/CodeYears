import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { parseArgs, promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { prepareTownScale } from './town-scale.mjs';

const {values}=parseArgs({options:{outDir:{type:'string'},metrics:{type:'string'}}});
if(!values.outDir)throw new Error('请指定正式设计图的 --outDir。');
const root=fileURLToPath(new URL('..',import.meta.url));
const {frames,sources}=await prepareTownScale({root});
const oldCatalog=JSON.parse(await readFile(resolve(root,'src/renderers/town-baked-catalog.json'),'utf8'));
const paths=new Map([...sources,['/private-courtyards.js',resolve(root,'probes/fantasy-city/private-courtyards.js')],
  ['/preview.js',resolve(root,'probes/fantasy-city/scale-preview.js')],
  ['/scale-sprites.js',resolve(root,'probes/fantasy-city/scale-sprites.js')],
  ['/work-window.js',resolve(root,'probes/fantasy-city/work-window.js')]]);
const oldIds=['cottages-1','forms-7-x','life-1'].filter(id=>oldCatalog[id]);
for(const id of oldIds)paths.set('/old/'+id+'.png',resolve(root,'public/assets/town-runtime',oldCatalog[id].file));
const page=`<!doctype html><meta charset="utf-8"><script src="/private-courtyards.js"></script><script src="/scale-sprites.js"></script><script src="/work-window.js"></script><script src="/preview.js"></script><script>
(async()=>{
 const oldIds=${JSON.stringify(oldIds)},frames=${JSON.stringify(frames)},oldCatalog=${JSON.stringify(Object.fromEntries(oldIds.map(id=>[id,oldCatalog[id]])))},sprites={},oldSprites={};
 const load=url=>new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=j;i.src=url});
 Object.assign(sprites,await prepareTownScaleImages({frames,load}));
 for(const [id,m]of Object.entries(oldCatalog)){const im=await load('/old/'+id+'.png'),canvas=document.createElement('canvas');canvas.width=im.width;canvas.height=im.height;canvas.getContext('2d').drawImage(im,0,0);oldSprites[id]={...m,id,canvas};}
 const result=await renderTownScalePreview({sprites,oldSprites:oldIds.length===3?oldSprites:undefined});
 const metrics={frames:frames.map(({id,label,metrics,nativeWidth,nativeDepth})=>({id,label,...metrics,nativeWidth,nativeDepth})),checks:result.checks};
 await fetch('/result',{method:'POST',body:JSON.stringify({gallery:result.gallery.toDataURL('image/png').split(',')[1],farm:result.farm.toDataURL('image/png').split(',')[1],metrics})});document.title='READY';
})().catch(async e=>{await fetch('/error',{method:'POST',body:String(e.stack||e)});document.title='ERROR'});
</script>`;
let result,error;
const server=createServer(async(req,res)=>{
  if(req.url==='/'){res.setHeader('Content-Type','text/html;charset=utf-8');res.end(page);return;}
  if(paths.has(req.url)){res.setHeader('Content-Type',req.url.endsWith('.png')?'image/png':'text/javascript');res.end(await readFile(paths.get(req.url)));return;}
  if(req.method==='POST'&&(req.url==='/result'||req.url==='/error')){const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=Buffer.concat(chunks).toString();if(req.url==='/result')result=JSON.parse(body);else error=body;res.end('ok');return;}
  res.writeHead(404).end();
});
const temporary=await mkdtemp(join(tmpdir(),'codeyears-scale-preview-'));
try{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  await promisify(execFile)('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',[
    '--headless=new','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-sync','--hide-scrollbars',
    '--user-data-dir='+join(temporary,'profile'),'--virtual-time-budget=12000','--dump-dom','http://127.0.0.1:'+server.address().port,
  ],{timeout:90000,maxBuffer:8*1024*1024});
  if(error)throw new Error(error);if(!result)throw new Error('浏览器未完成设计预览。');
  const out=resolve(values.outDir);await mkdir(out,{recursive:true});
  for(const [name,value]of [['unified-scale-gallery',result.gallery],['farm-scale-and-private-courts',result.farm]])await writeFile(join(out,name+'.png'),Buffer.from(value,'base64'));
  if(values.metrics)await writeFile(resolve(values.metrics),JSON.stringify(result.metrics,null,2)+'\n');
  console.log(JSON.stringify({out,frames:frames.length,checks:result.metrics.checks},null,2));
}finally{await new Promise(r=>server.close(r));await rm(temporary,{recursive:true,force:true});}
