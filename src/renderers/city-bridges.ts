import { sampleCityBridge, type CityBridge } from './city-road-network';

export const CITY_PAINTED_BRIDGE_ELEVATION=.18;
export const CITY_PAINTED_BRIDGE_APPROACH=.8;

/** 引桥从年度大道外侧路缘起坡，终点与精绘桥面的高度及轴线一致。 */
export function createCityBridgeApproachPainter(bridges:readonly CityBridge[]):(context:CanvasRenderingContext2D)=>void {
  const commands:{path:Path2D;color:string;width?:number}[]=[];
  for(const bridge of bridges)for(const near of [false,true]){
    const [x,z]=near?bridge.to:bridge.from;
    const point=(t:number,offset:number,ground=false):[number,number]=>{
      const along=near?z+t*CITY_PAINTED_BRIDGE_APPROACH:z+(t-1)*CITY_PAINTED_BRIDGE_APPROACH;
      const blend=t*t*(3-2*t),height=ground?0:CITY_PAINTED_BRIDGE_ELEVATION*(near?1-blend:blend);
      // 原画车行面略窄于季度路，坡道同时缓和车幅，避免接缝外露尖角。
      const across=offset*(near?.875+.125*t:1-.125*t);
      return [(x+across-along)*.5,(x+across+along)*.25-height*.5];
    };
    const times=[0,.125,.25,.375,.5,.625,.75,.875,1];
    const path=(points:readonly [number,number][],color:string,width?:number)=>{
      const shape=new Path2D();points.forEach((p,i)=>i?shape.lineTo(...p):shape.moveTo(...p));if(width===undefined)shape.closePath();commands.push({path:shape,color,width});
    };
    // 挡墙先于桥面，前侧浅石材分缝沿真实坡度收口。
    for(const offset of [-.56,.56]){
      path([...times.map(t=>point(t,offset,true)),...[...times].reverse().map(t=>point(t,offset))],offset>0?'#aa977d':'#8d8370');
      for(const t of [.25,.5,.75])path([point(t,offset,true),point(t,offset)],'#d2bfa1',.009);
    }
    const deck=(left:number,right:number,color:string)=>path([...times.map(t=>point(t,left)),...[...times].reverse().map(t=>point(t,right))],color);
    deck(-.56,.56,'#c5b397');deck(-.4,.4,'#626d68');
    for(const offset of [-.49,.49])path(times.map(t=>point(t,offset)),'#e4d5bb',.045);
    for(const offset of [-.355,.355])path(times.map(t=>point(t,offset)),'#e1dfd0',.013);
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
