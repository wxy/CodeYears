import type { DailyContribution } from '../data/types';
import { planWeeklyCity, type CityParcel, type WeeklyCity } from './city-parcels';
import type { CityScene, CitySceneItem } from './city-view';
import catalog from './town-baked-catalog.json';

type Point=[number,number];
interface TownPlot { parcel:CityParcel; x:number; z:number; w:number; d:number; bodies:{x:number;z:number;w:number;d:number}[]; entries:Point[]; gate:Point }
interface TownSquare { cell:CityParcel; kind:string; x:number; z:number; road:Point }
export interface TownPlan { scene:CityScene; plots:TownPlot[]; roads:[Point,Point][]; squares:TownSquare[]; yearX:number[]; yearDepth:number[] }
const PITCH=1.7,WIDTH=7*PITCH,GAP=3;
const sprites:Record<string,{nativeWidth:number;nativeDepth:number}>=catalog;
const project=(x:number,z:number):Point=>[(x-z)*.5,(x+z)*.25];
const edgeKey=(a:Point,b:Point)=>[a.join(','),b.join(',')].sort().join('|');
const seedFor=(p:CityParcel)=>((Math.imul(p.block+1,73856093)^Math.imul(p.x+1,19349663)^Math.imul(p.z+1,83492791))>>>0);

/** 七日为一行，区域相近时采用素材能承载的不同矩形，不以楼层编码贡献。 */
export function planTownScene(days:readonly DailyContribution[],reservedYears?:readonly number[],joinedOn?:string):TownPlan {
  const calendar=planWeeklyCity(days,false,false,reservedYears,joinedOn);
  const cells=calendar.cells.map(cell=>({...cell,x:cell.z,z:cell.x}));
  const byCell=new Map(cells.map(cell=>[`${cell.block},${cell.x},${cell.z}`,cell]));
  const candidates:{cell:CityParcel;w:number;d:number;members:CityParcel[]}[]=[];
  // 当前建筑目录承载至八日、最长四格；这是占地容量，不是固定周/月切分线。
  for(const cell of cells){
    if(cell.kind!=='building'||cell.milestone)continue;
    for(let w=1;w<=4;w++)for(let d=1;d<=4;d++){
      if(w*d>8||cell.x+w>7||cell.z+d>calendar.districts[cell.block].weeks)continue;
      const members:CityParcel[]=[];
      for(let z=cell.z;z<cell.z+d;z++)for(let x=cell.x;x<cell.x+w;x++){
        const next=byCell.get(`${cell.block},${x},${z}`);
        if(next?.kind==='building'&&next.band===cell.band&&!next.milestone)members.push(next);
      }
      if(members.length===w*d)candidates.push({cell,w,d,members});
    }
  }
  candidates.sort((a,b)=>b.w*b.d-a.w*a.d||Math.min(b.w,b.d)/Math.max(b.w,b.d)-Math.min(a.w,a.d)/Math.max(a.w,a.d)||a.cell.block-b.cell.block||a.cell.z-b.cell.z||a.cell.x-b.cell.x);
  const used=new Set<number>(),parcels:CityParcel[]=[];
  for(const {cell,w,d,members}of candidates){
    if(members.some(member=>used.has(member.indices[0])))continue;
    const indices=members.flatMap(member=>member.indices),count=members.reduce((sum,member)=>sum+member.count,0);
    indices.forEach(index=>used.add(index));parcels.push({...cell,w,d,indices,count,mean:count/indices.length});
  }
  for(const cell of cells)if(!used.has(cell.indices[0]))parcels.push(cell);
  const weekly:WeeklyCity={...calendar,columns:7,cells,parcels};
  const yearX=calendar.districts.map((_,i)=>i*(WIDTH+GAP));
  const yearDepth=calendar.districts.map(year=>year.weeks*PITCH);
  const width=Math.max(WIDTH,(yearX.at(-1)??0)+WIDTH),depth=Math.max(52*PITCH,...yearDepth);
  const items:CitySceneItem[]=[],plots:TownPlot[]=[],roads:[Point,Point][]=[],squares:TownSquare[]=[];
  const prop=(id:string,x:number,z:number,factor=1,revealAfter=0)=>{
    const art=sprites[id],w=art.nativeWidth*factor,d=art.nativeDepth*factor;
    items.push({id,factor,x:x-w/2,z:z-d/2,w,d,flat:false,revealAfter});
  };
  for(const parcel of parcels){
    if(parcel.kind!=='building')continue;
    const {w,d,band}=parcel,seed=seedFor(parcel),area=w*d;
    let id:string;
    if(parcel.milestone)id='magic-0';
    else if(area===1)id=band>=2&&seed%3===0?`magic-${band>=3?0:1}`:`cottages-${band*2+seed%2}`;
    else if(band<=1&&area>=4)id=w>=2&&d>=2?'forms-7-x':`forms-7${w>d?'-x':''}`;
    else if(w>=2&&d>=2)id=`magic-${w/d>=1.6?5:band>=3?4:3}`;
    else id=`${band>=2&&seed%3===0?'magic-2':`forms-${(Math.max(w,d)>=3?3:0)+(band>=2?1:0)}`}${w>d?'-x':''}`;
    const x=yearX[parcel.block]+parcel.x*PITCH,z=parcel.z*PITCH,pw=w*PITCH,pd=d*PITCH;
    const plot:TownPlot={parcel,x,z,w:pw,d:pd,bodies:[],entries:[],gate:[x+pw/2,z+pd]};
    const addBody=(key:string,bx:number,bz:number,bw:number,bd:number)=>{
      const art=sprites[key],factor=Math.min((bw-.30)/art.nativeWidth,(bd-.42)/art.nativeDepth,1.15);
      const aw=art.nativeWidth*factor,ad=art.nativeDepth*factor,px=bx+(bw-aw)/2,pz=bz+.14;
      items.push({parcel,id:key,factor,x:px,z:pz,w:aw,d:ad,flat:false});
      plot.bodies.push({x:px,z:pz,w:aw,d:ad});plot.entries.push([px+aw/2,pz+ad+.10]);
    };
    if(band<=1&&w>=2&&d>=2){
      // 整图农场尚不能证明共享相机，改用分别校准的连体畜舍与农舍。
      addBody('forms-7-x',x+.15,z+.14,pw-.30,pd*.48);
      addBody('cottages-1',x+.15,z+pd*.5,pw*.48-.15,pd*.5-.38);
    }else if(area>=6&&w>=3){
      addBody(id,x+.15,z+.14,pw-1.8,pd-.38);
      addBody(band<=1?'forms-0':'magic-1',x+pw-1.55,z+.25,1.3,pd-.5);
    }else if(area>=6&&d>=3){
      addBody(id,x+.15,z+.14,pw-.30,pd-1.8);
      addBody(band<=1?'cottages-1':'magic-0',x+.25,z+pd-1.65,Math.min(pw-.5,1.4),1.28);
    }else addBody(id,x+.15,z+.14,pw-.30,pd-.38);
    const after=Math.min(...parcel.indices)+1;
    const entry=plot.entries[0];
    prop(`life-${band>=2?(seed%2?0:2):1}`,entry[0]+.12,entry[1]+.04,1,after);
    if(band<=1&&area>=4)prop('life-3',x+.5,z+pd-.37,.85,after);
    plots.push(plot);
  }
  for(let block=0;block<calendar.districts.length;block++){
    const weeks=calendar.districts[block].weeks,owners=new Int32Array(7*weeks).fill(-1);
    const local=plots.filter(plot=>plot.parcel.block===block);
    local.forEach((plot,id)=>{const p=plot.parcel;for(let y=p.z;y<p.z+p.d;y++)for(let x=p.x;x<p.x+p.w;x++)owners[y*7+x]=id});
    const owner=(x:number,y:number)=>x<0||x>=7||y<0||y>=weeks?-1:owners[y*7+x];
    const allowed=(x:number,y:number,nx:number,ny:number)=>{
      const a=x!==nx?owner(Math.min(x,nx),y-1):owner(x-1,Math.min(y,ny));
      const b=x!==nx?owner(Math.min(x,nx),y):owner(x,Math.min(y,ny));return !(a>=0&&a===b);
    };
    const parent=new Int32Array(8*(weeks+1)).fill(-1),queue:number[]=[];
    for(let y=0;y<=weeks;y++){parent[y*8]=y*8;queue.push(y*8)}
    for(let head=0;head<queue.length;head++){
      const id=queue[head],x=id%8,y=Math.floor(id/8);
      for(const [nx,ny]of [[x+1,y],[x,y-1],[x,y+1],[x-1,y]]){
        if(nx<0||nx>7||ny<0||ny>weeks)continue;
        const next=ny*8+nx;if(parent[next]>=0||!allowed(x,y,nx,ny))continue;
        parent[next]=id;queue.push(next);
      }
    }
    const edges=new Map<string,[Point,Point]>(),roots=new Set<number>();
    for(const {parcel:p}of local){
      let id=(p.z+p.d)*8+Math.round(p.x+p.w/2);
      while(parent[id]!==id){
        const next=parent[id],a:Point=[id%8,Math.floor(id/8)],b:Point=[next%8,Math.floor(next/8)];
        edges.set(edgeKey(a,b),[a,b]);id=next;
      }
      roots.add(Math.floor(id/8));
      const ox=yearX[block];roads.push([[ox+(p.x+p.w/2)*PITCH,(p.z+p.d)*PITCH],[ox+Math.round(p.x+p.w/2)*PITCH,(p.z+p.d)*PITCH]]);
    }
    for(const [a,b]of edges.values())roads.push([[yearX[block]+a[0]*PITCH,a[1]*PITCH],[yearX[block]+b[0]*PITCH,b[1]*PITCH]]);
    for(const y of roots)roads.push([[yearX[block]-.55,y*PITCH],[yearX[block],y*PITCH]]);
    const buckets=new Map<number,{cell:CityParcel;edge:[Point,Point];rank:number}>();
    for(const cell of cells){
      if(cell.block!==block||cell.count!==0)continue;
      const {x,z:y}=cell;
      if(![[x+1,y],[x-1,y],[x,y+1],[x,y-1]].some(([xx,yy])=>(byCell.get(`${block},${xx},${yy}`)?.count??0)>0))continue;
      const edge=([[[x,y],[x+1,y]],[[x,y+1],[x+1,y+1]],[[x,y],[x,y+1]],[[x+1,y],[x+1,y+1]]] as [Point,Point][]).find(([a,b])=>edges.has(edgeKey(a,b)));
      if(!edge)continue;const bucket=Math.floor(y/4),rank=seedFor(cell);
      if(!buckets.has(bucket)||rank<buckets.get(bucket)!.rank)buckets.set(bucket,{cell,edge,rank});
    }
    const squareIndices=new Set<number>();
    for(const [bucket,{cell,edge}]of buckets){
      const x=yearX[block]+(cell.x+.5)*PITCH,z=(cell.z+.5)*PITCH;
      const kind=['magic-6','life-7','life-8','magic-8'][(bucket+block)%4];
      const road:Point=[yearX[block]+(edge[0][0]+edge[1][0])/2*PITCH,(edge[0][1]+edge[1][1])/2*PITCH];
      squares.push({cell,kind,x,z,road});squareIndices.add(cell.indices[0]);
      prop(kind,x,z,1,cell.indices[0]+1);prop('magic-7',x+.48,z-.38,.8,cell.indices[0]+1);
      prop('life-5',x-.45,z+.40,.65,cell.indices[0]+1);
    }
    for(const cell of cells)if(cell.block===block&&cell.count===0&&!squareIndices.has(cell.indices[0])){
      const seed=seedFor(cell),x=yearX[block]+(cell.x+.5)*PITCH,z=(cell.z+.5)*PITCH;
      if(seed%9===0)prop('life-5',x,z,.85,cell.indices[0]+1);
      else if(seed%53===0)prop(seed%2?'life-3':'life-4',x,z,.85,cell.indices[0]+1);
    }
  }
  const scene:CityScene={kind:'town',weekly,items,keys:[...new Set(items.map(item=>item.id))],width,depth,parkStarts:[],roadNetwork:{roads:[],junctions:[],bridges:[],vehicles:[],ringOuter:.7},layout:{width,districts:calendar.districts.map((year,i)=>({year:year.year,z:0,quarterWeeks:[],quarterPadding:[],weekX:week=>yearX[i]+week*PITCH}))}};
  return {scene,plots,roads,squares,yearX,yearDepth};
}

/** 地面与边界路网只随数据规划；缩放仅重画这些固定矢量命令。 */
export function createTownGround(plan:TownPlan):(context:CanvasRenderingContext2D)=>void {
  return ctx=>{
    const rectangle=(x:number,z:number,w:number,d:number,color:string)=>{
      ctx.fillStyle=color;ctx.beginPath();[project(x,z),project(x+w,z),project(x+w,z+d),project(x,z+d)].forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fill();
    };
    const line=(points:Point[],color:string,width:number)=>{
      ctx.beginPath();points.map(([x,z])=>project(x,z)).forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();
    };
    const path=(points:Point[])=>{line(points,'#8c8865',.11);line(points,'#c6bb91',.075)};
    rectangle(-1.1,-1.1,plan.scene.width+2.2,plan.scene.depth+2.2,'#94a16b');
    plan.yearX.forEach((x,i)=>{
      path([[x-.55,-.7],[x-.55,plan.yearDepth[i]+.7]]);
      if(i%3===2){
        rectangle(x-1.95,-1,.65,plan.scene.depth+2,'#54939b');
        for(const y of [12,31,45]){rectangle(x-2.08,y*PITCH-.18,1.64,.36,'#b6b59a');line([[x-2.08,y*PITCH-.18],[x-.44,y*PITCH-.18]],'#d5ccb0',.035)}
      }
      const [tx,ty]=project(x+WIDTH/2,-1.2);ctx.font='600 .48px system-ui';ctx.textAlign='center';ctx.fillStyle='#405b3e';ctx.fillText(String(plan.scene.weekly.districts[i].year),tx,ty);
    });
    path([[plan.yearX[0]??0,-.7],[plan.scene.width,-.7]]);
    for(const {x,z,w,d,parcel,bodies,entries,gate}of plan.plots){
      rectangle(x+.17,z+.17,w-.34,d-.34,parcel.band<=1?'#a4a375':'#a6b184');
      const farm=parcel.band<=1&&parcel.w*parcel.d>=4;
      for(let zz=z+.45;zz<z+d-.65;zz+=.55)for(let xx=x+.3;xx<x+w-.55;xx+=.73){
        if(bodies.some(b=>xx+.3>b.x-.1&&xx<b.x+b.w+.1&&zz+.3>b.z-.1&&zz<b.z+b.d+.1))continue;
        if(zz+.27>z+d-.45||entries.some(([ex,ez])=>zz+.27>ez&&xx+.3>ex-.13&&xx<ex+.13))continue;
        rectangle(xx,zz,.3,.27,farm?'#81734e':'#708850');
        for(let j=0;j<3;j++)line([[xx+.03,zz+.05+j*.08],[xx+.27,zz+.05+j*.08]],farm?'#a7b566':'#c8c18b',.016);
      }
      for(const b of bodies)rectangle(b.x-.03,b.z-.03,b.w+.06,b.d+.06,parcel.band<=1?'#b3a57b':'#c0b895');
      const rail=parcel.band>=3?'#a2a58a':'#92774c';
      line([[x+.17,z+d-.17],[x+.17,z+.17],[x+w-.17,z+.17],[x+w-.17,z+d-.17]],rail,.027);
      line([[x+.17,z+d-.17],[gate[0]-.22,z+d-.17]],rail,.027);line([[gate[0]+.22,z+d-.17],[x+w-.17,z+d-.17]],rail,.027);
      for(const entry of entries)path([entry,[entry[0],z+d-.34],[gate[0],z+d-.34],gate]);
    }
    for(const edge of plan.roads)path(edge);
    for(const square of plan.squares){rectangle(square.x-.62,square.z-.62,1.24,1.24,'#b8b794');path([[square.x,square.z],square.road])}
  };
}
