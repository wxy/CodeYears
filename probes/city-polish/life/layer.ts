import type { CityImages } from '../../../src/renderers/city-assets';
import type { Track } from './planning';
import { project } from './planning';

/** One-shot sprite copies + at most two transforms. No main canvas reference or renderer callback. */
export function createLifeLayer(host:HTMLElement,tracks:readonly Track[],images:CityImages){
  let requested=0,active=false,raf=0,last:number|undefined,elapsed=0,disposed=false;
  let transform={scale:1,x:(x:number)=>x,y:(y:number)=>y},width=0,height=0;
  const intervals:number[]=[],costs:number[]=[];
  const stats={frames:0,spriteUploads:0,visible:0,elapsed:0};
  const sprites=tracks.map(t=>{
    const s=images[t.id],c=document.createElement('canvas');c.width=s.canvas.width;c.height=s.canvas.height;
    c.getContext('2d')!.drawImage(s.canvas,0,0);stats.spriteUploads++;host.append(c);c.hidden=true;return {t,s,c};
  });
  function paint(){
    stats.visible=0;
    sprites.forEach(({t,s,c},i)=>{
      if(i>=requested||!active){c.hidden=true;return;}
      const phase=((elapsed*.7/t.length+i*.173)%1+1)%1;
      const [px,py]=project(t.x+t.dx*t.length*phase-s.nativeWidth/2,t.z+t.dz*t.length*phase-s.nativeDepth/2);
      const x=transform.x(px+s.left),y=transform.y(py+s.top),w=s.width*transform.scale,h=s.height*transform.scale;
      c.hidden=x+w<0||x>width||y+h<0||y>height;
      if(c.hidden)return;
      stats.visible++;
      c.style.width=`${w}px`;c.style.height=`${h}px`;c.style.transform=`translate(${x}px,${y}px)`;
      c.style.zIndex=String(Math.round((t.x+t.dx*t.length*phase+t.z+t.dz*t.length*phase)*1000));
      c.style.opacity=String(Math.min(1,phase/.12,(1-phase)/.12));
    });
  }
  function tick(now:number){
    raf=0;if(disposed||!active||!requested)return;
    const start=performance.now();
    if(last!==undefined){const dt=now-last;elapsed+=Math.min(dt,100)/1000;intervals.push(dt);if(intervals.length>1200)intervals.shift();}
    last=now;stats.elapsed=elapsed;stats.frames++;paint();costs.push(performance.now()-start);if(costs.length>1200)costs.shift();
    raf=requestAnimationFrame(tick);
  }
  function sync(){
    if(raf)cancelAnimationFrame(raf);raf=0;last=undefined;
    paint();if(!disposed&&active&&requested)raf=requestAnimationFrame(tick);
  }
  return {
    set(count:number,running:boolean){if(count!==requested){intervals.length=0;costs.length=0;}requested=count;active=running&&!disposed;sync();},
    camera(next:typeof transform,w:number,h:number){transform=next;width=w;height=h;paint();},
    snapshot(){const p=(a:number[],q:number)=>a.length?[...a].sort((x,y)=>x-y)[Math.floor((a.length-1)*q)]:null;
      return {...stats,requested,pending:!!raf,active,disposed,intervalP50:p(intervals,.5),intervalP95:p(intervals,.95),cpuP50:p(costs,.5),cpuP95:p(costs,.95),spritePixels:sprites.reduce((n,s)=>n+s.c.width*s.c.height,0)};},
    dispose(){disposed=true;active=false;sync();for(const {c} of sprites){c.remove();c.width=c.height=0;}},
  };
}
