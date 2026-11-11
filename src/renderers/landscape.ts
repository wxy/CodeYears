import type { DailyContribution } from "../data/types";
import { createTimeline } from "../timeline/controller";
import type { TimelineState } from "../timeline/types";
import { closeCityImages, loadCityImages, type CityImages } from "./city-assets";
import { createCityView, planCityScene, type CityScene } from "./city-view";
import { planOrganicCity, createOrganicGround } from "./city-organic-layout";
import { planTownScene, createTownGround } from './town-layout';
import { loadTownImages } from './town-assets';
import type { LandscapeView, LandscapeViewport, ViewMode } from "./types";

export interface CityRoadControl { sign: HTMLElement; surface: HTMLAnchorElement | HTMLButtonElement; label:string; mutual:boolean }

export interface ContributionLandscape {
  setRoadControls(controls: readonly CityRoadControl[], returnPost?:HTMLElement): void;
  buildingAt(x: number, y: number): readonly DailyContribution[] | undefined;
  highlightBuilding(point?: {x:number;y:number}): void;
  setView(view: ViewMode,signal?:AbortSignal): Promise<void>;
  zoomBy(factor: number): void;
  zoomToMax(): void;
  resetView(): void;
  pause(): void;
  resume(): void;
  skip(): void;
  replay(): void;
  /** 隐藏时停止绘制，保留当前场景、素材和取景。 */
  setVisible(visible: boolean): void;
  /** 渐进City：该批素材就绪并交换画面后resolve，不等待短填入动画。 */
  updateDays(days: readonly DailyContribution[], joinedOn?:string): Promise<void>;
  dispose(): void;
}

/** 两种引擎共享播放/缩放/平移；缩放通知按面板的100%基准归一化。City不创建WebGL。 */
export function createLandscape(host: HTMLElement, days: readonly DailyContribution[], onChange: (state: TimelineState, error?: string, detail?: string) => void, initialView: ViewMode = "city", assetBase = new URL(/* @vite-ignore */ "./assets/city/", import.meta.url).href, cityWonders = true, reservedYears?: readonly number[], onZoomChange?: (zoom: number) => void, namingOriginYear?: number): ContributionLandscape {
  const progressiveCity=initialView!=="terrain"&&reservedYears!==undefined;
  // 原City的150%作为新100%；City缩放固定下限50%，上限不超过2000%。
  const zoomBase=progressiveCity?1.875:initialView!=="terrain"?1.5:1;
  const minZoom=zoomBase*.5;
  let currentDays=days,revealedDays=0,revealFrom=0,revealStarted=0;
  const timeline=createTimeline(days.length,initialView!=="terrain"?3000:8000),viewport:LandscapeViewport={width:1,height:1,dpr:Math.min(devicePixelRatio,1.5),zoom:zoomBase,panX:0,panY:0,dark:false};
  let view=initialView,layer:LandscapeView|undefined,images:CityImages|undefined,assetPromise:Promise<CityImages>|undefined;
  let cityScene:CityScene|undefined;const assetAbort=new AbortController();
  let joinedDate:string|undefined;
  const townAssetBase=new URL('../town/',assetBase).href;
  const planMap=(mode:'city'|'town',snapshot:readonly DailyContribution[],joined?:string)=>{
    if(mode==='town'){const plan=planTownScene(snapshot,reservedYears,joined);return {scene:plan.scene,ground:createTownGround(plan)}}
    const plan=planOrganicCity(snapshot,90,reservedYears!,cityWonders,namingOriginYear,joined);
    return {scene:plan.scene,ground:createOrganicGround(plan)};
  };
  let disposed=false,blocked=false,suspended=false,generation=0,raf=0,playing=!progressiveCity,anchored=false;
  let preparationError: string | undefined;
  const roadLayer=document.createElement('div');roadLayer.className='city-road-links';host.append(roadLayer);
  let roadAnchors:readonly CityRoadControl[]=[],returnSign:HTMLElement|undefined;
  const placeRoadTarget=(element:HTMLElement,polygon:readonly [number,number][])=>{
    element.hidden=!polygon.length;if(!polygon.length)return;
    const xs=polygon.map(p=>p[0]),ys=polygon.map(p=>p[1]),left=Math.min(...xs),top=Math.min(...ys),width=Math.max(...xs)-left,height=Math.max(...ys)-top;
    Object.assign(element.style,{left:`${left}px`,top:`${top}px`,width:`${width}px`,height:`${height}px`,clipPath:`polygon(${polygon.map(([x,y])=>`${(x-left)/width*100}% ${(y-top)/height*100}%`).join(',')})`});
  };
  const positionRoads=()=>{
    const exits=layer?.roadExits?.(viewport)??[];
    for(const [slot,{sign,surface}]of roadAnchors.entries()){
      placeRoadTarget(sign,exits[slot]?.board??[]);
      placeRoadTarget(surface,exits[slot]?.polygon??[]);
    }
    if(returnSign)placeRoadTarget(returnSign,layer?.returnPost?.(viewport)??[]);
  };
  const state=():TimelineState=>progressiveCity?{status:revealedDays>=currentDays.length?"completed":playing?"playing":"paused",revealedDays:Math.floor(revealedDays),totalDays:currentDays.length}:timeline.getState();
  const notify=(error?:string)=>onChange(state(),error,preparationError??layer?.description()??`正在准备${view==="terrain"?"连续山脉":view==='town'?'魔法小镇':'建筑素材'}…`);
  const labelCity=()=>{
    if(!progressiveCity||!layer)return;
    const name=view==='town'?'魔法小镇':'贡献之城';
    const text=!currentDays.length?`${name}空场地，等待读取所选年份贡献。`:playing?`${name}，正在将已读取的 ${currentDays.length} 天数据填入。`:`${name}，已呈现 ${currentDays.length} 天贡献。`;
    layer.canvas.setAttribute("aria-label",`${text}固定视角，拖动平移，滚轮缩放。`);
  };
  const configureCanvas=(next:LandscapeView,mode=view)=>{
    next.setRoadCount?.(roadAnchors.length||4);
    next.setRoadLabels?.(roadAnchors.map(road=>({name:road.label,mutual:road.mutual})),returnSign?.dataset.cityLabel);
    next.canvas.style.cssText="display:block;width:100%;height:100%;background:transparent";
    next.canvas.setAttribute("aria-label",`${mode==="city"?"贡献之城":mode==='town'?'魔法小镇':"连续时光山脉"}，固定视角。拖动平移，滚轮缩放。`);
  };
  const schedule=()=>{if(!disposed&&!blocked&&!suspended&&!document.hidden&&!raf)raf=requestAnimationFrame(tick)};
  function tick(now:number){
    raf=0;if(disposed||blocked||suspended||document.hidden||!layer)return;
    if(progressiveCity){
      if(playing){
        if(!anchored){revealFrom=revealedDays;revealStarted=now;anchored=true}
        const fraction=Math.min(1,(now-revealStarted)/650);
        revealedDays=revealFrom+(currentDays.length-revealFrom)*fraction;
        if(fraction===1){revealedDays=currentDays.length;playing=false;labelCity()}
      }
      layer.draw(currentDays.length?revealedDays/currentDays.length:1,viewport);
    }else{
      if(playing){if(!anchored){timeline.play(now);anchored=true}timeline.advance(now);playing=timeline.getState().status==="playing"}
      const current=timeline.getState();layer.draw(current.revealedDays/current.totalDays,viewport);
    }
    positionRoads();notify();if(playing)schedule();
  }
  const pause=()=>{playing=false;timeline.pause();anchored=false;notify()};
  async function prepare(){
    const token=++generation;layer?.dispose();layer=undefined;timeline.pause();anchored=false;blocked=false;preparationError=undefined;notify();
    try{
      if(view==='town'){
        const plan=planTownScene(currentDays,reservedYears,joinedDate);cityScene=plan.scene;
        assetPromise=loadTownImages(townAssetBase,plan.scene.keys,assetAbort.signal);
        const ready=await assetPromise;
        if(disposed||token!==generation){closeCityImages(ready);return}
        images=ready;layer=createCityView(plan.scene,images,progressiveCity?0:undefined,createTownGround(plan));
      }else if(view==="city"){
        if(progressiveCity){
          const plan=planOrganicCity(days,90,reservedYears!,cityWonders,namingOriginYear),ground=createOrganicGround(plan);
          cityScene=plan.scene;
          images={};layer=createCityView(cityScene,images,0,ground);configureCanvas(layer);host.append(layer.canvas);
          layer.draw(1,viewport);labelCity();schedule();notify();
          // 场地先同步显示；本地自然图片独立于网络贡献加载，且与后续批次共用。
          assetPromise=loadCityImages(assetBase,["natural-ground","direction-board","direction-board-mutual"],assetAbort.signal).then(ready=>{
            if(disposed){closeCityImages(ready);throw new DOMException('城市已关闭。','AbortError')}
            Object.assign(images!,ready);return ready;
          });
          await assetPromise;if(disposed||token!==generation)return;
          const previous=layer;layer=createCityView(cityScene,images,0,ground);previous.canvas.replaceWith(layer.canvas);previous.dispose();
        }
        else{
          cityScene??=planCityScene(days,cityWonders,reservedYears);
          assetPromise??=loadCityImages(assetBase,cityScene.keys,assetAbort.signal);const ready=await assetPromise;
          if(disposed||token!==generation)return;
          images=ready;layer=createCityView(cityScene,ready);
        }
      }else{
        const module=await import("./terrain-view");if(disposed||token!==generation)return;
        layer=module.createTerrainView(days,()=>{blocked=true;pause();cancelAnimationFrame(raf);raf=0;notify("图形上下文已中断，请重新生成风景。")});
      }
      zoomAt(1);
      configureCanvas(layer);host.append(layer.canvas);
      if(progressiveCity){layer.draw(1,viewport);labelCity()}
      schedule();notify();
    }catch(error){if(!disposed&&token===generation){playing=false;preparationError=error instanceof Error?error.message:"风景加载失败，请重新生成。";notify(preparationError)}}
  }
  const resize=()=>{if(suspended)return;viewport.width=Math.max(host.clientWidth,1);viewport.height=Math.max(host.clientHeight,1);zoomAt(1)};
  const observer=new ResizeObserver(resize);observer.observe(host);
  const preference=matchMedia("(prefers-color-scheme: dark)");
  const theme=()=>{
    const mode=document.documentElement.getAttribute("data-color-mode"),preview=document.documentElement.getAttribute("data-preview-theme");
    viewport.dark=preview==="dark"||(preview!=="light"&&(mode==="dark"||(mode!=="light"&&preference.matches)));schedule();
  };
  const themeObserver=new MutationObserver(theme);themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:["data-color-mode","data-dark-theme","data-light-theme","data-preview-theme"]});preference.addEventListener("change",theme);
  let pointer:{id:number;x:number;y:number;dragging:boolean;road:boolean}|undefined,suppressRoadClick=false;
  const down=(event:PointerEvent)=>{
    if(pointer||event.button!==0)return;
    const target=event.target instanceof Element?event.target:undefined,road=!!target?.closest('.city-road-surface');
    if(!road&&target?.closest('a,button,input'))return;
    suppressRoadClick=false;pointer={id:event.pointerId,x:event.clientX,y:event.clientY,dragging:!road,road};
    if(!road){host.setPointerCapture(event.pointerId);host.style.cursor="grabbing"}
  };
  const move=(event:PointerEvent)=>{
    if(!pointer||pointer.id!==event.pointerId)return;
    if(!pointer.dragging){
      if(Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)<4)return;
      pointer.dragging=true;host.setPointerCapture(event.pointerId);host.style.cursor="grabbing";
    }
    viewport.panX+=event.clientX-pointer.x;viewport.panY+=event.clientY-pointer.y;pointer.x=event.clientX;pointer.y=event.clientY;schedule();
  };
  const up=(event:PointerEvent)=>{if(pointer?.id!==event.pointerId)return;suppressRoadClick=pointer.road&&pointer.dragging;pointer=undefined;host.style.cursor="grab"};
  const click=(event:MouseEvent)=>{if(suppressRoadClick){suppressRoadClick=false;event.preventDefault();event.stopPropagation()}};
  const dragStart=(event:DragEvent)=>{if(event.target instanceof Element&&event.target.closest('.city-road-surface'))event.preventDefault()};
  const zoomAt=(factor:number,x=0,y=0)=>{if(disposed)return;const max=Math.min(layer?.maxZoom?.(viewport)??5,view!=="terrain"?zoomBase*20:5),next=Math.min(max,Math.max(view!=="terrain"?minZoom:.35,viewport.zoom*factor)),ratio=next/viewport.zoom;viewport.panX=x-(x-viewport.panX)*ratio;viewport.panY=y-(y-viewport.panY)*ratio;viewport.zoom=next;onZoomChange?.(next/zoomBase);schedule()};
  const wheel=(event:WheelEvent)=>{event.preventDefault();const rect=host.getBoundingClientRect();zoomAt(Math.exp(-event.deltaY*.0015),event.clientX-rect.left-viewport.width/2,event.clientY-rect.top-viewport.height/2)};
  // Only the stable, focused scene host owns arrows; inputs and browser shortcuts keep theirs.
  const keydown=(event:KeyboardEvent)=>{
    if(disposed||view==="terrain"||event.target!==host||!host.matches(":focus")||event.altKey||event.ctrlKey||event.metaKey)return;
    if(event.key==='+'||event.key==='='||event.key==='-'){
      event.preventDefault();event.stopPropagation();zoomAt(event.key==='-'?.8:1.25);return;
    }
    if(event.shiftKey)return;
    const delta:Record<string,[number,number]>={ArrowLeft:[-40,0],ArrowRight:[40,0],ArrowUp:[0,-40],ArrowDown:[0,40]};
    const move=delta[event.key];if(!move)return;
    event.preventDefault();event.stopPropagation();viewport.panX+=move[0];viewport.panY+=move[1];schedule();
  };
  const visibility=()=>{if(document.hidden){pause();cancelAnimationFrame(raf);raf=0}else schedule()};
  host.style.touchAction="none";host.style.cursor="grab";host.addEventListener("pointerdown",down);host.addEventListener("pointermove",move);host.addEventListener("pointerup",up);host.addEventListener("pointercancel",up);host.addEventListener("lostpointercapture",up);host.addEventListener("click",click,true);host.addEventListener("dragstart",dragStart);host.addEventListener("wheel",wheel,{passive:false});host.addEventListener("keydown",keydown);document.addEventListener("visibilitychange",visibility);
  resize();theme();if(matchMedia("(prefers-reduced-motion: reduce)").matches){playing=false;timeline.skip()}void prepare();
  return{
    setRoadControls(controls,post){
      roadLayer.replaceChildren();roadAnchors=controls;returnSign=post;
      for(const {sign,surface}of controls)roadLayer.append(surface,sign);
      if(post)roadLayer.append(post);
      layer?.setRoadCount?.(controls.length);layer?.setRoadLabels?.(controls.map(road=>({name:road.label,mutual:road.mutual})),post?.dataset.cityLabel);positionRoads();schedule();
    },
    buildingAt(x,y){
      if(disposed||suspended||!progressiveCity)return;
      return layer?.buildingAt?.(x,y,viewport)?.map(index=>currentDays[index]).filter(day=>day.count>0);
    },
    highlightBuilding(point){
      if(disposed||suspended||!progressiveCity)return;
      layer?.highlightBuilding?.(point,viewport);
    },
    setVisible(visible){if(disposed)return;suspended=!visible;if(suspended){layer?.highlightBuilding?.(undefined,viewport);cancelAnimationFrame(raf);raf=0;pointer=undefined;host.style.cursor="grab"}else resize()},
    async setView(mode,signal){
      if(disposed||mode===view)return;
      signal?.throwIfAborted();
      if(!progressiveCity){
        // 旧预览可在City/Terrain间复用City图片；进入或离开Town必须换资源目录。
        if(view==='town'||mode==='town'){
          layer?.dispose();layer=undefined;
          if(images)closeCityImages(images);else if(assetPromise)void assetPromise.then(closeCityImages,()=>{});
          images=undefined;assetPromise=undefined;cityScene=undefined;
        }
        view=mode;await prepare();return;
      }
      if(mode==='terrain')return;
      await assetPromise;assetAbort.signal.throwIfAborted();signal?.throwIfAborted();
      const token=++generation;
      const plan=planMap(mode,currentDays,joinedDate);
      let ready:CityImages|undefined,next:LandscapeView|undefined;
      try{
        ready=await (mode==='town'?loadTownImages(townAssetBase,plan.scene.keys,assetAbort.signal):loadCityImages(assetBase,[...plan.scene.keys,'natural-ground'],assetAbort.signal));
        assetAbort.signal.throwIfAborted();signal?.throwIfAborted();
        if(disposed||token!==generation)throw new DOMException('城市已关闭或替换。','AbortError');
        next=createCityView(plan.scene,ready,currentDays.length,plan.ground);
        configureCanvas(next,mode);viewport.zoom=zoomBase;viewport.panX=viewport.panY=0;next.draw(1,viewport);
        const previous=layer,previousImages=images;
        if(previous)previous.canvas.replaceWith(next.canvas);else host.append(next.canvas);
        layer=next;next=undefined;images=ready;ready=undefined;cityScene=plan.scene;view=mode;
        assetPromise=Promise.resolve(images);revealedDays=currentDays.length;playing=false;preparationError=undefined;
        previous?.dispose();if(previousImages)closeCityImages(previousImages);
        labelCity();positionRoads();zoomAt(1);notify();
      }catch(error){next?.dispose();if(ready)closeCityImages(ready);throw error}
    },
    zoomBy:zoomAt,
    zoomToMax(){zoomAt((layer?.maxZoom?.(viewport)??5)/viewport.zoom)},
    resetView(){viewport.zoom=view!=="terrain"?minZoom:1;viewport.panX=viewport.panY=0;onZoomChange?.(viewport.zoom/zoomBase);schedule()},
    pause,
    resume(){if(disposed||blocked||state().status==="completed")return;playing=true;anchored=false;schedule()},
    skip(){if(disposed)return;playing=false;if(progressiveCity){revealedDays=currentDays.length;labelCity()}else timeline.skip();schedule();notify()},
    replay(){if(disposed||progressiveCity)return;timeline.replay(performance.now());timeline.pause();playing=true;anchored=false;schedule();notify()},
    async updateDays(nextDays,joinedOn){
      if(!progressiveCity)throw new Error("逐年填入仅适用于预留年份的City。");
      if(disposed)throw new DOMException("城市已关闭。","AbortError");
      const token=++generation;
      // 已就绪快照也让出一次任务，避免连续微任务批次阻塞输入与绘制。
      await new Promise<void>(resolve=>setTimeout(resolve,0));
      assetAbort.signal.throwIfAborted();
      if(disposed||token!==generation)throw new DOMException("城市已关闭或替换。","AbortError");
      const organic=planMap(view==='town'?'town':'city',nextDays,joinedOn);
      const nextScene=organic.scene;
      let added:CityImages|undefined,next:LandscapeView|undefined,merged=false;
      try{
        await assetPromise;
        const missing=nextScene.keys.filter(id=>!images?.[id]);
        if(missing.length)added=await (view==='town'?loadTownImages(townAssetBase,missing,assetAbort.signal):loadCityImages(assetBase,missing,assetAbort.signal));
        assetAbort.signal.throwIfAborted();
        if(disposed||token!==generation)throw new DOMException("城市已关闭或替换。","AbortError");
        images??={};if(added)Object.assign(images,added);merged=true;
        const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
        const prefix=reduced?nextDays.length:Math.min(Math.floor(revealedDays),nextDays.length);
        next=createCityView(nextScene,images,prefix,organic.ground);configureCanvas(next);
        // 新层先完成一次绘制再交换，素材准备期间原图和取景始终保留。
        next.draw(nextDays.length?prefix/nextDays.length:1,viewport);
        const previous=layer;
        if(previous)previous.canvas.replaceWith(next.canvas);else host.append(next.canvas);
        layer=next;next=undefined;previous?.dispose();cityScene=nextScene;
        currentDays=nextDays;joinedDate=joinedOn;revealedDays=prefix;playing=prefix<nextDays.length;anchored=false;preparationError=undefined;
        labelCity();positionRoads();notify();if(playing)schedule();
      }catch(error){next?.dispose();if(added&&!merged)closeCityImages(added);throw error}
    },
    dispose(){
      if(disposed)return;disposed=true;generation++;assetAbort.abort();playing=false;timeline.pause();cancelAnimationFrame(raf);raf=0;observer.disconnect();themeObserver.disconnect();preference.removeEventListener("change",theme);document.removeEventListener("visibilitychange",visibility);
      host.removeEventListener("pointerdown",down);host.removeEventListener("pointermove",move);host.removeEventListener("pointerup",up);host.removeEventListener("pointercancel",up);host.removeEventListener("lostpointercapture",up);host.removeEventListener("click",click,true);host.removeEventListener("dragstart",dragStart);host.removeEventListener("wheel",wheel);host.removeEventListener("keydown",keydown);layer?.dispose();layer=undefined;
      roadLayer.remove();roadAnchors=[];returnSign=undefined;
      if(images)closeCityImages(images);else if(assetPromise)void assetPromise.then(closeCityImages,()=>{});
    },
  };
}
