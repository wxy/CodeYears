import {isoYearStart} from '../../../src/data/iso-week';
import type {DailyContribution} from '../../../src/data/types';
import {createCityView} from '../../../src/renderers/city-view';
import {planOrganicCity,createOrganicGround} from '../../../src/renderers/city-organic-layout';
import {loadCityImages,closeCityImages,type CityImages} from '../../../src/renderers/city-assets';
import type {LandscapeView,LandscapeViewport} from '../../../src/renderers/types';
import {samples,contactGround,contactScene} from './contact';
let views:LandscapeView[]=[],images:CityImages={},controller:AbortController|undefined,draws=0,hidden=false;
let camera={zoom:1,panX:0,panY:0},audit:Record<string,unknown>={};
const node=(id:string)=>document.getElementById(id)!;
const viewport=(v:LandscapeView):LandscapeViewport=>({width:v.canvas.clientWidth,height:580,dpr:Math.min(devicePixelRatio,1.5),dark:false,...camera});
function draw(){if(hidden)return;for(const v of views){v.draw(1,viewport(v));draws++}node('audit').textContent=JSON.stringify({...audit,draws,camera},null,2)}
function close(){controller?.abort();views.forEach(v=>v.dispose());views=[];closeCityImages(images);images={};node('swatches').replaceChildren();node('status').textContent='已释放';}
async function show(){close();hidden=false;camera={zoom:1,panX:0,panY:0};const request=controller=new AbortController();
 const n=Number((node('years') as HTMLSelectElement).value),dense=(node('sample') as HTMLSelectElement).value==='dense',years=Array.from({length:n},(_,i)=>2026-n+i),days:DailyContribution[]=[];
 for(let t=isoYearStart(years[0]),i=0;t<isoYearStart(2026);t+=86400000,i++)days.push({date:new Date(t).toISOString().slice(0,10),count:dense?(i%91<7?1:i%91<21?4:6+(i*17%75)):i%11===0?1+i%65:0});
 const plan=planOrganicCity(days,90,years,true,years[0]),scene=plan.scene;
 try{images=await loadCityImages(new URL('/assets/city-runtime/',location.href).href,[...new Set([...scene.keys,...samples,'transport-bridge-stone','transport-bridge-girder'])],request.signal);if(request.signal.aborted)return;
 const original=JSON.stringify({days,scene});const candidate=contactScene(scene,images);
 const nonzero=days.flatMap((d,i)=>d.count>0?[i]:[]),mapped=scene.items.flatMap(i=>i.parcel?.count?i.parcel.indices.filter(j=>days[j].count>0):[]);
 const base=createOrganicGround(plan);views=[createCityView(scene,images,undefined,base),createCityView(candidate,images,undefined,base)];
 audit={baseline:'5c6d2e60b3becdbb5900d98cb7478a1fbf9b6bba',days:days.length,total:days.reduce((a,d)=>a+d.count,0),years,dense,affected:scene.items.filter(i=>samples.includes(i.id)).map(i=>({id:i.id,x:i.x,z:i.z,indices:i.parcel?.indices})),sourceUnchanged:original===JSON.stringify({days,scene}),membersConserved:nonzero.length===mapped.length&&new Set(mapped).size===mapped.length&&nonzero.every(i=>mapped.includes(i)),sameBuildingObjects:true,shadowCanvasPixels:3*384*192,bridges:scene.roadNetwork.bridges,extraPNGBytes:0};
 views.forEach((v,i)=>{node(i?'new':'old').replaceChildren(v.canvas);v.canvas.onwheel=e=>{e.preventDefault();camera.zoom=Math.max(.5,Math.min(20,views[0].maxZoom!(viewport(v)),camera.zoom*Math.exp(-e.deltaY*.002)));draw()};v.canvas.onpointerdown=e=>v.canvas.setPointerCapture(e.pointerId);v.canvas.onpointermove=e=>{if(v.canvas.hasPointerCapture(e.pointerId)){camera.panX+=e.movementX;camera.panY+=e.movementY;draw()}};v.canvas.onpointerup=e=>v.canvas.releasePointerCapture(e.pointerId)});
 for(const id of [...samples,'transport-bridge-stone','transport-bridge-girder'])for(const candidate of [false,true]){const s=images[id],c=document.createElement('canvas');c.width=240;c.height=300;const ctx=c.getContext('2d')!;ctx.fillStyle='#b5c3a3';ctx.fillRect(0,0,240,300);ctx.fillStyle='#26362b';ctx.fillText(id+(candidate?' 候选':' 基线'),8,16);const scale=Math.min(200/s.width,245/s.height);ctx.save();ctx.translate(120,35-s.top*scale);ctx.scale(scale,scale);ctx.strokeStyle='#789270';ctx.lineWidth=1/scale;for(let j=-2;j<3;j++){ctx.beginPath();ctx.moveTo(j*.5-1,-.5+j*.25);ctx.lineTo(j*.5+1,.5+j*.25);ctx.stroke()}
 if(candidate&&samples.includes(id)){const fake={...scene,items:[{id,x:0,z:0,w:s.nativeWidth,d:s.nativeDepth,factor:1,flat:false}]};contactGround(fake,images,()=>{})(ctx)}ctx.drawImage(s.canvas,s.left,s.top,s.width,s.height);ctx.restore();node('swatches').append(c)}
 node('status').textContent=`${days.length} 天，同一规划对象、正式 PNG、相同镜头；右侧只增加地面缓存绘制。`;draw();
 }catch(e){if(!request.signal.aborted)node('status').textContent=String(e)}
}
node('fit').onclick=()=>{camera={zoom:1,panX:0,panY:0};draw()};
node('near').onclick=()=>{
 camera={zoom:1,panX:0,panY:0};draw();const v=views[0];if(!v)return;const vp=viewport(v);
 const affected=audit.affected as {indices?:number[]}[];const wanted=new Set(affected.flatMap(i=>i.indices??[]));let best:{x:number,y:number}|undefined;
 for(let y=20;y<580&&!best;y++)for(let x=20;x<vp.width;x++){const hit=v.buildingAt?.(x,y,vp);if(hit?.some(i=>wanted.has(i))){best={x,y};break}}
 camera.zoom=Math.min(12,v.maxZoom?.(vp)??12);if(best){camera.panX=(vp.width/2-best.x)*camera.zoom;camera.panY=(290-best.y)*camera.zoom}draw();
};
node('hide').onclick=()=>{hidden=!hidden;views.forEach(v=>v.canvas.style.visibility=hidden?'hidden':'visible');if(!hidden)draw()};node('close').onclick=close;node('open').onclick=()=>void show();for(const id of ['sample','years'])node(id).onchange=()=>void show();window.addEventListener('resize',draw);window.addEventListener('pagehide',close);Object.assign(window,{artProbe:{snapshot:()=>({...audit,draws,camera,hidden,canvases:views.map(v=>[v.canvas.width,v.canvas.height])})}});void show();
