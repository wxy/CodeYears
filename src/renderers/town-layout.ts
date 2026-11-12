import type { DailyContribution } from '../data/types';
import { planWeeklyCity, type CityParcel, type WeeklyCity } from './city-parcels';
import type { CityScene, CitySceneItem } from './city-view';
import catalog from './town-baked-catalog.json';
import { planTownActivity, type TownActivityPhase } from './town-activity';

type Point=[number,number];
interface Rectangle { x:number; z:number; w:number; d:number }
interface TownCourt extends Rectangle { id:string; gate:Point }
interface TownPlot extends Rectangle { parcel:CityParcel; phase:number; bodies:(Rectangle&{id:string})[]; courts:TownCourt[]; entries:Point[]; paths:Point[][]; courtyardPads:Rectangle[]; gate:Point }
interface TownSquare { cell:CityParcel; kind:string; x:number; z:number; road:Point }
export interface TownSettlement extends TownActivityPhase,Rectangle { row:number; gapBefore:number }
export interface TownPlan { scene:CityScene; plots:TownPlot[]; roads:[Point,Point][]; avenues:[Point,Point][]; squares:TownSquare[]; settlements:TownSettlement[]; yearPosts:{year:number;x:number;z:number}[] }
const PITCH=2.8,GRID_WIDTH=10;
const sprites:Record<string,{nativeWidth:number;nativeDepth:number;entrancePoint?:number[];entranceAxis?:string;entranceSide?:string}>=catalog;
const seedFor=(p:CityParcel)=>((Math.imul(p.block+1,73856093)^Math.imul(p.x+1,19349663)^Math.imul(p.z+1,83492791))>>>0);

/** 时间阶段保持跨年；原生建筑用地按真实年份从前角向后紧凑拼接。 */
export async function planTownScene(days:readonly DailyContribution[],reservedYears?:readonly number[],joinedOn?:string,signal?:AbortSignal):Promise<TownPlan> {
  const calendar=planWeeklyCity(days,false,false,reservedYears,joinedOn);
  const cells=calendar.cells;
  const byIndex=new Map(cells.map(cell=>[cell.indices[0],cell]));
  const phases=await planTownActivity(days,signal),used=new Set<number>(),parcels:CityParcel[]=[];
  // 整数格是拼接用地，不再对应星期；每年从上一年的最高边缘继续。
  const lots:{parcel:CityParcel;x:number;z:number;phase:number;model:string}[]=[];
  const gardens:{u:number;v:number;phase:number}[]=[],yearEdges:{year:number;v:number}[]=[];
  const pendingLots:{parcel:CityParcel;phase:number;year:number;order:number}[]=[];
  const pools=[['estate-farmhouse','estate-windmill','forms-0','cottages-1','stable-0','rustic-hut-front'],
    ['estate-farmhouse','estate-windmill','forms-0','cottages-2','cottages-3','cottages-4'],
    ['forms-2','forms-4','forms-1','magic-2','mage-0','cottages-9'],
    ['estate-villa','magic-3','magic-0','cottages-9','mage-0']];
  for(const [phaseIndex,phase]of phases.entries()){
    const runs:number[][]=[];let run:number[]=[];
    const flush=()=>{if(run.length)runs.push(run);run=[]};
    for(const index of phase.indices){
      if(days[index].count<=0)continue;
      const previous=run.at(-1);
      if(previous!==undefined&&(days[index].date.slice(0,4)!==days[previous].date.slice(0,4)||days[index].date===joinedOn||days[previous].date===joinedOn||
        (phase.density<.2&&Date.parse(days[index].date)-Date.parse(days[previous].date)>3*86400000)))flush();
      run.push(index);
    }
    flush();
    for(const indices of runs){
      const parts=Math.ceil(indices.length/24);
      for(let part=0;part<parts;part++){
        const members=indices.slice(Math.floor(part*indices.length/parts),Math.floor((part+1)*indices.length/parts));
        const count=members.reduce((sum,index)=>sum+days[index].count,0),cell=byIndex.get(members[0])!;
        const parcel:CityParcel={...cell,w:1,d:1,indices:members,count,mean:count/members.length,band:count<10?0:count<50?1:count<200?2:3};
        members.forEach(index=>used.add(index));parcels.push(parcel);
        pendingLots.push({parcel,phase:phaseIndex,year:Number(days[members[0]].date.slice(0,4)),order:members[0]});
      }
    }
  }
  const years=[...new Set(days.map(day=>Number(day.date.slice(0,4))))].sort((a,b)=>a-b);
  let totalRows=0;
  for(const year of years){
    yearEdges.push({year,v:totalRows});
    const skyline=Array<number>(GRID_WIDTH).fill(totalRows);
    const entries=[...pendingLots.filter(lot=>lot.year===year).map(lot=>({...lot,garden:false})),
      ...phases.flatMap((phase,index)=>phase.density<.2&&phase.indices.some(i=>Number(days[i].date.slice(0,4))===year)
        ?[{parcel:undefined,phase:index,year,order:phase.indices.find(i=>Number(days[i].date.slice(0,4))===year)!,garden:true}]:[])].sort((a,b)=>a.order-b.order);
    for(const entry of entries){
      const parcel=entry.parcel;
      const choices=parcel?(parcel.milestone?['magic-0']:pools[parcel.band]):[];
      const base=parcel?choices[seedFor(parcel)%choices.length]:'';
      const ids=parcel?[base,...(sprites[`${base}-x`]?[`${base}-x`]:[])]:[''];
      let best:{u:number;v:number;w:number;d:number;id:string}|undefined;
      for(const id of ids){
        const art=sprites[id];
        const w=art?Math.ceil((art.nativeWidth+.64)/PITCH):1;
        const d=art?Math.ceil((art.nativeDepth+.64+(art.nativeWidth<1.8?.7:0))/PITCH):1;
        for(let u=0;u<=GRID_WIDTH-w;u++){
          const v=Math.max(...skyline.slice(u,u+w)),candidate={u,v,w,d,id};
          if(!best||v+d<best.v+best.d||(v+d===best.v+best.d&&v<best.v)||(v===best.v&&d===best.d&&u<best.u))best=candidate;
        }
      }
      const tile=best!;for(let u=tile.u;u<tile.u+tile.w;u++)skyline[u]=tile.v+tile.d;
      if(parcel){parcel.w=tile.w;parcel.d=tile.d;lots.push({parcel,x:tile.u,z:tile.v,phase:entry.phase,model:tile.id})}
      else gardens.push({u:tile.u,v:tile.v,phase:entry.phase});
    }
    totalRows=Math.max(totalRows,...skyline);
  }
  totalRows=Math.max(1,totalRows);
  const townWidth=GRID_WIDTH*PITCH,width=townWidth+8,depth=totalRows*PITCH;
  // 只转换用地原点；建筑图与其门向保持原生，不镜像人物或门窗。
  lots.forEach(lot=>{lot.x=townWidth-(lot.x+lot.parcel.w)*PITCH;lot.z=depth-(lot.z+lot.parcel.d)*PITCH});
  const yearPosts=yearEdges.map(edge=>({year:edge.year,x:townWidth+4.2,z:depth-edge.v*PITCH-.6}));
  const settlements:TownSettlement[]=phases.map((phase,index)=>{
    const own=lots.filter(lot=>lot.phase===index),xs=own.map(lot=>lot.x),zs=own.map(lot=>lot.z);
    const x=own.length?Math.min(...xs):0,z=own.length?Math.min(...zs):0;
    return {...phase,x,z,w:own.length?Math.max(...own.map(lot=>lot.x+lot.parcel.w*PITCH))-x:0,d:own.length?Math.max(...own.map(lot=>lot.z+lot.parcel.d*PITCH))-z:0,row:0,gapBefore:0};
  });
  const weekly:WeeklyCity={...calendar,parcels:[...parcels,...cells.filter(cell=>!used.has(cell.indices[0]))]};
  const items:CitySceneItem[]=[],plots:TownPlot[]=[],roads:[Point,Point][]=[],avenues:[Point,Point][]=[],squares:TownSquare[]=[];
  const prop=(id:string,x:number,z:number,revealAfter=0)=>{
    const art=sprites[id],w=art.nativeWidth,d=art.nativeDepth;
    items.push({id,factor:1,x:x-w/2,z:z-d/2,w,d,flat:false,revealAfter});
  };
  for(const lot of lots){
    const parcel=lot.parcel;
    const {w,d}=parcel,seed=seedFor(parcel);
    const x=lot.x,z=lot.z,pw=w*PITCH,pd=d*PITCH;
    const after=Math.min(...parcel.indices)+1;
    const plot:TownPlot={parcel,phase:lot.phase,x,z,w:pw,d:pd,bodies:[],courts:[],entries:[],paths:[],courtyardPads:[],gate:[x+pw/2,z+pd]};
    const area=w*d,transpose=pw>pd,cw=transpose?pd:pw,cd=transpose?pw:pd;
    const point=(u:number,v:number):Point=>transpose?[x+v,z+u]:[x+u,z+v];
    // 累计贡献编码材料工艺；同档保留多种原生形制。
    const mainArt=sprites[lot.model],main={base:lot.model.replace(/-x$/,''),id:lot.model,
      w:transpose?mainArt.nativeDepth:mainArt.nativeWidth,d:transpose?mainArt.nativeWidth:mainArt.nativeDepth};
    // 只有实际排得下时才接一个相容工作设施；主体/设施共用一块真实入口工作面。
    const facilityBase=parcel.band<=1?'stable-0':'magic-2';
    const facilityOptions=area>=9&&main.base!==facilityBase
      ?[facilityBase,...(sprites[`${facilityBase}-x`]?[`${facilityBase}-x`]:[])].map(id=>{
        const art=sprites[id];return {base:facilityBase,id,w:transpose?art.nativeDepth:art.nativeWidth,d:transpose?art.nativeWidth:art.nativeDepth};
      }).filter(body=>main.w+body.w+.35<=cw-.64&&body.d<=cd-.64)
        .sort((a,b)=>a.d-b.d):[];
    const bed=sprites['estate-herb-bed'],facility=facilityOptions[0];
    const rowW=main.w+(facility?facility.w+.35:0),rowD=Math.max(main.d,facility?.d??0);
    const rowX=(cw-rowW)/2,rowZ=.32,front=rowZ+rowD,available=cd-.32-front;
    const padD=Math.min(area===1?.7:area<6?1.6:2.8,available-.18);
    const padW=Math.min(cw-.64,Math.max(1.25,Math.min(5,main.w*.7+.5)));
    const center:Point=[rowX+main.w/2,padD>=.4?front+.18+padD/2:Math.min(cd-.15,front+.12)];
    const facilityU=rowX+main.w+.35,facilityV=rowZ+rowD-(facility?.d??0);
    const addHouse=(body:{id:string;w:number;d:number},u:number,v:number)=>{
      const art=sprites[body.id],[bx,bz]=point(u,v),entry=art.entrancePoint!;
      const door:Point=transpose?[u+entry[1],v+entry[0]]:[u+entry[0],v+entry[1]];
      const axis=transpose?(art.entranceAxis==='x'?'z':'x'):art.entranceAxis,positive=art.entranceSide==='front';
      const exit:Point=axis==='x'
        ?[positive?Math.max(u+body.w+.12,door[0]):Math.min(u-.12,door[0]),door[1]]
        :[door[0],positive?Math.max(v+body.d+.12,door[1]):Math.min(v-.12,door[1])];
      const route:Point[]=[door,exit,[exit[0],center[1]],center];
      items.push({parcel,id:body.id,factor:1,x:bx,z:bz,w:art.nativeWidth,d:art.nativeDepth,flat:false});
      plot.bodies.push({id:body.id,x:bx,z:bz,w:art.nativeWidth,d:art.nativeDepth});plot.entries.push(point(...door));plot.paths.push(route.map(([u,v])=>point(u,v)));
    };
    addHouse(main,rowX,rowZ+rowD-main.d);
    if(facility)addHouse(facility,facilityU,facilityV);
    if(padD>=.4){
      const [px,pz]=point(center[0]-padW/2,front+.18);
      plot.courtyardPads.push({x:px,z:pz,w:transpose?padD:padW,d:transpose?padW:padD});
    }
    const exitZ=Math.min(cd-.18,front+.18+Math.max(0,padD));
    const route=([center,[center[0],exitZ],[cw-.18,exitZ]] as Point[]).map(([u,v])=>point(u,v)),last=route.at(-1)!;
    plot.paths.push([...route,[x+pw-.18,last[1]],[x+pw-.18,z+pd-.18],[plot.gate[0],z+pd-.18],plot.gate]);
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
    if(area>=3&&gardenStart+bed.nativeDepth<=cd-.32){
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
  // 边界网格仅允许沿院落外缘通行，共边自然相接，不穿过矩形内部。
  const owners=Array.from({length:totalRows},()=>Array<number>(GRID_WIDTH).fill(-1));
  plots.forEach((plot,id)=>{for(let z=Math.round(plot.z/PITCH);z<Math.round((plot.z+plot.d)/PITCH);z++)for(let x=Math.round(plot.x/PITCH);x<Math.round((plot.x+plot.w)/PITCH);x++)owners[z][x]=id});
  const node=(x:number,z:number)=>z*(GRID_WIDTH+1)+x,parents=new Map<number,number>(),queue:number[]=[];
  for(let z=0;z<=totalRows;z++){const id=node(GRID_WIDTH,z);parents.set(id,id);queue.push(id)}
  const owner=(x:number,z:number)=>owners[z]?.[x]??-1;
  for(let head=0;head<queue.length;head++){
    const id=queue[head],x=id%(GRID_WIDTH+1),z=Math.floor(id/(GRID_WIDTH+1));
    for(const [nx,nz]of [[x-1,z],[x+1,z],[x,z-1],[x,z+1]]){
      if(nx<0||nx>GRID_WIDTH||nz<0||nz>totalRows)continue;
      const a=nx===x?owner(x-1,Math.min(z,nz)):owner(Math.min(x,nx),z-1),b=nx===x?owner(x,Math.min(z,nz)):owner(Math.min(x,nx),z);
      if(a>=0&&a===b)continue;
      const next=node(nx,nz);if(!parents.has(next)){parents.set(next,id);queue.push(next)}
    }
  }
  const edges=new Set<string>();
  for(const plot of plots){
    let id=node(Math.round(plot.gate[0]/PITCH),Math.round(plot.gate[1]/PITCH));
    const start:Point=[id%(GRID_WIDTH+1)*PITCH,Math.floor(id/(GRID_WIDTH+1))*PITCH];roads.push([plot.gate,start]);
    while(parents.get(id)!==id){const next=parents.get(id)!;const key=[Math.min(id,next),Math.max(id,next)].join(':');if(!edges.has(key)){edges.add(key);roads.push([[id%(GRID_WIDTH+1)*PITCH,Math.floor(id/(GRID_WIDTH+1))*PITCH],[next%(GRID_WIDTH+1)*PITCH,Math.floor(next/(GRID_WIDTH+1))*PITCH]])}id=next}
    roads.push([[townWidth,Math.floor(id/(GRID_WIDTH+1))*PITCH],[townWidth+.7,Math.floor(id/(GRID_WIDTH+1))*PITCH]]);
  }
  for(const garden of gardens){
    const x=townWidth-(garden.u+.5)*PITCH,z=depth-(garden.v+.5)*PITCH;
    prop('life-5',x-.4,z-.3,Math.min(...phases[garden.phase].indices)+1);prop('magic-6',x+.4,z+.35,Math.min(...phases[garden.phase].indices)+1);
  }
  // 少量树填补skyline无法利用的格间余隙，不把空格再变成建筑或日期。
  let gapTrees=0;
  for(let z=0;z<totalRows&&gapTrees<6;z++)for(let x=0;x<GRID_WIDTH&&gapTrees<6;x++){
    if(owner(x,z)>=0||!owners[z].some(id=>id>=0))continue;
    if(gardens.some(garden=>GRID_WIDTH-garden.u-1===x&&totalRows-garden.v-1===z))continue;
    prop('life-5',(x+.5)*PITCH,(z+.5)*PITCH);gapTrees++;
  }
  avenues.push([[-.7,-.7],[townWidth+.7,-.7]],[[townWidth+.7,-.7],[townWidth+.7,depth+.7]],[[townWidth+.7,depth+.7],[-.7,depth+.7]],[[-.7,depth+.7],[-.7,-.7]]);
  const scene:CityScene={kind:'town',yearPosts,weekly,items,keys:[...new Set([...items.map(item=>item.id),'natural-ground','town-stone','town-earth','town-paving','outskirts-forest','outskirts-hills','direction-board-x','direction-board-z'])],width,depth,parkStarts:[],roadNetwork:{roads:[],junctions:[],bridges:[],vehicles:[],ringOuter:.7},layout:{width,districts:[]}};
  const exitZ=depth/2,exitX=townWidth+.7;
  scene.roadNetwork.roads=[
    {id:'exit-west',lanes:2,points:[[-.7,exitZ],[-8,exitZ]]},
    {id:'exit-east',lanes:2,points:[[exitX,exitZ],[exitX+8,exitZ]]},
    {id:'exit-north',lanes:2,points:[[-.7,-.7],[-.7,-8]]},
    {id:'exit-south',lanes:2,points:[[-.7,depth+.7],[-.7,depth+8]]},
  ];
  return {scene,plots,roads,avenues,squares,settlements,yearPosts};
}

export { createTownGround } from './town-ground';
