import type { DailyContribution } from "../data/types";
import type { ProfileOrganization } from "../data/profile-places";
import { createTimeline } from "../timeline/controller";
import type { TimelineState } from "../timeline/types";
import { closeCityImages, loadCityImages, type CityImages } from "./city-assets";
import { joiningTowerId } from "./city-building-style";
import { createCityView, planCityScene, type CityScene } from "./city-view";
import { organizationFrameId, prepareOrganizationPoster, type OrganizationPoster } from "./city-organization-boards";
import { createOrganizationLinks } from "./city-organization-links";
import { planOrganicCity, createOrganicGround } from "./city-organic-layout";
import { CITY_SCENERY_IDS } from "./city-outskirts";
import type { CityRoadLabel, LandscapeView, LandscapeViewport, ViewMode } from "./types";

export interface CityRoadControl extends CityRoadLabel { sign: HTMLAnchorElement | HTMLButtonElement; surface?: HTMLAnchorElement }
export interface CityReturnControl { sign:HTMLElement; surface:HTMLAnchorElement; label:string }

export interface ContributionLandscape {
  setOrganizations(organizations:readonly ProfileOrganization[], directoryLabel?:string):void;
  setTrafficConnections(connections:number):void;
  setRoadControls(controls: readonly CityRoadControl[], returnPost?:CityReturnControl): void;
  buildingAt(x: number, y: number): readonly DailyContribution[] | undefined;
  stepBuilding(backward: boolean): {x:number;y:number} | undefined;
  highlightBuilding(point?: {x:number;y:number}): void;
  setView(view: ViewMode): Promise<void>;
  zoomBy(factor: number): void;
  zoomToMax(): void;
  resetView(overlays?:{top:HTMLElement;bottom:HTMLElement}): void;
  pause(): void;
  resume(): void;
  skip(): void;
  replay(): void;
  /** 隐藏时停止绘制，保留当前场景、素材和取景。 */
  setVisible(visible: boolean, trafficSeed?: number): void;
  /** 仅为已确认的注册日准备纪念物。失败可继续按普通贡献规划这一批。 */
  prepareJoiningTower(signal: AbortSignal): Promise<boolean>;
  /** 渐进City：该批素材就绪并交换画面后resolve，不等待短填入动画。 */
  updateDays(days: readonly DailyContribution[], joinedOn?:string): Promise<void>;
  dispose(): void;
}

/** 两种引擎共享播放/缩放/平移；缩放通知按面板的100%基准归一化。City不创建WebGL。 */
export function createLandscape(host: HTMLElement, days: readonly DailyContribution[], onChange: (state: TimelineState, error?: string, detail?: string) => void, initialView: ViewMode = "city", assetBase = new URL(/* @vite-ignore */ "./assets/city/", import.meta.url).href, cityWonders = true, reservedYears?: readonly number[], onZoomChange?: (zoom: number) => void, namingOriginYear?: number, trafficSeed = 0, onExitCount?: (count:number)=>void): ContributionLandscape {
  const progressiveCity=initialView==="city"&&reservedYears!==undefined;
  // 原City的150%作为新100%；City缩放固定下限50%，上限不超过2000%。
  const zoomBase=progressiveCity?1.875:initialView==="city"?1.5:1;
  const minZoom=zoomBase*.5;
  let currentDays=days,revealedDays=0,revealFrom=0,revealStarted=0;
  const timeline=createTimeline(days.length,initialView==="city"?3000:8000),viewport:LandscapeViewport={width:1,height:1,dpr:Math.min(devicePixelRatio,1.5),zoom:zoomBase,zoomBase,panX:0,panY:0,dark:false};
  let view=initialView,layer:LandscapeView|undefined,images:CityImages|undefined,assetPromise:Promise<CityImages>|undefined;
  let planVehicles:ReturnType<typeof planOrganicCity>['planVehicles']|undefined;
  let trafficConnections=0;
  let cityScene:CityScene|undefined;const assetAbort=new AbortController();
  let disposed=false,blocked=false,suspended=false,generation=0,raf=0,playing=!progressiveCity,anchored=false;
  let preparationError: string | undefined;
  const roadLayer=document.createElement('div');roadLayer.className='city-road-links';host.append(roadLayer);
  const organizationLinks=createOrganizationLinks(host,(dx,dy)=>{
    inOverview=false;viewport.panX+=dx;viewport.panY+=dy;schedule();
  });
  let posters:readonly OrganizationPoster[]=[];
  let frameImages:CityImages|undefined,frameRequested=false;
  let roadAnchors:readonly CityRoadControl[]=[],returnSign:CityReturnControl|undefined;
  let inOverview=false;
  let cityZoomFloor=minZoom;
  let overviewOverlays:{top:HTMLElement;bottom:HTMLElement} | undefined;
  const refitOverview=(target=layer)=>{
    if(!inOverview)return;
    const top=overviewOverlays?.top,bottom=overviewOverlays?.bottom;
    const topInset=top?.offsetHeight ? top.offsetTop+top.offsetHeight : 0;
    const bottomInset=bottom?.offsetHeight ? viewport.height-bottom.offsetTop : 0;
    const fit=target?.fitOverview?.(viewport,topInset,bottomInset);
    Object.assign(viewport,fit??{zoom:view==="city"?minZoom:1,panX:0,panY:0});
    cityZoomFloor=Math.min(minZoom,viewport.zoom);
    onZoomChange?.(viewport.zoom/zoomBase);
  };
  const placeRoadTarget=(element:HTMLElement,polygon:readonly [number,number][])=>{
    element.hidden=!polygon.length;if(!polygon.length)return;
    const xs=polygon.map(p=>p[0]),ys=polygon.map(p=>p[1]),left=Math.min(...xs),top=Math.min(...ys),width=Math.max(...xs)-left,height=Math.max(...ys)-top;
    Object.assign(element.style,{left:`${left}px`,top:`${top}px`,width:`${width}px`,height:`${height}px`,clipPath:`polygon(${polygon.map(([x,y])=>`${(x-left)/width*100}% ${(y-top)/height*100}%`).join(',')})`});
  };
  const positionRoads=()=>{
    organizationLinks.position(layer,viewport);
    const exits=layer?.roadExits?.(viewport)??[];
    for(const [slot,{sign,surface}]of roadAnchors.entries()){
      const board=exits[slot]?.board??[];
      placeRoadTarget(sign,board);
      if(surface)placeRoadTarget(surface,exits[slot]?.polygon??[]);
    }
    if(returnSign){const back=layer?.returnPost?.(viewport);placeRoadTarget(returnSign.sign,back?.board??[]);placeRoadTarget(returnSign.surface,back?.polygon??[])}
  };
  const state=():TimelineState=>progressiveCity?{status:revealedDays>=currentDays.length?"completed":playing?"playing":"paused",revealedDays:Math.floor(revealedDays),totalDays:currentDays.length}:timeline.getState();
  const notify=(error?:string)=>onChange(state(),error,preparationError??layer?.description()??`正在准备${view==="terrain"?"连续山脉":"建筑素材"}…`);
  const labelCity=()=>{
    if(!progressiveCity||!layer)return;
    const text=!currentDays.length?`贡献之城空场地，等待读取所选年份贡献。`:playing?`贡献之城，正在将已读取的 ${currentDays.length} 天数据填入。`:`贡献之城，已呈现 ${currentDays.length} 天贡献。`;
    layer.canvas.setAttribute("aria-label",`${text}固定视角，拖动平移，滚轮缩放。`);
  };
  const configureCanvas=(next:LandscapeView)=>{
    if(next.exitCount!==undefined)onExitCount?.(next.exitCount);
    next.setRoadLabels?.(roadAnchors,returnSign?.label);
    if(posters.length)next.setOrganizationPosters?.(posters,frameImages?.[organizationFrameId]);
    refitOverview(next);
    next.canvas.style.cssText="display:block;width:100%;height:100%;background:transparent";
    next.canvas.setAttribute("aria-label",`${view==="city"?"贡献之城":"连续时光山脉"}，固定视角。拖动平移，滚轮缩放。`);
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
      if(view==="city"){
        if(progressiveCity){
          const plan=planOrganicCity(days,90,reservedYears!,cityWonders,namingOriginYear,undefined,trafficSeed),ground=createOrganicGround(plan);
          cityScene=plan.scene;
          images={};layer=createCityView(cityScene,images,0,ground);configureCanvas(layer);host.append(layer.canvas);
          layer.draw(1,viewport);labelCity();schedule();notify();
          // 场地先同步显示；本地自然图片独立于网络贡献加载，且与后续批次共用。
          assetPromise=loadCityImages(assetBase,[...CITY_SCENERY_IDS,"direction-board-x","direction-board-z"],assetAbort.signal).then(ready=>{
            if(disposed){closeCityImages(ready);throw new DOMException('城市已关闭。','AbortError')}
            Object.assign(images!,ready);return ready;
          });
          await assetPromise;if(disposed||token!==generation)return;
          const previous=layer;layer=createCityView(cityScene,images,0,ground);configureCanvas(layer);
          previous.canvas.replaceWith(layer.canvas);previous.dispose();schedule();
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
  const resize=()=>{
    if(suspended)return;
    viewport.width=Math.max(host.clientWidth,1);viewport.height=Math.max(host.clientHeight,1);
    if(inOverview){refitOverview();schedule()}else zoomAt(1);
  };
  const observer=new ResizeObserver(entries=>{
    if(inOverview||entries.some(entry=>entry.target===host))resize();
  });
  observer.observe(host);
  const preference=matchMedia("(prefers-color-scheme: dark)");
  const theme=()=>{
    const mode=document.documentElement.getAttribute("data-color-mode"),preview=document.documentElement.getAttribute("data-preview-theme");
    viewport.dark=preview==="dark"||(preview!=="light"&&(mode==="dark"||(mode!=="light"&&preference.matches)));schedule();
  };
  const themeObserver=new MutationObserver(theme);themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:["data-color-mode","data-dark-theme","data-light-theme","data-preview-theme"]});preference.addEventListener("change",theme);
  let pointer:{id:number;x:number;y:number;dragging:boolean;road:boolean}|undefined,suppressRoadClick=false;
  const down=(event:PointerEvent)=>{
    if(pointer||event.button!==0)return;
    const target=event.target instanceof Element?event.target:undefined,road=!!target?.closest('.city-road-surface,button.city-road-sign');
    if(!road&&target?.closest('a,button,input,.city-org-directory'))return;
    suppressRoadClick=false;pointer={id:event.pointerId,x:event.clientX,y:event.clientY,dragging:!road,road};
    if(!road){host.setPointerCapture(event.pointerId);host.style.cursor="grabbing"}
  };
  const move=(event:PointerEvent)=>{
    if(!pointer||pointer.id!==event.pointerId)return;
    if(!pointer.dragging){
      if(Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)<4)return;
      pointer.dragging=true;host.setPointerCapture(event.pointerId);host.style.cursor="grabbing";
    }
    inOverview=false;viewport.panX+=event.clientX-pointer.x;viewport.panY+=event.clientY-pointer.y;pointer.x=event.clientX;pointer.y=event.clientY;schedule();
  };
  const up=(event:PointerEvent)=>{if(pointer?.id!==event.pointerId)return;suppressRoadClick=pointer.road&&pointer.dragging;pointer=undefined;host.style.cursor="grab"};
  const click=(event:MouseEvent)=>{if(suppressRoadClick){suppressRoadClick=false;event.preventDefault();event.stopPropagation()}};
  const dragStart=(event:DragEvent)=>{if(event.target instanceof Element&&event.target.closest('.city-road-surface'))event.preventDefault()};
  const zoomAt=(factor:number,x=0,y=0)=>{
    if(disposed)return;
    const max=Math.min(layer?.maxZoom?.(viewport)??5,view==="city"?zoomBase*20:5);
    // 全景有时需要小于普通的 50% 下限。从这个实际倍率连续放大。
    const min=view==="city"?cityZoomFloor:.35;
    const next=Math.min(max,Math.max(min,viewport.zoom*factor));
    if(factor!==1){
      if(next===viewport.zoom)return;
      inOverview=false;
    }
    const ratio=next/viewport.zoom;
    viewport.panX=x-(x-viewport.panX)*ratio;viewport.panY=y-(y-viewport.panY)*ratio;viewport.zoom=next;onZoomChange?.(next/zoomBase);schedule();
  };
  const wheel=(event:WheelEvent)=>{
    if(!event.deltaY||event.target instanceof Element&&event.target.closest('.city-org-directory'))return;
    event.preventDefault();
    const rect = host.getBoundingClientRect();
    zoomAt(Math.exp(-event.deltaY*.0015),event.clientX-rect.left-viewport.width/2,event.clientY-rect.top-viewport.height/2);
  };
  // Only the stable, focused scene host owns arrows; inputs and browser shortcuts keep theirs.
  const keydown=(event:KeyboardEvent)=>{
    if(disposed||view==="terrain"||event.target!==host||!host.matches(":focus")||event.altKey||event.ctrlKey||event.metaKey)return;
    if(event.key==='+'||event.key==='='||event.key==='-'){
      event.preventDefault();event.stopPropagation();zoomAt(event.key==='-'?.8:1.25);return;
    }
    if(event.shiftKey)return;
    const delta:Record<string,[number,number]>={ArrowLeft:[-40,0],ArrowRight:[40,0],ArrowUp:[0,-40],ArrowDown:[0,40]};
    const move=delta[event.key];if(!move)return;
    event.preventDefault();event.stopPropagation();inOverview=false;viewport.panX+=move[0];viewport.panY+=move[1];schedule();
  };
  const visibility = () => {
    if (!document.hidden) { schedule(); return; }
    cancelAnimationFrame(raf);
    raf = 0;
    // 浏览器标签页暂离只冻结逐年填入，回到同一画布时接着播放。
    if (progressiveCity) anchored = false;
    else pause();
  };
  host.style.touchAction="none";host.style.cursor="grab";host.addEventListener("pointerdown",down);host.addEventListener("pointermove",move);host.addEventListener("pointerup",up);host.addEventListener("pointercancel",up);host.addEventListener("lostpointercapture",up);host.addEventListener("click",click,true);host.addEventListener("dragstart",dragStart);host.addEventListener("wheel",wheel,{passive:false});host.addEventListener("keydown",keydown);document.addEventListener("visibilitychange",visibility);
  resize();theme();if(matchMedia("(prefers-reduced-motion: reduce)").matches){playing=false;timeline.skip()}void prepare();
  return{
    setTrafficConnections(connections){
      if(disposed||trafficConnections===connections)return;
      trafficConnections=connections;
      if(planVehicles)layer?.setVehicles?.(planVehicles(trafficSeed,trafficConnections));
      schedule();
    },
    setOrganizations(organizations,directoryLabel='Organizations'){
      if(disposed)return;
      posters=organizations.map(prepareOrganizationPoster);
      const focused=organizationLinks.setPosters(posters,directoryLabel);
      layer?.setOrganizationPosters?.(posters,frameImages?.[organizationFrameId]);refitOverview();
      organizationLinks.position(layer,viewport,focused);schedule();
      if(posters.length&&!frameRequested){
        frameRequested=true;
        void loadCityImages(assetBase,[organizationFrameId],assetAbort.signal).then(ready=>{
          if(disposed){closeCityImages(ready);return}
          frameImages=ready;
          layer?.setOrganizationPosters?.(posters,ready[organizationFrameId]);
          refitOverview();schedule();
        },error=>{
          frameRequested=false;
          if(!disposed)notify(error.message);
        });
      }
    },
    setRoadControls(controls,post){
      roadLayer.replaceChildren();roadAnchors=controls;returnSign=post;
      for(const {sign,surface}of controls){
        if(surface)roadLayer.append(surface);
        roadLayer.append(sign);
      }
      if(post)roadLayer.append(post.surface,post.sign);
      layer?.setRoadLabels?.(controls,post?.label);refitOverview();positionRoads();schedule();
    },
    buildingAt(x,y){
      if(disposed||suspended||!progressiveCity)return;
      return layer?.buildingAt?.(x,y,viewport)?.map(index=>currentDays[index]).filter(day=>day.count>0);
    },
    stepBuilding(backward){
      if (!disposed && !suspended && progressiveCity) return layer?.stepBuilding?.(backward,viewport);
    },
    highlightBuilding(point){
      if(disposed||suspended||!progressiveCity)return;
      layer?.highlightBuilding?.(point,viewport);
    },
    setVisible(visible, nextSeed = trafficSeed){
      if(disposed)return;
      suspended=!visible;
      if(suspended){layer?.highlightBuilding?.(undefined,viewport);cancelAnimationFrame(raf);raf=0;pointer=undefined;host.style.cursor="grab";return}
      if(nextSeed!==trafficSeed){
        trafficSeed=nextSeed;
        if(planVehicles)layer?.setVehicles?.(planVehicles(trafficSeed,trafficConnections));
      }
      resize();
    },
    async setView(mode){
      if(disposed||mode===view||progressiveCity)return;
      inOverview=false;view=mode;
      await prepare();
    },
    zoomBy:zoomAt,
    zoomToMax(){zoomAt((layer?.maxZoom?.(viewport)??5)/viewport.zoom)},
    resetView(overlays){
      inOverview=true;overviewOverlays=overlays;
      if(overlays){observer.observe(overlays.top);observer.observe(overlays.bottom)}
      refitOverview();schedule();
    },
    pause,
    resume(){if(disposed||blocked||state().status==="completed")return;playing=true;anchored=false;schedule()},
    skip(){if(disposed)return;playing=false;if(progressiveCity){revealedDays=currentDays.length;labelCity()}else timeline.skip();schedule();notify()},
    replay(){if(disposed||progressiveCity)return;timeline.replay(performance.now());timeline.pause();playing=true;anchored=false;schedule();notify()},
    async prepareJoiningTower(signal) {
      if (images?.[joiningTowerId]) return true;
      const pending = AbortSignal.any([signal, assetAbort.signal]);
      try {
        const loaded = await loadCityImages(assetBase, [joiningTowerId], pending);
        if (disposed) closeCityImages(loaded);
        else Object.assign(images!, loaded);
        return !disposed;
      } catch {
        pending.throwIfAborted();
        return false;
      }
    },
    async updateDays(nextDays,joinedOn){
      if(!progressiveCity)throw new Error("逐年填入仅适用于预留年份的City。");
      if(disposed)throw new DOMException("城市已关闭。","AbortError");
      const token=++generation;
      // 已就绪快照也让出一次任务，避免连续微任务批次阻塞输入与绘制。
      await new Promise<void>(resolve=>setTimeout(resolve,0));
      assetAbort.signal.throwIfAborted();
      if(disposed||token!==generation)throw new DOMException("城市已关闭或替换。","AbortError");
      const plannedSeed=trafficSeed,plannedConnections=trafficConnections;
      const organic=planOrganicCity(nextDays,90,reservedYears!,cityWonders,namingOriginYear,joinedOn,plannedSeed,plannedConnections);
      const nextScene=organic.scene;
      let added:CityImages|undefined,next:LandscapeView|undefined,merged=false;
      try{
        await assetPromise;
        const missing=nextScene.keys.filter(id=>!images?.[id]);
        if(missing.length)added=await loadCityImages(assetBase,missing,assetAbort.signal);
        assetAbort.signal.throwIfAborted();
        if(disposed||token!==generation)throw new DOMException("城市已关闭或替换。","AbortError");
        images??={};if(added)Object.assign(images,added);merged=true;
        const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
        const prefix=reduced?nextDays.length:Math.min(Math.floor(revealedDays),nextDays.length);
        next=createCityView(nextScene,images,prefix,createOrganicGround(organic));configureCanvas(next);
        // 纪念物素材可能跨过一次返回城市；交换画面前使用当前访问的车阵。
        if(plannedSeed!==trafficSeed||plannedConnections!==trafficConnections)next.setVehicles?.(organic.planVehicles(trafficSeed,trafficConnections));
        // 新层先完成一次绘制再交换，素材准备期间原图和取景始终保留。
        next.draw(nextDays.length?prefix/nextDays.length:1,viewport);
        const previous=layer;
        if(previous)previous.canvas.replaceWith(next.canvas);else host.append(next.canvas);
        layer=next;next=undefined;previous?.dispose();cityScene=nextScene;planVehicles=organic.planVehicles;
        currentDays=nextDays;revealedDays=prefix;playing=prefix<nextDays.length;anchored=false;preparationError=undefined;
        labelCity();positionRoads();notify();if(playing)schedule();
      }catch(error){next?.dispose();if(added&&!merged)closeCityImages(added);throw error}
    },
    dispose(){
      if(disposed)return;disposed=true;generation++;assetAbort.abort();playing=false;timeline.pause();cancelAnimationFrame(raf);raf=0;observer.disconnect();themeObserver.disconnect();preference.removeEventListener("change",theme);document.removeEventListener("visibilitychange",visibility);
      host.removeEventListener("pointerdown",down);host.removeEventListener("pointermove",move);host.removeEventListener("pointerup",up);host.removeEventListener("pointercancel",up);host.removeEventListener("lostpointercapture",up);host.removeEventListener("click",click,true);host.removeEventListener("dragstart",dragStart);host.removeEventListener("wheel",wheel);host.removeEventListener("keydown",keydown);layer?.dispose();layer=undefined;
      roadLayer.remove();roadAnchors=[];returnSign=undefined;
      organizationLinks.dispose();posters=[];
      if(frameImages)closeCityImages(frameImages);
      if(images)closeCityImages(images);else if(assetPromise)void assetPromise.then(closeCityImages,()=>{});
    },
  };
}
