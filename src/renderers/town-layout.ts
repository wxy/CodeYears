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
const PITCH=2.8,WIDTH=7*PITCH,GAP=3;
const sprites:Record<string,{nativeWidth:number;nativeDepth:number;entrancePoint?:number[];entranceAxis?:string;entranceSide?:string}>=catalog;
const edgeKey=(a:Point,b:Point)=>[a.join(','),b.join(',')].sort().join('|');
const seedFor=(p:CityParcel)=>((Math.imul(p.block+1,73856093)^Math.imul(p.x+1,19349663)^Math.imul(p.z+1,83492791))>>>0);

/** 与现代城市共用周向+x、星期向+z；相近真实数量构成矩形聚落。 */
export function planTownScene(days:readonly DailyContribution[],reservedYears?:readonly number[],joinedOn?:string):TownPlan {
  const calendar=planWeeklyCity(days,false,false,reservedYears,joinedOn);
  const cells=calendar.cells;
  const byCell=new Map(cells.map(cell=>[`${cell.block},${cell.x},${cell.z}`,cell]));
  const candidates:{cell:CityParcel;w:number;d:number;members:CityParcel[]}[]=[];
  // 放宽相近日数合并；最多56日/8周，形状不超过3:1，不设固定周/月窗口。
  for(const cell of cells){
    if(cell.kind!=='building'||cell.milestone)continue;
    for(let w=1;w<=8;w++)for(let d=1;d<=7;d++){
      if(w*d>56||Math.max(w/d,d/w)>3||cell.x+w>calendar.districts[cell.block].weeks||cell.z+d>7)continue;
      const members:CityParcel[]=[];
      for(let z=cell.z;z<cell.z+d;z++)for(let x=cell.x;x<cell.x+w;x++){
        const next=byCell.get(`${cell.block},${x},${z}`);
        if(next?.kind==='building'&&!next.milestone)members.push(next);
      }
      if(members.length!==w*d)continue;
      const mean=members.reduce((sum,member)=>sum+member.count,0)/members.length;
      if(members.every(member=>Math.abs(member.count-mean)<=Math.max(6,mean*.9)))candidates.push({cell,w,d,members});
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
    const plot:TownPlot={parcel,x,z,w:pw,d:pd,bodies:[],courts:[],entries:[],paths:[],courtyardPads:[],gate:[x+pw/2,z+pd]};
    const area=w*d,transpose=pw>pd,cw=transpose?pd:pw,cd=transpose?pw:pd;
    const point=(u:number,v:number):Point=>transpose?[x+v,z+u]:[x+u,z+v];
    // 日均对应材料与工艺等级；同档可高可矮，高档没有朴素小屋回退。
    const choices=parcel.milestone?['magic-0']:parcel.band===0
      ?['estate-farmhouse','estate-windmill','forms-0','cottages-1','stable-0','rustic-hut-front']
      :parcel.band===1?['estate-farmhouse','estate-windmill','forms-0','cottages-2','cottages-3','cottages-4']
        :parcel.band===2?['forms-2','forms-4','forms-1','magic-2','mage-0','cottages-9']
          :['estate-villa','magic-3','magic-0','cottages-9','mage-0'];
    const fitted:{base:string;id:string;w:number;d:number}[]=[];
    for(const base of choices){
      const options=[base,...(sprites[`${base}-x`]?[`${base}-x`]:[])].map(id=>{
        const art=sprites[id];return {base,id,w:transpose?art.nativeDepth:art.nativeWidth,d:transpose?art.nativeWidth:art.nativeDepth};
      }).filter(body=>body.w<=cw-.64&&body.d<=cd-.64)
        .sort((a,b)=>Math.max(b.w/cw,b.d/cd)-Math.max(a.w/cw,a.d/cd));
      if(options.length)fitted.push(options[0]);
    }
    const largest=Math.max(...fitted.map(body=>body.w*body.d));
    const suitable=area>=2?fitted.filter(body=>body.w*body.d>=largest*.5):fitted;
    const estate=fitted.find(body=>body.base==='estate-villa'||body.base==='estate-farmhouse'||body.base==='estate-windmill');
    const main=estate??suitable[seed%suitable.length];
    // 只有实际排得下时才接一个相容工作设施；主体/设施共用一块真实入口工作面。
    const facilityBase=parcel.band<=1?'stable-0':'magic-2';
    const facilityOptions=area>=9&&main.base!==facilityBase
      ?[facilityBase,...(sprites[`${facilityBase}-x`]?[`${facilityBase}-x`]:[])].map(id=>{
        const art=sprites[id];return {base:facilityBase,id,w:transpose?art.nativeDepth:art.nativeWidth,d:transpose?art.nativeWidth:art.nativeDepth};
      }).filter(body=>main.w+body.w+.35<=cw-.64&&body.d<=cd-.64)
        .sort((a,b)=>a.d-b.d):[];
    const bed=sprites['estate-herb-bed'],remoteBase=parcel.band<=1?'estate-windmill':main.base==='magic-2'?'forms-1':'magic-2';
    // 大用地须留得下前后两段园地与中央工作轴，才把唯一附属设施放到远端。
    const firstGardenEnd=.32+main.d+.18+2.8+.45+bed.nativeDepth;
    const remoteOptions=area>=24?[remoteBase,`${remoteBase}-x`].map(id=>{
      const art=sprites[id];return {base:remoteBase,id,w:transpose?art.nativeDepth:art.nativeWidth,d:transpose?art.nativeWidth:art.nativeDepth};
    }).filter(body=>body.w<=cw/2-.9&&cd-.32-body.d-.75-2>=firstGardenEnd+.55)
      .sort((a,b)=>a.w-b.w):[];
    const remote=remoteOptions[0],facility=remote??facilityOptions[0];
    const rowW=main.w+(!remote&&facility?facility.w+.35:0),rowD=remote?main.d:Math.max(main.d,facility?.d??0);
    const rowX=(cw-rowW)/2,rowZ=.32,front=rowZ+rowD,available=cd-.32-front;
    const padD=Math.min(area===1?.7:area<6?1.6:2.8,available-.18);
    const padW=Math.min(cw-.64,Math.max(1.25,Math.min(5,main.w*.7+.5)));
    const center:Point=[rowX+main.w/2,padD>=.4?front+.18+padD/2:Math.min(cd-.15,front+.12)];
    const facilityU=remote?cw-.32-remote.w:rowX+main.w+.35;
    const facilityV=remote?cd-.32-remote.d:rowZ+rowD-(facility?.d??0);
    const workCenter:Point=remote?[facilityU+remote.w/2,facilityV-.75]:center;
    const addHouse=(body:{id:string;w:number;d:number},u:number,v:number)=>{
      const art=sprites[body.id],[bx,bz]=point(u,v),entry=art.entrancePoint!;
      const door:Point=transpose?[u+entry[1],v+entry[0]]:[u+entry[0],v+entry[1]];
      const axis=transpose?(art.entranceAxis==='x'?'z':'x'):art.entranceAxis,positive=art.entranceSide==='front';
      const exit:Point=axis==='x'
        ?[positive?Math.max(u+body.w+.12,door[0]):Math.min(u-.12,door[0]),door[1]]
        :[door[0],positive?Math.max(v+body.d+.12,door[1]):Math.min(v-.12,door[1])];
      let route:Point[]=[door,exit,[exit[0],center[1]],center];
      if(remote&&body===facility){
        route=axis==='x'?[door,exit,[exit[0],workCenter[1]],workCenter,[center[0],workCenter[1]],center]
          :[door,exit,[u+body.w+.16,exit[1]],[u+body.w+.16,workCenter[1]],workCenter,[center[0],workCenter[1]],center];
      }
      items.push({parcel,id:body.id,factor:1,x:bx,z:bz,w:art.nativeWidth,d:art.nativeDepth,flat:false});
      plot.bodies.push({id:body.id,x:bx,z:bz,w:art.nativeWidth,d:art.nativeDepth});plot.entries.push(point(...door));plot.paths.push(route.map(([u,v])=>point(u,v)));
    };
    addHouse(main,rowX,rowZ+rowD-main.d);
    if(facility)addHouse(facility,facilityU,facilityV);
    if(padD>=.4){
      const [px,pz]=point(center[0]-padW/2,front+.18);
      plot.courtyardPads.push({x:px,z:pz,w:transpose?padD:padW,d:transpose?padW:padD});
    }
    if(remote){
      const workW=Math.min(2.2,remote.w-.2),[px,pz]=point(workCenter[0]-workW/2,workCenter[1]-.6);
      plot.courtyardPads.push({x:px,z:pz,w:transpose?1.2:workW,d:transpose?workW:1.2});
      const route:Point[]=transpose?[center,[cw-.18,center[1]],[cw-.18,cd/2],[cw,cd/2]]
        :[center,[center[0],cd-.18],[cw/2,cd-.18],[cw/2,cd]];
      plot.paths.push(route.map(([u,v])=>point(u,v)));
    }else{
      const exitZ=Math.min(cd-.18,front+.18+Math.max(0,padD));
      const route=([center,[center[0],exitZ],[cw-.18,exitZ]] as Point[]).map(([u,v])=>point(u,v)),last=route.at(-1)!;
      plot.paths.push([...route,[x+pw-.18,last[1]],[x+pw-.18,z+pd-.18],[plot.gate[0],z+pd-.18],plot.gate]);
    }
    if(padD>=.65){
      const person=point(center[0]+Math.min(.4,padW*.25),center[1]-.35);prop(seed%2?'life-0':'life-2',person[0],person[1],after);
      if(area>=4){const well=point(center[0]-padW*.3,front+.18+padD*.7);prop('magic-6',well[0],well[1],after)}
    }else{
      const body=plot.bodies[0],art=sprites[body.id],door=plot.entries[0],positive=art.entranceSide==='front';
      const person:Point=art.entranceAxis==='x'
        ?[positive?body.x+body.w+.17:body.x-.17,door[1]]
        :[door[0],positive?body.z+body.d+.17:body.z-.17];
      prop(seed%2?'life-0':'life-2',person[0],person[1],after);
    }
    // 园地沿主屋的前场延伸，只放少量实用设施，不按日期格铺满花畦。
    const gardenStart=front+.18+Math.max(0,padD)+.45;
    if(remote){
      // 两段各两床，以主院到远端工作面的轴线组织，不按日期网格铺田。
      for(const v of [gardenStart,workCenter[1]-2]){
        for(const u of [center[0]-bed.nativeWidth-.3,center[0]+.3]){
          const id=transpose?'estate-herb-bed-x':'estate-herb-bed',art=sprites[id],[gx,gz]=point(u,v);
          items.push({id,factor:1,x:gx,z:gz,w:art.nativeWidth,d:art.nativeDepth,flat:false,revealAfter:after});
        }
        const tree=point(center[0]-bed.nativeWidth-.95,v+bed.nativeDepth+.55);prop('life-5',tree[0],tree[1],after);
      }
      const lamp=point(center[0]+.55,(gardenStart+bed.nativeDepth+workCenter[1]-2)/2);prop('magic-7',lamp[0],lamp[1],after);
      const worker=point(workCenter[0]-.4,workCenter[1]-.4);prop('life-0',worker[0],worker[1],after);
    }else if(area>=3&&gardenStart+bed.nativeDepth<=cd-.32){
      const positions:Point[]=cw<4?[[center[0]-bed.nativeWidth/2,gardenStart]]
        :[[center[0]-bed.nativeWidth-.3,gardenStart],[center[0]+.3,gardenStart]];
      if(cw<4&&gardenStart+bed.nativeDepth*2+.55<=cd-.32)positions.push([center[0]-bed.nativeWidth/2,gardenStart+bed.nativeDepth+.55]);
      for(const [u,v]of positions){
        if(u<.32||u+bed.nativeWidth>cw-.32)continue;
        const id=transpose?'estate-herb-bed-x':'estate-herb-bed',art=sprites[id],[gx,gz]=point(u,v);
        items.push({id,factor:1,x:gx,z:gz,w:art.nativeWidth,d:art.nativeDepth,flat:false,revealAfter:after});
      }
      if(cw>=5){const tree=point(cw-.75,Math.min(cd-.7,gardenStart+bed.nativeDepth+.5));prop('life-5',tree[0],tree[1],after)}
    }
    // 栏只标记小屋自己的工作庭院；不沿日历plot周界画一圈。
    if(padD>=.4&&!facility&&(main.base==='stable-0'||main.base==='cottages-1'||main.base==='cottages-9')){
      const stone=main.base==='cottages-9',yardX=rowX-.18,yardW=main.w+.36,yardD=rowD+.18+padD;
      const [yx,yz]=point(yardX,rowZ),gate=point(rowX+main.w/2,rowZ+yardD);
      plot.courts.push({id:'building-yard',x:yx,z:yz,w:transpose?yardD:yardW,d:transpose?yardW:yardD,gate});
      const id=stone?(transpose?'yard-wall-x':'yard-wall-z'):(transpose?'yard-fence-x':'yard-fence-z'),art=sprites[id];
      const nativeAlong=transpose?art.nativeWidth:art.nativeDepth;
      for(const u of [yardX,yardX+yardW-(transpose?art.nativeDepth:art.nativeWidth)]){
        const [fx,fz]=point(u,rowZ+yardD-nativeAlong);
        items.push({id,factor:1,x:fx,z:fz,w:art.nativeWidth,d:art.nativeDepth,flat:false,revealAfter:after});
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
