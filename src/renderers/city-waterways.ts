import { CITY_RIVER_BANK_DEPTH, CITY_RIVER_DEPTH } from './city-layout';
import type { CityBridge } from './city-road-network';
import catalog from './city-baked-catalog.json';

export interface CityRiver {
  left:number;
  right:number;
  z:number;
  top:number;
  bottom:number;
}

interface WaterSample { x:number; center:number; half:number; drop:number }
interface Watercourse {
  from:number;
  to:number;
  z:number;
  sample(x:number):WaterSample;
}

const project=(x:number,z:number,drop=0):[number,number]=>[(x-z)*.5,(x+z)*.25+drop];
const ease=(distance:number)=>{const t=Math.min(1,distance);return t*t*(3-2*t)};

/** 水道固定在世界坐标中，主河和支流两端都裁到当前视野外。 */
export function createCityWaterways(rivers:readonly CityRiver[],bridges:readonly CityBridge[],width:number,depth:number) {
  const reaches=new Map<number,CityRiver>();
  for(const river of rivers){
    const earlier=reaches.get(river.z);
    reaches.set(river.z,earlier?{...river,left:Math.min(earlier.left,river.left),right:Math.max(earlier.right,river.right)}:river);
  }
  const main:Watercourse[]=[...reaches.values()].map(({left,right,z,top,bottom})=>{
    const half=(bottom-top)/2-CITY_RIVER_BANK_DEPTH;
    const crossings=bridges.filter(bridge=>bridge.landings.from[1]===top&&bridge.landings.to[1]===bottom)
      .map(bridge=>({x:bridge.from[0],clearance:catalog[`transport-bridge-${bridge.style}`].nativeWidth/2+.25}));
    return {from:-Infinity,to:Infinity,z,sample(x){
      const distance=Math.max(0,left-x,x-right),outside=ease(distance/12);
      const bend=(3.7*Math.sin(x*.094+z*.19)+1.05*Math.sin(x*.23+z))*outside;
      const quiet=crossings.reduce((blend,bridge)=>Math.min(blend,Math.max(0,Math.abs(x-bridge.x)-bridge.clearance)),1);
      return {x,center:z+bend,half:half*(1-.27*outside)+.19*outside*Math.sin(x*.14)
        -.06*Math.sin(x*1.7+z)*quiet,drop:CITY_RIVER_DEPTH*.5*(1-ease(distance/5))};
    }};
  });
  // 预留年份的范围确定后，旷野溪流的位置固定，和数据分批到达无关。
  const wildernessZ=depth+24;
  const wilderness:Watercourse={from:-Infinity,to:Infinity,z:wildernessZ,sample:x=>({
    x,center:wildernessZ+3.4*Math.sin(x*.091)+1.15*Math.sin(x*.23),half:.92+.21*Math.sin(x*.16),drop:0,
  })};
  const branchSource=main[0]??wilderness,first=reaches.values().next().value;
  const branches:Watercourse[]=([-1,1] as const).map(direction=>{
    const fork=direction<0?(first?.left??0)-10:(first?.right??width)+10;
    return {from:direction<0?-Infinity:fork,to:direction<0?fork:Infinity,z:branchSource.z+direction*12,sample(x){
      const distance=Math.abs(x-fork),split=ease(distance/26);
      const lakeAt=direction<0?16:19,lakeWidth=direction<0?3.1:3.75;
      const lake=lakeWidth*Math.exp(-(((distance-lakeAt)/4.8)**2));
      return {x,center:branchSource.sample(x).center+direction*split*(15.3+2.5*Math.sin(x*.16)),
        half:.54+.14*Math.sin(x*.17)+lake,drop:0};
    }};
  });
  // 河谷外侧保留一片小的牛轭湖，和支流汇出的湖湾一起形成不同形状的水面。
  const lakeX=width*.64,lakeRadius=5.4;
  const oxbow:Watercourse={from:lakeX-lakeRadius,to:lakeX+lakeRadius,z:wildernessZ+8,sample(x){
    const t=(x-lakeX)/lakeRadius;
    return {x,center:wilderness.sample(x).center+7.7-2.8*t*t+.34*Math.sin(x*.73),
      half:Math.sqrt(Math.max(0,1-t*t))*(1.8+.32*Math.sin(x*.86)),drop:0};
  }};
  const streams=[wilderness,oxbow,...branches,...main];
  return (context:CanvasRenderingContext2D,left:number,top:number,right:number,bottom:number)=>{
    // 反解等轴测视口的角点，截面留在画布外。真实岸线和分叉不随镜头搬动。
    const minX=left+2*top-4,maxX=right+2*bottom+4,minZ=2*top-right,maxZ=2*bottom-left;
    const shore=new Path2D(),water=new Path2D(),deep=new Path2D(),ripples=new Path2D();
    const nearWall=new Path2D(),farWall=new Path2D();
    for(const stream of streams){
      const from=Math.max(minX,stream.from),to=Math.min(maxX,stream.to);
      if(to<=from||stream.z<minZ-25||stream.z>maxZ+25)continue;
      const step=Math.max(.33,(to-from)/640);
      const samples=[stream.sample(from)];
      for(let x=Math.ceil(from/step)*step;x<to;x+=step)if(x>from)samples.push(stream.sample(x));
      samples.push(stream.sample(to));
      const reversed=[...samples].reverse();
      for(const [path,inset,bank] of [[shore,1,.20],[water,1,0],[deep,.69,0]] as const){
        samples.forEach((s,i)=>{
          const p=project(s.x,s.center-s.half*inset-bank,s.drop);
          if(i)path.lineTo(...p);else path.moveTo(...p);
        });
        for(const s of reversed)path.lineTo(...project(s.x,s.center+s.half*inset+bank,s.drop));
        path.closePath();
      }
      // 城里水面低于桥面，城外的岸线逐渐回到自然地面。
      for(const [path,direction] of [[nearWall,-1],[farWall,1]] as const){
        samples.forEach((s,i)=>{
          const p=project(s.x,s.center+direction*s.half);
          if(i)path.lineTo(...p);else path.moveTo(...p);
        });
        for(const s of reversed)path.lineTo(...project(s.x,s.center+direction*s.half,s.drop));
        path.closePath();
      }
      const spacing=Math.max(.62,(to-from)/420);
      for(let i=Math.ceil(from/spacing);i*spacing<to;i++){
        const x=i*spacing+.17*Math.sin(i*3.31+stream.z);
        if(x<from||x>=to)continue;
        const s=stream.sample(x);
        const at=s.center+s.half*.78*Math.sin(i*2.39+stream.z);
        const span=Math.min(s.half*.6,.12+.28*(.5+.5*Math.sin(i*5.2)));
        ripples.moveTo(...project(x,at,s.drop));
        ripples.quadraticCurveTo(...project(x+span*.45,at-.045,s.drop),...project(x+span,at+.012,s.drop));
      }
    }
    context.fillStyle='#869b7e';context.fill(shore);
    context.fillStyle='#729d98';context.fill(water);
    context.fillStyle='#64969a';context.fill(deep);
    context.strokeStyle='#d1e3dc38';context.lineWidth=.015;context.stroke(ripples);
    context.fillStyle='#84987b';context.fill(nearWall);
    context.fillStyle='#6e836d';context.fill(farWall);
  };
}
