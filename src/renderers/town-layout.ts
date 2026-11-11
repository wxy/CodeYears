import type { DailyContribution } from '../data/types';
import { planWeeklyCity, type CityParcel, type WeeklyCity } from './city-parcels';
import type { CityScene, CitySceneItem } from './city-view';
import catalog from './town-baked-catalog.json';

type Point=[number,number];
interface Rectangle { x:number; z:number; w:number; d:number }
interface TownCourt extends Rectangle { id:string; gate:Point }
interface TownPlot extends Rectangle { parcel:CityParcel; bodies:(Rectangle&{id:string})[]; courts:TownCourt[]; entries:Point[]; paths:Point[][]; courtyardPads:Rectangle[]; gate:Point }
interface TownSquare { cell:CityParcel; kind:string; x:number; z:number; road:Point }
export interface TownPlan { scene:CityScene; plots:TownPlot[]; roads:[Point,Point][]; squares:TownSquare[]; yearZ:number[]; yearWidth:number[] }
const PITCH=3.8,WIDTH=7*PITCH,GAP=3;
const sprites:Record<string,{nativeWidth:number;nativeDepth:number;entrancePoint?:number[];entranceAxis?:string;entranceSide?:string}>=catalog;
const edgeKey=(a:Point,b:Point)=>[a.join(','),b.join(',')].sort().join('|');
const seedFor=(p:CityParcel)=>((Math.imul(p.block+1,73856093)^Math.imul(p.x+1,19349663)^Math.imul(p.z+1,83492791))>>>0);

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
    const {w,d}=parcel,seed=seedFor(parcel);
    const x=parcel.x*PITCH,z=yearZ[parcel.block]+parcel.z*PITCH,pw=w*PITCH,pd=d*PITCH;
    const after=Math.min(...parcel.indices)+1;
    const yardId='shared-yard';
    const plot:TownPlot={parcel,x,z,w:pw,d:pd,bodies:[],courts:[{id:yardId,x:x+.3,z:z+.3,w:pw-.6,d:pd-.6,gate:[x+pw/2,z+pd-.3]}],entries:[],paths:[],courtyardPads:[],gate:[x+pw/2,z+pd]};
    // 短栏以各自地面中心排序，长侧栏不再跨过前景屋顶。
    const fenceX=sprites['yard-fence-x'],fenceZ=sprites['yard-fence-z'];
    const fence=(id:string,fx:number,fz:number)=>{
      const art=sprites[id];items.push({id,factor:1,x:fx,z:fz,w:art.nativeWidth,d:art.nativeDepth,flat:false,revealAfter:after});
    };
    const spanX=pw-.64,spanZ=pd-.64,gate=spanX/2;
    const top=[0,spanX-fenceX.nativeWidth,...(spanX>6?[spanX*.33-fenceX.nativeWidth/2,spanX*.66-fenceX.nativeWidth/2]:[])];
    const bottom=[gate-.5-fenceX.nativeWidth,gate+.5,0,spanX-fenceX.nativeWidth];
    const sides=[0,spanZ-fenceZ.nativeDepth,...(spanZ>6?[spanZ*.33-fenceZ.nativeDepth/2,spanZ*.66-fenceZ.nativeDepth/2]:[])];
    const front:number[]=[];
    for(const start of bottom)if(start>=0&&start+fenceX.nativeWidth<=spanX&&!front.some(other=>Math.abs(other-start)<fenceX.nativeWidth+.04))front.push(start);
    for(const start of top)fence('yard-fence-x',x+.32+start,z+.32);
    for(const start of front)fence('yard-fence-x',x+.32+start,z+pd-.32-fenceX.nativeDepth);
    for(const start of sides){
      fence('yard-fence-z',x+.32,z+.32+start);
      fence('yard-fence-z',x+pw-.32-fenceZ.nativeWidth,z+.32+start);
    }
    const count=Math.min(4,Math.ceil(w*d/4));
    const columns=count===4&&w>=2&&d>=2?2:pw>=pd?count:1;
    const rows=count===4&&w>=2&&d>=2?2:pw>=pd?1:count;
    for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
      const index=row*columns+column,mx=x+column*pw/columns,mz=z+row*pd/rows,mw=pw/columns,md=pd/rows;
      const transpose=mw>md,cw=transpose?md:mw,cd=transpose?mw:md;
      const point=(u:number,v:number):Point=>transpose?[mx+v,mz+u]:[mx+u,mz+v];
      const padW=w*d===1?1.2:cw<5?1.7:2.3+(seed+index)%2*.15;
      const desiredPadD=1.7+(seed+index)%3*.15;
      let north='rustic-hut-front';
      if(parcel.milestone)north='magic-0';
      else if(!transpose&&index===0){
        if((seed%7===0)&&parcel.band<=1)north='stable-0';
        else if(seed%5===0&&cd>=sprites['forms-0'].nativeDepth+sprites['rustic-hut-back'].nativeDepth+desiredPadD+1.34&&parcel.band<=2)north='forms-0';
        else if(seed%11===0&&parcel.band>=2)north='mage-0';
        else if(seed%5===1)north='cottages-1';
      }
      const northArt=sprites[north],southArt=sprites['rustic-hut-back'];
      const padD=w*d===1?.5:Math.min(desiredPadD,cd-northArt.nativeDepth-southArt.nativeDepth-1.34);
      const westWidth=sprites['rustic-hut-front-x'].nativeWidth;
      const westReach=westWidth+.22+padW/2,eastReach=Math.max(northArt.nativeWidth,southArt.nativeWidth)/2;
      const westCenter=Math.max(cw/2+(westReach-eastReach)/2,.45+westReach);
      const side=w*d>1&&westCenter+padW/2<=cw-.9;
      const cx=side?westCenter:cw/2;
      const cz=w*d===1?northArt.nativeDepth+.88
        :Math.max(northArt.nativeDepth+padD/2+.67,Math.min(cd/2,cd-southArt.nativeDepth-padD/2-.67));
      const center=point(cx,cz);
      const addHouse=(base:string,axis:'x'|'z',u:number,v:number)=>{
        const mirrored=(axis==='x')!==transpose,id=mirrored?`${base}-x`:base,art=sprites[id];
        const [bx,bz]=point(u,v),door:Point=[bx+art.entrancePoint![0],bz+art.entrancePoint![1]];
        const body={id,x:bx,z:bz,w:art.nativeWidth,d:art.nativeDepth};
        items.push({parcel,id,factor:1,x:bx,z:bz,w:body.w,d:body.d,flat:false});plot.bodies.push(body);plot.entries.push(door);
        const positive=art.entranceSide==='front',exit:Point=art.entranceAxis==='x'
          ?[positive?bx+body.w+.12:bx-.12,door[1]]
          :[door[0],positive?bz+body.d+.12:bz-.12];
        plot.paths.push(art.entranceAxis==='x'
          ?[door,exit,[center[0],exit[1]],center]
          :[door,exit,[exit[0],center[1]],center]);
      };
      // 小院以相向的南北屋为骨架；宽院加西翼，东侧始终作为共同入口。
      addHouse(north,'z',cx-northArt.nativeWidth/2,w*d===1?.45:cz-padD/2-.22-northArt.nativeDepth);
      if(w*d>1){
        addHouse('rustic-hut-back','z',cx-southArt.nativeWidth/2+(index%2?.08:-.08),cz+padD/2+.22);
        if(side){
          const west=sprites['rustic-hut-front-x'];
          addHouse('rustic-hut-front','x',cx-padW/2-.22-west.nativeWidth,cz-west.nativeDepth/2+(index%2?.12:-.12));
        }
      }
      const [px,pz]=point(cx-padW/2,cz-padD/2);
      plot.courtyardPads.push({x:px,z:pz,w:transpose?padD:padW,d:transpose?padW:padD});
      const exit=point(cw-.45,cz),corridor=x+pw-.45;
      plot.paths.push([center,exit,[exit[0],mz+md-.45],[corridor,mz+md-.45],[corridor,z+pd-.45],[plot.gate[0],z+pd-.45],plot.gate]);
      if(w*d>1){
        const fixture=point(cx+(index%2?.5:-.55),cz+(index%2?-.55:.55));
        prop(index%2?'life-5':'magic-6',fixture[0],fixture[1],after);
        const person=point(cx-.28,cz+.2);prop(seed%2?'life-0':'life-2',person[0],person[1],after);
      }
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
