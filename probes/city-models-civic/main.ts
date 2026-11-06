import { isoYearStart } from '../../src/data/iso-week';
import type { DailyContribution } from '../../src/data/types';
import { createCityView, planCityScene } from '../../src/renderers/city-view';
import { loadCityImages, closeCityImages, type CityImages } from '../../src/renderers/city-assets';
import type { LandscapeView, LandscapeViewport } from '../../src/renderers/types';
import catalog from '../../docs/design/city-model-expansion/civic/catalog.json';
let images:CityImages={},view:LandscapeView|undefined,controller:AbortController|undefined;
let focusPoints:Record<string,[number,number]>={},worldCenter:[number,number]=[0,0],worldSpan:[number,number]=[1,1];
let camera={zoom:1,panX:0,panY:0},audit:Record<string,unknown>={},draws=0;
const element=(id:string)=>document.getElementById(id)!;
const viewport=():LandscapeViewport=>({width:element('stage').clientWidth,height:600,dpr:Math.min(devicePixelRatio,1.5),dark:false,...camera});
function draw(){if(!view)return;const vp=viewport();const fit=Math.min(Math.max(1,vp.width-32)/worldSpan[0],Math.max(1,vp.height-24)/worldSpan[1]),maximum=view.maxZoom!(vp);audit.sampling=catalog.map(c=>({id:c.id,fitCss:[c.width*fit,c.height*fit],near150Css:[c.width*fit*1.5,c.height*fit*1.5],currentCss:[c.width*fit*vp.zoom,c.height*fit*vp.zoom],maximumCss:[c.width*fit*maximum,c.height*fit*maximum],maximumDevice:[c.width*fit*maximum*vp.dpr,c.height*fit*maximum*vp.dpr],note:'由正式CityView相同边界与fitScale公式计算；上采样不增加源细节'}));view.draw(1,vp);draws++;audit={...audit,camera:{...camera},css:[vp.width,vp.height],dpr:vp.dpr,backing:[view.canvas.width,view.canvas.height],maxZoom:view.maxZoom!(vp),draws};element('audit').textContent=JSON.stringify(audit,null,2)}
function close(){controller?.abort();view?.dispose();view=undefined;closeCityImages(images);images={};element('status').textContent='已关闭释放'}
async function open(){
 close();const signal=(controller=new AbortController()).signal;camera={zoom:1,panX:0,panY:0};
 const n=Number((element('years') as HTMLSelectElement).value),first=2026-n,years=Array.from({length:n},(_,i)=>first+i);
 const days:DailyContribution[]=[];for(let t=isoYearStart(first),i=0;t<isoYearStart(2026);t+=86400000,i++)days.push({date:new Date(t).toISOString().slice(0,10),count:i%91<28?12:6+i*17%65});
 const scene=planCityScene(days,false,years);
 const mapping=()=>JSON.stringify(scene.items.filter(i=>i.parcel).map(i=>[i.x,i.z,i.w,i.d,i.parcel]));const before=mapping();
 const actual:Record<string,number>={};
 // 仅此预览替换兼容占地的外观；保留原 parcel 引用、位置、日期和数量，不推断贡献类型。
 for(const candidate of catalog){let count=0;for(const item of scene.items){if(count===3)break;if(item.parcel?.kind!=='building'||item.w!==candidate.nativeWidth||item.d!==candidate.nativeDepth||item.id.startsWith('civic-'))continue;item.id=candidate.id;item.factor=1;count++}actual[candidate.id]=count}
 const mapped=scene.items.flatMap(i=>i.parcel?.indices??[]),total=scene.items.reduce((s,i)=>s+(i.parcel?.count??0),0);
 const display=(element('display') as HTMLSelectElement).value;
 const fullItems=scene.items;
 scene.keys=[...new Set([...scene.items.map(i=>i.id),...scene.keys.filter(id=>['natural-ground','outskirts-forest','outskirts-hills'].includes(id))])];
 const mappingUnchanged=before===mapping();
 if(display==='isolated'){scene.items=fullItems.filter(i=>i.id.startsWith('civic-'));scene.keys=[...new Set([...scene.items.map(i=>i.id),'natural-ground','outskirts-forest','outskirts-hills'])]}
 audit={display,mappingAuditScope:'完整合成场景；隔离模式只隐藏其他模型，不作为完整数据展示',years,inputDays:days.length,total:days.reduce((s,d)=>s+d.count,0),mappedTotal:total,mapped:mapped.length,unique:new Set(mapped).size,conserved:mapped.length===days.length&&new Set(mapped).size===days.length&&total===days.reduce((s,d)=>s+d.count,0),mappingUnchanged,actual,rule:'ISO周年；每日i%91<28为12，否则6+i*17%65；最多每款3处；只替换同占地外观，不变更正式catalog或映射',sprites:catalog.map(c=>({id:c.id,pixels:c.pixels,rgbaBytes:c.pixels[0]*c.pixels[1]*4,world:[c.width,c.height],origin:c.origin}))};
 try{
 const regular=scene.keys.filter(id=>!catalog.some(c=>c.id===id));
 images=await loadCityImages(new URL('/assets/city-runtime/',location.href).href,regular,signal);
 for(const entry of catalog.filter(c=>scene.keys.includes(c.id))){const response=await fetch(entry.file,{signal});if(!response.ok)throw new Error(`候选读取失败 ${entry.file}`);const bitmap=await createImageBitmap(await response.blob());try{signal.throwIfAborted();const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;canvas.getContext('2d')!.drawImage(bitmap,0,0);images[entry.id]={...entry,canvas}}finally{bitmap.close()}}
 signal.throwIfAborted();view=createCityView(scene,images);element('stage').replaceChildren(view.canvas);
 view.canvas.onpointerdown=e=>view!.canvas.setPointerCapture(e.pointerId);view.canvas.onpointerup=e=>view!.canvas.releasePointerCapture(e.pointerId);view.canvas.onpointermove=e=>{if(view?.canvas.hasPointerCapture(e.pointerId)){camera.panX+=e.movementX;camera.panY+=e.movementY;draw()}};

 const bounds=scene.items.map(i=>{const sp=images[i.id],x=i.x+(i.w-sp.nativeWidth*i.factor)/2,z=i.z+(i.d-sp.nativeDepth*i.factor)/2;return {left:(x-z)*.5+sp.left*i.factor,top:(x+z)*.25+sp.top*i.factor,width:sp.width*i.factor,height:sp.height*i.factor}});
 const outer=scene.roadNetwork.ringOuter+12;
 const minX=Math.min(-scene.depth/2-outer-.4,...bounds.map(p=>p.left))-.3,maxX=Math.max(scene.width/2+outer+.4,...bounds.map(p=>p.left+p.width))+.3;
 const minY=Math.min(-outer/2-.4,...bounds.map(p=>p.top))-.5,maxY=Math.max((scene.width+scene.depth)/4+outer/2+.5,...bounds.map(p=>p.top+p.height));
 worldSpan=[maxX-minX,maxY-minY];worldCenter=[(minX+maxX)/2,(minY+maxY)/2];focusPoints={};
 for(const i of scene.items)if(i.id.startsWith('civic-')&&!focusPoints[i.id]){const sp=images[i.id];focusPoints[i.id]=[(i.x+i.w/2-i.z-i.d/2)*.5,(i.x+i.w/2+i.z+i.d/2)*.25-sp.baselineHeight*.25]}
 audit.focusPoints=focusPoints;
 element('status').textContent='正式Canvas已绘制；候选仅为造型审查，尚未正式映射';draw();
 }catch(error){if(!signal.aborted){close();element('status').textContent=String(error);throw error}}
}
for(const id of ['fit','near','max'])element(id).onclick=()=>{camera.zoom=id==='fit'?1:id==='near'?1.5:view?.maxZoom!(viewport())??1;camera.panX=camera.panY=0;draw()};
element('focus').onclick=()=>{camera.zoom=view?.maxZoom!(viewport())??1;const point=focusPoints[(element('target') as HTMLSelectElement).value];if(point){const vp=viewport(),scale=Math.min(Math.max(1,vp.width-32)/worldSpan[0],Math.max(1,vp.height-24)/worldSpan[1])*camera.zoom;camera.panX=(worldCenter[0]-point[0])*scale;camera.panY=(worldCenter[1]-point[1])*scale}draw()};
element('close').onclick=close;element('open').onclick=()=>void open();element('years').onchange=()=>void open();element('display').onchange=()=>void open();window.addEventListener('resize',draw);window.addEventListener('pagehide',close);
for(const c of catalog){const option=document.createElement('option');option.value=c.id;option.textContent=c.name;element('target').append(option);const fig=document.createElement('figure'),img=document.createElement('img'),caption=document.createElement('figcaption');img.src=c.file;caption.textContent=`${c.name} · ${c.origin} · ${c.pixels.join('×')}`;fig.append(img,caption);element('gallery').append(fig)}
element('background').onchange=()=>{const value=(element('background') as HTMLSelectElement).value;document.querySelectorAll<HTMLElement>('figure').forEach(f=>f.style.background=value==='checker'?'':value)};
Object.assign(window,{civicProbe:{snapshot:()=>audit,open,close,draw,setCamera:(value:typeof camera)=>{camera=value;draw()}}});
if(new URLSearchParams(location.search).has('bake'))void import('./bake').then(m=>m.bake());else void open();
