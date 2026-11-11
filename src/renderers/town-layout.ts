import type { DailyContribution } from '../data/types';
import { planWeeklyCity, type CityParcel, type WeeklyCity } from './city-parcels';
import type { CityScene, CitySceneItem } from './city-view';
import catalog from './town-baked-catalog.json';

type Point=[number,number];
interface Rectangle { x:number; z:number; w:number; d:number }
interface CourtMetadata { width:number; depth:number; gateX:number; doorX:number; doorZ:number }
interface TownCourt extends Rectangle { id:string; gate:Point; door:Point }
interface TownPlot extends Rectangle { parcel:CityParcel; bodies:(Rectangle&{id:string})[]; courts:TownCourt[]; entries:Point[]; paths:Point[][]; beds:Rectangle[]; gate:Point }
interface TownSquare { cell:CityParcel; kind:string; x:number; z:number; road:Point }
export interface TownPlan { scene:CityScene; plots:TownPlot[]; roads:[Point,Point][]; squares:TownSquare[]; yearZ:number[]; yearWidth:number[] }
const PITCH=3.8,WIDTH=7*PITCH,GAP=3,SETBACK=.32,COURT_GAP=.35;
const sprites:Record<string,{nativeWidth:number;nativeDepth:number;court?:CourtMetadata}>=catalog;
const edgeKey=(a:Point,b:Point)=>[a.join(','),b.join(',')].sort().join('|');
const seedFor=(p:CityParcel)=>((Math.imul(p.block+1,73856093)^Math.imul(p.x+1,19349663)^Math.imul(p.z+1,83492791))>>>0);
const overlaps=(a:Rectangle,b:Rectangle,margin=0)=>a.x+a.w>b.x-margin&&a.x<b.x+b.w+margin&&a.z+a.d>b.z-margin&&a.z<b.z+b.d+margin;

/** 最多四栋完整实尺独立院落；逐行排放，行间保留入户通道。 */
function packCourts(ids:string[],w:number,d:number):TownCourt[]|undefined {
  const courts=ids.map(id=>({id,...sprites[id].court!}));
  const arrangements=[];
  for(let columns=1;columns<=courts.length;columns++){
    const positions:Point[]=[],rowWidths:number[]=[];
    let z=0;
    for(let start=0;start<courts.length;start+=columns){
      const row=courts.slice(start,start+columns),depth=Math.max(...row.map(c=>c.depth));
      let x=0;
      for(const court of row){positions.push([x,z+depth-court.depth]);x+=court.width+COURT_GAP}
      rowWidths.push(x-COURT_GAP);z+=depth+COURT_GAP;
    }
    arrangements.push({w:Math.max(...rowWidths),d:z-COURT_GAP,positions});
  }
  const fit=arrangements.filter(a=>a.w<=w-SETBACK*2&&a.d<=d-SETBACK*2)
    .sort((a,b)=>Math.max(a.w/w,a.d/d)-Math.max(b.w/w,b.d/d))[0];
  if(!fit)return;
  const x=(w-fit.w)/2,z=SETBACK+(d-SETBACK*2-fit.d)*.1;
  return courts.map((court,i):TownCourt=>{
    const [px,pz]=fit.positions[i],cx=x+px,cz=z+pz;
    return {id:court.id,x:cx,z:cz,w:court.width,d:court.depth,gate:[cx+court.gateX,cz+court.depth],door:[cx+.3+court.doorX,cz+.2+court.doorZ]};
  });
}

/** 支路沿独立院外侧走；后排院门绕过前院，不能借道穿过别院。 */
function courtAccess(court:TownCourt,plot:TownPlot):Point[] {
  const start:Point=[court.gate[0],court.gate[1]+.16],front=plot.z+plot.d-.04;
  const blocked=(path:Point[])=>path.slice(1).some((b,i)=>{
    const a=path[i],segment={x:Math.min(a[0],b[0]),z:Math.min(a[1],b[1]),w:Math.abs(a[0]-b[0]),d:Math.abs(a[1]-b[1])};
    return plot.courts.some(c=>overlaps(segment,c,.025));
  });
  const direct=[court.gate,start,[start[0],front],[plot.gate[0],front],plot.gate] as Point[];
  if(!blocked(direct.slice(1)))return direct;
  const routes=[plot.x+.04,plot.x+plot.w-.04].map(side=>[court.gate,start,[side,start[1]],[side,front],[plot.gate[0],front],plot.gate] as Point[]);
  return routes.filter(route=>!blocked(route.slice(1))).sort((a,b)=>{
    const length=(path:Point[])=>path.slice(1).reduce((sum,p,i)=>sum+Math.abs(p[0]-path[i][0])+Math.abs(p[1]-path[i][1]),0);
    return length(a)-length(b);
  })[0];
}

/** 与现代城市共用周向+x、星期向+z；相近真实数量构成矩形聚落。 */
export function planTownScene(days:readonly DailyContribution[],reservedYears?:readonly number[],joinedOn?:string):TownPlan {
  const calendar=planWeeklyCity(days,false,false,reservedYears,joinedOn);
  const cells=calendar.cells;
  const byCell=new Map(cells.map(cell=>[`${cell.block},${cell.x},${cell.z}`,cell]));
  const candidates:{cell:CityParcel;w:number;d:number;members:CityParcel[]}[]=[];
  // 最多八周、七日、三十二个成员；跨原强度档，不设固定周/月切分线。
  for(const cell of cells){
    if(cell.kind!=='building'||cell.milestone)continue;
    for(let w=1;w<=8;w++)for(let d=1;d<=7;d++){
      if(w*d>32||cell.x+w>calendar.districts[cell.block].weeks||cell.z+d>7)continue;
      const members:CityParcel[]=[];
      for(let z=cell.z;z<cell.z+d;z++)for(let x=cell.x;x<cell.x+w;x++){
        const next=byCell.get(`${cell.block},${x},${z}`);
        if(next?.kind==='building'&&!next.milestone)members.push(next);
      }
      if(members.length!==w*d)continue;
      const mean=members.reduce((sum,member)=>sum+member.count,0)/members.length;
      if(members.every(member=>Math.abs(member.count-mean)<=Math.max(3,mean*.7)))candidates.push({cell,w,d,members});
    }
  }
  candidates.sort((a,b)=>b.w*b.d-a.w*a.d||Math.min(b.w,b.d)/Math.max(b.w,b.d)-Math.min(a.w,a.d)/Math.max(a.w,a.d)||a.cell.block-b.cell.block||a.cell.z-b.cell.z||a.cell.x-b.cell.x);
  const used=new Set<number>(),parcels:CityParcel[]=[];
  for(const {cell,w,d,members}of candidates){
    if(members.some(member=>used.has(member.indices[0])))continue;
    const indices=members.flatMap(member=>member.indices),count=members.reduce((sum,member)=>sum+member.count,0);
    const mean=count/indices.length,band=mean<=2?0:mean<=5?1:mean<=19?2:mean<=49?3:4;
    indices.forEach(index=>used.add(index));parcels.push({...cell,w,d,indices,count,mean,band});
  }
  for(const cell of cells)if(!used.has(cell.indices[0]))parcels.push(cell);
  const weekly:WeeklyCity={...calendar,cells,parcels};
  const yearZ=calendar.districts.map((_,i)=>i*(WIDTH+GAP));
  const yearWidth=calendar.districts.map(year=>year.weeks*PITCH);
  const width=Math.max(52*PITCH,...yearWidth),depth=Math.max(WIDTH,(yearZ.at(-1)??0)+WIDTH);
  const items:CitySceneItem[]=[],plots:TownPlot[]=[],roads:[Point,Point][]=[],squares:TownSquare[]=[];
  const prop=(id:string,x:number,z:number,revealAfter=0)=>{
    const art=sprites[id],w=art.nativeWidth,d=art.nativeDepth;
    items.push({id,factor:1,x:x-w/2,z:z-d/2,w,d,flat:false,revealAfter});
  };
  for(const parcel of parcels){
    if(parcel.kind!=='building')continue;
    const {w,d,band}=parcel,seed=seedFor(parcel),area=w*d;
    const x=parcel.x*PITCH,z=yearZ[parcel.block]+parcel.z*PITCH,pw=w*PITCH,pd=d*PITCH;
    const after=Math.min(...parcel.indices)+1;
    const oriented=(id:string)=>w>d?[`${id}-x`,id]:[id,`${id}-x`];
    const workshops=seed%2===0?[['magic-3'],...oriented('magic-2').map(id=>[id])]:[...oriented('magic-2').map(id=>[id]),['magic-3']];
    const choices=parcel.milestone?[['magic-0']]:band<=1
      ?[
        ...(area>=12?oriented('forms-0').map(id=>[id,'stable-0','cottages-1','stable-0']):[]),
        ...(area>=6?oriented('forms-0').map(id=>[id,'stable-0','cottages-1']):[]),
        ...(area>=4?oriented('forms-0').map(id=>[id,'stable-0']):[]),
        ...(area>=2?[['cottages-1','stable-0']]:[]),['cottages-1']
      ]
      :[
        ...(area>=12&&band>=3?[['academy-0','mage-0','magic-0'],...oriented('guild-0').map(id=>[id,'mage-0','magic-0'])]:[]),
        ...(band>=3?[['academy-0'],...oriented('guild-0').map(id=>[id])]:[]),
        ...(area>=8?workshops.map(ids=>[...ids,'mage-0','magic-0']):[]),
        ...workshops,
        ...((seed%2===0)?[['mage-0'],['magic-0']]:[['magic-0'],['mage-0']])
      ];
    const courts=choices.map(ids=>packCourts(ids,pw,pd)).find(Boolean)!;
    const plot:TownPlot={parcel,x,z,w:pw,d:pd,bodies:[],courts:courts.map((c):TownCourt=>({...c,x:x+c.x,z:z+c.z,gate:[x+c.gate[0],z+c.gate[1]],door:[x+c.door[0],z+c.door[1]]})),entries:[],paths:[],beds:[],gate:[x+pw/2,z+pd]};
    for(const court of plot.courts){
      const art=sprites[court.id],bx=court.x+.3,bz=court.z+.2;
      items.push({parcel,id:court.id,factor:1,x:bx,z:bz,w:art.nativeWidth,d:art.nativeDepth,flat:false});
      plot.bodies.push({id:court.id,x:bx,z:bz,w:art.nativeWidth,d:art.nativeDepth});
      plot.entries.push(court.door);
      for(const phase of ['back','front'])items.push({id:`court-${court.id}-${phase}`,factor:1,x:court.x,z:court.z,w:court.w,d:court.d,flat:false,revealAfter:after,sortY:phase==='back'?(court.x+court.z)/4-.001:(court.x+court.z+court.w+court.d)/4+.001});
      prop(seed%2?'life-0':'life-2',Math.min(court.x+court.w-.25,court.gate[0]+.28),court.z+court.d-.38,after);
      if(court.id==='guild-0'||court.id==='guild-0-x'||court.id==='academy-0'){
        // 沿用已审阅原型的开放内院居民；placed 坐标是素材原点，镜像行会交换两轴。
        const mirror=court.id==='guild-0-x',middle=(mirror?art.nativeDepth:art.nativeWidth)*.5,openZ=(mirror?art.nativeWidth:art.nativeDepth)*.7;
        for(const [id,offset]of [['life-2',-.35],['life-1',.35]] as const){
          const person=sprites[id],[px,pz]=mirror?[openZ,middle+offset]:[middle+offset,openZ];
          items.push({id,factor:1,x:bx+px,z:bz+pz,w:person.nativeWidth,d:person.nativeDepth,flat:false,revealAfter:after});
        }
      }
    }
    plot.paths=plot.courts.map(court=>courtAccess(court,plot));
    const onPath=(patch:Rectangle)=>plot.paths.some(path=>path.slice(1).some((b,i)=>{
      const a=path[i];return overlaps(patch,{x:Math.min(a[0],b[0]),z:Math.min(a[1],b[1]),w:Math.abs(a[0]-b[0]),d:Math.abs(a[1]-b[1])},.12);
    }));
    // 院外余地使用固定人尺度的菜畦/果树，不把同一栋房子变成越来越大的空院。
    let garden=0;
    for(let zz=z+.35;zz<z+pd-.7;zz+=.85)for(let xx=x+.25;xx<x+pw-.8;xx+=.9){
      const patch={x:xx,z:zz,w:.55,d:.42};
      if(plot.courts.some(c=>overlaps(patch,c,.12))||onPath(patch))continue;
      if(area>=4&&garden++%7===0){
        const tree={x:xx-.05,z:zz-.05,w:.65,d:.65};
        if(!plot.courts.some(c=>overlaps(tree,c,.12))&&!onPath(tree))prop('life-5',xx+.275,zz+.275,after);
        else plot.beds.push(patch);
      }else plot.beds.push(patch);
    }
    plots.push(plot);
  }
  for(let block=0;block<calendar.districts.length;block++){
    const weeks=calendar.districts[block].weeks,stride=weeks+1,oz=yearZ[block];
    const owners=new Int32Array(7*weeks).fill(-1);
    const local=plots.filter(plot=>plot.parcel.block===block);
    local.forEach((plot,id)=>{const p=plot.parcel;for(let y=p.z;y<p.z+p.d;y++)for(let x=p.x;x<p.x+p.w;x++)owners[y*weeks+x]=id});
    const owner=(x:number,y:number)=>x<0||x>=weeks||y<0||y>=7?-1:owners[y*weeks+x];
    const allowed=(x:number,y:number,nx:number,ny:number)=>{
      const a=x!==nx?owner(Math.min(x,nx),y-1):owner(x-1,Math.min(y,ny));
      const b=x!==nx?owner(Math.min(x,nx),y):owner(x,Math.min(y,ny));return !(a>=0&&a===b);
    };
    const parent=new Int32Array(stride*8).fill(-1),queue:number[]=[];
    for(let x=0;x<=weeks;x++){parent[x]=x;queue.push(x)}
    for(let head=0;head<queue.length;head++){
      const id=queue[head],x=id%stride,y=Math.floor(id/stride);
      for(const [nx,ny]of [[x+1,y],[x,y-1],[x,y+1],[x-1,y]]){
        if(nx<0||nx>weeks||ny<0||ny>7)continue;
        const next=ny*stride+nx;if(parent[next]>=0||!allowed(x,y,nx,ny))continue;
        parent[next]=id;queue.push(next);
      }
    }
    const edges=new Map<string,[Point,Point]>(),roots=new Set<number>();
    for(const {parcel:p}of local){
      let id=(p.z+p.d)*stride+Math.round(p.x+p.w/2);
      while(parent[id]!==id){
        const next=parent[id],a:Point=[id%stride,Math.floor(id/stride)],b:Point=[next%stride,Math.floor(next/stride)];
        edges.set(edgeKey(a,b),[a,b]);id=next;
      }
      roots.add(id%stride);
      roads.push([[(p.x+p.w/2)*PITCH,oz+(p.z+p.d)*PITCH],[Math.round(p.x+p.w/2)*PITCH,oz+(p.z+p.d)*PITCH]]);
    }
    for(const [a,b]of edges.values())roads.push([[a[0]*PITCH,oz+a[1]*PITCH],[b[0]*PITCH,oz+b[1]*PITCH]]);
    for(const x of roots)roads.push([[x*PITCH,oz-.55],[x*PITCH,oz]]);
    roads.push([[-.7,oz-.55],[yearWidth[block]+.7,oz-.55]]);
    if(block>0)roads.push([[-.7,yearZ[block-1]-.55],[-.7,oz-.55]]);
    const buckets=new Map<number,{cell:CityParcel;edge:[Point,Point];rank:number}>();
    for(const cell of cells){
      if(cell.block!==block||cell.count!==0)continue;
      const {x,z:y}=cell;
      if(![[x+1,y],[x-1,y],[x,y+1],[x,y-1]].some(([xx,yy])=>(byCell.get(`${block},${xx},${yy}`)?.count??0)>0))continue;
      const edge=([[[x,y],[x+1,y]],[[x,y+1],[x+1,y+1]],[[x,y],[x,y+1]],[[x+1,y],[x+1,y+1]]] as [Point,Point][]).find(([a,b])=>edges.has(edgeKey(a,b)));
      if(!edge)continue;const bucket=Math.floor(x/4),rank=seedFor(cell);
      if(!buckets.has(bucket)||rank<buckets.get(bucket)!.rank)buckets.set(bucket,{cell,edge,rank});
    }
    const squareIndices=new Set<number>();
    for(const [bucket,{cell,edge}]of buckets){
      const x=(cell.x+.5)*PITCH,z=oz+(cell.z+.5)*PITCH;
      const kind=['magic-6','life-8','magic-8'][(bucket+block)%3];
      const road:Point=[(edge[0][0]+edge[1][0])/2*PITCH,oz+(edge[0][1]+edge[1][1])/2*PITCH];
      squares.push({cell,kind,x,z,road});squareIndices.add(cell.indices[0]);
      prop(kind,x,z,cell.indices[0]+1);prop('magic-7',x+.7,z-.7,cell.indices[0]+1);
      prop('life-5',x-.75,z+.65,cell.indices[0]+1);
      prop('life-0',x+.65,z+.65,cell.indices[0]+1);
    }
    for(const cell of cells)if(cell.block===block&&cell.count===0&&!squareIndices.has(cell.indices[0])){
      const seed=seedFor(cell),x=(cell.x+.5)*PITCH,z=oz+(cell.z+.5)*PITCH;
      if(seed%9===0)prop('life-5',x,z,cell.indices[0]+1);
    }
  }
  const scene:CityScene={kind:'town',weekly,items,keys:[...new Set([...items.map(item=>item.id),'natural-ground','town-stone','town-earth','town-paving','outskirts-forest','outskirts-hills'])],width,depth,parkStarts:[],roadNetwork:{roads:[],junctions:[],bridges:[],vehicles:[],ringOuter:.7},layout:{width,districts:calendar.districts.map((year,i)=>({year:year.year,z:yearZ[i],quarterWeeks:[],quarterPadding:[],weekX:week=>week*PITCH}))}};
  return {scene,plots,roads,squares,yearZ,yearWidth};
}

export { createTownGround } from './town-ground';
