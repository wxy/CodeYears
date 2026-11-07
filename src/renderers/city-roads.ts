export type RoadPoint=[number,number];
export interface CityRoadRoute {id:string;points:readonly RoadPoint[];lanes:2|4|8;laneWidth?:number;closed?:boolean;leftShoulder?:number;cornerRadius?:number;junctionCorners?:readonly RoadPoint[]}
export interface CityRoadJunction {x:number;z:number;radius:number;roundabout?:boolean;signalized?:boolean}
export const CITY_LANE_WIDTH=.4;
export const cityRoadWidth=(route:Pick<CityRoadRoute,'lanes'|'laneWidth'>)=>route.lanes*(route.laneWidth??CITY_LANE_WIDTH);

/** 绘制、接路和路面年份共用圆角后的真实切线，避免各自猜测拐角位置。 */
export function planRoadGeometry(route:CityRoadRoute) {
  const points=route.points.filter((p,i)=>i===0||p[0]!==route.points[i-1][0]||p[1]!==route.points[i-1][1]);
  const count=route.closed?points.length:points.length-1;
  const directions=Array.from({length:count},(_,i)=>{
    const a=points[i],b=points[(i+1)%points.length],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    return {x:(b[0]-a[0])/length,z:(b[1]-a[1])/length,length};
  });
  const radius=route.cornerRadius??0;
  const radii=route.closed?points.map((_,i)=>Math.min(radius,directions[(i-1+count)%count].length/2,directions[i].length/2)):[];
  const straights=directions.map((direction,i)=>{
    const a=points[i],b=points[(i+1)%points.length],start=radii[i]??0,end=radii[(i+1)%points.length]??0;
    return {a:[a[0]+direction.x*start,a[1]+direction.z*start] as RoadPoint,
      b:[b[0]-direction.x*end,b[1]-direction.z*end] as RoadPoint};
  });
  return {points,count,directions,radii,straights};
}

/** 停止线与路缘信号灯共用入口；弯道路口从实际切点外开始，避免灯柱落在车流中央。 */
export function planSignalizedApproaches(routes:readonly CityRoadRoute[],junctions:readonly CityRoadJunction[]) {
  const approaches:{x:number;z:number;dx:number;dz:number;half:number}[]=[];
  const geometry=routes.map(route=>({route,...planRoadGeometry(route)}));
  for(const junction of junctions.filter(j=>j.signalized))for(const {route,points,directions,radii,straights} of geometry){
    const half=cityRoadWidth(route)/2;
    const corner=points.findIndex((p,i)=>route.junctionCorners?.some(q=>p[0]===q[0]&&p[1]===q[1])&&Math.hypot(p[0]-junction.x,p[1]-junction.z)<=radii[i]+1e-6);
    if(corner>=0){
      const previous=(corner-1+directions.length)%directions.length;
      for(const [index,end,sign]of [[previous,'b',-1],[corner,'a',1]] as const){
        const edge=straights[index],direction=directions[index];
        if(Math.hypot(edge.b[0]-edge.a[0],edge.b[1]-edge.a[1])<.4)continue;
        const dx=direction.x*sign,dz=direction.z*sign;
        approaches.push({x:edge[end][0]+dx*.35,z:edge[end][1]+dz*.35,dx,dz,half});
      }
      continue;
    }
    for(const {a,b}of straights){
      const horizontal=a[1]===b[1],at=horizontal?junction.z:junction.x;
      if(Math.abs(at-(horizontal?a[1]:a[0]))>1e-6)continue;
      const center=horizontal?junction.x:junction.z,start=Math.min(horizontal?a[0]:a[1],horizontal?b[0]:b[1]),end=Math.max(horizontal?a[0]:a[1],horizontal?b[0]:b[1]);
      if(center<start-1e-6||center>end+1e-6)continue;
      for(const sign of [-1,1])if((sign<0?center-start:end-center)>=junction.radius+.4){
        const dx=horizontal?sign:0,dz=horizontal?0:sign;
        approaches.push({x:junction.x+dx*(junction.radius+.35),z:junction.z+dz*(junction.radius+.35),dx,dz,half});
      }
    }
  }
  return approaches;
}

/** 输入为世界 XZ 中心线；所有几何和路口裁段只在创建时计算。 */
export function createCityRoadPainter(routes:readonly CityRoadRoute[],junctions:readonly CityRoadJunction[]):(context:CanvasRenderingContext2D)=>void {
  const surfaces:{path:Path2D;width:number}[]=[];
  const markings:{path:Path2D;color:string;width:number;dash:number[];phase:number}[]=[];
  const cornerFills:{curb:Path2D;pavement:Path2D}[]=[];
  const geometry=routes.map(route=>({route,...planRoadGeometry(route)}));
  // 路口只清除两条实际相交车行面的重叠区；圆形半径会误伤邻近弯道。
  const roundabouts=junctions.filter(j=>j.roundabout);
  const crossings=junctions.filter(j=>!j.roundabout).map(({x,z,radius,signalized})=>{
    const clearance=signalized?radius:0;
    let left=x-clearance,right=x+clearance,top=z-clearance,bottom=z+clearance;
    for(const {route,straights} of geometry){
      for(const {a,b} of straights){
        const half=cityRoadWidth(route)/2,shoulder=route.leftShoulder??0;
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
  for(const {route,points,count,directions,radii} of geometry){
    if(points.length<2)continue;
    // 单侧拓宽只用于当前两点直线支路；行车中心与贯通轴保持原位。
    const shoulder=route.leftShoulder??0,shift=shoulder/2,first=directions[0];
    const path=new Path2D(),radius=route.cornerRadius??0;
    if(radius&&route.closed){
      const prev=directions.at(-1)!;path.moveTo(points[0][0]-prev.x*radii[0],points[0][1]-prev.z*radii[0]);
      points.forEach(([x,z],i)=>{const next=directions[i];path.arcTo(x,z,x+next.x*radii[i],z+next.z*radii[i],radii[i])});
      path.closePath();
    }else{
      points.forEach(([x,z],i)=>{const px=x-first.z*shift,pz=z+first.x*shift;i?path.lineTo(px,pz):path.moveTo(px,pz)});
      if(route.closed)path.closePath();
    }
    const laneWidth=route.laneWidth??CITY_LANE_WIDTH,half=cityRoadWidth(route)/2;surfaces.push({path,width:half*2+shoulder});
    // 平交路口只拉直弯外侧，弯内继续沿原圆弧转弯；命令在地面缓存创建前编译。
    const squared=points.map(p=>route.junctionCorners?.some(q=>p[0]===q[0]&&p[1]===q[1])??false);
    points.forEach(([x,z],i)=>{
      if(!squared[i])return;
      const prev=directions[(i-1+count)%count],next=directions[i],turn=prev.x*next.z-prev.z*next.x;
      const fill=(width:number)=>{
        const offset=-turn*width,divisor=1+prev.x*next.x+prev.z*next.z;
        const qx=x-(prev.z+next.z)*offset/divisor,qz=z+(prev.x+next.x)*offset/divisor,r=radii[i]+width;
        const cx=qx-prev.x*r+next.x*r,cz=qz-prev.z*r+next.z*r,start=Math.atan2(-next.z,-next.x);
        const patch=new Path2D();patch.moveTo(qx-prev.x*r,qz-prev.z*r);patch.lineTo(qx,qz);patch.lineTo(qx+next.x*r,qz+next.z*r);
        // 与既有路面微量重叠，避免抗锯齿边缘留下原弧线的细缝。
        patch.arc(cx,cz,r-.02,start+turn*Math.PI/2,start,turn>0);patch.closePath();return patch;
      };
      cornerFills.push({curb:fill(half+.06),pavement:fill(half)});
    });
    const offsets=[{offset:-.05,kind:'central'},{offset:.05,kind:'central'},
      ...Array.from({length:route.lanes/2-1},(_,i)=>(i+1)*laneWidth).flatMap(d=>[{offset:-d,kind:'lane'},{offset:d,kind:'lane'}]),
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
        if(squared[i]&&offset*turn<0)return [[x,z] as RoadPoint];
        // 内外车道共用圆心，半径按侧向偏移调整；与直线切向连接。
        const r=Math.max(0,radii[i]-offset*turn),cx=x-prev.x*r+next.x*r,cz=z-prev.z*r+next.z*r;
        const start=Math.atan2(-next.z,-next.x);
        // 每个90度弧12段，只供既有路口裁段；路面仍由上方arcTo绘制。
        return Array.from({length:13},(_,step):RoadPoint=>{const angle=start+turn*Math.PI/2*step/12;return [cx+Math.cos(angle)*r,cz+Math.sin(angle)*r]});
      }):corners;
      let distance=0;
      for(let i=0;i<(route.closed?parallel.length:parallel.length-1);i++){
        const a=parallel[i],b=parallel[(i+1)%parallel.length],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
        if(length<1e-6)continue;
        const cuts:[number,number][]=[];
        for(const {x,z,radius} of roundabouts){
          // 对实际圆形车行面裁段，避免矩形清线区误伤附近弯道。
          const ox=a[0]-x,oz=a[1]-z,dot=ox*dx+oz*dz,square=length*length;
          const discriminant=dot*dot-square*(ox*ox+oz*oz-radius*radius);
          if(discriminant>0){
            const root=Math.sqrt(discriminant),start=Math.max(0,(-dot-root)/square),end=Math.min(1,(-dot+root)/square);
            if(end>start)cuts.push([start,end]);
          }
        }
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
  const circles=roundabouts.map(({x,z,radius})=>{
    const outer=new Path2D(),island=new Path2D(),edge=new Path2D();
    const inner=radius*.28;
    outer.arc(x,z,radius,0,Math.PI*2);island.arc(x,z,inner,0,Math.PI*2);edge.arc(x,z,inner+.07,0,Math.PI*2);
    return {outer,island,edge};
  });
  const stopLines=planSignalizedApproaches(routes,junctions).map(({x,z,dx,dz,half})=>{
    const path=new Path2D();path.moveTo(x-dz*.1,z+dx*.1);path.lineTo(x-dz*(half-.08),z+dx*(half-.08));return path;
  });
  return context=>{
    context.save();
    // 用世界坐标实际宽度描边，再整体做固定2:1等轴测投影。
    context.transform(.5,.25,-.5,.25,0,0);context.lineJoin='miter';context.miterLimit=3;context.lineCap='round';context.setLineDash([]);context.lineDashOffset=0;
    // 所有路缘先画、所有路面随后覆盖交叉处，最后才提交标线。
    context.strokeStyle='#a7b0a1';for(const {path,width}of surfaces){context.lineWidth=width+.12;context.stroke(path)}
    context.fillStyle='#a7b0a1';for(const {curb}of cornerFills)context.fill(curb);
    context.strokeStyle='#626d68';for(const {path,width}of surfaces){context.lineWidth=width;context.stroke(path)}
    context.fillStyle='#626d68';for(const {pavement}of cornerFills)context.fill(pavement);
    context.fillStyle='#626d68';for(const {outer}of circles)context.fill(outer);
    context.lineCap='butt';
    for(const marking of markings){context.strokeStyle=marking.color;context.lineWidth=marking.width;context.setLineDash(marking.dash);context.lineDashOffset=marking.phase;context.stroke(marking.path)}
    context.setLineDash([]);context.lineWidth=.08;context.strokeStyle='#d9ded0';for(const path of stopLines)context.stroke(path);
    context.setLineDash([]);context.lineWidth=.035;
    for(const {island,edge}of circles){
      context.fillStyle='#8fa17b';context.fill(island);context.strokeStyle='#d2cbb6';context.stroke(island);
      context.strokeStyle='#d6b96d';context.stroke(edge);
    }
    context.restore();
  };
}
