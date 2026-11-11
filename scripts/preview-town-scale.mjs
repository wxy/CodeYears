import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { parseArgs, promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { runInNewContext } from 'node:vm';

const {values}=parseArgs({options:{outDir:{type:'string'},metrics:{type:'string'}}});
if(!values.outDir)throw new Error('请指定正式设计图的 --outDir。');
const root=fileURLToPath(new URL('..',import.meta.url));
const design=resolve(root,'docs/design/ancient-town-concepts/2026-11-11');
const readJSON=async path=>JSON.parse(await readFile(path,'utf8'));
const [classic,magicLife,mage,newHalls,newStable,cottages,forms,magic,life,correction,oldCatalog]=await Promise.all([
  ...['scale-classic-v1','scale-magic-life-v1','scale-mage-workshop-v1','scale-guild-academy-v1','scale-stable-v2'].map(n=>readJSON(join(design,n+'.json'))),
  readJSON(resolve(design,'../2026-11-10/fantasy-sprites-v1.json')),
  readJSON(resolve(design,'../2026-11-10/fantasy-building-forms-v1.json')),
  readJSON(join(design,'magic-town-v2.json')),readJSON(join(design,'town-life-v1.json')),
  readJSON(join(design,'classic-projection-v2.json')),readJSON(resolve(root,'src/renderers/town-baked-catalog.json')),
]);
correction.cottages.forEach((entry,i)=>Object.assign(cottages.frames[i],entry));
correction.forms.forEach((entry,i)=>Object.assign(forms.frames[i],entry));
const context={window:{}};runInNewContext(await readFile(resolve(root,'probes/fantasy-city/project-sprites.js'),'utf8'),context);
const sources=new Map(),frames=[];
const lineHeight=(line,cal)=>Math.abs(cal.shear*(line.bottom[0]-line.top[0])+cal.vertical*(line.bottom[1]-line.top[1]));
const add=(id,label,frame,observation,reference,target,kind)=>{
  const source=resolve(design,observation.source),url='/source/'+sources.size+'.png';
  sources.set(url,source);
  const f={...frame},cal=context.window.prepareFantasyProjection(f);
  const height=reference.top?lineHeight(reference,cal):cal.vertical*reference.heightPx;
  // The measured doorway/adult sets the scale. Ground fit never caps it again.
  const scale=target/height,measured=!!(f.ground||f.ellipse);
  const nw=measured?cal.span[0]/cal.scale*scale:f.footprint[0];
  const nd=measured?cal.span[1]/cal.scale*scale:f.footprint[1];
  const center=[(nw-nd)/4,(nw+nd)/8];
  const screen=([x,y])=>[center[0]+(x-cal.anchor[0])*scale/2,
    center[1]+(cal.shear*(x-cal.anchor[0])+cal.vertical*(y-cal.anchor[1]))*scale/2];
  const floor=p=>{const [x,y]=screen(p);return [x+2*y,-x+2*y];};
  const corners=[[0,0],[f.sw,0],[f.sw,f.sh],[0,f.sh]].map(screen);
  const door=observation.door?.top?observation.door:undefined;
  const win=observation.window?.top?observation.window:undefined;
  let doorWidth;
  if(door?.width){const [a,b]=door.width.map(floor);doorWidth=Math.hypot(b[0]-a[0],b[1]-a[1]);}
  if(door?.leftAtY660){const [a,b]=[door.leftAtY660,door.rightAtY660].map(floor);doorWidth=Math.hypot(b[0]-a[0],b[1]-a[1]);}
  const workWindow=observation.workWindow?{
    clipPolygon:observation.workWindow.clipPolygon.map(screen),
    exclusions:observation.workWindow.clipExcludePolygons.map(p=>p.polygon.map(screen)),
  }:undefined;
  frames.push({id,label,source:url,crop:[f.sx??0,f.sy??0,f.sw,f.sh],
    projection:{anchor:cal.anchor,shear:cal.shear,vertical:cal.vertical,scale,center},
    left:Math.min(...corners.map(p=>p[0])),top:Math.min(...corners.map(p=>p[1])),
    width:Math.max(...corners.map(p=>p[0]))-Math.min(...corners.map(p=>p[0])),
    height:Math.max(...corners.map(p=>p[1]))-Math.min(...corners.map(p=>p[1])),
    nativeWidth:nw,nativeDepth:nd,
    doorPoint:door?floor(door.bottom):[nw/2,nd],
    crownPoint:kind==='adult'?screen(reference.top):undefined,workWindow,
    metrics:{referenceType:kind,referenceHeight:target,basis:reference.basis??reference.note,
      doorHeight:door?lineHeight(door,cal)*scale:undefined,doorWidth,
      windowHeight:win?lineHeight(win,cal)*scale:undefined,
      personHeight:kind==='adult'?.8:kind==='upper-body'?.8:undefined,
      personVisibility:kind==='upper-body'?'inferred from 0.55H visible upper body':undefined,
      scale,groundSpan:[nw,nd],postPlacementFactor:1}});
};
for(const obs of classic.cottages){
  const i=Number(obs.id.split('-')[1]),door=obs.door?.top?obs.door:{heightPx:88,basis:'inferred: shared cottage structural family; no visible door in this variant'};
  add(obs.id,i===1?'农舍':'小屋 '+i,cottages.frames[i],obs,door,1,'door');
}
for(const obs of classic.forms){
  const i=Number(obs.id.split('-')[1]);if(i===7)continue;
  add(obs.id,['长屋','工坊长屋','侧翼庄园','深长屋','深工坊'][i],forms.frames[i],obs,obs.door,1,'door');
}
for(const obs of newStable.frames){const [, ,sw,sh]=obs.crop;
  add(obs.id,'单体畜舍',{sw,sh,ground:obs.ground,axes:obs.axes,footprint:[1,1]},obs,obs.door,1,'door');}
for(const i of [0,2,3]){
  const obs=magicLife.magic.find(f=>f.id==='magic-'+i),person=obs.embeddedPeople[0];
  add(obs.id,['圆形观星台','','温室','炼金庄园'][i],magic.frames[i],obs,person.reference,
    i===2?.44:.8,i===2?'upper-body':'adult');
}
add('mage-0','圆形法师工坊',{sw:mage.sw,sh:mage.sh,ground:mage.ground,axes:mage.axes,footprint:[1,1]},mage,mage.door,1,'door');
for(const obs of newHalls.frames){const [, ,sw,sh]=obs.crop;
  add(obs.id,obs.id==='guild-0'?'行会庭院':'宽学院',{sw,sh,ground:obs.ground,axes:obs.axes,footprint:[1,1]},obs,obs.door,1,'door');}
for(const i of [0,1,2]){
  const obs=magicLife.life.find(f=>f.id==='life-'+i),ref=obs.people[0].headCrownToSole;
  add(obs.id,['学徒','居民','学者'][i],{...life.frames[i],anchor:ref.bottom,footprint:[i===1?.55:.25,.20]},obs,ref,.8,'adult');
}
const tree=magicLife.life.find(f=>f.id==='life-5');
add('life-5','花树',{...life.frames[5],anchor:tree.reference.bottom},tree,tree.reference,1.6,'tree');
for(const [i,target,label]of [[7,.22,'公共长椅'],[8,.44,'泉台']]){
  const obs=magicLife.life.find(f=>f.id==='life-'+i);
  add(obs.id,label,life.frames[i],obs,obs.references[0].line,target,'facility');
}
const paths=new Map([...sources,['/private-courtyards.js',resolve(root,'probes/fantasy-city/private-courtyards.js')],
  ['/preview.js',resolve(root,'probes/fantasy-city/scale-preview.js')]]);
const oldIds=['cottages-1','forms-7-x','life-1'];
for(const id of oldIds)paths.set('/old/'+id+'.png',resolve(root,'public/assets/town-runtime',oldCatalog[id].file));
const page=`<!doctype html><meta charset="utf-8"><script src="/private-courtyards.js"></script><script src="/preview.js"></script><script>
(async()=>{
 const frames=${JSON.stringify(frames)},oldCatalog=${JSON.stringify(Object.fromEntries(oldIds.map(id=>[id,oldCatalog[id]])))},sprites={},oldSprites={};
 const load=url=>new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=j;i.src=url});
 for(const f of frames){
  const im=await load(f.source),p=f.projection,ratio=752/Math.max(f.width,f.height),padding=4;
  const canvas=document.createElement('canvas');canvas.width=Math.ceil(f.width*ratio)+padding*2;canvas.height=Math.ceil(f.height*ratio)+padding*2;
  const c=canvas.getContext('2d');c.imageSmoothingQuality='high';c.translate(padding+(p.center[0]-f.left)*ratio,padding+(p.center[1]-f.top)*ratio);
  c.scale(p.scale*ratio/2,p.scale*ratio/2);c.transform(1,p.shear,0,p.vertical,0,0);c.translate(-p.anchor[0],-p.anchor[1]);c.drawImage(im,...f.crop,0,0,f.crop[2],f.crop[3]);c.resetTransform();
  const pixels=c.getImageData(0,0,canvas.width,canvas.height);for(let i=3;i<pixels.data.length;i+=4){const a=pixels.data[i];if(a<=8)pixels.data[i]=0;else if(a<32)pixels.data[i]=Math.round(a*(a-8)/24);}c.putImageData(pixels,0,0);
  sprites[f.id]={...f,canvas,left:f.left-padding/ratio,top:f.top-padding/ratio,width:canvas.width/ratio,height:canvas.height/ratio};
 }
 for(const [id,m]of Object.entries(oldCatalog)){const im=await load('/old/'+id+'.png'),canvas=document.createElement('canvas');canvas.width=im.width;canvas.height=im.height;canvas.getContext('2d').drawImage(im,0,0);oldSprites[id]={...m,id,canvas};}
 const result=await renderTownScalePreview({sprites,oldSprites});
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
