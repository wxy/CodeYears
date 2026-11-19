import { cityRoadWidth, clipCityExit, type CityRoadRoute } from './city-roads';
import type { CityImages } from './city-assets';
import { loadUnit } from './unit-calibration';

export const CITY_OUTSKIRT_MARGIN=12;

export const CITY_OUTSKIRT_IDS=['outskirts-forest','outskirts-hills','natural-ground'] as const;
export const CITY_SCENERY_IDS=[...CITY_OUTSKIRT_IDS,'outskirts-mountains','outskirts-dry-meadow','outskirts-snowy-mountains'] as const;

/** 原图经过共享低alpha清理后一次缩图；返回画布由closeCityImages统一释放。 */
export async function loadCityOutskirtsImages(base:string,signal?:AbortSignal):Promise<CityImages> {
  const images:CityImages={};
  try {
    for(const id of CITY_OUTSKIRT_IDS){
      signal?.throwIfAborted();
      const source=await loadUnit(new URL(`${id}.png`,base).href,signal);
      try {
        signal?.throwIfAborted();
        if(id==='natural-ground'){
          const canvas=document.createElement('canvas');canvas.width=canvas.height=2048;
          images[id]={canvas,left:0,top:0,width:32,height:32,nativeWidth:32,nativeDepth:32,baselineHeight:0,sampleId:id};
          const context=canvas.getContext('2d');if(!context)throw new Error('无法创建自然地面缓存。');
          context.imageSmoothingQuality='high';
          // 保留源图细节后镜像接续；32格的2048px缓存，不生成无限地块。
          for(let x=0;x<2;x++)for(let y=0;y<2;y++){
            context.save();context.translate(x?2048:0,y?2048:0);context.scale(x?-1:1,y?-1:1);
            context.drawImage(source.clean,0,0,1024,1024);context.restore();
          }
          continue;
        }
        const canvas=document.createElement('canvas'),ratio=Math.min(1,512/Math.max(source.clean.width,source.clean.height));
        canvas.width=Math.max(1,Math.round(source.clean.width*ratio));canvas.height=Math.max(1,Math.round(source.clean.height*ratio));
        const displayWidth=7,displayHeight=displayWidth*source.sourceHeight/source.sourceWidth;
        images[id]={canvas,left:.5-displayWidth/2,top:1.75-displayHeight*.65,width:displayWidth,height:displayHeight,nativeWidth:8,nativeDepth:6,baselineHeight:2,sampleId:id};
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
      const ux=dx/length,uz=dz/length,clearance=cityRoadWidth(route)/2+.55;
      clips.push(exclusion(path([[a[0]-ux*clearance-uz*clearance,a[1]-uz*clearance+ux*clearance],[b[0]+ux*clearance-uz*clearance,b[1]+uz*clearance+ux*clearance],[b[0]+ux*clearance+uz*clearance,b[1]+uz*clearance-ux*clearance],[a[0]-ux*clearance+uz*clearance,a[1]-uz*clearance-ux*clearance]])));
    }
  }
  const noise=(i:number)=>{const n=Math.sin(i*127.1+31.7)*43758.5453;return n-Math.floor(n)};
  for(let side=0;side<4;side++){
    const along=(side%2?depth:width)+ringOuter*2;
    // 全画布已有连续自然底图，外围仅保留最多40处立体林丘。
    const count=Math.min(10,Math.max(2,Math.ceil(along/8.5)));
    for(let group=0;group<count;group++){
      const seed=side*101+group*13,t=(group+.5+(noise(seed+6)-.5)*.16)/count;
      const center=-ringOuter+t*along,offset=ringOuter+5.2+noise(seed)*.3;
      const x=side===0?center:side===1?width+offset:side===2?center:-offset;
      const z=side===0?-offset:side===1?center:side===2?depth+offset:center;
      const factor=.7+noise(seed+3)*.08;
      // 高地景主动避开出城道路廊道。
      const nearExit=exits.some(route=>route.points.some((a,i)=>{
        if(i===route.points.length-1&&!route.closed)return false;
        const b=route.points[(i+1)%route.points.length],dx=b[0]-a[0],dz=b[1]-a[1],length=dx*dx+dz*dz;
        const u=length?Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/length)):0;
        return Math.hypot(x-a[0]-u*dx,z-a[1]-u*dz)<cityRoadWidth(route)/2+7.5*factor;
      }));
      if(nearExit)continue;
      const id=(group+side)%2?'outskirts-forest':'outskirts-hills',sprite=images[id];
      if(!sprite)throw new Error(`未加载外围图片：${id}`);
      const [px,py]=project(x,z);
      commands.push({canvas:sprite.canvas,left:px+(sprite.left-.5)*factor,top:py+(sprite.top-1.75)*factor,width:sprite.width*factor,height:sprite.height*factor,order:x+z});
    }
  }
  commands.sort((a,b)=>a.order-b.order);
  return context=>{
    context.save();context.clip(outer);for(const clip of clips)context.clip(clip,'evenodd');
    for(const command of commands)context.drawImage(command.canvas,command.left,command.top,command.width,command.height);
    context.restore();
  };
}

/** 城郊坡色和位图使用地图坐标，格外宽阔的远景才摆放雪山。 */
export function createCitySceneryPainter(width:number,depth:number,exits:readonly CityRoadRoute[],images:CityImages,
  {left,top,right,bottom}:{left:number;top:number;right:number;bottom:number}) {
  const span=right-left,height=bottom-top;
  const fields=[
    [.24,.43,.23,.32,'rgba(202,181,121,.51)'],
    [.73,.36,.25,.33,'rgba(101,130,126,.57)'],
    [.31,.75,.26,.24,'rgba(192,172,116,.56)'],
    [.72,.76,.26,.23,'rgba(115,142,107,.53)'],
  ] as const;
  const mountains=images['outskirts-mountains'];
  const mountainWidth=Math.min(54,Math.max(34,(width+depth)*.46));
  const snow=images['outskirts-snowy-mountains'];
  const snowWidth=Math.min(25,span*.24),snowHeight=snow?snowWidth*snow.height/snow.width:0;
  const snowLeft=depth>=42?[left+span*.62,left+span*.53,right-snowWidth-2,left+2].find(x=>
    !exits.some(exit=>clipCityExit(exit,x,top+1,x+snowWidth,top+snowHeight+1))):undefined;
  const meadow=images['outskirts-dry-meadow'];
  const meadowWidth=Math.min(45,span*.36);
  const stands=[
    [-12,-8,'forest',1.05],[-19,depth*.27,'hills',1.42],[-24,depth*.64+3,'forest',1.55],
    [width*.18,-13,'forest',1.45],[width*.56,-19,'hills',1.5],[width*.88,-11,'forest',1.12],
    [width+13,depth*.18,'hills',1.68],[width+23,depth*.63,'forest',1.58],
    [width*.78,depth+13,'forest',1.35],[width*.43,depth+17,'hills',1.6],[width*.16,depth+9,'forest',1.17],
    [-15,depth+13,'hills',1.52],[width+7,depth+13,'hills',1.28],
  ] as const;
  const trees=stands.flatMap(([x,z,kind,factor])=>{
    const sprite=images[`outskirts-${kind}`];
    if(!sprite||exits.some(route=>{
      const [a,b]=route.points,dx=b[0]-a[0],dz=b[1]-a[1];
      const t=Math.max(0,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz));
      return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz)<cityRoadWidth(route)/2+4.6*factor;
    }))return [];
    const px=(x-z)*.5+(sprite.left-.5)*factor,py=(x+z)*.25+(sprite.top-1.75)*factor;
    const w=sprite.width*factor,h=sprite.height*factor;
    if(px<left||px+w>right||py<top||py+h>bottom)return [];
    return [{sprite,px,py,w,h,order:x+z}];
  }).sort((a,b)=>a.order-b.order);
  return (context:CanvasRenderingContext2D)=>{
    for(const [x,y,rx,ry,color] of fields){
      context.save();
      context.translate(left+x*span,top+y*height);
      context.scale(rx*span,ry*height);
      const shade=context.createRadialGradient(0,0,0,0,0,1);
      shade.addColorStop(0,color);
      shade.addColorStop(1,'transparent');
      context.fillStyle=shade;
      context.fillRect(-1,-1,2,2);
      context.restore();
    }
    if(meadow){
      const meadowHeight=meadowWidth*meadow.height/meadow.width;
      context.save();
      context.globalAlpha=.88;
      context.drawImage(meadow.canvas,left+span*.12,Math.min(top+height*.61,bottom-meadowHeight-1),meadowWidth,meadowHeight);
      context.restore();
    }
    if(snow&&snowLeft!==undefined)context.drawImage(snow.canvas,snowLeft,top+1,snowWidth,snowHeight);
    if(mountains)context.drawImage(mountains.canvas,Math.max(left+1,-mountainWidth*.60),top+1,mountainWidth,mountainWidth*mountains.height/mountains.width);
    for(const {sprite,px,py,w,h} of trees)context.drawImage(sprite.canvas,px,py,w,h);
  };
}
