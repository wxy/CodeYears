import type { DailyContribution } from "../data/types";
import { createTimeline } from "../timeline/controller";
import type { TimelineState } from "../timeline/types";
import { closeCityImages, loadCityImages, type CityImages } from "./city-assets";
import { createCityView, planCityScene, type CityScene } from "./city-view";
import { CITY_OUTSKIRT_IDS } from "./city-outskirts";
import type { LandscapeView, LandscapeViewport, ViewMode } from "./types";

export interface ContributionLandscape {
  setView(view: ViewMode): void;
  zoomBy(factor: number): void;
  resetView(): void;
  pause(): void;
  resume(): void;
  skip(): void;
  replay(): void;
  /** 渐进City：该批素材就绪并交换画面后resolve，不等待短填入动画。 */
  updateDays(days: readonly DailyContribution[]): Promise<void>;
  dispose(): void;
}

/** 两种引擎共享播放/缩放/平移；City 不加载 Three.js、不创建 WebGL。 */
export function createLandscape(host: HTMLElement, days: readonly DailyContribution[], onChange: (state: TimelineState, error?: string, detail?: string) => void, initialView: ViewMode = "city", assetBase = new URL(/* @vite-ignore */ "./assets/city/", import.meta.url).href, cityWonders = true, reservedYears?: readonly number[]): ContributionLandscape {
  const progressiveCity=initialView==="city"&&reservedYears!==undefined;
  let currentDays=days,revealedDays=0,revealFrom=0,revealStarted=0;
  const timeline=createTimeline(days.length,initialView==="city"?3000:8000),viewport:LandscapeViewport={width:1,height:1,dpr:Math.min(devicePixelRatio,1.5),zoom:1,panX:0,panY:0,dark:false};
  let view=initialView,layer:LandscapeView|undefined,images:CityImages|undefined,assetPromise:Promise<CityImages>|undefined;
  let cityScene:CityScene|undefined;const assetAbort=new AbortController();
  let disposed=false,blocked=false,generation=0,raf=0,playing=!progressiveCity,anchored=false;
  let preparationError: string | undefined;
  const state=():TimelineState=>progressiveCity?{status:revealedDays>=currentDays.length?"completed":playing?"playing":"paused",revealedDays:Math.floor(revealedDays),totalDays:currentDays.length}:timeline.getState();
  const notify=(error?:string)=>onChange(state(),error,preparationError??layer?.description()??`正在准备${view==="city"?"建筑素材":"连续山脉"}…`);
  const labelCity=()=>{
    if(!progressiveCity||!layer)return;
    const text=!currentDays.length?"贡献之城空场地，等待读取所选年份贡献。":playing?`贡献之城，正在将已读取的 ${currentDays.length} 天数据填入。`:`贡献之城，已呈现 ${currentDays.length} 天贡献。`;
    layer.canvas.setAttribute("aria-label",`${text}固定视角，拖动平移，滚轮缩放。`);
  };
  const configureCanvas=(next:LandscapeView)=>{
    next.canvas.style.cssText="display:block;width:100%;height:100%;background:transparent";
    next.canvas.setAttribute("aria-label",`${view==="city"?"贡献之城":"连续时光山脉"}，固定视角。拖动平移，滚轮缩放。`);
  };
  const schedule=()=>{if(!disposed&&!blocked&&!document.hidden&&!raf)raf=requestAnimationFrame(tick)};
  function tick(now:number){
    raf=0;if(disposed||blocked||document.hidden||!layer)return;
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
    notify();if(playing)schedule();
  }
  const pause=()=>{playing=false;timeline.pause();anchored=false;notify()};
  async function prepare(){
    const token=++generation;layer?.dispose();layer=undefined;timeline.pause();anchored=false;blocked=false;preparationError=undefined;notify();
    try{
      if(view==="city"){
        cityScene??=planCityScene(days,cityWonders,reservedYears);
        if(progressiveCity){
          images={};layer=createCityView(cityScene,images,0);configureCanvas(layer);host.append(layer.canvas);
          layer.draw(1,viewport);labelCity();schedule();notify();
          // 场地先同步显示；本地自然图片独立于网络贡献加载，且与后续批次共用。
          assetPromise=loadCityImages(assetBase,CITY_OUTSKIRT_IDS,assetAbort.signal).then(ready=>{
            if(disposed){closeCityImages(ready);throw new DOMException('城市已关闭。','AbortError')}
            Object.assign(images!,ready);return ready;
          });
          await assetPromise;if(disposed||token!==generation)return;
          const previous=layer;layer=createCityView(cityScene,images,0);previous.canvas.replaceWith(layer.canvas);previous.dispose();
        }
        else{
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
  const resize=()=>{viewport.width=Math.max(host.clientWidth,1);viewport.height=Math.max(host.clientHeight,1);schedule()};
  const observer=new ResizeObserver(resize);observer.observe(host);
  const preference=matchMedia("(prefers-color-scheme: dark)");
  const theme=()=>{
    const mode=document.documentElement.getAttribute("data-color-mode"),preview=document.documentElement.getAttribute("data-preview-theme");
    viewport.dark=preview==="dark"||(preview!=="light"&&(mode==="dark"||(mode!=="light"&&preference.matches)));schedule();
  };
  const themeObserver=new MutationObserver(theme);themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:["data-color-mode","data-dark-theme","data-light-theme","data-preview-theme"]});preference.addEventListener("change",theme);
  let pointer:{id:number;x:number;y:number}|undefined;
  const down=(event:PointerEvent)=>{if(pointer)return;pointer={id:event.pointerId,x:event.clientX,y:event.clientY};host.setPointerCapture(event.pointerId);host.style.cursor="grabbing"};
  const move=(event:PointerEvent)=>{if(!pointer||pointer.id!==event.pointerId)return;viewport.panX+=event.clientX-pointer.x;viewport.panY+=event.clientY-pointer.y;pointer.x=event.clientX;pointer.y=event.clientY;schedule()};
  const up=(event:PointerEvent)=>{if(pointer?.id!==event.pointerId)return;pointer=undefined;host.style.cursor="grab"};
  const zoomAt=(factor:number,x=0,y=0)=>{if(disposed)return;const next=Math.min(layer?.maxZoom?.(viewport)??5,Math.max(.35,viewport.zoom*factor)),ratio=next/viewport.zoom;viewport.panX=x-(x-viewport.panX)*ratio;viewport.panY=y-(y-viewport.panY)*ratio;viewport.zoom=next;schedule()};
  const wheel=(event:WheelEvent)=>{event.preventDefault();const rect=host.getBoundingClientRect();zoomAt(Math.exp(-event.deltaY*.0015),event.clientX-rect.left-viewport.width/2,event.clientY-rect.top-viewport.height/2)};
  const visibility=()=>{if(document.hidden){pause();cancelAnimationFrame(raf);raf=0}else schedule()};
  host.style.touchAction="none";host.style.cursor="grab";host.addEventListener("pointerdown",down);host.addEventListener("pointermove",move);host.addEventListener("pointerup",up);host.addEventListener("pointercancel",up);host.addEventListener("lostpointercapture",up);host.addEventListener("wheel",wheel,{passive:false});document.addEventListener("visibilitychange",visibility);
  resize();theme();if(matchMedia("(prefers-reduced-motion: reduce)").matches){playing=false;timeline.skip()}void prepare();
  return{
    setView(next){if(disposed||next===view||progressiveCity)return;view=next;void prepare()},
    zoomBy:zoomAt,
    resetView(){viewport.zoom=1;viewport.panX=viewport.panY=0;schedule()},
    pause,
    resume(){if(disposed||blocked||state().status==="completed")return;playing=true;anchored=false;schedule()},
    skip(){if(disposed)return;playing=false;if(progressiveCity){revealedDays=currentDays.length;labelCity()}else timeline.skip();schedule();notify()},
    replay(){if(disposed||progressiveCity)return;timeline.replay(performance.now());timeline.pause();playing=true;anchored=false;schedule();notify()},
    async updateDays(nextDays){
      if(!progressiveCity)throw new Error("逐年填入仅适用于预留年份的City。");
      if(disposed)throw new DOMException("城市已关闭。","AbortError");
      const token=++generation,nextScene=planCityScene(nextDays,cityWonders,reservedYears);
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
        next=createCityView(nextScene,images,prefix);configureCanvas(next);
        // 新层先完成一次绘制再交换，素材准备期间原图和取景始终保留。
        next.draw(nextDays.length?prefix/nextDays.length:1,viewport);
        const previous=layer;
        if(previous)previous.canvas.replaceWith(next.canvas);else host.append(next.canvas);
        layer=next;next=undefined;previous?.dispose();cityScene=nextScene;
        currentDays=nextDays;revealedDays=prefix;playing=prefix<nextDays.length;anchored=false;preparationError=undefined;
        labelCity();notify();if(playing)schedule();
      }catch(error){next?.dispose();if(added&&!merged)closeCityImages(added);throw error}
    },
    dispose(){
      if(disposed)return;disposed=true;generation++;assetAbort.abort();playing=false;timeline.pause();cancelAnimationFrame(raf);raf=0;observer.disconnect();themeObserver.disconnect();preference.removeEventListener("change",theme);document.removeEventListener("visibilitychange",visibility);
      host.removeEventListener("pointerdown",down);host.removeEventListener("pointermove",move);host.removeEventListener("pointerup",up);host.removeEventListener("pointercancel",up);host.removeEventListener("lostpointercapture",up);host.removeEventListener("wheel",wheel);layer?.dispose();layer=undefined;
      if(images)closeCityImages(images);else if(assetPromise)void assetPromise.then(closeCityImages,()=>{});
    },
  };
}
