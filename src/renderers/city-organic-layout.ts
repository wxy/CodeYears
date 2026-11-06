import type { DailyContribution } from '../data/types';
import { planCityScene, type CityScene } from './city-view';
import { CITY_QUARTER_ROADS, CITY_ROAD_WIDTH, CITY_YEAR_GAP } from './city-layout';
import { createCityRoadLabels, cityRoadLabelLength, type CityRoadLabel } from './city-year-markers';
import { type CityVehicle, type CityVehicleKind } from './city-vehicles';
import { planCityTransport, type CityTrafficSignal } from './city-transport';
import type { CityBridge } from './city-road-network';
import { createCityBridgeApproachPainter, CITY_PAINTED_BRIDGE_APPROACH } from './city-bridges';
import { createCityRoadPainter, planRoadGeometry, type CityRoadRoute, type CityRoadJunction, type RoadPoint } from './city-roads';

const DAY = 86400000;
export interface OrganicGap { from: string; to: string; days: number; indices: number[] }
export interface OrganicRegion { block: number; segment: number; left: number; right: number }
export interface OrganicCity {
  scene: CityScene; gaps: OrganicGap[]; omitted: number[]; regions: OrganicRegion[]; labels:CityRoadLabel[]; signals:CityTrafficSignal[];
  rivers: { left: number; right: number; z: number; top:number; bottom:number }[];
}

/** City轮廓候选。输入沿用已校验date/count；阈值不是产品默认值。 */
export function planOrganicCity(days: readonly DailyContribution[], threshold: number, years: readonly number[], wonders = true, namingOriginYear = years[0]): OrganicCity {
  const original = planCityScene(days, wonders, years);
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
  const rivers: OrganicCity['rivers']=[],bridges:CityBridge[]=[];
  for(const region of regions) for(const next of regions) {
    if(next.block!==region.block+1)continue;
    const beforeZ=original.layout.districts[region.block].z, afterZ=original.layout.districts[next.block].z;
    const left=Math.max(region.left,next.left),right=Math.min(region.right,next.right);
    if(right<=left)continue;
    if(afterZ-beforeZ>10) {
      if(next.segment>=0&&region.segment>=0&&next.segment!==region.segment)continue;
      const top=beforeZ+7+CITY_YEAR_GAP/2,bottom=afterZ-CITY_YEAR_GAP/2;
      rivers.push({left,right,z:(top+bottom)/2,top,bottom});
      // 景观带属于城内；外环沿两岸共同范围跨过它，不给每五年另围一圈。
      footprints.push({left:left-ringHalf,right:right+ringHalf,top:beforeZ+7,bottom:afterZ});
      road(true,beforeZ+7+CITY_YEAR_GAP/2,left-ringHalf,right+ringHalf,4);
      road(true,afterZ-CITY_YEAR_GAP/2,left-ringHalf,right+ringHalf,4);
      CITY_QUARTER_ROADS.forEach((axis,index)=>{const x=fixed(axis+side);if(x>left&&x<right){
        road(false,x,top,bottom,2);
        bridges.push({id:`organic-bridge-${bridges.length}`,band:Math.floor(next.block/5)-1,quarter:index+1,from:[x,top],to:[x,bottom]});
      }});
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
    const lanes=area<0?4:members.some(region=>region.segment===-1)||(land>91&&activeDays>7)?8:2;
    if(area<0){
      // 城内空档不是独立小聚落：两岸沿用年度主路的车幅和轴线。
      const axes=[...lines.values()].filter(line=>line.horizontal&&line.lanes===4).map(line=>line.at);
      for(const point of corners){
        const axis=axes.find(z=>Math.abs(z-point[1])<=CITY_YEAR_GAP/2+1e-6);
        if(axis!==undefined)point[1]=axis;
      }
    }
    roads.push({id:`organic-${area>0?'ring':'courtyard'}-${roads.length}`,lanes,cornerRadius:lanes===8?2.4:1.2,closed:true,points:corners});
  }
  const rings=roads.filter(route=>route.id.startsWith('organic-ring'));
  // 连接路沿荒地向西接入最近片区；未相交的支路在城外共用一条纵向道路。
  connectSettlements(rings,(horizontal,at,start,end,kind)=>road(horizontal,at,start,end,2,kind));
  for(const line of lines.values()){
    const merged:{start:number;end:number}[]=[];
    for(const span of line.spans.sort((a,b)=>a.start-b.start)){
      const last=merged.at(-1);if(last&&span.start<=last.end)last.end=Math.max(last.end,span.end);else merged.push({...span});
    }
    for(const span of merged)roads.push({id:`organic-${line.kind}-${roads.length}`,lanes:line.lanes,points:line.horizontal?[[span.start,line.at],[span.end,line.at]]:[[line.at,span.start],[line.at,span.end]]});
  }
  const junctions:CityRoadJunction[]=[];
  // 主路接环路用紧凑环岛吸收车幅和方向变化，外径不超出较宽道路的预留车幅。
  for(const road of roads)if(!road.closed&&road.lanes===4)for(const [x,z] of road.points){
    const contact=roads.filter(other=>other.closed).flatMap(other=>other.points.map((a,i)=>{
      const b=other.points[(i+1)%other.points.length];
      const px=Math.max(Math.min(a[0],b[0]),Math.min(Math.max(a[0],b[0]),x));
      const pz=Math.max(Math.min(a[1],b[1]),Math.min(Math.max(a[1],b[1]),z));
      return {x:px,z:pz,distance:Math.hypot(px-x,pz-z),lanes:other.lanes};
    })).filter(hit=>hit.distance<=CITY_YEAR_GAP/2+1e-6).sort((a,b)=>a.distance-b.distance)[0];
    if(contact&&!junctions.some(j=>j.x===contact.x&&j.z===contact.z))
      junctions.push({x:contact.x,z:contact.z,radius:Math.max(road.lanes,contact.lanes)*.4/2,roundabout:true});
  }
  joinOrganicStreets(roads,junctions);
  const roadSegments=roads.flatMap(route=>planRoadGeometry(route).straights.map(edge=>({...edge,route})));
  for(const {a,b,route} of roadSegments)if(a[1]===b[1])for(const {a:c,b:d,route:other} of roadSegments)if(c[0]===d[0]&&route!==other){
    const x=c[0],z=a[1];
    if(x>=Math.min(a[0],b[0])&&x<=Math.max(a[0],b[0])&&z>=Math.min(c[1],d[1])&&z<=Math.max(c[1],d[1])&&
      !junctions.some(j=>Math.hypot(j.x-x,j.z-z)<=j.radius))junctions.push({x,z,radius:.9});
  }
  const labels=planRoadLabels(original,regions,roads,junctions,namingOriginYear);
  const straights=roads.flatMap(road=>planRoadGeometry(road).straights.map(edge=>({...edge,road})));
  const signals:CityTrafficSignal[]=junctions.filter(j=>j.roundabout).map(({x,z})=>({x,z,heads:['x','z']}));
  for(const item of original.items)if(item.id.startsWith('traffic-signal')){
    const x=item.x+.125,z=item.z+.125;
    if(junctions.some(j=>j.roundabout&&Math.hypot(j.x-x,j.z-z)<j.radius+.6))continue;
    if(straights.some(({a,b,road})=>Math.hypot(x-Math.max(Math.min(a[0],b[0]),Math.min(Math.max(a[0],b[0]),x)),
      z-Math.max(Math.min(a[1],b[1]),Math.min(Math.max(a[1],b[1]),z)))<=road.lanes*.4/2+.35))
      signals.push({x,z,heads:[item.id==='traffic-signal-w'?'x':'z']});
  }
  // 只在最终圆角直道的车道内布车，避开环岛、文字和彼此；缩放不重新布置。
  const vehicles:CityVehicle[]=[],kinds:CityVehicleKind[]=['sedan','suv','van','bus'];
  const colors=['#b65f4f','#52768b','#dbbd62','#e1ded1','#647e70','#7d6b88'];
  for(const {a,b,road} of straights){
    const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);if(length<3)continue;
    let seed=2166136261;for(const c of road.id)seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
    for(const direction of [1,-1]){
      if(vehicles.length>=180)break;
      const fraction=direction===1?.32+(seed%13)/100:.62+(seed%11)/100;
      const offset=(.2+.4*(seed%(road.lanes/2)))*direction;
      const x=a[0]+dx*fraction+dz/length*offset,z=a[1]+dz*fraction-dx/length*offset;
      if(junctions.some(j=>Math.hypot(j.x-x,j.z-z)<j.radius+.8)||
        bridges.some(bridge=>Math.abs(x-bridge.from[0])<.8&&z>bridge.from[1]-CITY_PAINTED_BRIDGE_APPROACH-.6&&z<bridge.to[1]+CITY_PAINTED_BRIDGE_APPROACH+.6)||
        labels.some(label=>Math.hypot(label.x-x,label.z-z)<cityRoadLabelLength(label.text,label.kind)/2+.65)||
        vehicles.some(v=>Math.hypot(v.x-x,v.z-z)<1.1))continue;
      vehicles.push({x,z,angle:Math.atan2(dz,dx)+(direction===-1?Math.PI:0),kind:kinds[(seed+(direction===1?0:1))%4],color:colors[seed%colors.length]});
    }
  }
  items.push(...planCityTransport(vehicles,signals,bridges));
  const scene={...original,items,keys:[...new Set([...items.map(i=>i.id),'natural-ground'])],roadNetwork:{...original.roadNetwork,roads,junctions,bridges,vehicles}};
  const shown=new Set(items.flatMap(item=>item.parcel?.indices??[]));
  return {scene,gaps,omitted:days.flatMap((d,i)=>d.count===0&&!shown.has(i)?[i]:[]),regions,labels,signals,rivers};
}

/** 所有标识以已完成的真实路段定位，编号基于主页最早可展示年份。 */
function planRoadLabels(scene:CityScene,regions:readonly OrganicRegion[],roads:readonly CityRoadRoute[],junctions:readonly CityRoadJunction[],originYear:number):CityRoadLabel[] {
  const labels:CityRoadLabel[]=[],districts=scene.layout.districts;
  const segments=roads.flatMap(road=>planRoadGeometry(road).straights.map(edge=>({...edge,road})));
  const free=(edge:typeof segments[number],from:number,to:number)=>{
    const {a,b,road}=edge,horizontal=a[1]===b[1],at=horizontal?a[1]:a[0];
    let spans:[number,number][]=[[Math.max(from,Math.min(horizontal?a[0]:a[1],horizontal?b[0]:b[1])),
      Math.min(to,Math.max(horizontal?a[0]:a[1],horizontal?b[0]:b[1]))]];
    for(const other of segments){
      if(other.road===road||(horizontal?other.a[0]!==other.b[0]:other.a[1]!==other.b[1]))continue;
      if(at<Math.min(horizontal?other.a[1]:other.a[0],horizontal?other.b[1]:other.b[0])||
        at>Math.max(horizontal?other.a[1]:other.a[0],horizontal?other.b[1]:other.b[0]))continue;
      const crossing=horizontal?other.a[0]:other.a[1],clearance=other.road.lanes*.4/2+.25;
      spans=spans.flatMap(([start,end])=>[[start,Math.min(end,crossing-clearance)],[Math.max(start,crossing+clearance),end]] as [number,number][]).filter(([start,end])=>end>start);
    }
    for(const junction of junctions)if(junction.roundabout&&Math.abs(at-(horizontal?junction.z:junction.x))<junction.radius){
      const crossing=horizontal?junction.x:junction.z,clearance=junction.radius+.25;
      spans=spans.flatMap(([start,end])=>[[start,Math.min(end,crossing-clearance)],[Math.max(start,crossing+clearance),end]] as [number,number][]).filter(([start,end])=>end>start);
    }
    return spans.filter(([start,end])=>end-start>.2).map(([start,end])=>({x:horizontal?(start+end)/2:at,z:horizontal?at:(start+end)/2,span:end-start,lanes:road.lanes}));
  };
  const place=(year:number,text:string,kind:CityRoadLabel['kind'],horizontal:boolean,side:-1|1,spaces:ReturnType<typeof free>)=>{
    const fits=spaces.filter(space=>space.span>=cityRoadLabelLength(text,kind)).sort((a,b)=>b.span-a.span||a.x-b.x||a.z-b.z);
    for(const space of kind==='block'?fits.slice(0,1):fits){
      const copies=Math.max(1,Math.floor(space.span/10));
      for(let i=0;i<copies;i++){
        const shift=space.span*((i+.5)/copies-.5);
        labels.push({year,text,kind,horizontal,side,...space,x:space.x+(horizontal?shift:0),z:space.z+(horizontal?0:shift),span:space.span/copies});
      }
    }
  };
  districts.forEach((district,block)=>{
    // 街区整体右侧：选择该年份最靠右的保留区域及其外环。
    const region=regions.filter(r=>r.block===block).sort((a,b)=>b.right-a.right)[0];
    if(region){
      const ring=roads.find(road=>road.id.startsWith('organic-ring')&&contains(road.points,(region.left+region.right)/2,district.z+3.5))!;
      place(district.year,`${district.year} BLK`,'block',false,1,
        segments.filter(edge=>edge.road===ring&&edge.a[0]===edge.b[0]&&edge.a[0]>region.right)
          .flatMap(edge=>free(edge,district.z,district.z+7)));
    }
    CITY_QUARTER_ROADS.forEach((axis,index)=>{
      const x=Math.round((axis+CITY_ROAD_WIDTH/2)*1000)/1000;
      place(district.year,['WEST RD','CENTRAL RD','EAST RD'][index],'road',false,-1,
        segments.filter(edge=>!edge.road.closed&&edge.road.lanes===2&&edge.a[0]===x&&edge.b[0]===x)
          .flatMap(edge=>free(edge,district.z,district.z+7)));
    });
    const next=districts[block+1];if(!next)return;
    const number=district.year-originYear+1;
    const suffix=number%100>=11&&number%100<=13?'TH':number%10===1?'ST':number%10===2?'ND':number%10===3?'RD':'TH';
    // 五年带的两岸属于同一年度边界，不拆成两个大道编号。
    const axes=[district.z+7+CITY_YEAR_GAP/2];if(next.z-district.z>10)axes.push(next.z-CITY_YEAR_GAP/2);
    const zs=axes.map(z=>Math.round(z*1000)/1000);
    place(district.year,`${number}${suffix} AVE`,'avenue',true,-1,
      segments.filter(edge=>!edge.road.closed&&edge.road.lanes===4&&edge.a[1]===edge.b[1]&&zs.includes(edge.a[1]))
        .flatMap(edge=>free(edge,-Infinity,Infinity)));
  });
  return labels;
}

/** 年度/季度路先收齐到实际交点；内收圆角旁用短支路接到切线，不留悬空端。 */
function joinOrganicStreets(roads:CityRoadRoute[],junctions:readonly CityRoadJunction[]):void {
  const segments=roads.flatMap(road=>planRoadGeometry(road).straights.map(edge=>({...edge,road})));
  const joins:CityRoadRoute[]=[];
  for(const road of roads)if(!road.closed){
    const points=road.points.map(p=>[...p] as RoadPoint),horizontal=points[0][1]===points[1][1];
    for(const end of [0,1]){
      const point=points[end];
      if(junctions.some(j=>j.roundabout&&Math.hypot(j.x-point[0],j.z-point[1])<j.radius))continue;
      const crossings=segments.filter(segment=>segment.road!==road).flatMap(({a,b})=>{
        if(horizontal&&a[0]===b[0]&&point[1]>=Math.min(a[1],b[1])&&point[1]<=Math.max(a[1],b[1])&&Math.abs(a[0]-point[0])<=1)
          return [{point:[a[0],point[1]] as RoadPoint,distance:Math.abs(a[0]-point[0])}];
        if(!horizontal&&a[1]===b[1]&&point[0]>=Math.min(a[0],b[0])&&point[0]<=Math.max(a[0],b[0])&&Math.abs(a[1]-point[1])<=1)
          return [{point:[point[0],a[1]] as RoadPoint,distance:Math.abs(a[1]-point[1])}];
        return [];
      }).sort((a,b)=>a.distance-b.distance);
      if(crossings.length){points[end]=crossings[0].point;continue}
      const tangent=segments.filter(segment=>segment.road.closed).flatMap(({a,b,road:parent})=>{
        if(horizontal&&a[0]===b[0]&&a[0]===point[0]){
          const z=Math.max(Math.min(a[1],b[1]),Math.min(Math.max(a[1],b[1]),point[1]));
          return [{point:[point[0],z] as RoadPoint,distance:Math.abs(z-point[1]),radius:parent.cornerRadius??0}];
        }
        if(!horizontal&&a[1]===b[1]&&a[1]===point[1]){
          const x=Math.max(Math.min(a[0],b[0]),Math.min(Math.max(a[0],b[0]),point[0]));
          return [{point:[x,point[1]] as RoadPoint,distance:Math.abs(x-point[0]),radius:parent.cornerRadius??0}];
        }
        return [];
      }).filter(hit=>hit.distance>0&&hit.distance<=hit.radius+CITY_YEAR_GAP).sort((a,b)=>a.distance-b.distance)[0];
      if(tangent)joins.push({id:`organic-join-${joins.length}`,lanes:2,points:[point,tangent.point]});
    }
    road.points=points;
  }
  roads.push(...joins);
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
  const edges=rings.flatMap(ring=>planRoadGeometry(ring).straights.filter(({a,b})=>a[0]!==b[0]||a[1]!==b[1]).map(edge=>({...edge,ring})));
  const vertical=edges.filter(({a,b})=>a[0]===b[0]), horizontal=edges.filter(({a,b})=>a[1]===b[1]);
  const west=Math.min(...vertical.map(e=>e.a[0])),east=Math.max(...vertical.map(e=>e.a[0]));
  const north=Math.min(...horizontal.map(e=>e.a[1])),south=Math.max(...horizontal.map(e=>e.a[1]));
  const port=(edge:typeof edges[number])=>(edge.a[1]+edge.b[1])/2;
  const terminals:{x:number;z:number}[]=[];
  if(rings.length>1)for(const ring of rings){
    const side=vertical.filter(e=>e.ring===ring).sort((a,b)=>a.a[0]-b.a[0]||Math.min(a.a[1],a.b[1])-Math.min(b.a[1],b.b[1]))[0];
    const x=side.a[0],low=Math.min(side.a[1],side.b[1]),high=Math.max(side.a[1],side.b[1]);
    const target=vertical.filter(e=>e.ring!==ring&&e.a[0]<x)
      .map(e=>({edge:e,from:Math.max(low,Math.min(e.a[1],e.b[1])),to:Math.min(high,Math.max(e.a[1],e.b[1]))}))
      .filter(e=>e.to>e.from).sort((a,b)=>b.edge.a[0]-a.edge.a[0])[0];
    if(target)road(true,(target.from+target.to)/2,target.edge.a[0],x,'link');
    else terminals.push({x,z:port(side)});
  }
  if(terminals.length>1){
    const spine=west-5;
    for(const {x,z} of terminals)road(true,z,spine,x,'link');
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
  const paintLabels=createCityRoadLabels(plan.labels);
  const paintRoads=createCityRoadPainter(plan.scene.roadNetwork.roads,plan.scene.roadNetwork.junctions);
  const paintApproaches=createCityBridgeApproachPainter(plan.scene.roadNetwork.bridges);
  const water=plan.rivers.map(({left,right,z,top,bottom})=>{
    const half=(bottom-top)/2-.8,samples=Array.from({length:Math.ceil((right-left)*4)+1},(_,i)=>{
      const x=left+(right-left)*i/Math.ceil((right-left)*4),wave=.06*Math.sin(x*1.7+z);
      return {x,near:z-half+wave,far:z+half+wave*.6};
    });
    const bank=(side:'near'|'far')=>{const path=new Path2D();samples.forEach((p,i)=>i?path.lineTo(...project(p.x,p[side])):path.moveTo(...project(p.x,p[side])));return path};
    const path=new Path2D(bank('near'));for(const p of [...samples].reverse())path.lineTo(...project(p.x,p.far));path.closePath();
    const ripples=new Path2D(),stones=new Path2D();
    for(let x=left+.5;x<right-.5;x+=.67){
      for(const offset of [-.63,-.17,.38,.76]){
        const start=x+.21*Math.sin(x*7+offset*13),length=.1+.17*(1+Math.sin(x*9+offset*17))/2;
        const dz=offset+.09*Math.sin(x*2.1+offset*7),a=project(start,z+dz),b=project(start+length,z+dz-.015);
        ripples.moveTo(...a);ripples.quadraticCurveTo(...project(start+length*.5,z+dz-.035),...b);
      }
      for(const side of [-1,1]){const p=project(x,z+side*(half+.1)),radius=.06+.015*Math.sin(x);stones.moveTo(p[0]+radius*Math.cos(side*.4),p[1]+radius*Math.sin(side*.4));stones.ellipse(p[0],p[1],radius,.026,side*.4,0,Math.PI*2)}
    }
    // 渐变沿投影河岸的法线，不能沿斜投影Z轴，否则长河的两端会变成大块纯色。
    const center=project((left+right)/2,z);
    return {path,near:bank('near'),far:bank('far'),ripples,stones,
      from:[center[0]+half*.2,center[1]-half*.4] as [number,number],
      to:[center[0]-half*.2,center[1]+half*.4] as [number,number]};
  });
  return context=>{
    context.save();
    for(const path of paths){context.fillStyle='#b3b4a2';context.fill(path);context.strokeStyle='#d2cbb6';context.lineWidth=.12;context.stroke(path)}
    for(const river of water){
      context.strokeStyle='#8f9f85';context.lineWidth=.28;context.stroke(river.near);context.stroke(river.far);
      const gradient=context.createLinearGradient(...river.from,...river.to);
      gradient.addColorStop(0,'#829e8c');gradient.addColorStop(.2,'#608f8b');gradient.addColorStop(.55,'#497c81');gradient.addColorStop(.82,'#689c96');gradient.addColorStop(1,'#91aa94');
      context.fillStyle=gradient;context.fill(river.path);
      context.strokeStyle='#c2d0b4';context.lineWidth=.035;context.stroke(river.near);context.stroke(river.far);
      context.strokeStyle='#d5e7d840';context.lineWidth=.012;context.stroke(river.ripples);
      context.fillStyle='#b2b49a';context.fill(river.stones);
    }
    paintRoads(context);
    paintApproaches(context);
    paintLabels(context);
    context.restore();
  };
}
