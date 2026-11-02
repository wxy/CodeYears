export type RoadPoint=[number,number];
export interface CityRoadRoute {id:string;points:readonly RoadPoint[];lanes:2|4|8;closed?:boolean;leftShoulder?:number;cornerRadius?:number}
export interface CityRoadJunction {x:number;z:number;radius:number}
export const CITY_LANE_WIDTH=.4;

/** 输入为世界 XZ 中心线；所有几何和路口裁段只在创建时计算。 */
export function createCityRoadPainter(routes:readonly CityRoadRoute[],junctions:readonly CityRoadJunction[]):(context:CanvasRenderingContext2D)=>void {
  const surfaces:{path:Path2D;width:number}[]=[];
  const markings:{path:Path2D;color:string;width:number;dash:number[];phase:number}[]=[];
  // 路口只清除两条实际相交车行面的重叠区；圆形半径会误伤邻近弯道。
  const crossings=junctions.map(({x,z})=>{
    let left=x,right=x,top=z,bottom=z;
    for(const route of routes){
      const count=route.closed?route.points.length:route.points.length-1;
      for(let i=0;i<count;i++){
        const a=route.points[i],b=route.points[(i+1)%route.points.length],half=route.lanes*CITY_LANE_WIDTH/2,shoulder=route.leftShoulder??0;
        if(a[1]===b[1]&&Math.abs(z-a[1])<1e-6&&x>=Math.min(a[0],b[0])-1e-6&&x<=Math.max(a[0],b[0])+1e-6){
          const extra=Math.sign(b[0]-a[0])*shoulder;top=Math.min(top,z-half+Math.min(0,extra));bottom=Math.max(bottom,z+half+Math.max(0,extra));
        }
        if(a[0]===b[0]&&Math.abs(x-a[0])<1e-6&&z>=Math.min(a[1],b[1])-1e-6&&z<=Math.max(a[1],b[1])+1e-6){
          const extra=-Math.sign(b[1]-a[1])*shoulder;left=Math.min(left,x-half+Math.min(0,extra));right=Math.max(right,x+half+Math.max(0,extra));
        }
      }
    }
    return {left,right,top,bottom};
  });
  for(const route of routes){
    const points=route.points.filter((p,i)=>i===0||p[0]!==route.points[i-1][0]||p[1]!==route.points[i-1][1]);
    if(points.length<2)continue;
    const count=route.closed?points.length:points.length-1;
    const directions=Array.from({length:count},(_,i)=>{
      const a=points[i],b=points[(i+1)%points.length],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
      return {x:(b[0]-a[0])/length,z:(b[1]-a[1])/length};
    });
    // 单侧拓宽只用于当前两点直线支路；行车中心与贯通轴保持原位。
    const shoulder=route.leftShoulder??0,shift=shoulder/2,first=directions[0];
    const path=new Path2D(),radius=route.cornerRadius??0;
    if(radius&&route.closed){
      // 当前圆弧路线是正交闭合外环；路面用真正的切线圆弧，不只是round join。
      const prev=directions.at(-1)!;path.moveTo(points[0][0]-prev.x*radius,points[0][1]-prev.z*radius);
      points.forEach(([x,z],i)=>{const next=directions[i];path.arcTo(x,z,x+next.x*radius,z+next.z*radius,radius)});
      path.closePath();
    }else{
      points.forEach(([x,z],i)=>{const px=x-first.z*shift,pz=z+first.x*shift;i?path.lineTo(px,pz):path.moveTo(px,pz)});
      if(route.closed)path.closePath();
    }
    const half=route.lanes*CITY_LANE_WIDTH/2;surfaces.push({path,width:half*2+shoulder});
    const offsets=[{offset:-.05,kind:'central'},{offset:.05,kind:'central'},
      ...Array.from({length:route.lanes/2-1},(_,i)=>(i+1)*CITY_LANE_WIDTH).flatMap(d=>[{offset:-d,kind:'lane'},{offset:d,kind:'lane'}]),
      ...(shoulder>0?[{offset:half-.055,kind:'edge'}]:[]),
      {offset:-half+.055,kind:'edge'},{offset:half+shoulder-.055,kind:'edge'}];
    for(const {offset,kind}of offsets){
      const central=kind==='central',edge=kind==='edge';
      const color=central?'#d6b96d':edge?'#bcc5bb':'#c9d0c3',width=central?.035:edge?.018:.02,dash=central||edge?[]:[.24,.22];
      // 相邻轴向段的平行线在转角相交，闭环四角不会把线留在道路中心。
      const corners:RoadPoint[]=points.map(([x,z],i)=>{
        const prev=directions[(i-1+count)%count],next=directions[i%count];
        const a=!route.closed&&i===0?next:prev,b=!route.closed&&i===points.length-1?prev:next;
        const divisor=1+a.x*b.x+a.z*b.z;
        return divisor>1e-6?[x-(a.z+b.z)*offset/divisor,z+(a.x+b.x)*offset/divisor]:[x-a.z*offset,z+a.x*offset];
      });
      const parallel:RoadPoint[]=radius&&route.closed?corners.flatMap(([x,z],i)=>{
        const prev=directions[(i-1+count)%count],next=directions[i],turn=prev.x*next.z-prev.z*next.x;
        // 内外车道共用圆心，半径按侧向偏移调整；与直线切向连接。
        const r=radius-offset*turn,cx=x-prev.x*r+next.x*r,cz=z-prev.z*r+next.z*r;
        const start=Math.atan2(-next.z,-next.x);
        // 每个90度弧12段，只供既有路口裁段；路面仍由上方arcTo绘制。
        return Array.from({length:13},(_,step):RoadPoint=>{const angle=start+turn*Math.PI/2*step/12;return [cx+Math.cos(angle)*r,cz+Math.sin(angle)*r]});
      }):corners;
      let distance=0;
      for(let i=0;i<(route.closed?parallel.length:parallel.length-1);i++){
        const a=parallel[i],b=parallel[(i+1)%parallel.length],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
        if(length<1e-6)continue;
        const cuts:[number,number][]=[];
        for(const crossing of crossings){
          let start=0,end=1;
          for(const [origin,delta,min,max]of [[a[0],dx,crossing.left,crossing.right],[a[1],dz,crossing.top,crossing.bottom]]){
            if(Math.abs(delta)<1e-9){if(origin<min||origin>max){end=0;break}}
            else{const t1=(min-origin)/delta,t2=(max-origin)/delta;start=Math.max(start,Math.min(t1,t2));end=Math.min(end,Math.max(t1,t2))}
          }
          if(end>start)cuts.push([start,end]);
        }
        cuts.sort((a,b)=>a[0]-b[0]);
        const visible:[number,number][]=[];let cursor=0;
        for(const [start,end]of cuts){if(start>cursor)visible.push([cursor,start]);cursor=Math.max(cursor,end)}
        if(cursor<1)visible.push([cursor,1]);
        for(const [start,end]of visible){
          const segment=new Path2D();segment.moveTo(a[0]+dx*start,a[1]+dz*start);segment.lineTo(a[0]+dx*end,a[1]+dz*end);
          markings.push({path:segment,color,width,dash,phase:distance+start*length});
        }
        distance+=length;
      }
    }
    // 稀疏导流斜线把拓宽区读成硬路肩，不伪装成新的贡献地块或行车道。
    if(shoulder>.25){
      const a=points[0],b=points[1],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
      for(let distance=.6;distance<length-.6;distance+=.8){
        const x=a[0]+first.x*distance-first.z*(half+shoulder/2),z=a[1]+first.z*distance+first.x*(half+shoulder/2);
        if(junctions.some(j=>Math.hypot(j.x-x,j.z-z)<j.radius+shoulder/2))continue;
        const hatch=new Path2D();
        hatch.moveTo(a[0]+first.x*(distance-.2)-first.z*(half+.1),a[1]+first.z*(distance-.2)+first.x*(half+.1));
        hatch.lineTo(a[0]+first.x*(distance+.2)-first.z*(half+shoulder-.1),a[1]+first.z*(distance+.2)+first.x*(half+shoulder-.1));
        markings.push({path:hatch,color:'#aeb9ad',width:.02,dash:[],phase:0});
      }
    }
  }
  return context=>{
    context.save();
    // 用世界坐标实际宽度描边，再整体做固定2:1等轴测投影。
    context.transform(.5,.25,-.5,.25,0,0);context.lineJoin='miter';context.miterLimit=3;context.lineCap='butt';context.setLineDash([]);context.lineDashOffset=0;
    // 所有路缘先画、所有路面随后覆盖交叉处，最后才提交标线。
    context.strokeStyle='#a7b0a1';for(const {path,width}of surfaces){context.lineWidth=width+.12;context.stroke(path)}
    context.strokeStyle='#626d68';for(const {path,width}of surfaces){context.lineWidth=width;context.stroke(path)}
    for(const marking of markings){context.strokeStyle=marking.color;context.lineWidth=marking.width;context.setLineDash(marking.dash);context.lineDashOffset=marking.phase;context.stroke(marking.path)}
    context.restore();
  };
}
