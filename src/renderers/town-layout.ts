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
export interface TownPlan { scene:CityScene; plots:TownPlot[]; roads:[Point,Point][]; avenues:[Point,Point][]; squares:TownSquare[]; settlements:TownSettlement[] }
const PITCH=2.8,LANE=1.3;
const sprites:Record<string,{nativeWidth:number;nativeDepth:number;entrancePoint?:number[];entranceAxis?:string;entranceSide?:string}>=catalog;
const seedFor=(p:CityParcel)=>((Math.imul(p.block+1,73856093)^Math.imul(p.x+1,19349663)^Math.imul(p.z+1,83492791))>>>0);

/** 时间阶段先形成聚落；院落只是阶段内部的原生建筑用地，不按周/月/年切分。 */
export async function planTownScene(days:readonly DailyContribution[],reservedYears?:readonly number[],joinedOn?:string,signal?:AbortSignal):Promise<TownPlan> {
  const calendar=planWeeklyCity(days,false,false,reservedYears,joinedOn);
  const cells=calendar.cells;
  const byIndex=new Map(cells.map(cell=>[cell.indices[0],cell]));
  const phases=await planTownActivity(days,signal),used=new Set<number>(),parcels:CityParcel[]=[];
  const lots:{parcel:CityParcel;x:number;z:number;phase:number;lane:number}[]=[];
  const settlements:TownSettlement[]=[],rows:{members:number[];width:number;depth:number;z:number;road:number}[]=[];
  for(const [phaseIndex,phase]of phases.entries()){
    const positive=phase.indices.filter(index=>days[index].count>0),groups:number[][]=[];
    let pending:number[]=[];
    const flush=()=>{if(pending.length){groups.push(pending);pending=[]}};
    if(phase.density>=.2){
      // 每段最多24个活跃日期，均衡分配尾部；零记录日留在聚落的园地中。
      const runs:number[][]=[];
      for(const index of positive){
        if(days[index].date===joinedOn){if(pending.length)runs.push(pending);pending=[];runs.push([index])}
        else pending.push(index);
      }
      if(pending.length)runs.push(pending);pending=[];
      for(const run of runs){
        const count=Math.ceil(run.length/24);
        for(let part=0;part<count;part++)groups.push(run.slice(Math.floor(part*run.length/count),Math.floor((part+1)*run.length/count)));
      }
    }else{
      // 冷淡段不把相隔很远的零星记录圈成大宅；临近记录可共用小院。
      for(const index of positive){
        if(pending.length&&(Date.parse(days[index].date)-Date.parse(days[pending.at(-1)!].date)>3*86400000||pending.length===24||days[index].date===joinedOn||days[pending[0]].date===joinedOn))flush();
        pending.push(index);
      }
      flush();
    }
    const own=groups.map(indices=>{
      const cell=byIndex.get(indices[0])!,count=indices.reduce((sum,index)=>sum+days[index].count,0),mean=count/indices.length;
      const area=Math.ceil(indices.length/2),w=Math.ceil(Math.sqrt(area)),d=Math.ceil(area/w);
      const parcel:CityParcel={...cell,w,d,indices,count,mean,band:mean<=2?0:mean<=5?1:mean<=19?2:mean<=49?3:4};
      indices.forEach(index=>used.add(index));parcels.push(parcel);
      return {parcel,x:0,z:0,phase:phaseIndex,lane:0};
    });
    const columns=Math.max(1,Math.ceil(Math.sqrt(own.length))),columnWidths=Array.from({length:columns},(_,col)=>Math.max(0,...own.filter((_,i)=>i%columns===col).map(lot=>lot.parcel.w*PITCH)));
    const rowCount=Math.ceil(own.length/columns),rowDepths=Array.from({length:rowCount},(_,row)=>Math.max(...own.slice(row*columns,(row+1)*columns).map(lot=>lot.parcel.d*PITCH)));
    const packedW=columnWidths.reduce((sum,n)=>sum+n,0)+Math.max(0,columns-1)*LANE,packedD=rowDepths.reduce((sum,n)=>sum+n,0)+Math.max(0,rowCount-1)*LANE;
    const w=Math.max(packedW+3,phase.density<.2?8+Math.sqrt(phase.indices.length)*1.2:0,9);
    const d=Math.max(packedD+3.4,phase.density<.2?8:0,7);
    own.forEach((lot,i)=>{
      const col=i%columns,row=Math.floor(i/columns);
      lot.x=1.5+columnWidths.slice(0,col).reduce((sum,n)=>sum+n+LANE,0);
      lot.z=1+rowDepths.slice(0,row).reduce((sum,n)=>sum+n+LANE,0);
      lot.lane=lot.z+rowDepths[row]+LANE/2;
    });
    lots.push(...own);
    const previous=phases[phaseIndex-1],gapBefore=previous?Math.max(0,(Date.parse(phase.startDate)-Date.parse(previous.endDate))/86400000-1):0;
    settlements.push({...phase,x:0,z:0,w,d,row:0,gapBefore});
  }
  // 规则矩形沿时间主路折返；行只是摆放空间，不代表星期或年份。
  const targetWidth=Math.max(30,Math.min(84,Math.sqrt(settlements.reduce((sum,p)=>sum+p.w*p.d,0))*1.35),...settlements.map(p=>p.w));
  for(const [index,settlement]of settlements.entries()){
    let row=rows.at(-1);
    if(!row||(row.members.length&&row.width+2+settlement.w>targetWidth)){row={members:[],width:0,depth:0,z:0,road:0};rows.push(row)}
    settlement.row=rows.length-1;settlement.x=row.width+(row.members.length?2:0);row.width=settlement.x+settlement.w;row.depth=Math.max(row.depth,settlement.d);row.members.push(index);
  }
  const width=Math.max(24,...rows.map(row=>row.width));let nextZ=1;
  rows.forEach((row,index)=>{
    row.z=nextZ;row.road=row.z+row.depth+1.2;
    for(const id of row.members){const stage=settlements[id];if(index%2)stage.x=width-stage.x-stage.w;stage.z=row.z}
    nextZ=row.z+row.depth+5;
  });
  const depth=Math.max(16,nextZ-3);
  const weekly:WeeklyCity={...calendar,parcels:[...parcels,...cells.filter(cell=>!used.has(cell.indices[0]))]};
  const items:CitySceneItem[]=[],plots:TownPlot[]=[],roads:[Point,Point][]=[],avenues:[Point,Point][]=[],squares:TownSquare[]=[];
  const prop=(id:string,x:number,z:number,revealAfter=0)=>{
    const art=sprites[id],w=art.nativeWidth,d=art.nativeDepth;
    items.push({id,factor:1,x:x-w/2,z:z-d/2,w,d,flat:false,revealAfter});
  };
  for(const lot of lots){
    const parcel=lot.parcel,stage=settlements[lot.phase];
    const {w,d}=parcel,seed=seedFor(parcel);
    const x=stage.x+lot.x,z=stage.z+lot.z,pw=w*PITCH,pd=d*PITCH;
    const after=Math.min(...parcel.indices)+1;
    const plot:TownPlot={parcel,phase:lot.phase,x,z,w:pw,d:pd,bodies:[],courts:[],entries:[],paths:[],courtyardPads:[],gate:[x+pw/2,z+pd]};
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
  for(const [index,stage]of settlements.entries()){
    const ownLots=lots.filter(lot=>lot.phase===index),spine=stage.x+.55;
    for(const lot of ownLots){
      const plot=plots.find(plot=>plot.parcel===lot.parcel)!,lane=stage.z+lot.lane;
      roads.push([plot.gate,[plot.gate[0],lane]],[[spine,lane],[plot.x+plot.w+.2,lane]]);
    }
    const row=rows[stage.row];
    roads.push([[spine,stage.z+.4],[spine,row.road]]);
    const occupied:Rectangle[]=plots.filter(plot=>plot.phase===index);
    const decorations=stage.density<.2?['magic-6','life-5','life-5',...(stage.indices.length>=28?['life-8','life-5']:[])]:['life-5','magic-7'];
    for(const id of decorations){
      const art=sprites[id];
      for(let position=0;position<30;position++){
        const px=stage.x+1+(position%6)*(stage.w-2)/5,pz=stage.z+.6+Math.floor(position/6)*(stage.d-3.5)/4;
        const box={x:px-art.nativeWidth/2,z:pz-art.nativeDepth/2,w:art.nativeWidth,d:art.nativeDepth};
        if(box.x<stage.x+.2||box.z<stage.z+.2||box.x+box.w>stage.x+stage.w-.2||box.z+box.d>stage.z+stage.d-2)continue;
        if(occupied.some(other=>box.x+box.w+.25>other.x&&box.x<other.x+other.w+.25&&box.z+box.d+.25>other.z&&box.z<other.z+other.d+.25))continue;
        if(roads.some(([a,b])=>box.x+box.w+.25>Math.min(a[0],b[0])&&box.x<Math.max(a[0],b[0])+.25&&box.z+box.d+.25>Math.min(a[1],b[1])&&box.z<Math.max(a[1],b[1])+.25))continue;
        occupied.push(box);prop(id,px,pz,Math.min(...stage.indices)+1);break;
      }
    }
  }
  rows.forEach((row,index)=>{
    avenues.push([[-.7,row.road],[width+.7,row.road]]);
    if(index){const x=index%2?width+.7:-.7;avenues.push([[x,rows[index-1].road],[x,row.road]])}
  });
  const northZ=rows[0]?.road??1,southZ=depth+.7;
  avenues.push([[-.7,-.7],[-.7,southZ]]);
  const scene:CityScene={kind:'town',weekly,items,keys:[...new Set([...items.map(item=>item.id),'natural-ground','town-stone','town-earth','town-paving','outskirts-forest','outskirts-hills','direction-board-x','direction-board-z'])],width,depth,parkStarts:[],roadNetwork:{roads:[],junctions:[],bridges:[],vehicles:[],ringOuter:.7},layout:{width,districts:[]}};
  const exitZ=rows[Math.floor(rows.length/2)]?.road??northZ,exitX=width+.7;
  scene.roadNetwork.roads=[
    {id:'exit-west',lanes:2,points:[[-.7,exitZ],[-8,exitZ]]},
    {id:'exit-east',lanes:2,points:[[exitX,exitZ],[exitX+8,exitZ]]},
    {id:'exit-north',lanes:2,points:[[-.7,-.7],[-.7,-8]]},
    {id:'exit-south',lanes:2,points:[[-.7,depth+.7],[-.7,depth+8]]},
  ];
  return {scene,plots,roads,avenues,squares,settlements};
}

export { createTownGround } from './town-ground';
