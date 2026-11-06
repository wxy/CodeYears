import type { DailyContribution } from '../data/types';
import { planCityScene, type CityScene } from './city-view';
import { CITY_QUARTER_ROADS, CITY_ROAD_WIDTH, CITY_YEAR_GAP } from './city-layout';
import { createCityRoadYearLabels, type CityRoadYearLabel } from './city-year-markers';
import { createCityRoadPainter, type CityRoadRoute, type CityRoadJunction, type RoadPoint } from './city-roads';

const DAY = 86400000;
export interface OrganicGap { from: string; to: string; days: number; indices: number[] }
export interface OrganicRegion { block: number; segment: number; left: number; right: number }
export interface OrganicCity {
  scene: CityScene; gaps: OrganicGap[]; omitted: number[]; regions: OrganicRegion[]; labels:CityRoadYearLabel[];
  rivers: { left: number; right: number; z: number }[];
  /** false表示待填充快照：不根据尚未到达的数据推断边界。 */
  settled: boolean;
}

/** City轮廓候选。输入沿用已校验date/count；阈值不是产品默认值。 */
export function planOrganicCity(days: readonly DailyContribution[], threshold: number, complete: boolean, years: readonly number[], wonders = true): OrganicCity {
  const original = planCityScene(days, wonders, years);
  if (!complete) return { scene: original, gaps: [], omitted: [], regions: [], labels:[], rivers: [], settled: false };
  const ordered = days.map((day, index) => ({ ...day, index, time: Date.parse(day.date) })).sort((a,b)=>a.time-b.time);
  const gaps: OrganicGap[] = [];
  let run: typeof ordered = [];
  const finish = () => {
    if (run.length >= threshold) gaps.push({ from: run[0].date, to: run.at(-1)!.date, days: run.length, indices: run.map(d=>d.index) });
    run = [];
  };
  ordered.forEach((day, i) => {
    if (i && day.time - ordered[i-1].time !== DAY) finish();
    if (day.count === 0) run.push(day); else finish();
  });
  finish();
  const removed = new Set(gaps.flatMap(g=>g.indices));
  // 日期缺口阻断连续性；每段仅保留真实贡献前后七天的已知日期。
  const segments = new Map<number, number>();
  let segment = 0;
  ordered.forEach((day,i)=>{
    if (i && (day.time-ordered[i-1].time!==DAY || removed.has(ordered[i-1].index))) segment++;
    if (!removed.has(day.index)) segments.set(day.index, segment);
  });
  const active = new Map<number, number[]>();
  for (const day of ordered) if (day.count>0) {
    const s=segments.get(day.index)!; active.set(s,[...(active.get(s)??[]),day.time]);
  }
  const retained = new Set<number>();
  for (const day of ordered) {
    const s=segments.get(day.index), times=s===undefined?undefined:active.get(s);
    // 只有已知连续段的首尾退让；不跨缺失日期填补地面。
    if (times && day.time>=times[0]-7*DAY && day.time<=times.at(-1)!+7*DAY) retained.add(day.index);
  }
  const items=original.items.filter(item=>item.parcel && (item.parcel.count>0 || item.parcel.indices.every(i=>retained.has(i))));
  // 仅按时间段裁切整周范围，保留完整七天行，不根据路口附近的星期分布制造凹口。
  const groups=new Map<string, OrganicRegion>();
  for (const item of items) {
    const parcel=item.parcel!, member=parcel.indices.find(i=>days[i].count>0)??parcel.indices[0], s=segments.get(member)!;
    const key=`${parcel.block}:${s}`;
    let region=groups.get(key);
    if (!region) { region={block:parcel.block,segment:s,left:item.x,right:item.x+item.w}; groups.set(key,region); }
    region.left=Math.min(region.left,item.x);region.right=Math.max(region.right,item.x+item.w);
  }
  // 请求完成不代表周年的未来日期已经存在：缺少任一天的周仍保留空场地，不补零。
  const knownDates=new Set(days.map(day=>day.date)), bounds=[...groups.values()];
  original.weekly.districts.forEach((district,block)=>{
    let reserved:OrganicRegion|undefined;
    for(let week=0;week<district.weeks;week++){
      const missing=Array.from({length:7},(_,weekday)=>new Date(district.monday+(week*7+weekday)*DAY).toISOString().slice(0,10)).some(date=>!knownDates.has(date));
      if(!missing){reserved=undefined;continue}
      const layout=original.layout.districts[block];
      if(reserved)reserved.right=layout.weekX(week)+1;
      else{reserved={block,segment:-1,left:layout.weekX(week),right:layout.weekX(week)+1};bounds.push(reserved)}
    }
  });
  const regions:OrganicRegion[]=[];
  for(const region of bounds.sort((a,b)=>a.block-b.block||a.left-b.left)){
    const previous=regions.at(-1);
    if(previous&&previous.block===region.block&&region.left<=previous.right){
      previous.right=Math.max(previous.right,region.right);
      if(previous.segment!==region.segment)previous.segment=-1;
    }else regions.push({...region});
  }
  // 混排52/53周年时，短年末端既有道路余量不变成额外缺口。
  for(const region of regions){
    const district=original.layout.districts[region.block], weeks=original.weekly.districts[region.block].weeks;
    if(region.right>=district.weekX(weeks-1)+1)region.right=original.width;
  }
  // 外环取所有街区的并集边界，不能逐年围圈，否则边缘空档仍被道路圈住。
  const ringHalf=1.6, side=CITY_ROAD_WIDTH/2;
  const footprints=regions.map(region=>{
    const z=original.layout.districts[region.block].z;
    return {left:region.left-ringHalf,right:region.right+ringHalf,top:z-ringHalf,bottom:z+7+ringHalf};
  });
  // 年度主路只保留相邻街区共用的部分，外露部分由八车道外环承担。
  const lines=new Map<string,{horizontal:boolean;at:number;lanes:2|4;kind:'street'|'link'|'exit';spans:{start:number;end:number}[]}>();
  const fixed=(value:number)=>Math.round(value*1000)/1000;
  const road=(horizontal:boolean,at:number,start:number,end:number,lanes:2|4,kind:'street'|'link'|'exit'='street')=>{
    at=fixed(at);const key=`${horizontal}:${at}:${lanes}`;
    let line=lines.get(key);if(!line){line={horizontal,at,lanes,kind,spans:[]};lines.set(key,line)}
    if(kind==='exit'||line.kind==='street')line.kind=kind;
    line.spans.push({start:fixed(Math.min(start,end)),end:fixed(Math.max(start,end))});
  };
  for(const region of regions){
    const z=original.layout.districts[region.block].z;
    for(const x of CITY_QUARTER_ROADS.map(x=>x+side)){
      if(x>region.left&&x<region.right)road(false,x,z-ringHalf,z+7+ringHalf,2);
    }
  }
  const rivers: {left:number;right:number;z:number}[]=[];
  for(const region of regions) for(const next of regions) {
    if(next.block!==region.block+1)continue;
    const beforeZ=original.layout.districts[region.block].z, afterZ=original.layout.districts[next.block].z;
    const left=Math.max(region.left,next.left),right=Math.min(region.right,next.right);
    if(right<=left)continue;
    if(afterZ-beforeZ>10) {
      if(next.segment>=0&&region.segment>=0&&next.segment!==region.segment)continue;
      rivers.push({left,right,z:(beforeZ+7+afterZ)/2});
      // 景观带属于城内；外环沿两岸共同范围跨过它，不给每五年另围一圈。
      footprints.push({left:left-ringHalf,right:right+ringHalf,top:beforeZ+7,bottom:afterZ});
      road(true,beforeZ+7+CITY_YEAR_GAP/2,left-ringHalf,right+ringHalf,4);
      road(true,afterZ-CITY_YEAR_GAP/2,left-ringHalf,right+ringHalf,4);
      for(const x of CITY_QUARTER_ROADS.map(x=>x+side))if(x>left&&x<right)road(false,x,beforeZ+7+CITY_YEAR_GAP/2,afterZ-CITY_YEAR_GAP/2,2);
    } else road(true,beforeZ+7+CITY_YEAR_GAP/2,left-ringHalf,right+ringHalf,4);
  }
  // 坐标压缩后只沿占用格与外部的分界走线；内部共边不会进入外环。
  const xs=[...new Set(footprints.flatMap(r=>[fixed(r.left),fixed(r.right)]))].sort((a,b)=>a-b);
  const zs=[...new Set(footprints.flatMap(r=>[fixed(r.top),fixed(r.bottom)]))].sort((a,b)=>a-b);
  const columns=xs.length-1, rows=zs.length-1;
  const occupied=new Set<number>();
  for(const rect of footprints){
    const left=xs.indexOf(fixed(rect.left)),right=xs.indexOf(fixed(rect.right));
    const top=zs.indexOf(fixed(rect.top)),bottom=zs.indexOf(fixed(rect.bottom));
    for(let z=top;z<bottom;z++)for(let x=left;x<right;x++)occupied.add(z*columns+x);
  }
  const boundary=new Map<string,RoadPoint>();
  const pointKey=([x,z]:RoadPoint)=>`${x}:${z}`;
  const edge=(a:RoadPoint,b:RoadPoint)=>boundary.set(pointKey(a),b);
  const filled=(x:number,z:number)=>x>=0&&x<columns&&z>=0&&z<rows&&occupied.has(z*columns+x);
  for(let z=0;z<rows;z++)for(let x=0;x<columns;x++)if(filled(x,z)){
    if(!filled(x,z-1))edge([xs[x],zs[z]],[xs[x+1],zs[z]]);
    if(!filled(x+1,z))edge([xs[x+1],zs[z]],[xs[x+1],zs[z+1]]);
    if(!filled(x,z+1))edge([xs[x+1],zs[z+1]],[xs[x],zs[z+1]]);
    if(!filled(x-1,z))edge([xs[x],zs[z+1]],[xs[x],zs[z]]);
  }
  const roads:CityRoadRoute[]=[];
  while(boundary.size){
    const start=boundary.keys().next().value!,points:RoadPoint[]=[];
    let key=start;
    do{
      const point=key.split(':').map(Number) as RoadPoint, next=boundary.get(key)!;
      points.push(point);boundary.delete(key);key=pointKey(next);
    }while(key!==start);
    const corners=points.filter((p,i)=>{
      const a=points[(i+points.length-1)%points.length],b=points[(i+1)%points.length];
      return (p[0]-a[0])*(b[1]-p[1])!==(p[1]-a[1])*(b[0]-p[0]);
    });
    const area=corners.reduce((sum,p,i)=>{const q=corners[(i+1)%corners.length];return sum+p[0]*q[1]-q[0]*p[1]},0);
    const members=regions.filter(region=>contains(corners,(region.left+region.right)/2,original.layout.districts[region.block].z+3.5));
    const land=members.reduce((sum,region)=>sum+(region.right-region.left)*7,0);
    const activeDays=items.filter(item=>item.parcel!.count>0&&contains(corners,item.x+item.w/2,item.z+item.d/2))
      .reduce((sum,item)=>sum+item.parcel!.indices.filter(index=>days[index].count>0).length,0);
    // 一个季度以内的小片区、至多七个活跃日期的零星聚落统一用双向两车道。
    const lanes=area>0&&land>91&&activeDays>7?8:2;
    roads.push({id:`organic-${area>0?'ring':'courtyard'}-${roads.length}`,lanes,cornerRadius:lanes===8?2.4:1.2,closed:true,points:corners});
  }
  const rings=roads.filter(route=>route.id.startsWith('organic-ring'));
  // 连接路沿荒地向西接入最近片区；未相交的支路在城外共用一条纵向道路。
  connectSettlements(rings,(horizontal,at,start,end,kind)=>road(horizontal,at,start,end,2,kind));
  const labels:CityRoadYearLabel[]=original.layout.districts.flatMap((district,block)=>{
    const region=regions.filter(r=>r.block===block).sort((a,b)=>(b.right-b.left)-(a.right-a.left))[0];
    if(!region)return [];
    const {left,right}=region;
    const ring=rings.find(r=>contains(r.points,(left+right)/2,district.z+3.5))!;
    // 左侧直道先扣掉切线圆角和实际横向路口，再放道路名称。
    const spaces=ring.points.flatMap((a,i)=>{
      const b=ring.points[(i+1)%ring.points.length];
      if(a[0]!==b[0]||a[0]>=left)return [];
      const previous=ring.points[(i+ring.points.length-1)%ring.points.length],next=ring.points[(i+2)%ring.points.length];
      const length=Math.abs(b[1]-a[1]),radius=ring.cornerRadius!;
      const first=Math.min(radius,length/2,Math.hypot(a[0]-previous[0],a[1]-previous[1])/2);
      const last=Math.min(radius,length/2,Math.hypot(next[0]-b[0],next[1]-b[1])/2);
      let spans:[number,number][]=[[Math.max(district.z,Math.min(a[1],b[1])+(a[1]<b[1]?first:last)),
        Math.min(district.z+7,Math.max(a[1],b[1])-(a[1]<b[1]?last:first))]];
      for(const line of lines.values())if(line.horizontal&&line.spans.some(span=>a[0]>=span.start&&a[0]<=span.end)){
        const clearance=line.lanes*.4/2+.25;
        spans=spans.flatMap(([from,to])=>[[from,Math.min(to,line.at-clearance)],[Math.max(from,line.at+clearance),to]] as [number,number][]).filter(([from,to])=>to>from);
      }
      return spans.filter(([from,to])=>to>from).map(([from,to])=>({x:a[0],z:(from+to)/2,span:to-from}));
    }).sort((a,b)=>b.span-a.span||b.x-a.x);
    return [{year:district.year,lanes:ring.lanes,...spaces[0]}];
  });
  for(const line of lines.values()){
    const merged:{start:number;end:number}[]=[];
    for(const span of line.spans.sort((a,b)=>a.start-b.start)){
      const last=merged.at(-1);if(last&&span.start<=last.end)last.end=Math.max(last.end,span.end);else merged.push({...span});
    }
    for(const span of merged)roads.push({id:`organic-${line.kind}-${roads.length}`,lanes:line.lanes,points:line.horizontal?[[span.start,line.at],[span.end,line.at]]:[[line.at,span.start],[line.at,span.end]]});
  }
  const junctions:CityRoadJunction[]=[];
  const roadSegments=roads.flatMap(route=>Array.from({length:route.points.length-(route.closed?0:1)},(_,i)=>({
    a:route.points[i],b:route.points[(i+1)%route.points.length],route,
  })));
  for(const {a,b,route} of roadSegments)if(a[1]===b[1])for(const {a:c,b:d,route:other} of roadSegments)if(c[0]===d[0]&&route!==other){
    const x=c[0],z=a[1];
    if(x>=Math.min(a[0],b[0])&&x<=Math.max(a[0],b[0])&&z>=Math.min(c[1],d[1])&&z<=Math.max(c[1],d[1]))junctions.push({x,z,radius:.9});
  }
  const scene={...original,items,keys:[...new Set([...items.map(i=>i.id),'natural-ground'])],roadNetwork:{...original.roadNetwork,roads,junctions,bridges:[],vehicles:[]}};
  const shown=new Set(items.flatMap(item=>item.parcel!.indices));
  return {scene,gaps,omitted:days.flatMap((d,i)=>d.count===0&&!shown.has(i)?[i]:[]),regions,labels,rivers,settled:true};
}

/** 正交闭环内的点，供街区归属与年份牌定位共用。 */
function contains(points:readonly RoadPoint[],x:number,z:number):boolean {
  let inside=false;
  points.forEach((a,i)=>{const b=points[(i+1)%points.length];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside});
  return inside;
}

/** 西向射线只接入首先遇到的外环，不穿过建筑；城外纵路将各分支连成一网。 */
function connectSettlements(rings:readonly CityRoadRoute[],road:(horizontal:boolean,at:number,start:number,end:number,kind:'link'|'exit')=>void):void {
  if(!rings.length)return;
  const edges=rings.flatMap(ring=>ring.points.map((a,i)=>({a,b:ring.points[(i+1)%ring.points.length],ring})));
  const vertical=edges.filter(({a,b})=>a[0]===b[0]), horizontal=edges.filter(({a,b})=>a[1]===b[1]);
  const west=Math.min(...vertical.map(e=>e.a[0])),east=Math.max(...vertical.map(e=>e.a[0]));
  const north=Math.min(...horizontal.map(e=>e.a[1])),south=Math.max(...horizontal.map(e=>e.a[1]));
  const port=(edge:typeof edges[number])=>{
    const low=Math.min(edge.a[1],edge.b[1]),high=Math.max(edge.a[1],edge.b[1]);
    return Math.min((low+high)/2,low+(edge.ring.cornerRadius??0)+.1);
  };
  const terminals:{x:number;z:number}[]=[];
  if(rings.length>1)for(const ring of rings){
    const side=vertical.filter(e=>e.ring===ring).sort((a,b)=>a.a[0]-b.a[0]||Math.min(a.a[1],a.b[1])-Math.min(b.a[1],b.b[1]))[0];
    const x=side.a[0],z=port(side);
    const target=vertical.filter(e=>e.ring!==ring&&e.a[0]<x&&z>=Math.min(e.a[1],e.b[1])&&z<=Math.max(e.a[1],e.b[1])).sort((a,b)=>b.a[0]-a.a[0])[0];
    if(target)road(true,z,target.a[0]-.2,x+.2,'link');
    else terminals.push({x,z});
  }
  if(terminals.length>1){
    const spine=west-5;
    for(const {x,z} of terminals)road(true,z,spine,x+.2,'link');
    road(false,spine,Math.min(...terminals.map(p=>p.z)),Math.max(...terminals.map(p=>p.z)),'link');
  }
  // 四向出口从全局最外沿出发，避免重新横穿内收后的荒地或其他街区。
  for(const [x,reach] of [[west,west-12],[east,east+12]]){
    const side=vertical.find(e=>e.a[0]===x)!;
    road(true,port(side),x,reach,'exit');
  }
  for(const [z,reach] of [[north,north-12],[south,south+12]]){
    const side=horizontal.find(e=>e.a[1]===z)!;
    road(false,(side.a[0]+side.b[0])/2,z,reach,'exit');
  }
}

/** 地块保留完整星期行；外环沿城市并集内收，年度道路只保留共用部分。 */
export function createOrganicGround(plan: OrganicCity): (context: CanvasRenderingContext2D)=>void {
  const project=(x:number,z:number):[number,number]=>[(x-z)*.5,(x+z)*.25];
  const paths=plan.regions.map(region=>{
    const z=plan.scene.layout.districts[region.block].z,path=new Path2D();
    [project(region.left-.12,z-.12),project(region.right+.12,z-.12),project(region.right+.12,z+7.12),project(region.left-.12,z+7.12)].forEach((p,i)=>i?path.lineTo(...p):path.moveTo(...p));
    path.closePath();return path;
  });
  const paintYears=createCityRoadYearLabels(plan.labels);
  const paintRoads=createCityRoadPainter(plan.scene.roadNetwork.roads,plan.scene.roadNetwork.junctions);
  return context=>{
    context.save();
    for(const path of paths){context.fillStyle='#b3b4a2';context.fill(path);context.strokeStyle='#d2cbb6';context.lineWidth=.12;context.stroke(path)}
    for(const {left,right,z} of plan.rivers){
      const river=new Path2D();river.moveTo(...project(left,z));river.lineTo(...project(right,z));
      context.strokeStyle='#98a88a';context.lineWidth=1.5;context.stroke(river);
      context.strokeStyle='#699c9c';context.lineWidth=.8;context.stroke(river);
    }
    paintRoads(context);
    paintYears(context);
    context.restore();
  };
}
