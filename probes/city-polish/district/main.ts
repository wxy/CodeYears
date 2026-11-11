import {isoYearStart} from '../../../src/data/iso-week';
import type {DailyContribution} from '../../../src/data/types';
import {planOrganicCity} from '../../../src/renderers/city-organic-layout';
import {createCityView} from '../../../src/renderers/city-view';
import {loadCityImages,closeCityImages,type CityImages} from '../../../src/renderers/city-assets';
import type {LandscapeView,LandscapeViewport} from '../../../src/renderers/types';
import {organize,districtGround} from './organize';
const $=(id:string)=>document.getElementById(id)!;
let views:LandscapeView[]=[],images:CityImages={},generation=0,draws=0,enabled=true,hidden=false;
let camera={zoom:1.875,panX:0,panY:0};
let audit:Record<string,unknown>={};
const vp=(v:LandscapeView):LandscapeViewport=>({width:v.canvas.clientWidth,height:580,dpr:1,dark:false,...camera});
function draw(){if(hidden)return;for(const v of views){v.draw(1,vp(v));draws++}}
function dispose(){views.forEach(v=>v.dispose());views=[];closeCityImages(images);images={}}
function zoom(value:number){camera.zoom=Math.max(.9375,Math.min(37.5,...views.map(v=>v.maxZoom?.(vp(v))??37.5),value));draw()}
async function show(keepCamera=false){
 const token=++generation;dispose();if(!keepCamera)camera={zoom:1.875,panX:0,panY:0};
 const sample=($('sample') as HTMLSelectElement).value,years=sample==='multi'?[2020,2021,2022,2023,2024,2025]:[2024];
 const days:DailyContribution[]=[];
 for(let t=isoYearStart(years[0]),i=0;t<isoYearStart(years.at(-1)!+1);t+=86400000,i++){
  const count=sample==='sparse'?(i%17===0?1+i%65:0):[2,5,16,35,70][Math.floor(i/28)%5];
  days.push({date:new Date(t).toISOString().slice(0,10),count});
 }
 const started=performance.now(),base=planOrganicCity(days,90,years,true,2020),planned=performance.now();
 const next={...base,scene:enabled?organize(base.scene):base.scene},finished=performance.now();
 const mapping=(s:typeof base.scene)=>JSON.stringify(s.items.map(i=>[i.x,i.z,i.w,i.d,i.factor,i.parcel]));
 const modelSignature=next.scene.items.reduce((hash,item)=>{for(const ch of item.id)hash=Math.imul(hash^ch.charCodeAt(0),16777619);return hash},2166136261)>>>0;
 audit={modelSignature,sample,years,inputDays:days.length,total:days.reduce((s,d)=>s+d.count,0),mappingIdentical:mapping(base.scene)===mapping(next.scene),roadsIdentical:JSON.stringify(base.scene.roadNetwork)===JSON.stringify(next.scene.roadNetwork),changedModels:next.scene.items.filter((v,i)=>v.id!==base.scene.items[i].id).length,basePlanMs:planned-started,candidateMs:finished-planned,bridges:base.scene.roadNetwork.bridges.length};
 const loaded=await loadCityImages(new URL('/assets/city-runtime/',location.href).href,[...new Set([...base.scene.keys,...next.scene.keys])]);
 if(token!==generation){closeCityImages(loaded);return}images=loaded;
 views=[createCityView(base.scene,images,0,districtGround(base,false)),createCityView(next.scene,images,0,districtGround(next,enabled))];
 views.forEach((v,i)=>{ $(i?'candidate':'base').replaceChildren(v.canvas);
 v.canvas.onwheel=e=>{e.preventDefault();zoom(camera.zoom*Math.exp(-e.deltaY*.002))};
 v.canvas.onpointerdown=e=>v.canvas.setPointerCapture(e.pointerId);
 v.canvas.onpointermove=e=>{if(v.canvas.hasPointerCapture(e.pointerId)){camera.panX+=e.movementX;camera.panY+=e.movementY;draw()}};
 v.canvas.onpointerup=e=>v.canvas.releasePointerCapture(e.pointerId);
 });$('label').textContent=enabled?'候选 · 家族庭院':'候选关闭 · 基线';draw();$('audit').textContent=JSON.stringify(audit,null,2);
}
$('sample').onchange=()=>void show();$('fit').onclick=()=>{camera={zoom:1.875,panX:0,panY:0};draw()};$('near').onclick=()=>zoom(11.25);
$('minus').onclick=()=>zoom(camera.zoom/1.25);$('plus').onclick=()=>zoom(camera.zoom*1.25);
$('reuse').onclick=()=>{hidden=!hidden;document.querySelector('main')!.hidden=hidden;if(!hidden)draw()};
$('toggle').onclick=()=>{enabled=!enabled;void show(true)};
window.addEventListener('resize',draw);window.addEventListener('pagehide',dispose);
Object.assign(window,{districtProbe:{snapshot:()=>({...audit,draws,camera,hidden,canvases:views.map(v=>[v.canvas.width,v.canvas.height])}),ready:()=>views.length===2}});
void show();
