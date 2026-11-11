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
    const plot:TownPlot={parcel,x,z,w:pw,d:pd,bodies:[],courts:[{id:'shared-compound',x:x+.3,z:z+.3,w:pw-.6,d:pd-.6,gate:[x+pw/2,z+pd-.3]}],entries:[],paths:[],courtyardPads:[],gate:[x+pw/2,z+pd]};
    const area=w*d,transpose=pw>pd,cw=transpose?pd:pw,cd=transpose?pw:pd;
    const point=(u:number,v:number):Point=>transpose?[x+v,z+u]:[x+u,z+v];
    const choices=parcel.milestone?['magic-0']:area===1
      ?parcel.band<=1?['cottages-1','cottages-2','cottages-3','stable-0','cottages-4','rustic-hut-front']
        :['mage-0','cottages-4','magic-0','cottages-2','cottages-3']
      :parcel.band===0?['forms-0','cottages-1','stable-0']
        :parcel.band===1?['magic-2','forms-0','cottages-3']
          :parcel.band===2?['forms-2','forms-1','forms-4','magic-2']
            :['magic-0','magic-3','mage-0'];
    const primaryChoices=area>=4&&cw<6&&parcel.band<=2?choices.filter(id=>id.startsWith('forms-')||id==='magic-2'):choices;
    const offset=parcel.milestone?0:seed%primaryChoices.length;
    const preferred=[...primaryChoices.slice(offset),...primaryChoices.slice(0,offset),...choices,'forms-0','mage-0','cottages-1'];
    const candidates=preferred.flatMap(id=>sprites[`${id}-x`]?[id,`${id}-x`]:[id]).map(id=>{
      const art=sprites[id];return {id,w:transpose?art.nativeDepth:art.nativeWidth,d:transpose?art.nativeWidth:art.nativeDepth};
    });
    // 只用已烘焙的朝向和原生尺寸；不为形制档位阻断实际可容纳的后备建筑。
    const fitted=candidates.filter(body=>body.w<=cw-.86&&body.d<=cd-(area===1?1.4:2.25));
    const family=fitted.filter(body=>choices.includes(body.id.replace(/-x$/,'')));
    const eligible=family.length?family:fitted;
    const main=area>=8?eligible.sort((a,b)=>b.w*b.d-a.w*a.d)[0]:eligible[0];
    const mainArt=sprites[main.id],mainAxis=transpose?(mainArt.entranceAxis==='x'?'z':'x'):mainArt.entranceAxis;
    const narrow=cw<6,annexCount=area>=12?2:area>=4?1:0;
    const annexBases=area>=12&&cw>=10
      ?main.id.startsWith('magic-3')?['magic-2','cottages-3']
        :main.id.startsWith('magic-0')||main.id.startsWith('mage-0')?['magic-2','forms-1']
          :main.id.startsWith('forms-')?['forms-1','cottages-4']:['forms-0','stable-0']
      :main.id.startsWith('forms-0')?['stable-0','cottages-1']
      :main.id.startsWith('magic-2')?['cottages-3','stable-0']
        :main.id.startsWith('forms-')?['cottages-4','cottages-2']:['cottages-3','cottages-4'];
    const annexes=narrow&&annexCount
      ?[{id:transpose?'rustic-hut-back-x':'rustic-hut-back',w:sprites['rustic-hut-back'].nativeWidth,d:sprites['rustic-hut-back'].nativeDepth}]
      :annexBases.slice(0,annexCount).map((base,index)=>{
        const id=index===1&&base==='forms-1'?(transpose?base:`${base}-x`):base,art=sprites[id];
        return {id,w:transpose?art.nativeDepth:art.nativeWidth,d:transpose?art.nativeWidth:art.nativeDepth};
      });
    const desiredPadD=area===1?.7:area<=3?1.2:area<12?2:Math.max(2.8,...annexes.map(body=>body.d+.5));
    const padD=Math.min(desiredPadD,cd-.86-main.d-.25-(narrow&&annexes.length?annexes[0].d+.3:0));
    const left=narrow?0:annexes[0]?annexes[0].w+.25:0,right=narrow?0:annexes[1]?annexes[1].w+.25:0;
    const padW=Math.min(area===1?1.4:Math.max(1.8,Math.min(4,main.w*.65+1.2)),cw-.86-left-right);
    const westReach=Math.max(main.w/2,padW/2+left),eastReach=Math.max(main.w/2,padW/2+right);
    const centerX=cw/2+(westReach-eastReach)/2;
    const groupD=main.d+.25+padD+(narrow&&annexes.length?annexes[0].d+.3:0);
    const startZ=Math.max(.43,(cd-groupD)/2),padZ=startZ+main.d+.25;
    const center:Point=[centerX,padZ+padD/2],mainX=mainAxis==='x'&&narrow?.43:centerX-main.w/2;
    const addHouse=(body:{id:string;w:number;d:number},u:number,v:number)=>{
      const art=sprites[body.id],[bx,bz]=point(u,v),entry=art.entrancePoint!;
      const door:Point=transpose?[u+entry[1],v+entry[0]]:[u+entry[0],v+entry[1]];
      const axis=transpose?(art.entranceAxis==='x'?'z':'x'):art.entranceAxis,positive=art.entranceSide==='front';
      const exit:Point=axis==='x'
        ?[positive?Math.max(u+body.w+.12,door[0]):Math.min(u-.12,door[0]),door[1]]
        :[door[0],positive?Math.max(v+body.d+.12,door[1]):Math.min(v-.12,door[1])];
      const route=axis==='x'?[door,exit,[exit[0],center[1]],center]:[door,exit,[center[0],exit[1]],center];
      items.push({parcel,id:body.id,factor:1,x:bx,z:bz,w:art.nativeWidth,d:art.nativeDepth,flat:false});
      plot.bodies.push({id:body.id,x:bx,z:bz,w:art.nativeWidth,d:art.nativeDepth});plot.entries.push(point(...door));plot.paths.push(route.map(([u,v])=>point(u,v)));
    };
    addHouse(main,mainX,startZ);
    for(const [index,annex]of annexes.entries()){
      const u=narrow?(cw-annex.w)/2:index===0?centerX-padW/2-.25-annex.w:centerX+padW/2+.25;
      const v=narrow?padZ+padD+.3:padZ+padD-annex.d-.22;
      addHouse(annex,u,v);
    }
    const [px,pz]=point(centerX-padW/2,padZ);
    plot.courtyardPads.push({x:px,z:pz,w:transpose?padD:padW,d:transpose?padW:padD});
    const exitZ=Math.min(cd-.45,padZ+padD+.25);
    const access=narrow&&annexes.length
      ?[center,[cw-.45,center[1]],[cw-.45,cd-.45]]
      :[center,[centerX,exitZ],[cw-.45,exitZ],[cw-.45,cd-.45]];
    const route=access.map(([u,v])=>point(u,v)),last=route.at(-1)!;
    plot.paths.push([...route,[x+pw-.45,last[1]],[x+pw-.45,z+pd-.45],[plot.gate[0],z+pd-.45],plot.gate]);
    if(area>1){
      const fixture=point(centerX-padW*.28,padZ+padD*.7);prop(area>=4?'magic-6':'magic-7',fixture[0],fixture[1],after);
      const resident=point(centerX+padW*.3,padZ+padD*.35);prop(seed%2?'life-0':'life-2',resident[0],resident[1],after);
      if(area>=8){const tree=point(centerX+padW*.32,padZ+padD*.76);prop('life-5',tree[0],tree[1],after)}
    }
    // 连续感由低围栏明确，而不是复制小院；每一短段仍按自身脚点排序。
    const stone=main.id.startsWith('magic-0')||main.id.startsWith('magic-3')||main.id.startsWith('forms-2');
    const fenceX=sprites[stone?'yard-wall-x':'yard-fence-x'],fenceZ=sprites[stone?'yard-wall-z':'yard-fence-z'];
    const segment=(id:string,fx:number,fz:number)=>{
      const art=sprites[id];items.push({id,factor:1,x:fx,z:fz,w:art.nativeWidth,d:art.nativeDepth,flat:false,revealAfter:after});
    };
    const spanX=pw-.64,spanZ=pd-.64,gate=spanX/2;
    const starts=(length:number,span:number)=>{const count=Math.ceil((length-span)/1.35)+1;return Array.from({length:count},(_,i)=>i*(length-span)/(count-1))};
    for(const start of starts(spanX,fenceX.nativeWidth)){
      segment(stone?'yard-wall-x':'yard-fence-x',x+.32+start,z+.32);
      if(start+fenceX.nativeWidth<=gate-.5||start>=gate+.5)segment(stone?'yard-wall-x':'yard-fence-x',x+.32+start,z+pd-.32-fenceX.nativeDepth);
    }
    for(const start of starts(spanZ,fenceZ.nativeDepth)){
      segment(stone?'yard-wall-z':'yard-fence-z',x+.32,z+.32+start);
      segment(stone?'yard-wall-z':'yard-fence-z',x+pw-.32-fenceZ.nativeWidth,z+.32+start);
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
  const scene:CityScene={kind:'town',weekly,items,keys:[...new Set([...items.map(item=>item.id),'natural-ground','town-stone','town-earth','town-paving','outskirts-forest','outskirts-hills','direction-board-x','direction-board-z'])],width,depth,parkStarts:[],roadNetwork:{roads:[],junctions:[],bridges:[],vehicles:[],ringOuter:.7},layout:{width,districts:calendar.districts.map((year,i)=>({year:year.year,z:yearZ[i],quarterWeeks:[],quarterPadding:[],weekX:week=>week*PITCH}))}};
  const exitYear=Math.floor(yearZ.length/2),exitZ=yearZ[exitYear]-.55,exitX=yearWidth[exitYear]+.7;
  scene.roadNetwork.roads=[
    {id:'exit-west',lanes:2,points:[[-.7,exitZ],[-8,exitZ]]},
    {id:'exit-east',lanes:2,points:[[exitX,exitZ],[exitX+8,exitZ]]},
    {id:'exit-north',lanes:2,points:[[-.7,-.55],[-.7,-8]]},
    {id:'exit-south',lanes:2,points:[[-.7,depth+.7],[-.7,depth+8]]},
  ];
  return {scene,plots,roads,squares,yearZ,yearWidth};
}

export { createTownGround } from './town-ground';
