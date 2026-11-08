import {planOrganicCity,createOrganicGround} from '../../../src/renderers/city-organic-layout';
import {createCityView} from '../../../src/renderers/city-view';
import {loadCityImages,closeCityImages} from '../../../src/renderers/city-assets';
import {isoYearStart} from '../../../src/data/iso-week';
import {recognize} from './rules.mjs';
const $=(id:string)=>document.getElementById(id)!;
let candidate=false,view:any,images:any,days:any[]=[],plan:any,result:any,viewport={width:0,height:620,dpr:1,zoom:1.875,panX:0,panY:0,dark:false},draws=0,generation=0;
const evidenceFor=(kind:string)=>({joined:kind==='absent'?undefined:'2020-01-06',created:[kind==='same'?'2020-01-06':'2020-02-03'],completeFromJoined:kind!=='weak'});
function summary(){
 const active=days.filter(d=>d.count>0).length,total=days.reduce((s,d)=>s+d.count,0);
 $('summary').textContent=`${days.length} 天 · ${total} 次合成贡献。`+(candidate?` 活跃 ${active} 天；最高单日 ${Math.max(0,...days.map(d=>d.count))} 次。`+(result.first?` ${result.first} 首仓库（合成完整事件证据）。${result.shared?'与 Joined GitHub 共用注册塔，不新增楼体。':'关联注册塔；异日保留原日期地块，不新增仓库楼。'}`:result.tower?'注册塔在地图范围内；首仓库证据或范围不足，不认定。':'地图范围无明确注册塔，不认定首仓库。'):' 基线：仅保留现有注册塔与贡献表达。');
 $('mode').textContent=`候选摘要：${candidate?'开':'关（基线）'}`;
}
function draw(){if(!view||$('scene').hidden)return;viewport.width=$('scene').clientWidth;view.draw(1,viewport);draws++;$('status').textContent=`静态绘制 ${draws} 次 · ${Math.round(viewport.zoom/1.875*100)}% · 拖动平移；切换摘要复用同一规划/画布/素材`;(window as any).probe={draws,result,days:days.length,total:days.reduce((s,d)=>s+d.count,0),parcels:plan.scene.weekly.parcels.length,roads:JSON.stringify(plan.scene.roadNetwork),canvas:view.canvas};}
async function show(){
 const token=++generation;view?.dispose();view=undefined;if(images)closeCityImages(images);images=undefined;
 const kind=($('case') as HTMLSelectElement).value,density=($('density') as HTMLSelectElement).value,years=density==='多年'?Array.from({length:6},(_,i)=>2020+i):[2020];
 if(kind==='range')years.shift(),years.length||years.push(2021);
 days=[];for(let t=isoYearStart(years[0]),end=isoYearStart(years.at(-1)!+1),i=0;t<end;t+=86400000,i++){const date=new Date(t).toISOString().slice(0,10);days.push({date,count:date==='2020-01-06'?1:density==='稠密'?30:i%17===0?12:0});}
 const evidence=evidenceFor(kind);result=recognize(days.map(d=>d.date),evidence);
 plan=planOrganicCity(days,90,years,true,years[0],evidence.joined);const loaded=await loadCityImages(new URL('/assets/city-runtime/',location.href).href,plan.scene.keys);
 if(token!==generation){closeCityImages(loaded);return;}images=loaded;view=createCityView(plan.scene,images,0,createOrganicGround(plan));$('scene').replaceChildren(view.canvas);view.canvas.style.cssText='width:100%;height:100%';viewport.zoom=1.875;viewport.panX=viewport.panY=0;summary();draw();
}
$('mode').onclick=()=>{candidate=!candidate;summary();};
$('case').onchange=$('density').onchange=show;
function zoom(f:number){viewport.zoom=Math.max(.9375,Math.min(37.5,view.maxZoom(viewport),viewport.zoom*f));draw();}
$('in').onclick=()=>zoom(1.5);$('out').onclick=()=>zoom(1/1.5);$('reset').onclick=()=>{viewport.panX=viewport.panY=0;viewport.zoom=.9375;draw();};
$('near').onclick=()=>{if(!result.tower)return;viewport.zoom=.9375;viewport.panX=viewport.panY=0;draw();const box=view.canvas.getBoundingClientRect();
 for(let y=0;y<box.height;y+=2)for(let x=0;x<box.width;x+=2){const indices=view.buildingAt?.(x,y,viewport);if(indices?.some((i:number)=>days[i].date==='2020-01-06')){const target=Math.min(9.375,view.maxZoom(viewport)),ratio=target/viewport.zoom;viewport.panX=(box.width/2-x)*ratio;viewport.panY=(box.height/2-y)*ratio-box.height*.2;viewport.zoom=target;draw();return;}}};
$('reuse').onclick=()=>{$('scene').hidden=!$('scene').hidden;if(!$('scene').hidden)draw();};
let pointer:any;$('scene').onpointerdown=e=>{pointer={x:e.clientX,y:e.clientY};$('scene').setPointerCapture(e.pointerId);};$('scene').onpointermove=e=>{if(!pointer)return;viewport.panX+=e.clientX-pointer.x;viewport.panY+=e.clientY-pointer.y;pointer={x:e.clientX,y:e.clientY};draw();};$('scene').onpointerup=()=>pointer=undefined;
window.addEventListener('resize',draw);window.addEventListener('pagehide',()=>{view?.dispose();if(images)closeCityImages(images);});show();
