import {isoYearStart} from '../../../src/data/iso-week';
import type {DailyContribution} from '../../../src/data/types';
import {planOrganicCity,createOrganicGround} from '../../../src/renderers/city-organic-layout';
import {createCityView} from '../../../src/renderers/city-view';
import {loadCityImages,closeCityImages,type CityImages} from '../../../src/renderers/city-assets';
import {CITY_OUTSKIRT_MARGIN} from '../../../src/renderers/city-outskirts';
import type {LandscapeView,LandscapeViewport} from '../../../src/renderers/types';
import {planStreetGround} from './ground';
const $=(id:string)=>document.getElementById(id)!;
let views:LandscapeView[]=[],images:CityImages={},controller:AbortController|undefined;
let camera={zoom:1.875,panX:0,panY:0},enabled=true,hidden=false,draws=0,ready=false;
let audit:Record<string,unknown>={},street:ReturnType<typeof planStreetGround>|undefined;
let center={x:0,y:0},target={x:0,y:0},span={x:1,y:1};
const viewport=(v:LandscapeView):LandscapeViewport=>({width:v.canvas.clientWidth,height:580,dpr:1,dark:false,...camera});
function snapshot(){return {...audit,ready,draws,enabled,hidden,camera:{...camera},groundPaints:street?.paints,canvases:views.map(v=>[v.canvas.width,v.canvas.height])}}
function draw(){if(hidden)return;for(const v of views){v.draw(1,viewport(v));draws++}$('audit').textContent=JSON.stringify(snapshot(),null,2)}
function close(){controller?.abort();views.forEach(v=>v.dispose());views=[];closeCityImages(images);images={};ready=false;$('status').textContent='已释放';}
async function show(){
 close();hidden=false;$('stage').style.visibility='visible';const request=controller=new AbortController();
 const sample=($('sample') as HTMLSelectElement).value,n=sample==='multi'?6:sample==='twenty'?20:1,years=Array.from({length:n},(_,i)=>2026-n+i);
 const days:DailyContribution[]=[];for(let t=isoYearStart(years[0]),i=0;t<isoYearStart(2026);t+=86400000,i++){
  const count=sample==='low'?1+i%5:sample==='high'?20+i%65:sample==='sparse'?(i%7<3&&i%17<9?1+i%5:0):1+i*17%84;
  days.push({date:new Date(t).toISOString().slice(0,10),count});
 }
 const plan=planOrganicCity(days,90,years,true,years[0]);const invariant=JSON.stringify(plan);
 try{
  images=await loadCityImages(new URL('/assets/city-runtime/',location.href).href,plan.scene.keys,request.signal);if(request.signal.aborted)return;
  const started=performance.now();street=planStreetGround(plan);const planningMs=performance.now()-started;
  enabled=true;const base=createOrganicGround(plan),candidate=(c:CanvasRenderingContext2D)=>{base(c);if(enabled)street!.paint(c)};
  const make=()=>createCityView(plan.scene,images,0,candidate);
  views=[createCityView(plan.scene,images,0,base),make()];
  const {width,depth,roadNetwork}=plan.scene,outer=roadNetwork.ringOuter+CITY_OUTSKIRT_MARGIN;
  const minX=-depth/2-outer-.7,maxX=width/2+outer+.7,minY=-outer/2-.9,maxY=(width+depth)/4+outer/2+1;
  center={x:(minX+maxX)/2,y:(minY+maxY)/2};span={x:maxX-minX,y:maxY-minY};
  const r=street.region,x=r?(r.left+r.right)/2:width/2,z=r?(r.top+r.bottom)/2:depth/2;target={x:(x-z)*.5,y:(x+z)*.25};
  const mapped=plan.scene.items.flatMap(i=>i.parcel?.count?i.parcel.indices.filter(j=>days[j].count>0):[]),expected=days.filter(d=>d.count>0).length;
  audit={baseline:'5c6d2e60b3becdbb5900d98cb7478a1fbf9b6bba',sample,years,days:days.length,total:days.reduce((s,d)=>s+d.count,0),mappedTotal:plan.scene.items.reduce((s,i)=>s+(i.parcel?.count??0),0),nonzero:expected,mapped:mapped.length,uniqueMapped:new Set(mapped).size,conserved:mapped.length===expected&&new Set(mapped).size===expected,sceneUnchanged:JSON.stringify(plan)===invariant,region:r,selectedBuildings:street.selected,segments:street.segments.length,rejected:street.rejected,bridges:roadNetwork.bridges.length,roads:roadNetwork.roads.length,planningMs,addedPNGs:0};
  camera={zoom:1.875,panX:0,panY:0};enabled=true;
  function mount(index:number){const v=views[index];$(index?'candidate':'baseline').replaceChildren(v.canvas);v.canvas.onwheel=e=>{e.preventDefault();const zoom=Math.max(.9375,Math.min(37.5,views[0].maxZoom!(viewport(v)),camera.zoom*Math.exp(-e.deltaY*.002)));const ratio=zoom/camera.zoom;camera={zoom,panX:camera.panX*ratio,panY:camera.panY*ratio};draw()};v.canvas.onpointerdown=e=>v.canvas.setPointerCapture(e.pointerId);v.canvas.onpointerup=e=>v.canvas.releasePointerCapture(e.pointerId);v.canvas.onpointermove=e=>{if(v.canvas.hasPointerCapture(e.pointerId)){camera.panX+=e.movementX;camera.panY+=e.movementY;draw()}}}
  mount(0);mount(1);
  $('toggle').onclick=()=>{if(views.length!==2)return;enabled=!enabled;views[1].dispose();views[1]=make();mount(1);draw()};
  ready=true;draw();$('status').textContent='已就绪 · 滚轮缩放 / 拖动，两侧同步；100%沿用正式基准，50%—2000%及素材上限。';
 }catch(error){if(!request.signal.aborted)$('status').textContent=String(error)}
}
$('sample').onchange=()=>void show();$('fit').onclick=()=>{camera={zoom:.9375,panX:0,panY:0};draw()};
$('near').onclick=()=>{if(!views.length)return;const vp=viewport(views[0]);camera.zoom=Math.min(20,37.5,views[0].maxZoom!(vp));const scale=Math.min((vp.width-32)/span.x,(vp.height-24)/span.y)*camera.zoom;camera.panX=(center.x-target.x)*scale;camera.panY=(center.y-target.y)*scale;draw()};
$('hide').onclick=()=>{hidden=!hidden;$('stage').style.visibility=hidden?'hidden':'visible';if(!hidden)draw()};
$('close').onclick=close;$('open').onclick=()=>void show();window.addEventListener('resize',draw);window.addEventListener('pagehide',close);
Object.assign(window,{streetProbe:{snapshot}});void show();
