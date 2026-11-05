import type { DailyContribution } from '../data/types';
import { planCityScene, type CityScene } from './city-view';

const DAY = 86400000;
export interface OrganicGap { from: string; to: string; days: number; indices: number[] }
export interface OrganicRegion { block: number; segment: number; columns: { x: number; top: number; bottom: number }[] }
export interface OrganicCity {
  scene: CityScene; gaps: OrganicGap[]; omitted: number[]; regions: OrganicRegion[];
  /** false表示待填充快照：不根据尚未到达的数据推断边界。 */
  settled: boolean;
}

/** 独立预览候选。输入沿用已校验date/count；阈值不是产品默认值。 */
export function planOrganicCity(days: readonly DailyContribution[], threshold: number, complete: boolean, years: readonly number[]): OrganicCity {
  const original = planCityScene(days, true, years);
  if (!complete) return { scene: original, gaps: [], omitted: [], regions: [], settled: false };
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
  // 年度边缘依附近真实贡献的星期行退让；内部短空档保留通道。
  for(const cell of original.weekly.cells) if(cell.count===0 && retained.has(cell.indices[0])) {
    const nearby=original.weekly.cells.filter(c=>c.count>0&&c.block===cell.block&&Math.abs(c.x-cell.x)<=2);
    if(nearby.length && (cell.z<Math.min(...nearby.map(c=>c.z))-1 || cell.z>Math.max(...nearby.map(c=>c.z))+1)) retained.delete(cell.indices[0]);
  }
  const items=original.items.filter(item=>item.parcel && (item.parcel.count>0 || item.parcel.indices.every(i=>retained.has(i))));
  // 按真实保留地块构造列包络；邻列外扩取并集，圆润退让不能裁掉建筑。
  const groups=new Map<string, OrganicRegion>();
  for (const item of items) {
    const parcel=item.parcel!, s=segments.get(parcel.indices[0])!;
    const key=`${parcel.block}:${s}`;
    let region=groups.get(key);
    if (!region) { region={block:parcel.block,segment:s,columns:[]}; groups.set(key,region); }
    for(let dx=0;dx<parcel.w;dx++) {
      const x=original.layout.districts[parcel.block].weekX(parcel.x+dx);
      let col=region.columns.find(c=>c.x===x);
      if(!col){col={x,top:item.z,bottom:item.z+parcel.d};region.columns.push(col)}
      col.top=Math.min(col.top,item.z);col.bottom=Math.max(col.bottom,item.z+parcel.d);
    }
  }
  const regions=[...groups.values()];
  for(const region of regions) {
    region.columns.sort((a,b)=>a.x-b.x);
    const before=region.columns.map(c=>({...c}));
    region.columns.forEach((c,i)=>{
      const neighbors=before.slice(Math.max(0,i-1),i+2);
      c.top=Math.min(...neighbors.map(n=>n.top))-1;
      c.bottom=Math.max(...neighbors.map(n=>n.bottom))+1;
    });
  }
  const scene={...original,items,keys:[...new Set([...items.map(i=>i.id),'natural-ground'])]};
  const shown=new Set(items.flatMap(item=>item.parcel!.indices));
  return {scene,gaps,omitted:days.flatMap((d,i)=>d.count===0&&!shown.has(i)?[i]:[]),regions,settled:true};
}

/** 年度地面与周边道路共用轮廓；没有穿过空档的旧矩形环路/景观/桥梁。 */
export function createOrganicGround(plan: OrganicCity): (context: CanvasRenderingContext2D)=>void {
  const paths=plan.regions.map(region=>{
    const path=new Path2D(), cols=region.columns;
    const point=(x:number,z:number,first=false)=>first?path.moveTo((x-z)*.5,(x+z)*.25):path.lineTo((x-z)*.5,(x+z)*.25);
    const left=cols[0].x-1, right=cols.at(-1)!.x+2;
    point(left,cols[0].top,true);
    cols.forEach((c,i)=>{const next=cols[i+1];point(next?(c.x+1+next.x)/2:right,c.top);if(next)point((c.x+1+next.x)/2,next.top)});
    point(right,cols.at(-1)!.bottom);
    [...cols].reverse().forEach((c,i)=>{const prev=cols[cols.length-i-2];point(prev?(prev.x+1+c.x)/2:left,c.bottom);if(prev)point((prev.x+1+c.x)/2,prev.bottom)});
    path.closePath();return path;
  });
  const project=(x:number,z:number):[number,number]=>[(x-z)*.5,(x+z)*.25];
  const links: {from:[number,number];to:[number,number]}[]=[];
  const rivers: {left:number;right:number;z:number}[]=[];
  for(const region of plan.regions) for(const next of plan.regions) {
    if(next.block!==region.block+1 || next.segment!==region.segment)continue;
    const beforeZ=plan.scene.layout.districts[region.block].z, afterZ=plan.scene.layout.districts[next.block].z;
    if(afterZ-beforeZ>10) {
      const left=Math.max(region.columns[0].x,next.columns[0].x), right=Math.min(region.columns.at(-1)!.x+1,next.columns.at(-1)!.x+1);
      if(right>left)rivers.push({left,right,z:(beforeZ+7+afterZ)/2});
    }
    for(const x of [13.4,27.2,41]) {
      const a=region.columns.find(c=>Math.abs(c.x-x)<1.5), b=next.columns.find(c=>Math.abs(c.x-x)<1.5);
      // 只有同一时间段两岸均保留的季度轴才连接；不跨长期中断。
      if(a && b && a.bottom>=beforeZ+7 && b.top<=afterZ) links.push({from:[x,a.bottom],to:[x,b.top]});
    }
  }
  return context=>{
    context.save();context.lineJoin='round';
    for(const {left,right,z} of rivers){
      const river=new Path2D();river.moveTo(...project(left,z));river.lineTo(...project(right,z));
      context.strokeStyle='#98a88a';context.lineWidth=1.5;context.stroke(river);
      context.strokeStyle='#699c9c';context.lineWidth=.8;context.stroke(river);
    }
    for(const {from,to} of links){
      const path=new Path2D();path.moveTo(...project(...from));path.lineTo(...project(...to));
      context.strokeStyle='#d2cbb6';context.lineWidth=.7;context.stroke(path);
      context.strokeStyle='#606967';context.lineWidth=.4;context.stroke(path);
      context.strokeStyle='#d6b96d';context.lineWidth=.025;context.stroke(path);
    }
    for(const [i,path] of paths.entries()){
      context.fillStyle='#b3b4a2';context.fill(path);
      context.strokeStyle='#d2cbb6';context.lineWidth=.72;context.stroke(path);
      context.strokeStyle='#606967';context.lineWidth=.45;context.stroke(path);
      context.strokeStyle='#d6b96d';context.lineWidth=.025;context.setLineDash([.2,.16]);context.stroke(path);context.setLineDash([]);
      context.save();context.clip(path);
      const region=plan.regions[i];
      for(const x of [13.4,27.2,41]) {
        const col=region.columns.find(c=>Math.abs(c.x-x)<1.5);
        if(!col)continue;
        const road=new Path2D();road.moveTo(...project(x,col.top));road.lineTo(...project(x,col.bottom));
        context.strokeStyle='#606967';context.lineWidth=.4;context.stroke(road);
      }
      context.restore();
      const regionYear=plan.scene.layout.districts[region.block].year, first=region.columns[0];
      context.fillStyle='#384e3b';context.font='.55px system-ui';context.fillText(String(regionYear),...project(first.x,first.top+.8));
    }
    context.restore();
  };
}
