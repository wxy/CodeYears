import { CITY_RIVER_BANK_DEPTH, CITY_RIVER_DEPTH } from './city-layout';
import type { CityRoadNetwork } from './city-road-network';
import { clipReliefSegment, unprojectGround, waterOutline, type ProjectedBounds } from './city-mountain-roads';
import { cityRoadWidth, isCityOuterRing, type RoadPoint } from './city-roads';
import catalog from './city-baked-catalog.json';

export interface CityRiver {
  left:number;
  right:number;
  z:number;
  top:number;
  bottom:number;
}

interface WaterSample { x:number; z:number; half:number; drop:number }
interface Watercourse {
  from:number;
  to:number;
  axis:0|1;
  sample(t:number):WaterSample;
}
export interface RoadWater {
  bankPoints: RoadPoint[];
  spans(a:RoadPoint,b:RoadPoint): [number,number][];
}

export function mergeWaterSpans(spans:[number,number][],gap=1e-5) {
  const joined:[number,number][]=[];
  for(const span of spans.sort((a,b)=>a[0]-b[0])){
    const prior=joined.at(-1);
    if(prior&&span[0]<=prior[1]+gap)prior[1]=Math.max(prior[1],span[1]);
    else joined.push(span);
  }
  return joined;
}

const project=(x:number,z:number,drop=0):[number,number]=>[(x-z)*.5,(x+z)*.25+drop];
const ease=(distance:number)=>{const t=Math.min(1,distance);return t*t*(3-2*t)};
const mouthRun=14;
function crossSection(stream:Watercourse,t:number) {
  const s=stream.sample(t),a=stream.sample(t-.16),b=stream.sample(t+.16);
  const x=b.x-a.x,z=b.z-a.z,len=Math.hypot(x,z);
  return {...s,nx:-z/len,nz:x/len};
}
const bankPoint=(s:ReturnType<typeof crossSection>,offset:number,drop=s.drop)=>project(s.x+s.nx*offset,s.z+s.nz*offset,drop);

/** 水道固定在世界坐标中，主河和支流两端都裁到当前视野外。 */
export function createCityWaterways(rivers:readonly CityRiver[],{roads,bridges}:CityRoadNetwork,width:number,depth:number) {
  const reaches=new Map<number,CityRiver>();
  for(const river of rivers){
    const earlier=reaches.get(river.z);
    reaches.set(river.z,earlier?{...river,left:Math.min(earlier.left,river.left),right:Math.max(earlier.right,river.right)}:river);
  }
  // 河带的左右端只代表邻接街区的重合区，须越过全城外环的最外车行边缘再转弯。
  let west=0,east=width;
  for(const road of roads){
    if(!isCityOuterRing(road))continue;
    const half=cityRoadWidth(road)/2;
    for(const [x] of road.points){
      west=Math.min(west,x-half);
      east=Math.max(east,x+half);
    }
  }
  const westTurn=west-mouthRun,eastTurn=east+mouthRun;
  const main:Watercourse[]=[...reaches.values()].map(({left,right,z,top,bottom},band)=>{
    const half=(bottom-top)/2-CITY_RIVER_BANK_DEPTH;
    const crossings=bridges.filter(bridge=>bridge.from[1]<z&&bridge.to[1]>z)
      .map(bridge=>({x:bridge.from[0],clearance:catalog[`transport-bridge-${bridge.style}`].nativeWidth/2+.25}));
    return {from:-Infinity,to:Infinity,axis:0,sample(x){
      const distance=Math.max(0,left-x,x-right),outside=ease(distance/17);
      // 先沿桥位同一条轴穿过城区，再把弯道平滑接到外侧直段。
      const turning=ease(Math.max(0,westTurn-x,x-eastTurn)/17);
      const side=(x<left?1:-1)*(band%2===0?1:-1),phase=band*.68+(x<left?.25:.85);
      const bend=side*turning*(14*Math.sin(distance*.077+phase)+5.8*Math.sin(distance*.157+phase)+7*Math.sin(distance*.029-phase));
      const quiet=crossings.reduce((blend,bridge)=>Math.min(blend,Math.max(0,Math.abs(x-bridge.x)-bridge.clearance)),1);
      return {x,z:z+bend,half:half*(1-.27*outside)+.19*outside*Math.sin(x*.14)
        -.06*Math.sin(x*1.7+z)*quiet,drop:CITY_RIVER_DEPTH*.5*(1-ease(distance/5))};
    }};
  });
  // 预留年份的范围确定后，旷野溪流的位置固定，和数据分批到达无关。
  const wildernessZ=depth+28;
  const wilderness:Watercourse={from:-Infinity,to:Infinity,axis:0,sample:x=>({
    x,z:wildernessZ+10.8*Math.sin(x*.080-.65)+3.4*Math.sin(x*.179+1.38),half:.92+.21*Math.sin(x*.16),drop:0,
  })};
  const branchSource=main[0]??wilderness;
  const [westFork,eastFork]=main.length?[westTurn-2,eastTurn+2]:[-13,width+13];
  const tributaries=([-1,1] as const).map(direction=>{
    const fork=branchSource.sample(direction<0?westFork:eastFork);
    const lakeAt=direction<0?18:22,lakeWidth=direction<0?3.1:3.75;
    // 两条侧谷改用南北方向推进，同主河汇合后分别转向各自的谷底。
    const stream:Watercourse={from:direction<0?-Infinity:fork.z,to:direction<0?fork.z:Infinity,axis:1,sample(z){
      const distance=Math.abs(z-fork.z),split=ease(distance/19);
      const lake=lakeWidth*Math.exp(-(((distance-lakeAt)/4.8)**2));
      return {x:fork.x+direction*(distance*.26+split*(6.1+6.5*Math.sin(distance*.103+.3))),
        z,half:.55+.13*Math.sin(distance*.16)+lake,drop:0};
    }};
    return stream;
  });
  // 河谷外侧保留一片小的牛轭湖，和支流汇出的湖湾一起形成不同形状的水面。
  const lakeX=width*.64,lakeRadius=5.4;
  const oxbow:Watercourse={from:lakeX-lakeRadius,to:lakeX+lakeRadius,axis:0,sample(x){
    const t=(x-lakeX)/lakeRadius;
    return {x,z:wilderness.sample(x).z+7.7-2.8*t*t+.34*Math.sin(x*.73),
      half:Math.sqrt(Math.max(0,1-t*t))*(1.8+.32*Math.sin(x*.86)),drop:0};
  }};
  // 小支流的汇口和湖心都在外环之外。短年份没有城内河带时汇入原有的郊外溪流。
  const valleyStreams=[
    {source:branchSource,forkX:westFork-4,side:-1,direction:1,length:17,lakeRadius:3.8},
    {source:main.at(-1)??wilderness,forkX:eastFork+4,side:1,direction:-1,length:20,lakeRadius:4.4},
    {source:main[Math.floor(main.length/2)]??wilderness,forkX:eastFork+18,side:1,direction:1,length:16,lakeRadius:3.4},
  ].flatMap(({source,forkX,side,direction,length,lakeRadius},index):Watercourse[]=>{
    const fork=source.sample(forkX),endZ=fork.z+direction*length;
    const along=(distance:number)=>forkX+side*(.47*distance+1.55*Math.sin(distance*.23)+1.15*Math.sin(distance*.10));
    const lakeX=along(length);
    return [
      {from:Math.min(fork.z,endZ),to:Math.max(fork.z,endZ),axis:1,sample(z){
        const distance=(z-fork.z)*direction;
        return {x:along(distance),z,half:.32+.065*Math.sin(distance*.57+index),drop:0};
      }},
      {from:lakeX-lakeRadius,to:lakeX+lakeRadius,axis:0,sample(x){
        const t=(x-lakeX)/lakeRadius;
        const width=Math.sqrt(Math.max(0,1-t*t))*(lakeRadius*.52+.29*Math.sin(t*4.8+index));
        return {x,z:endZ+.58*t+.66*t*t+.28*Math.sin(t*3.6),half:width,drop:0};
      }},
    ];
  });
  const streams=[wilderness,oxbow,...tributaries,...valleyStreams,...main];
  // 保留真实河湾、支流和湖泊的岸线。按河道轴索引截面，长路也只检查它经过的水段。
  const roadWater=({left,top,right,bottom}:ProjectedBounds,clearance=0):RoadWater=>{
    const pad=clearance?24:8,step=.8;
    const lows=[left+2*top-pad,2*top-right-pad],highs=[right+2*bottom+pad,2*bottom-left+pad];
    const bankPoints:RoadPoint[]=[];
    const courses=streams.flatMap(stream=>{
      const {axis}=stream,from=Math.max(lows[axis],stream.from),to=Math.min(highs[axis],stream.to);
      if(to<=from)return [];
      const first=Math.floor(from/step),last=Math.ceil(to/step);
      let margin=0;
      const banks=Array.from({length:last-first+1},(_,i)=>{
        const s=crossSection(stream,Math.min(to,Math.max(from,(first+i)*step))),half=s.half+clearance;
        margin=Math.max(margin,half);
        if(clearance&&(i%5===0||i===last-first)){
          bankPoints.push(bankPoint(s,-half-.65,0),bankPoint(s,half+.65,0));
        }
        return [bankPoint(s,-half,0),bankPoint(s,half,0)];
      });
      const strips=banks.slice(1).map((next,i)=>waterOutline([...banks[i],...next]));
      return [{axis,first,margin,strips}];
    });
    return {bankPoints,spans(a,b){
      const spans:[number,number][]=[];
      const worldA=unprojectGround(a),worldB=unprojectGround(b);
      for(const {axis,first,margin,strips} of courses){
        const start=Math.max(0,Math.floor((Math.min(worldA[axis],worldB[axis])-margin)/step)-first);
        const end=Math.min(strips.length,Math.ceil((Math.max(worldA[axis],worldB[axis])+margin)/step)-first);
        for(let i=start;i<end;i++){
          // 两个相邻截面的共边也在水里，沿着共边过河不能当作沿岸通行。
          const span=clipReliefSegment(a,b,strips[i],-1e-7);
          if(span)spans.push(span);
        }
      }
      return spans.length<2?spans:mergeWaterSpans(spans);
    }};
  };
  const paint=(context:CanvasRenderingContext2D,left:number,top:number,right:number,bottom:number)=>{
    // 反解等轴测视口的角点，给最大河宽留余量。边界使用对应的河谷轴。
    const lows=[left+2*top-7,2*top-right-7],highs=[right+2*bottom+7,2*bottom-left+7];
    const shore=new Path2D(),water=new Path2D(),deep=new Path2D(),ripples=new Path2D();
    const nearWall=new Path2D(),farWall=new Path2D();
    for(const stream of streams){
      const from=Math.max(lows[stream.axis],stream.from),to=Math.min(highs[stream.axis],stream.to);
      if(to<=from)continue;
      const section=(t:number)=>crossSection(stream,t);
      const step=Math.max(.33,(to-from)/640),samples=[section(from)];
      for(let t=Math.ceil(from/step)*step;t<to;t+=step)if(t>from)samples.push(section(t));
      samples.push(section(to));
      // 急弯沿中心线法线量宽，斜着越过地图时水面也保留实际宽度。
      const reversed=[...samples].reverse();
      for(const [path,inset,bank] of [[shore,1,.20],[water,1,0],[deep,.69,0]] as const){
        samples.forEach((s,i)=>{
          const p=bankPoint(s,-s.half*inset-bank);
          if(i)path.lineTo(...p);else path.moveTo(...p);
        });
        for(const s of reversed)path.lineTo(...bankPoint(s,s.half*inset+bank));
        path.closePath();
      }
      // 城里水面低于桥面，城外的岸线逐渐回到自然地面。
      for(const [path,direction] of [[nearWall,-1],[farWall,1]] as const){
        samples.forEach((s,i)=>{
          const p=bankPoint(s,direction*s.half,0);
          if(i)path.lineTo(...p);else path.moveTo(...p);
        });
        for(const s of reversed)path.lineTo(...bankPoint(s,direction*s.half));
        path.closePath();
      }
      const spacing=Math.max(.62,(to-from)/420);
      for(let i=Math.ceil(from/spacing);i*spacing<to;i++){
        const t=i*spacing+.17*Math.sin(i*3.31);
        if(t<from||t>=to)continue;
        const s=section(t),offset=s.half*.68*Math.sin(i*2.39);
        const span=Math.min(s.half*.6,.12+.28*(.5+.5*Math.sin(i*5.2)));
        ripples.moveTo(...bankPoint(s,offset));
        ripples.quadraticCurveTo(...bankPoint(section(t+span*.45),offset-.045),...bankPoint(section(t+span),offset+.012));
      }
    }
    context.fillStyle='#83a278';context.fill(shore);
    context.fillStyle='#729d98';context.fill(water);
    context.fillStyle='#64969a';context.fill(deep);
    context.strokeStyle='#d1e3dc38';context.lineWidth=.015;context.stroke(ripples);
    context.fillStyle='#84987b';context.fill(nearWall);
    context.fillStyle='#6e836d';context.fill(farWall);
  };
  // 检查的是山脚所在的地面区域。较高的峰顶可以遮住后方的景物。
  const clears=(left:number,top:number,right:number,bottom:number)=>!streams.some(stream=>{
    const low=stream.axis===0?left+2*top:2*top-right,high=stream.axis===0?right+2*bottom:2*bottom-left;
    const from=Math.max(stream.from,low-5),to=Math.min(stream.to,high+5);
    for(let t=from;t<=to;t+=1){
      const s=stream.sample(t),[x,y]=project(s.x,s.z),margin=s.half*.55+.35;
      if(x>=left-margin&&x<=right+margin&&y>=top-margin&&y<=bottom+margin)return true;
    }
    return false;
  });
  return {paint,clears,roadWater};
}
