import { isoYearStart } from '../../src/data/iso-week';
import type { DailyContribution } from '../../src/data/types';
import { planCityScene, createCityView } from '../../src/renderers/city-view';
import { planOrganicCity, createOrganicGround } from '../../src/renderers/city-organic-layout';
import { loadCityImages, closeCityImages, type CityImages } from '../../src/renderers/city-assets';
import type { LandscapeView, LandscapeViewport } from '../../src/renderers/types';
const select=(id:string)=>document.querySelector<HTMLSelectElement>(`#${id}`)!;
let views:LandscapeView[]=[], images:CityImages={}, abort:AbortController|undefined, draws=0;
let camera={zoom:1,panX:0,panY:0};
let audit:Record<string,unknown>={};
let filledPartial=false;
const viewport=(view:LandscapeView):LandscapeViewport=>({width:view.canvas.clientWidth,height:580,dpr:Math.min(devicePixelRatio,1.5),dark:false,...camera});
function draw(){for(const view of views){view.draw(1,viewport(view));draws++}}
function close(){abort?.abort();views.forEach(v=>v.dispose());views=[];closeCityImages(images);images={};document.querySelector('#status')!.textContent='已关闭，画布与图片释放。'}
async function show(keepCamera=false){
  close();const request=abort=new AbortController();if(!keepCamera)camera={zoom:1,panX:0,panY:0};
  const n=Number(select('years').value), last=2025, first=last-n+1, years=Array.from({length:n},(_,i)=>first+i);
  const start=isoYearStart(first),end=isoYearStart(last+1),sample=select('sample').value,threshold=Number(select('threshold').value);
  const midpoint=isoYearStart(last)+(sample==='cross'?-50:70)*86400000;
  const days:DailyContribution[]=[];
  for(let time=start,i=0;time<end;time+=86400000,i++){
    const date=new Date(time).toISOString().slice(0,10),weekday=new Date(time).getUTCDay();
    let count=sample==='dense'?6+(i*17%65):weekday>=2&&weekday<=4&&i%3===0?1+(i%23):0;
    if(sample==='gap'||sample==='cross'){
      count=weekday>0&&weekday<6?3+(i%31):0;
      if(time>=midpoint&&time<midpoint+150*86400000)count=0;
      if(sample==='gap'&&time===midpoint+75*86400000)count=1;
    }
    if(sample==='zero')count=0;
    // 2025-09之后未提供；另有31天缺口；complete=false不作空闲推断。
    if(sample==='partial'&&!filledPartial&&(time>=Date.UTC(last,8,1)||(time>=Date.UTC(last,2,1)&&time<Date.UTC(last,3,1))))continue;
    days.push({date,count});
  }
  const before=planCityScene(days,true,years),plan=planOrganicCity(days,threshold,sample!=='partial'||filledPartial,years);
  const nonzero=days.flatMap((d,i)=>d.count>0?[i]:[]),mapped=plan.scene.items.flatMap(item=>item.parcel?.count?item.parcel.indices.filter(i=>days[i].count>0):[]);
  const mapping=(scene:typeof before)=>JSON.stringify(scene.items.filter(i=>i.parcel?.count).map(i=>[i.id,i.x,i.z,i.w,i.d,i.parcel!.indices]));
  audit={sample,years,threshold,complete:plan.settled,inputDays:days.length,total:days.reduce((s,d)=>s+d.count,0),nonzero:nonzero.length,mapped:mapped.length,uniqueMapped:new Set(mapped).size,conserved:nonzero.length===mapped.length&&nonzero.every(i=>mapped.includes(i)),buildingMappingIdentical:mapping(before)===mapping(plan.scene),mappedTotal:plan.scene.items.reduce((s,i)=>s+(i.parcel?.count??0),0),regions:plan.regions.length,omittedZeroDays:plan.omitted.length,gaps:plan.gaps.map(({indices:_,...g})=>g),omittedDates:plan.omitted.map(i=>days[i].date),rule:'ISO窗口逐日生成；稀疏=周二至四且i%3=0，count=1+i%23；密集=6+i*17%65；中断=150天零值，gap中点插入1；跨年从末年ISO起点前50天开始。未完成有31天缺口及未来未提供。'};
  document.querySelector('#audit')!.textContent=JSON.stringify(audit,null,2);
  document.querySelector('#status')!.textContent=`${days.length} 天 / ${audit.total} 次 · 省略显示 ${plan.omitted.length} 个零值日期 · ${plan.gaps.length} 段长期空档 · ${plan.settled?'候选已规划':'未完成快照，保留矩形待填场地，不推断空闲'}`;
  try{
    images=await loadCityImages(new URL('/assets/city-runtime/',location.href).href,[...new Set([...before.keys,...plan.scene.keys])],request.signal);
    if(request.signal.aborted)return;
    views=[createCityView(before,images),createCityView(plan.scene,images,undefined,plan.settled?createOrganicGround(plan):undefined)];
    views.forEach((view,i)=>{
      document.querySelector(i?'#new':'#old')!.replaceChildren(view.canvas);
      view.canvas.onwheel=event=>{event.preventDefault();camera.zoom=Math.max(.35,Math.min(views[0].maxZoom!(viewport(view)),camera.zoom*Math.exp(-event.deltaY*.002)));draw()};
      view.canvas.onpointerdown=event=>{view.canvas.setPointerCapture(event.pointerId)};
      view.canvas.onpointermove=event=>{if(view.canvas.hasPointerCapture(event.pointerId)){camera.panX+=event.movementX;camera.panY+=event.movementY;draw()}};
      view.canvas.onpointerup=event=>view.canvas.releasePointerCapture(event.pointerId);
    });draw();
  }catch(error){if(!request.signal.aborted)document.querySelector('#status')!.textContent=String(error)}
}
for(const id of ['years','sample','threshold'])select(id).onchange=()=>{filledPartial=false;void show()};
document.querySelector<HTMLButtonElement>('#fill')!.onclick=()=>{if(select('sample').value==='partial'){filledPartial=true;void show(true)}};
document.querySelector<HTMLButtonElement>('#close')!.onclick=close;
document.querySelector<HTMLButtonElement>('#open')!.onclick=()=>void show();
document.querySelector<HTMLButtonElement>('#fit')!.onclick=()=>{camera={zoom:1,panX:0,panY:0};draw()};
document.querySelector<HTMLButtonElement>('#near')!.onclick=()=>{camera.zoom=6;draw()};
window.addEventListener('resize',draw);window.addEventListener('pagehide',close);
Object.assign(window,{organicProbe:{snapshot:()=>({...audit,draws,canvases:views.map(v=>[v.canvas.width,v.canvas.height]),camera:{...camera}})}});
void show();
