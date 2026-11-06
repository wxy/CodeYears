import type { DailyContribution } from '../data/types';
import { planCityScene, type CityScene } from './city-view';
import { CITY_QUARTER_ROADS, CITY_ROAD_WIDTH, CITY_YEAR_GAP } from './city-layout';
import { createCityRoadPainter, type CityRoadRoute, type CityRoadJunction } from './city-roads';

const DAY = 86400000;
export interface OrganicGap { from: string; to: string; days: number; indices: number[] }
export interface OrganicRegion { block: number; segment: number; left: number; right: number }
export interface OrganicCity {
  scene: CityScene; gaps: OrganicGap[]; omitted: number[]; regions: OrganicRegion[];
  rivers: { left: number; right: number; z: number }[];
  /** false表示待填充快照：不根据尚未到达的数据推断边界。 */
  settled: boolean;
}

/** 独立预览候选。输入沿用已校验date/count；阈值不是产品默认值。 */
export function planOrganicCity(days: readonly DailyContribution[], threshold: number, complete: boolean, years: readonly number[]): OrganicCity {
  const original = planCityScene(days, true, years);
  if (!complete) return { scene: original, gaps: [], omitted: [], regions: [], rivers: [], settled: false };
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
  const regions=[...groups.values()];
  // 混排52/53周年时，短年末端既有道路余量不变成额外缺口。
  for(const region of regions){
    const district=original.layout.districts[region.block], weeks=original.weekly.districts[region.block].weeks;
    if(region.right>=district.weekX(weeks-1)+1)region.right=original.width;
  }
  // 年度主路沿原中心线布置，同轴重叠区间先合并，避免每年各画一条平行环路。
  const lines=new Map<string,{horizontal:boolean;at:number;lanes:2|4;spans:{start:number;end:number}[]}>();
  const fixed=(value:number)=>Math.round(value*1000)/1000;
  const road=(horizontal:boolean,at:number,start:number,end:number,lanes:2|4)=>{
    at=fixed(at);const key=`${horizontal}:${at}:${lanes}`;
    let line=lines.get(key);if(!line){line={horizontal,at,lanes,spans:[]};lines.set(key,line)}
    line.spans.push({start:fixed(start),end:fixed(end)});
  };
  const side=CITY_ROAD_WIDTH/2;
  for(const region of regions){
    const z=original.layout.districts[region.block].z, top=z-CITY_YEAR_GAP/2,bottom=z+7+CITY_YEAR_GAP/2;
    for(const at of [top,bottom])road(true,at,region.left-side,region.right+side,4);
    for(const x of new Set([region.left-side,region.right+side,...CITY_QUARTER_ROADS.map(x=>x+side)])){
      if(x>=region.left-side&&x<=region.right+side)road(false,x,top,bottom,2);
    }
  }
  const rivers: {left:number;right:number;z:number}[]=[];
  for(const region of regions) for(const next of regions) {
    if(next.block!==region.block+1 || next.segment!==region.segment)continue;
    const beforeZ=original.layout.districts[region.block].z, afterZ=original.layout.districts[next.block].z;
    if(afterZ-beforeZ>10) {
      const left=Math.max(region.left,next.left),right=Math.min(region.right,next.right);
      if(right>left)rivers.push({left,right,z:(beforeZ+7+afterZ)/2});
      for(const x of CITY_QUARTER_ROADS.map(x=>x+side))if(x>=left&&x<=right)road(false,x,beforeZ+7+CITY_YEAR_GAP/2,afterZ-CITY_YEAR_GAP/2,2);
    }
  }
  const roads:CityRoadRoute[]=[];
  for(const line of lines.values()){
    const merged:{start:number;end:number}[]=[];
    for(const span of line.spans.sort((a,b)=>a.start-b.start)){
      const last=merged.at(-1);if(last&&span.start<=last.end)last.end=Math.max(last.end,span.end);else merged.push({...span});
    }
    for(const span of merged)roads.push({id:`organic-${roads.length}`,lanes:line.lanes,points:line.horizontal?[[span.start,line.at],[span.end,line.at]]:[[line.at,span.start],[line.at,span.end]]});
  }
  const junctions:CityRoadJunction[]=[];
  for(const a of roads)if(a.points[0][1]===a.points[1][1])for(const b of roads)if(b.points[0][0]===b.points[1][0]){
    const x=b.points[0][0],z=a.points[0][1];
    if(x>=a.points[0][0]&&x<=a.points[1][0]&&z>=b.points[0][1]&&z<=b.points[1][1])junctions.push({x,z,radius:.9});
  }
  const scene={...original,items,keys:[...new Set([...items.map(i=>i.id),'natural-ground'])],roadNetwork:{...original.roadNetwork,roads,junctions,bridges:[],vehicles:[]}};
  const shown=new Set(items.flatMap(item=>item.parcel!.indices));
  return {scene,gaps,omitted:days.flatMap((d,i)=>d.count===0&&!shown.has(i)?[i]:[]),regions,rivers,settled:true};
}

/** 地块保留完整星期行；年度主路只绘制一次，共用道路不被分成两条环路。 */
export function createOrganicGround(plan: OrganicCity): (context: CanvasRenderingContext2D)=>void {
  const project=(x:number,z:number):[number,number]=>[(x-z)*.5,(x+z)*.25];
  const paths=plan.regions.map(region=>{
    const z=plan.scene.layout.districts[region.block].z,path=new Path2D();
    [project(region.left-.12,z-.12),project(region.right+.12,z-.12),project(region.right+.12,z+7.12),project(region.left-.12,z+7.12)].forEach((p,i)=>i?path.lineTo(...p):path.moveTo(...p));
    path.closePath();return path;
  });
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
    for(const region of plan.regions){
      const district=plan.scene.layout.districts[region.block];
      context.fillStyle='#384e3b';context.font='.55px system-ui';context.fillText(String(district.year),...project(region.left,district.z+.55));
    }
    context.restore();
  };
}
