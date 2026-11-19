import type { CityRoadRoute, RoadPoint } from './city-roads';
import type { RoadWater } from './city-waterways';

export interface ProjectedBounds { left:number; top:number; right:number; bottom:number }
export interface ReliefOutline { points:RoadPoint[]; bounds:ProjectedBounds }

export const CITY_MOUNTAIN_ROAD_LEAD=8;
export const projectGround=(x:number,z:number):RoadPoint=>[(x-z)*.5,(x+z)*.25];
export const unprojectGround=([x,y]:RoadPoint):RoadPoint=>[x+2*y,2*y-x];
const distance=([ax,ay]:RoadPoint,[bx,by]:RoadPoint)=>Math.hypot(ax-bx,2*(ay-by));
const side=([ax,ay]:RoadPoint,[bx,by]:RoadPoint,[x,y]:RoadPoint)=>(bx-ax)*(y-ay)-(by-ay)*(x-ax);
const cornerRoom=2.55;

export function boundsOverlap(a:ProjectedBounds,b:ProjectedBounds) {
  return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
}

export function reliefOutline(points:RoadPoint[]):ReliefOutline {
  return {points,bounds:{
    left:Math.min(...points.map(p=>p[0])),right:Math.max(...points.map(p=>p[0])),
    top:Math.min(...points.map(p=>p[1])),bottom:Math.max(...points.map(p=>p[1])),
  }};
}

/** 河湾的短截面与山体使用同一套凸多边形裁切。 */
export function waterOutline(shores:RoadPoint[]) {
  const sorted=shores.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const half=(points:RoadPoint[])=>{
    const hull:RoadPoint[]=[];
    for(const p of points){
      while(hull.length>1&&side(hull[hull.length-2],hull[hull.length-1],p)<=0)hull.pop();
      hull.push(p);
    }
    return hull.slice(0,-1);
  };
  return reliefOutline([...half(sorted),...half([...sorted].reverse())]);
}

const expand=({points}:ReliefOutline,pad:number)=>reliefOutline(points.flatMap((p,i):RoadPoint[]=>{
  const a=points[(i+points.length-1)%points.length],b=points[(i+1)%points.length];
  const prev=Math.hypot(p[0]-a[0],p[1]-a[1]),next=Math.hypot(b[0]-p[0],b[1]-p[1]);
  const nx=(p[1]-a[1])/prev,ny=(a[0]-p[0])/prev,mx=(b[1]-p[1])/next,my=(p[0]-b[0])/next;
  const join=1+nx*mx+ny*my;
  if(join<.7)return [[p[0]+nx*pad,p[1]+ny*pad],[p[0]+mx*pad,p[1]+my*pad]];
  const factor=pad/join;
  return [[p[0]+(nx+mx)*factor,p[1]+(ny+my)*factor]];
}));

/** 用轮廓各条支撑边裁测试路段。沿边相切仍是可通行的路径。 */
export function clipReliefSegment(a:RoadPoint,b:RoadPoint,{points,bounds}:ReliefOutline):[number,number]|undefined {
  if(Math.max(a[0],b[0])<=bounds.left||Math.min(a[0],b[0])>=bounds.right||
     Math.max(a[1],b[1])<=bounds.top||Math.min(a[1],b[1])>=bounds.bottom)return;
  let from=0,to=1;
  for(let i=0;i<points.length;i++){
    const p=points[i],q=points[(i+1)%points.length];
    const start=side(p,q,a)-1e-7,end=side(p,q,b)-1e-7;
    if(start<=0&&end<=0)return;
    if(start<0)from=Math.max(from,start/(start-end));
    if(end<0)to=Math.min(to,start/(start-end));
    if(to<=from)return;
  }
  return [from,to];
}
export const segmentMeetsRelief=(a:RoadPoint,b:RoadPoint,outline:ReliefOutline)=>!!clipReliefSegment(a,b,outline);

export function mountainRoadApproach(road:CityRoadRoute) {
  const [a,b]=road.points,dx=Math.sign(b[0]-a[0]),dz=Math.sign(b[1]-a[1]);
  const at=(length:number,offset=0):RoadPoint=>[b[0]+dx*length-dz*offset,b[1]+dz*length+dx*offset];
  const lead=at(CITY_MOUNTAIN_ROAD_LEAD+5);
  return {a,b,dx,dz,at,lead,
    blocks(outline:ReliefOutline){
      return segmentMeetsRelief(projectGround(...a),projectGround(...lead),expand(outline,cornerRoom));
    }};
}

/** 在保持出城方向的范围内选可通行山口。直达轴线只有碰到地形才转弯。 */
function routeAcrossValley(start:RoadPoint,ends:readonly RoadPoint[],obstacles:readonly ReliefOutline[],water:RoadWater,
  forward:(p:RoadPoint)=>number,withinValley:(p:RoadPoint)=>boolean):RoadPoint[] {
  const clear=(a:RoadPoint,b:RoadPoint)=>!obstacles.some(outline=>segmentMeetsRelief(a,b,outline));
  if(clear(start,ends[0])&&!water.spans(start,ends[0]).length)return [start,ends[0]];
  const corners=[...obstacles.flatMap(outline=>outline.points),...water.bankPoints]
    .filter(p=>withinValley(p)&&!water.spans(p,p).length);
  const nodes=[start,...ends,...corners];
  const crossings=nodes.map(()=>Infinity),costs=nodes.map(()=>Infinity),parents=nodes.map(()=>-1),closed=new Set<number>();
  const remaining=nodes.map(node=>Math.min(...ends.map(end=>distance(node,end))));
  const progress=nodes.map(forward);
  crossings[0]=costs[0]=0;
  for(let count=nodes.length;count>0;count--){
    let current=-1,best=Infinity,fewest=Infinity;
    costs.forEach((cost,i)=>{
      const score=cost+remaining[i];
      if(!closed.has(i)&&(crossings[i]<fewest||crossings[i]===fewest&&score<best)){
        current=i;best=score;fewest=crossings[i];
      }
    });
    if(current>0&&current<=ends.length){
      const path:RoadPoint[]=[];
      for(let i=current;i>=0;i=parents[i])path.push(nodes[i]);
      return path.reverse();
    }
    if(current<0)break;
    closed.add(current);
    nodes.forEach((node,i)=>{
      // 离开路牌直段时继续向外，避免为了贴近岸线立刻掉头。
      if(closed.has(i)||fewest>crossings[i]||current===0&&progress[i]<progress[0])return;
      const length=distance(nodes[current],node);
      const dryCost=costs[current]+length+.5*Math.max(0,progress[current]-progress[i]);
      if(fewest===crossings[i]&&dryCost>=costs[i]||!clear(nodes[current],node))return;
      // 沿岸方案排在任何过河方案之前。同样需要过河时，优先选择跨水更短的路线。
      const spans=water.spans(nodes[current],node),nextCrossings=fewest+spans.length;
      const next=dryCost+3*length*spans.reduce((sum,[from,to])=>sum+to-from,0);
      if(nextCrossings<crossings[i]||nextCrossings===crossings[i]&&next<costs[i]){
        crossings[i]=nextCrossings;costs[i]=next;parents[i]=current;
      }
    });
  }
  return [];
}

function roundValleyCorners(points:readonly RoadPoint[],water:RoadWater) {
  const result=[points[0],points[1]];
  for(let i=2;i<points.length-1;i++){
    const a=points[i-1],b=points[i],c=points[i+1];
    const before=Math.hypot(a[0]-b[0],a[1]-b[1]),after=Math.hypot(c[0]-b[0],c[1]-b[1]);
    const reach=Math.min(7,before*.32,after*.32);
    const incoming:RoadPoint=[b[0]+(a[0]-b[0])*reach/before,b[1]+(a[1]-b[1])*reach/before];
    const outgoing:RoadPoint=[b[0]+(c[0]-b[0])*reach/after,b[1]+(c[1]-b[1])*reach/after];
    const steps=Math.max(2,Math.ceil(reach/.35));
    const curve=Array.from({length:steps+1},(_,step):RoadPoint=>{
      const t=step/steps,u=1-t;
      return [u*u*incoming[0]+2*u*t*b[0]+t*t*outgoing[0],u*u*incoming[1]+2*u*t*b[1]+t*t*outgoing[1]];
    });
    const projected=curve.map(p=>projectGround(...p));
    // 水边收小圆角，保留原先已找到的沿岸路径。
    if(projected.some((p,j)=>j>0&&water.spans(projected[j-1],p).length))result.push(b);
    else result.push(...curve);
  }
  result.push(points.at(-1)!);
  return result;
}

export function planCityMountainRoads(exits:readonly CityRoadRoute[],relief:readonly ReliefOutline[],
  water:RoadWater,bounds:ProjectedBounds) {
  const extents=[([bounds.left,bounds.top] as RoadPoint),([bounds.right,bounds.bottom] as RoadPoint),
    ([bounds.right,bounds.top] as RoadPoint),([bounds.left,bounds.bottom] as RoadPoint),
    ...relief.flatMap(o=>o.points)].map(unprojectGround);
  const approaches=exits.map(mountainRoadApproach),mountains=relief.map(outline=>expand(outline,cornerRoom));
  const highways:CityRoadRoute[]=[];
  for(const [i,road] of exits.entries()){
    const approach=approaches[i],{a,b,dx,dz,at,lead}=approach;
    const forward=([x,z]:RoadPoint)=>(x-b[0])*dx+(z-b[1])*dz;
    const lateral=([x,z]:RoadPoint)=>-(x-b[0])*dz+(z-b[1])*dx;
    const outlet=Math.max(...extents.map(forward),CITY_MOUNTAIN_ROAD_LEAD+10)+14;
    // 同向出口各自保有一条谷带。两条公路不会因为同一片高地挤进一条道。
    let low=-Infinity,high=Infinity;
    for(const adjacent of approaches){
      if(adjacent===approach||adjacent.dx!==dx||adjacent.dz!==dz)continue;
      const separation=lateral(adjacent.b);
      if(separation<0)low=Math.max(low,separation*.5+1.55);
      if(separation>0)high=Math.min(high,separation*.5-1.55);
    }
    const withinValley=(p:RoadPoint)=>{
      const point=unprojectGround(p),offset=lateral(point);
      return offset>=Math.max(low,-48)&&offset<=Math.min(high,48)&&forward(point)>=-3;
    };
    const ends=[0,-7,7,-16,16,-28,28,-42,42].filter(offset=>offset>=low&&offset<=high)
      .map(offset=>projectGround(...at(outlet,offset)));
    const start=projectGround(...lead);
    const route=routeAcrossValley(start,ends,mountains,water,p=>forward(unprojectGround(p)),withinValley);
    if(!route.length){
      const obstructing=mountains.flatMap((outline,index)=>segmentMeetsRelief(start,ends[0],outline)
        ?[{index,distance:Math.min(...outline.points.map(p=>distance(start,p)))}]:[]).sort((a,b)=>a.distance-b.distance)[0];
      if(obstructing)return {blockedRidge:obstructing.index} as const;
      route.push(start,ends[0]);
    }
    const path=[a,b,...route.map(unprojectGround)],far=path.at(-1)!;
    const points=route.length===2&&Math.abs(lateral(far))<1e-6?[a,b,far]:roundValleyCorners(path,water);
    points.push(at(outlet+4,lateral(far)));
    highways.push({...road,points});
  }
  return {highways} as const;
}
