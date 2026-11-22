import type { CitySprite } from './city-assets';
import { sampleCityBridge, type CityBridge } from './city-road-network';
import { CITY_STREET_LANE_WIDTH } from './city-layout';
import { projectGround } from './city-mountain-roads';
import { cityRoadWidth, planRoadGeometry, type CityRoadRoute, type RoadPoint } from './city-roads';
import { mergeWaterSpans, type RoadWater } from './city-waterways';
import catalog from './city-baked-catalog.json';
import bridgeLevels from './city-bridge-levels.json';

export const CITY_PAINTED_BRIDGE_ELEVATION=bridgeLevels.deckElevation;

/** 贴图两边独立沿桥台定位。跨度和车幅可变，栏柱和桥墩保持竖直。 */
export function createHighwayBridgePainter(routes:readonly CityRoadRoute[],water:RoadWater,art:CitySprite) {
  const {canvas}=art,{sideRows,sideBaseline,asphaltPixels,pixelsPerUnit,pier}=bridgeLevels.arterial;
  const paints:((context:CanvasRenderingContext2D)=>void)[]=[];
  for(const route of routes){
    const half=cityRoadWidth(route)/2;
    for(const {a,b} of planRoadGeometry(route).straights){
      const dx=Math.abs(b[0]-a[0]),dz=Math.abs(b[1]-a[1]),length=Math.max(dx,dz);
      if(Math.min(dx,dz)>1e-6||length<1e-6)continue;
      const alongX=dx>dz,origin=Math.min(a[alongX?0:1],b[alongX?0:1]);
      const at=a[alongX?1:0];
      const point=(t:number,side:number):RoadPoint=>alongX?projectGround(origin+t,at+side):projectGround(at+side,origin+t);
      const wet=[-half,0,half].map(offset=>water.spans(point(0,offset),point(length,offset)));
      const spans=wet.flat().map(([from,to]):[number,number]=>[Math.max(0,from*length-.42),Math.min(length,to*length+.42)]);
      for(const [from,to] of mergeWaterSpans(spans,.09)){
        const [x,y]=point(from,-half),[x1,y1]=point(to,-half),[x2,y2]=point(from,half);
        const edges=[-half,half].map(side=>[point(to,side),point(from,side)] as const);
        const vertical=Math.min(1,.45+(to-from)*.15)/pixelsPerUnit;
        // 小溪由两岸承托。长跨的桥墩以近侧实际水段为中心。
        const waterUnderPier=wet[2].find(([a,b])=>a*length>=from&&b*length<=to&&(b-a)*length>2.6);
        const support=waterUnderPier?.map(t=>t*length);
        paints.push(context=>{
          // 只用原画沥青的细纹调制桥面，车道数量、标线和路宽沿用同一条公路。
          context.save();
          context.transform(x1-x,y1-y,x2-x,y2-y,x,y);
          context.globalCompositeOperation='soft-light';context.globalAlpha=.55;
          context.drawImage(canvas,0,2*sideRows,asphaltPixels,asphaltPixels,0,0,1,1);
          context.restore();
          if(support){
            const [a,b]=support,mid=(a+b)/2,radius=Math.min((to-from)*.14,(b-a)*.22);
            const [px,py]=point(mid+radius,half),[qx,qy]=point(mid-radius,half);
            context.save();
            context.transform(qx-px,qy-py,0,1,px,py);
            context.drawImage(canvas,asphaltPixels,2*sideRows,pier.width,pier.height,0,pier.top*vertical,1,.38);
            context.restore();
          }
          for(const [side,[[startX,startY],[endX,endY]]] of edges.entries()){
            context.save();
            // 同一原画水平镜像即是另一地图轴。竖向分量不随桥长变斜。
            context.transform(endX-startX,endY-startY,0,1,startX,startY);
            context.drawImage(canvas,0,side*sideRows,canvas.width,sideRows,0,-sideBaseline*vertical,1,sideRows*vertical);
            context.restore();
          }
        });
      }
    }
  }
  return (context:CanvasRenderingContext2D)=>{for(const paint of paints)paint(context)};
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
