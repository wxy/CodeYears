import catalog from '../../docs/design/city-model-expansion/residential/catalog.json';
import models from '../../docs/design/city-model-expansion/residential/models.json';
import calibration from '../../docs/design/city-model-expansion/residential/calibration.json';
import { calibrate, project, type UnitSample } from '../../src/renderers/unit-calibration';
import { createCityView, planCityScene, type CityScene } from '../../src/renderers/city-view';
import { loadCityImages, closeCityImages, type CityImages, type CitySprite } from '../../src/renderers/city-assets';
import { isoYearStart } from '../../src/data/iso-week';
import type { DailyContribution } from '../../src/data/types';
import type { LandscapeView, LandscapeViewport } from '../../src/renderers/types';
import { CITY_OUTSKIRT_IDS } from '../../src/renderers/city-outskirts';

const $=<T extends Element>(s:string)=>document.querySelector<T>(s)!;
type Entry=Omit<CitySprite,'canvas'>&{file:string};
const entries:Record<string,Entry>=catalog;
let images:CityImages={}, view:LandscapeView|undefined, controller:AbortController|undefined;
let audit:Record<string,unknown>={},camera={zoom:1,panX:0,panY:0},draws=0;
const viewport=():LandscapeViewport=>({width:$('#stage').clientWidth,height:600,dpr:Math.min(devicePixelRatio,1.5),dark:false,...camera});

async function loadCandidates(ids:string[],signal:AbortSignal):Promise<CityImages>{
  const loaded:CityImages={};
  try{
    for(const id of new Set(ids)){
      const entry=entries[id],response=await fetch(`/assets/city-candidates-residential/${entry.file}`,{signal});
      if(!response.ok)throw Error(`${id}: HTTP ${response.status}`);
      const bitmap=await createImageBitmap(await response.blob());
      try{
        signal.throwIfAborted();const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
        canvas.getContext('2d')!.drawImage(bitmap,0,0);const {file:_,...meta}=entry;loaded[id]={canvas,...meta};
      }finally{bitmap.close()}
    }
    return loaded;
  }catch(error){closeCityImages(loaded);throw error}
}
function signature(scene:CityScene){return JSON.stringify(scene.items.filter(i=>i.parcel).map(i=>[i.x,i.z,i.w,i.d,i.parcel!.indices,i.parcel!.count,i.parcel!.band]))}
function close(){controller?.abort();view?.dispose();view=undefined;closeCityImages(images);images={};$('#gallery').replaceChildren();$('#status').textContent='已释放视图和所有候选/正式贴图。'}
function draw(){
  if(!view)return;
  const vp=viewport(),max=view.maxZoom!(vp);camera.zoom=Math.min(camera.zoom,max);vp.zoom=camera.zoom;
  view.draw(1,vp);draws++;
  // 当前固定样本 max>5，所以正式 maxZoom=192/fitScale，直接还原实际绘制尺度。
  const scale=192/max*camera.zoom;
  audit={...audit,camera:{...camera},draws,canvasCSS:[vp.width,vp.height],canvasDevice:[view.canvas.width,view.canvas.height],dpr:vp.dpr,maxZoom:max,worldUnitCSS:scale,
    sampling:models.map(m=>({id:m.id,source:[images[m.id].canvas.width,images[m.id].canvas.height],css:[entries[m.id].width*scale,entries[m.id].height*scale],device:[entries[m.id].width*scale*vp.dpr,entries[m.id].height*scale*vp.dpr]}))};
  $('#audit').textContent=JSON.stringify(audit,null,2);
}
function gallery(){
  for(const model of models){
    const s=images[model.id],article=document.createElement('article'),title=document.createElement('h3'),canvas=document.createElement('canvas');
    title.textContent=`${model.name} · ${model.footprint.join('×')} · band ${model.band}`;article.append(title,canvas);
    const dpr=Math.min(devicePixelRatio,1.5),width=300,height=320;canvas.width=width*dpr;canvas.height=height*dpr;
    // Lock both CSS dimensions so browser grid resizing cannot stretch the 2:1 projection.
    canvas.style.width='300px';canvas.style.maxWidth='none';canvas.style.height='320px';article.style.overflow='auto';
    const ctx=canvas.getContext('2d')!;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingQuality='high';
    const scale=192,originX=width/2-(model.footprint[0]-model.footprint[1])*scale/4,originY=height-20-(model.footprint[0]+model.footprint[1])*scale/4;
    ctx.save();ctx.translate(originX,originY);ctx.scale(scale/96,scale/96);
    const points=[[0,0],[model.footprint[0],0],model.footprint,[0,model.footprint[1]]].map(p=>project(p[0],p[1]));
    ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.strokeStyle='#608862';ctx.lineWidth=.5;ctx.stroke();
    ctx.beginPath();ctx.arc(...project(model.footprint[0]/2,model.footprint[1]/2),1.3,0,Math.PI*2);ctx.fillStyle='#dd3a2c';ctx.fill();ctx.restore();
    ctx.drawImage(s.canvas,originX+s.left*scale,originY+s.top*scale,s.width*scale,s.height*scale);
    const details=document.createElement('p');details.textContent=`${s.canvas.width}×${s.canvas.height} RGBA · 高度 ${s.baselineHeight.toFixed(2)} · 红点为地面中心（可能被楼遮挡）`;article.append(details);$('#gallery').append(article);
  }
}
async function open(){
  close();const request=controller=new AbortController();camera={zoom:1,panX:0,panY:0};
  const n=Number($<HTMLSelectElement>('#years').value),years=Array.from({length:n},(_,i)=>2026-n+i),days:DailyContribution[]=[];
  for(let t=isoYearStart(years[0]),i=0;t<isoYearStart(2026);t+=86400000,i++)days.push({date:new Date(t).toISOString().slice(0,10),count:i%29===0?0:[1,2,4,4,4,4,8,14,8,14,4,4,1,2,8,4,4][i%17]});
  const scene=planCityScene(days,false,years),before=signature(scene),counts:Record<string,number>={};
  scene.items=scene.items.map((item,index)=>{
    const p=item.parcel;if(!p||p.kind!=='building')return item;
    const choices=models.filter(m=>m.band===p.band&&m.footprint[0]===item.w&&m.footprint[1]===item.d);
    if(!choices.length)return item;const chosen=choices[index%choices.length];counts[chosen.id]=(counts[chosen.id]??0)+1;return {...item,id:chosen.id,factor:1};
  });
  const parcelItems=scene.items.filter(i=>i.parcel),mapped=parcelItems.flatMap(i=>i.parcel!.indices);
  audit={years,inputDays:days.length,total:days.reduce((a,d)=>a+d.count,0),mappedTotal:parcelItems.reduce((a,i)=>a+i.parcel!.count,0),mappedDays:mapped.length,uniqueDays:new Set(mapped).size,
    datesIdentical:before===signature(scene),allDatesMapped:mapped.length===days.length&&new Set(mapped).size===days.length,candidateCounts:counts,
    calibration:(calibration.assets as unknown as UnitSample[]).map(s=>({id:s.id,...calibrate(s)})),rule:'ISO完整周年；i%29=0时0，否则循环[1,2,4,4,4,4,8,14,8,14,4,4,1,2,8,4,4]；只替换相同band/W/D，不改parcel或日期'};
  try{
    const candidateImages=await loadCandidates(models.map(m=>m.id),request.signal);
    if(request.signal.aborted){closeCityImages(candidateImages);return}images=candidateImages;
    const formal=await loadCityImages(new URL('/assets/city-runtime/',location.href).href,[...new Set([...scene.items.map(i=>i.id).filter(id=>!entries[id]),...CITY_OUTSKIRT_IDS,'natural-ground'])],request.signal);
    if(request.signal.aborted){closeCityImages(formal);return}Object.assign(images,formal);
    view=createCityView(scene,images);$('#stage').replaceChildren(view.canvas);
    view.canvas.onwheel=e=>{e.preventDefault();camera.zoom=Math.max(.35,Math.min(view!.maxZoom!(viewport()),camera.zoom*Math.exp(-e.deltaY*.002)));draw()};
    view.canvas.onpointerdown=e=>view!.canvas.setPointerCapture(e.pointerId);
    view.canvas.onpointermove=e=>{if(view!.canvas.hasPointerCapture(e.pointerId)){camera.panX+=e.movementX;camera.panY+=e.movementY;draw()}};
    view.canvas.onpointerup=e=>view!.canvas.releasePointerCapture(e.pointerId);
    gallery();draw();$('#status').textContent=`${days.length} 天 · ${audit.total} 次 · 已放置候选 ${Object.values(counts).reduce((a,b)=>a+b,0)} 座；最大倍率沿用正式绘制器`;
  }catch(error){if(!request.signal.aborted){close();$('#status').textContent=String(error)}}
}
$('#fit').addEventListener('click',()=>{camera={zoom:1,panX:0,panY:0};draw()});
$('#near').addEventListener('click',()=>{camera.zoom=1.5;draw()});
$('#max').addEventListener('click',()=>{if(view)camera.zoom=view.maxZoom!(viewport());draw()});
$('#close').addEventListener('click',close);$('#open').addEventListener('click',()=>void open());$('#years').addEventListener('change',()=>void open());
window.addEventListener('resize',draw);window.addEventListener('pagehide',close);
Object.assign(window,{residentialProbe:{snapshot:()=>audit,close,open}});void open();
