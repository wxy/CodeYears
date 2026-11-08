import catalog from '../../docs/design/city-model-expansion/culture-transit/catalog.json';
import calibration from '../../docs/design/city-model-expansion/culture-transit/calibration.json';
import {calibrate,type UnitSample} from '../../src/renderers/unit-calibration';
import {createCityView,planCityScene,type CitySceneItem} from '../../src/renderers/city-view';
import {loadCityImages,closeCityImages,type CityImages} from '../../src/renderers/city-assets';
import type {LandscapeView,LandscapeViewport} from '../../src/renderers/types';
import type {DailyContribution} from '../../src/data/types';
const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const ids=Object.keys(catalog),focus=$<HTMLSelectElement>('focus'),zoom=$<HTMLSelectElement>('zoom'),years=$<HTMLSelectElement>('years');
const labels=['小型公交站房','博物馆','小剧院 / 音乐厅','社区体育馆','市场大厅','钟楼文化馆'];
let view:LandscapeView|undefined,images:CityImages={},serial=0,disposed=false,panX=0,panY=0,guides=false,abort=new AbortController();
let currentItems:CitySceneItem[]=[];
let bounds=[0,1,0,1];
const audit:unknown[]=[];
for(const [i,id]of ids.entries()){
 const option=document.createElement('option');option.value=id;option.textContent=labels[i];focus.append(option);
 const fig=document.createElement('figure'),image=document.createElement('img'),caption=document.createElement('figcaption');image.src='/assets/city-candidates-culture-transit/'+id+'.png';caption.textContent=labels[i]+' · 新绘 · '+catalog[id as keyof typeof catalog].nativeWidth+'×'+catalog[id as keyof typeof catalog].nativeDepth;fig.append(image,caption);$('cards').append(fig);
}
function input(n:number):DailyContribution[]{const days:DailyContribution[]=[];for(let t=Date.UTC(2006,0,1);t<Date.UTC(2006+n,0,1);t+=86400000){const i=days.length;days.push({date:new Date(t).toISOString().slice(0,10),count:[3,12,32][Math.floor(i/84)%3]})}return days}
function signature(scene:ReturnType<typeof planCityScene>){return JSON.stringify(scene.weekly.parcels.map(p=>[p.indices,p.count,p.w,p.d]))}
function ground(ctx:CanvasRenderingContext2D){ctx.fillStyle=document.body.classList.contains('dark')?'#263a30':'#a3b58d';ctx.fillRect(-50,-50,180,180);if(!guides)return;ctx.lineWidth=.012;ctx.strokeStyle='#667c68';for(let i=-12;i<=65;i++){ctx.beginPath();ctx.moveTo((i+12)*.5,(i-12)*.25);ctx.lineTo((i-65)*.5,(i+65)*.25);ctx.stroke();ctx.beginPath();ctx.moveTo((-12-i)*.5,(-12+i)*.25);ctx.lineTo((65-i)*.5,(65+i)*.25);ctx.stroke()}}
async function rebuild(){
 const ticket=++serial;abort.abort();abort=new AbortController();const signal=abort.signal;
 view?.dispose();closeCityImages(images);images={};$('status').textContent='按需载入…';
 try{
 const days=input(Number(years.value)),scene=planCityScene(days,false),before=signature(scene),used=new Map<string,number>();
 // 仅预览替换兼容占地，日期和数量始终保留原 parcel。未匹配的保持正式模型。
 for(const item of scene.items){if(item.parcel?.kind!=='building')continue;const eligible=ids.filter(id=>{const s=catalog[id as keyof typeof catalog];return s.nativeWidth===item.w&&s.nativeDepth===item.d});if(!eligible.length)continue;const id=eligible[(item.parcel.indices[0]>>>0)%eligible.length];item.id=id;item.factor=1;used.set(id,(used.get(id)??0)+1)}
 // 固定独立审美陈列，无日期；保证无法在该输入合并出的占地也可验收。
 ids.forEach((id,i)=>{const s=catalog[id as keyof typeof catalog];scene.items.push({id,factor:1,x:8+(i%3)*3,z:-8+Math.floor(i/3)*3,w:s.nativeWidth,d:s.nativeDepth,flat:false})});
 scene.keys=[...new Set(scene.items.map(i=>i.id))];
 const builtins=scene.keys.filter(id=>!ids.includes(id));const loaded=await loadCityImages(new URL('/assets/city-runtime/',location.href).href,builtins,signal);
 images=loaded;
 await Promise.all(scene.keys.filter(id=>ids.includes(id)).map(async id=>{const entry=catalog[id as keyof typeof catalog],response=await fetch('/assets/city-candidates-culture-transit/'+entry.file,{signal});if(!response.ok)throw Error(String(response.status));const bitmap=await createImageBitmap(await response.blob());try{signal.throwIfAborted();const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;canvas.getContext('2d')!.drawImage(bitmap,0,0);const {file:_,...meta}=entry;loaded[id]={canvas,...meta}}finally{bitmap.close()}}));
 if(disposed||ticket!==serial){closeCityImages(loaded);return}
 currentItems=scene.items;
 const placed=scene.items.map(i=>{const s=images[i.id],x=i.x+(i.w-s.nativeWidth*i.factor)/2,z=i.z+(i.d-s.nativeDepth*i.factor)/2;return {left:(x-z)*.5+s.left*i.factor,top:(x+z)*.25+s.top*i.factor,width:s.width*i.factor,height:s.height*i.factor}});
 const outer=scene.roadNetwork.ringOuter+12;
 bounds=[Math.min(-scene.depth/2-outer-.4,...placed.map(p=>p.left))-.3,Math.max(scene.width/2+outer+.4,...placed.map(p=>p.left+p.width))+.3,Math.min(-outer/2-.4,...placed.map(p=>p.top))-.5,Math.max((scene.width+scene.depth)/4+outer/2+.5,...placed.map(p=>p.top+p.height))];
 view=createCityView(scene,images,undefined,ground);$('scene').replaceChildren(view.canvas);
 const indices=scene.weekly.parcels.flatMap(p=>p.indices).sort((a,b)=>a-b),record={years:Number(years.value),days:days.length,total:days.reduce((s,d)=>s+d.count,0),parcels:scene.weekly.parcels.length,totalByParcels:scene.weekly.parcels.reduce((s,p)=>s+p.count,0),countMatches:scene.weekly.parcels.every(p=>p.count===p.indices.reduce((s,i)=>s+days[i].count,0)),dateCount:indices.length,uniqueDates:new Set(indices).size,complete:indices.every((v,i)=>v===i),mappingUnchanged:before===signature(scene),candidates:Object.fromEntries(used),exhibition:6};
 audit.push(record);$('audit').textContent=JSON.stringify(audit,null,2);(window as unknown as {cultureAudit:unknown}).cultureAudit=record;
 $('status').textContent=`${days.length} 日 · 日期/数量守恒 ${record.complete&&record.mappingUnchanged&&record.countMatches?'通过':'失败'} · 六款陈列不代表日期`;
 panX=panY=0;draw();
 }catch(error){if(!signal.aborted)$('status').textContent='加载失败：'+String(error)}
}
function draw(){if(!view)return;const box=$('scene'),vp:LandscapeViewport={width:box.clientWidth,height:box.clientHeight,dpr:Math.min(devicePixelRatio,1.5),zoom:1,panX,panY,dark:document.body.classList.contains('dark')};vp.zoom=zoom.value==='max'?view.maxZoom!(vp):Number(zoom.value);const target=currentItems.find(i=>i.id===focus.value&&!i.parcel);if(target){const item=target,sprite=images[item.id];const [minX,maxX,minY,maxY]=bounds;
 const scale=Math.min((vp.width-32)/(maxX-minX),(vp.height-24)/(maxY-minY))*vp.zoom;vp.panX=panX+((minX+maxX)/2-(item.x-item.z)*.5-sprite.left-sprite.width/2)*scale;vp.panY=panY+((minY+maxY)/2-(item.x+item.z)*.25-sprite.top-sprite.height/2)*scale;
 }
 view.draw(1,vp);const details=ids.map(id=>{const s=images[id],actualScale=Math.min((vp.width-32)/(bounds[1]-bounds[0]),(vp.height-24)/(bounds[3]-bounds[2]))*vp.zoom,css=[s.width*actualScale,s.height*actualScale];return `${id}: PNG ${s.canvas.width}×${s.canvas.height}; 当前显示 ${css.map(x=>x.toFixed(1)).join('×')} CSS / ${css.map(x=>(x*vp.dpr).toFixed(1)).join('×')} device px`});$('specs').textContent=`Canvas ${vp.width}×${vp.height} CSS / ${view.canvas.width}×${view.canvas.height} device px; DPR ${vp.dpr}; zoom ${vp.zoom.toFixed(3)} / max ${view.maxZoom!(vp).toFixed(3)}\n384 上限保持；高倍采样会放大像素，不提高资源规格。\n`+details.join('\n');
 (window as unknown as {cultureView:unknown}).cultureView={viewport:vp,maxZoom:view.maxZoom!(vp),calibration:(calibration.assets as UnitSample[]).map(s=>({id:s.id,...((c)=>({W:c.mappedW,D:c.mappedD,clearance:c.clearance}))(calibrate(s))}))};
}
for(const el of [focus,zoom])el.onchange=()=>{panX=panY=0;draw()};years.onchange=()=>void rebuild();$('theme').onclick=()=>{document.body.classList.toggle('dark');void rebuild()};$('guides').onclick=()=>{guides=!guides;void rebuild()};
let pointer:{x:number;y:number}|undefined;$('scene').onpointerdown=e=>{pointer={x:e.clientX,y:e.clientY};$('scene').setPointerCapture(e.pointerId)};$('scene').onpointermove=e=>{if(!pointer)return;panX+=e.clientX-pointer.x;panY+=e.clientY-pointer.y;pointer={x:e.clientX,y:e.clientY};draw()};$('scene').onpointerup=()=>{pointer=undefined};const resize=new ResizeObserver(draw);resize.observe($('scene'));
window.addEventListener('pagehide',()=>{disposed=true;abort.abort();view?.dispose();closeCityImages(images);resize.disconnect()},{once:true});void rebuild();
