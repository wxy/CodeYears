import type { CityRoadRoute } from './city-roads';
import type { CityImages } from './city-assets';
import { loadUnit } from './unit-calibration';

export const CITY_OUTSKIRT_MARGIN=12;

export const CITY_OUTSKIRT_IDS=['outskirts-forest','outskirts-meadow','outskirts-hills'] as const;

/** 原图经过共享低alpha清理后一次缩图；返回画布由closeCityImages统一释放。 */
export async function loadCityOutskirtsImages(base:string,signal?:AbortSignal):Promise<CityImages> {
  const images:CityImages={};
  try {
    for(const id of CITY_OUTSKIRT_IDS){
      signal?.throwIfAborted();
      const source=await loadUnit(new URL(`${id}.png`,base).href,signal);
      try {
        signal?.throwIfAborted();
        const canvas=document.createElement('canvas'),ratio=Math.min(1,512/Math.max(source.clean.width,source.clean.height));
        canvas.width=Math.max(1,Math.round(source.clean.width*ratio));canvas.height=Math.max(1,Math.round(source.clean.height*ratio));
        const displayWidth=7,displayHeight=displayWidth*source.sourceHeight/source.sourceWidth;
        images[id]={canvas,left:.5-displayWidth/2,top:1.75-displayHeight*.65,width:displayWidth,height:displayHeight,nativeWidth:8,nativeDepth:6,baselineHeight:id==='outskirts-meadow'?.25:2,sampleId:id};
        const context=canvas.getContext('2d');if(!context)throw new Error('无法创建外围地貌缓存。');
        context.imageSmoothingQuality='high';context.drawImage(source.clean,0,0,canvas.width,canvas.height);
        signal?.throwIfAborted();
      } finally {source.close()}
    }
    return images;
  } catch(error){for(const sprite of Object.values(images))sprite.canvas.width=sprite.canvas.height=0;throw error}
}

/** 仅定位/裁剪生成PNG，不绘制程序地貌；所有图片与几何在缓存构造前准备。 */
export function createCityOutskirtsPainter(width:number,depth:number,ringOuter:number,exits:readonly CityRoadRoute[],images:CityImages):(context:CanvasRenderingContext2D)=>void {
  const margin=CITY_OUTSKIRT_MARGIN,min=-ringOuter-margin,maxX=width+ringOuter+margin,maxZ=depth+ringOuter+margin;
  const project=(x:number,z:number,h=0):[number,number]=>[(x-z)*.5,(x+z)*.25-h];
  const commands:{canvas:HTMLCanvasElement;left:number;top:number;width:number;height:number;order:number}[]=[];
  const path=(points:readonly [number,number,number?][])=>{
    const result=new Path2D();points.forEach(([x,z,h],i)=>{const p=project(x,z,h);if(i)result.lineTo(...p);else result.moveTo(...p)});result.closePath();return result;
  };
  const outer=path([[min,min],[maxX,min],[maxX,maxZ],[min,maxZ]]);
  const exclusion=(hole:Path2D)=>{const p=new Path2D(outer);p.addPath(hole);return p};
  // 每个排除区独立clip，交叠道路廊道不会因even-odd抵消而重新长出树。
  const clips=[exclusion(path([[-ringOuter,-ringOuter],[width+ringOuter,-ringOuter],[width+ringOuter,depth+ringOuter],[-ringOuter,depth+ringOuter]]))];
  for(const route of exits){
    const count=route.closed?route.points.length:route.points.length-1;
    for(let i=0;i<count;i++){
      const a=route.points[i],b=route.points[(i+1)%route.points.length],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);if(!length)continue;
      const ux=dx/length,uz=dz/length,clearance=route.lanes*.4/2+.55;
      clips.push(exclusion(path([[a[0]-ux*clearance-uz*clearance,a[1]-uz*clearance+ux*clearance],[b[0]+ux*clearance-uz*clearance,b[1]+uz*clearance+ux*clearance],[b[0]+ux*clearance+uz*clearance,b[1]+uz*clearance-ux*clearance],[a[0]-ux*clearance+uz*clearance,a[1]-uz*clearance-ux*clearance]])));
    }
  }
  const noise=(i:number)=>{const n=Math.sin(i*127.1+31.7)*43758.5453;return n-Math.floor(n)};
  for(let side=0;side<4;side++)for(const low of [true,false]){
    const along=(side%2?depth:width)+ringOuter*2;
    // 内层连续低草甸、外层立体林丘，总上限4×(40+10)=200张。
    const count=Math.min(low?40:10,Math.max(2,Math.ceil(along/(low?4.2:8.5))));
    for(let group=0;group<count;group++){
      const seed=side*101+group*13,t=(group+.5+(noise(seed+6)-.5)*.16)/count;
      const center=-ringOuter+t*along,offset=ringOuter+(low?1.8+noise(seed)*.4:5.2+noise(seed)*.3);
      const x=side===0?center:side===1?width+offset:side===2?center:-offset;
      const z=side===0?-offset:side===1?center:side===2?depth+offset:center;
      const factor=low?1.05+noise(seed+3)*.15:.7+noise(seed+3)*.08;
      // 高地景主动避开廊道；低草甸靠近路肩，由共享clip留出出口。
      const nearExit=!low&&exits.some(route=>route.points.some((a,i)=>{
        if(i===route.points.length-1&&!route.closed)return false;
        const b=route.points[(i+1)%route.points.length],dx=b[0]-a[0],dz=b[1]-a[1],length=dx*dx+dz*dz;
        const u=length?Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/length)):0;
        return Math.hypot(x-a[0]-u*dx,z-a[1]-u*dz)<route.lanes*.4/2+7.5*factor;
      }));
      if(nearExit)continue;
      const id=low?'outskirts-meadow':(group+side)%2?'outskirts-forest':'outskirts-hills',sprite=images[id];
      if(!sprite)throw new Error(`未加载外围图片：${id}`);
      const [px,py]=project(x,z);
      commands.push({canvas:sprite.canvas,left:px+(sprite.left-.5)*factor,top:py+(sprite.top-1.75)*factor,width:sprite.width*factor,height:sprite.height*factor,order:low?-Infinity:x+z});
    }
  }
  commands.sort((a,b)=>a.order-b.order);
  return context=>{
    context.save();context.clip(outer);for(const clip of clips)context.clip(clip,'evenodd');
    for(const command of commands)context.drawImage(command.canvas,command.left,command.top,command.width,command.height);
    context.restore();
  };
}
