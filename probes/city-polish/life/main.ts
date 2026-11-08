import { generateDays, type Density } from '../../../src/renderers/probe/data';
import { isoWeekDate } from '../../../src/data/iso-week';
import { planOrganicCity, createOrganicGround, type OrganicCity } from '../../../src/renderers/city-organic-layout';
import { loadCityImages, closeCityImages, type CityImages } from '../../../src/renderers/city-assets';
import { createCityView } from '../../../src/renderers/city-view';
import type { LandscapeView, LandscapeViewport } from '../../../src/renderers/types';
import { camera, planTracks, project, type Track } from './planning';
import { createLifeLayer } from './layer';

const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const stage=el('stage'),host=el('life'),mode=el<HTMLSelectElement>('mode'),sample=el<HTMLSelectElement>('sample');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let view:LandscapeView|undefined,images:CityImages={},plan:OrganicCity|undefined,tracks:Track[]=[];
let layer:ReturnType<typeof createLifeLayer>|undefined,abort:AbortController|undefined,generation=0;
let paused=false,official=false,destroyed=false,ready=false,mainDraws=0;
let frameKey="";
let input={days:0,total:0,nonzero:0,members:0};
const viewport:LandscapeViewport={width:stage.clientWidth,height:stage.clientHeight,dpr:Math.min(devicePixelRatio,1.5),zoom:1.875,panX:0,panY:0,dark:false};
function running(){return ready&&!destroyed&&!paused&&!official&&!document.hidden&&!reduced.matches;}
function sync(){layer?.set(Number(mode.value),running());el('pause').textContent=paused?'继续预览':'暂停预览';el('switch').textContent=official?'返回城市':'切回原图替身';
  host.hidden=official;if(view)view.canvas.hidden=official;el('official').hidden=!official;}
function snapshot(){return {ready,destroyed,paused,official,hidden:document.hidden,reduced:reduced.matches,mainDraws,input,tracks,viewport:{...viewport},animation:layer?.snapshot(),heap:(performance as Performance & {memory?:{usedJSHeapSize:number}}).memory?.usedJSHeapSize??null};}
function metrics(){el('stats').textContent=JSON.stringify(snapshot(),null,2);}
function draw(){if(!view||!plan||official||destroyed||document.hidden)return;const key=JSON.stringify(viewport);if(key!==frameKey){view.draw(1,viewport);mainDraws++;frameKey=key;}layer?.camera(camera(plan,viewport),viewport.width,viewport.height);}
function dispose(){generation++;abort?.abort();ready=false;destroyed=true;layer?.dispose();view?.dispose();view=undefined;frameKey="";closeCityImages(images);images={};sync();metrics();}
async function load(){
  dispose();const token=generation;destroyed=false;el('status').textContent='准备正式素材…';
  abort=new AbortController();
  try{
    const years=sample.value==='multi'?Array.from({length:20},(_,i)=>2006+i):[2023,2024,2025];
    const density:Density=sample.value==='multi'?'dense':sample.value as Density;
    const days=generateDays(density).filter(d=>years.includes(isoWeekDate(d.date).year));
    plan=planOrganicCity(days,90,years,true,years[0]);
    input={days:days.length,total:days.reduce((n,d)=>n+d.count,0),nonzero:days.filter(d=>d.count>0).length,members:new Set(plan.scene.items.flatMap(i=>i.parcel?.indices??[])).size};
    const ids=[...plan.scene.keys,...['xp','xm','zp','zm'].map(d=>`transport-sedan-${d}`)];
    const loaded=await loadCityImages(new URL('/assets/city-runtime/',location.href).href,ids,abort.signal);
    if(token!==generation){closeCityImages(loaded);return;}images=loaded;
    tracks=planTracks(plan,images);
    view=createCityView(plan.scene,images,0,createOrganicGround(plan));view.canvas.dataset.role='main';stage.prepend(view.canvas);
    layer=createLifeLayer(host,tracks,images);ready=true;mainDraws=0;
    viewport.zoom=1.875;viewport.panX=viewport.panY=0;draw();sync();
    el('status').textContent=`${input.days}天 / ${input.total}次合成贡献 · 安全短路段 ${tracks.length} 条 · ${reduced.matches?'系统减少动态：已停止':'开关只影响独立车辆层'}`;metrics();
  }catch(error){if(token===generation){el('status').textContent=String(error);dispose();}}
}
function zoom(factor:number){if(!view||!plan)return;viewport.zoom=Math.max(.9375,Math.min(37.5,view.maxZoom?.(viewport)??37.5,viewport.zoom*factor));draw();metrics();}
function near(){if(!plan||!tracks.length)return;const t=tracks[0],[x,y]=project(t.x+t.dx*2,t.z+t.dz*2);
  viewport.zoom=Math.min(37.5,view?.maxZoom?.(viewport)??37.5,90/camera(plan,{...viewport,zoom:1}).fit);
  viewport.panX=viewport.panY=0;const c=camera(plan,viewport);viewport.panX=viewport.width/2-c.x(x);viewport.panY=viewport.height/2-c.y(y);draw();metrics();}
mode.onchange=()=>{sync();metrics();};sample.onchange=()=>void load();
el('pause').onclick=()=>{paused=!paused;sync();metrics();};el('switch').onclick=()=>{official=!official;sync();if(!official)draw();metrics();};
el('wide').onclick=()=>{viewport.zoom=.9375;viewport.panX=viewport.panY=0;draw();metrics();};el('near').onclick=near;
el('out').onclick=()=>zoom(.8);el('in').onclick=()=>zoom(1.25);el('dispose').onclick=dispose;el('restore').onclick=()=>void load();el('metrics').onclick=metrics;
stage.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?1.12:1/1.12);},{passive:false});
let pointer:{id:number;x:number;y:number}|undefined;
stage.onpointerdown=e=>{if(official)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY};stage.setPointerCapture(e.pointerId);};
stage.onpointermove=e=>{if(!pointer||pointer.id!==e.pointerId)return;viewport.panX+=e.clientX-pointer.x;viewport.panY+=e.clientY-pointer.y;pointer={id:e.pointerId,x:e.clientX,y:e.clientY};draw();};
stage.onpointerup=stage.onpointercancel=()=>{pointer=undefined;};
const resize=new ResizeObserver(()=>{viewport.width=stage.clientWidth;viewport.height=stage.clientHeight;draw();});resize.observe(stage);
const visibility=()=>{sync();if(!document.hidden)draw();};document.addEventListener('visibilitychange',visibility);
const preference=()=>{sync();metrics();};reduced.addEventListener('change',preference);
window.addEventListener('pagehide',()=>{dispose();resize.disconnect();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',preference);},{once:true});
// Read-only diagnostics, deliberately no session, persistence, telemetry, or official-entry hook.
Object.assign(window,{lifeProbe:{snapshot}});
void load();
