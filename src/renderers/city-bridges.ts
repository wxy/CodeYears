import { sampleCityBridge, type CityBridge } from './city-road-network';
import { CITY_STREET_LANE_WIDTH } from './city-layout';
import { projectGround } from './city-mountain-roads';
import { cityRoadWidth, planRoadGeometry, type CityRoadRoute, type RoadPoint } from './city-roads';
import { mergeWaterSpans, type RoadWater } from './city-waterways';
import catalog from './city-baked-catalog.json';
import bridgeLevels from './city-bridge-levels.json';

export const CITY_PAINTED_BRIDGE_ELEVATION=bridgeLevels.deckElevation;

/** 用车行面两侧和中心与岸线的交点定位桥台。桥面接续原车道标线。 */
export function createHighwayBridgePainter(routes:readonly CityRoadRoute[],water:RoadWater) {
  const deck=new Path2D(),fascia=new Path2D(),rails=new Path2D(),posts=new Path2D(),piers=new Path2D();
  let hasCrossing=false;
  for(const route of routes){
    const {points,directions}=planRoadGeometry(route),half=cityRoadWidth(route)/2;
    if(!directions.length)continue;
    let distance=0;
    const stations=directions.map(d=>{const start=distance;distance+=d.length;return start});
    const normals=points.map((_,i):RoadPoint=>{
      const prev=directions[Math.max(0,i-1)],next=directions[Math.min(i,directions.length-1)];
      const join=1+prev.x*next.x+prev.z*next.z;
      return join>.05?[-(prev.z+next.z)/join,(prev.x+next.x)/join]:[-next.z,next.x];
    });
    const edge=(i:number,offset:number)=>projectGround(points[i][0]+normals[i][0]*offset,points[i][1]+normals[i][1]*offset);
    const wet:[number,number][]=[];
    for(const offset of [-half,0,half]){
      const line=points.map((_,i)=>edge(i,offset));
      for(const [i,{length}] of directions.entries())for(const [from,to] of water.spans(line[i],line[i+1])){
        wet.push([Math.max(0,stations[i]+from*length-.42),Math.min(distance,stations[i]+to*length+.42)]);
      }
    }
    for(const [from,to] of mergeWaterSpans(wet,.09)){
      hasCrossing=true;
      const span=to-from,stepCount=Math.ceil(span/1.05);
      const postsAt=Array.from({length:stepCount+1},(_,i)=>from+span*i/stepCount);
      const along=[...new Set([...postsAt,...stations.filter(t=>t>from&&t<to)])].sort((a,b)=>a-b);
      const section=(t:number,offset:number,drop=0):RoadPoint=>{
        let i=0;
        while(i+1<stations.length&&stations[i+1]<=t)i++;
        const u=(t-stations[i])/directions[i].length;
        const a=edge(i,offset),b=edge(i+1,offset);
        return [a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u+drop];
      };
      const path=(shape:Path2D,line:readonly RoadPoint[],close=false)=>{
        for(const [i,p] of line.entries())i?shape.lineTo(...p):shape.moveTo(...p);
        if(close)shape.closePath();
      };
      const wide=route.lanes===8;
      const width=half+(wide?.22:.15),depth=wide?.40:.28,railHeight=wide?.24:.19,reverse=[...along].reverse();
      path(deck,[...along.map(t=>section(t,-width)),...reverse.map(t=>section(t,width))],true);
      for(const side of [-width,width]){
        path(fascia,[...along.map(t=>section(t,side,depth)),...reverse.map(t=>section(t,side))],true);
        path(rails,along.map(t=>section(t,side,-railHeight)));
        for(const t of postsAt)path(posts,[section(t,side),section(t,side,-railHeight)]);
      }
      if(wide){
        const middle=(from+to)/2;
        const front=section(middle,width)[1]>section(middle,-width)[1]?width:-width;
        for(const fraction of span>3 ? [.34,.66] : [.5]){
          const t=from+span*fraction,pierHalf=Math.min(.26,span*.12);
          // 实际桥跨下的混凝土桥墩，内缩到梁底，保持水道可见。
          path(piers,[section(t-pierHalf,front,depth-.04),section(t+pierHalf,front,depth-.04),
            section(t+pierHalf*.8,front,.79),section(t-pierHalf*.8,front,.79)],true);
        }
      }
    }
  }
  if(!hasCrossing)return;
  return {
    deck(context:CanvasRenderingContext2D){
      context.fillStyle='#9b927d';context.fill(piers);
      context.fillStyle='#687b73';context.fill(fascia);
      context.fillStyle='#b8c4b8';context.fill(deck);
    },
    rails(context:CanvasRenderingContext2D){
      context.setLineDash([]);context.lineJoin='round';context.lineCap='round';
      context.strokeStyle='#73867e';context.lineWidth=.055;context.stroke(posts);
      context.strokeStyle='#e0e2cf';context.lineWidth=.047;context.stroke(rails);
    },
  };
}

/** 引桥由年度大道的靠河路缘向外起坡，不能覆盖岸路的任何一条车道。 */
export function createCityBridgeApproachPainter(bridges:readonly CityBridge[]):(context:CanvasRenderingContext2D)=>void {
  const commands:{path:Path2D;color:string;width?:number}[]=[];
  const roadHalf=cityRoadWidth({lanes:2,laneWidth:CITY_STREET_LANE_WIDTH})/2;
  for(const bridge of bridges)for(const near of [false,true]){
    const profile=catalog[`transport-bridge-${bridge.style}`];
    const from=near?bridge.to:bridge.landings.from,to=near?bridge.landings.to:bridge.from;
    const point=(t:number,offset:number,ground=false):[number,number]=>{
      const x=from[0]+(to[0]-from[0])*t,along=from[1]+(to[1]-from[1])*t;
      const blend=t*t*(3-2*t),height=ground?0:CITY_PAINTED_BRIDGE_ELEVATION*(near?1-blend:blend);
      return [(x+offset-along)*.5,(x+offset+along)*.25-height*.5];
    };
    // 每个桥型按实际标定的端面车幅过渡；石缘和黄线也使用同一宽度。
    const width=(t:number,curb=false)=>{
      const blend=t*t*(3-2*t),from=roadHalf+(curb ? .06 : 0),to=(curb?profile.deckWidth:profile.carriageway)/2;
      return near?to+(from-to)*blend:from+(to-from)*blend;
    };
    const edge=(t:number,side:number,ground=false)=>point(t,width(t,true)*side,ground);
    const times=[0,.125,.25,.375,.5,.625,.75,.875,1];
    const path=(points:readonly [number,number][],color:string,width?:number)=>{
      const shape=new Path2D();points.forEach((p,i)=>i?shape.lineTo(...p):shape.moveTo(...p));if(width===undefined)shape.closePath();commands.push({path:shape,color,width});
    };
    // 挡墙先于桥面，前侧浅石材分缝沿真实坡度收口。
    for(const side of [-1,1]){
      path([...times.map(t=>edge(t,side,true)),...[...times].reverse().map(t=>edge(t,side))],side>0?'#aa977d':'#8d8370');
      for(const t of [.25,.5,.75])path([edge(t,side,true),edge(t,side)],'#d2bfa1',.009);
    }
    const deck=(curb:boolean,color:string)=>path([...times.map(t=>point(t,-width(t,curb))),...[...times].reverse().map(t=>point(t,width(t,curb)))],color);
    deck(true,profile.curb);deck(false,'#626d68');
    for(const side of [-1,1])path(times.map(t=>point(t,(width(t,true)-.035)*side)),'#e4d5bb',.045);
    for(const side of [-1,1])path(times.map(t=>point(t,(width(t)-.035)*side)),'#e1dfd0',.013);
    for(const offset of [-.025,.025])path(times.map(t=>point(t,offset)),'#d6b96d',.014);
  }
  return context=>{
    context.save();context.setLineDash([]);context.lineJoin='round';
    for(const {path,color,width}of commands){
      if(width===undefined){context.fillStyle=color;context.fill(path)}
      else {context.strokeStyle=color;context.lineWidth=width;context.stroke(path)}
    }
    context.restore();
  };
}

/** 两端落在实际路口中心；季度轴不同时缓和过渡，桥头方向仍沿道路。 */
export function createCityBridgePainter(bridges: readonly CityBridge[]): (context: CanvasRenderingContext2D) => void {
  const paint: ((context: CanvasRenderingContext2D) => void)[] = [];
  for (const bridge of bridges) {
    const point = (t: number, offset: number, heightOffset = 0, ground = false): [number, number] => {
      const { x, z, elevation } = sampleCityBridge(bridge, t, offset);
      const height = (ground ? 0 : elevation) + heightOffset;
      return [(x - z) * .5, (x + z) * .25 - height * .5];
    };
    const times = [0, .125, .2, .375, .5, .625, .8, .875, 1];
    const fill = (points: readonly [number, number][], color: string) => {
      const path = new Path2D(); points.forEach((p, i) => i ? path.lineTo(...p) : path.moveTo(...p)); path.closePath();
      paint.push(context => { context.fillStyle = color; context.fill(path); });
    };
    const line = (points: readonly [number, number][], color: string, width: number) => {
      const path = new Path2D(); points.forEach((p, i) => i ? path.lineTo(...p) : path.moveTo(...p));
      paint.push(context => { context.lineJoin = 'round'; context.setLineDash([]); context.strokeStyle = color; context.lineWidth = width; context.stroke(path); });
    };
    const deck = (left: number, right: number, color: string, ground = false) => fill([
      ...times.map(t => point(t, left, 0, ground)), ...[...times].reverse().map(t => point(t, right, 0, ground)),
    ], color);
    deck(-.57, .64, 'rgba(47,75,73,.18)', true);
    // 水中支撑和桥身侧面位于抬升桥面下方。
    for (const t of [.35, .65]) {
      fill([point(t - .025, -.56, 0, true), point(t - .025, .56, 0, true), point(t + .025, .56), point(t + .025, -.56)], '#83958b');
    }
    fill([...times.map(t => point(t, .53, 0, true)), ...[...times].reverse().map(t => point(t, .53))], '#7a8b83');
    deck(-.53, .53, '#c1c5b7');
    deck(-.4, .4, '#626d68');
    for (const offset of [-.355, .355]) line(times.map(t => point(t, offset, .002)), '#e1dfd0', .013);
    // 双黄线在路口留空，接合的是道路中心而不是岸树空隙。
    for (const offset of [-.05, .05]) line([.23, .375, .5, .625, .77].map(t => point(t, offset, .003)), '#d6b96d', .014);
    for (const offset of [-.49, .49]) {
      line([.21, .375, .5, .625, .79].map(t => point(t, offset, .23)), '#dddccd', .018);
      for (let i = 0; i <= 6; i++) {
        const t = .21 + .58 * i / 6;
        line([point(t, offset), point(t, offset, .23)], '#a4b1a5', .018);
      }
      for (const t of [.25, .75]) {
        line([point(t, offset), point(t, offset, .35)], '#7d9083', .028);
        line([point(t, offset, .34), point(t, offset, .39)], '#dfcca0', .04);
      }
    }
  }
  return context => { for (const command of paint) command(context); };
}
