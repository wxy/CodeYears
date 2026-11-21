import type { DailyContribution } from '../data/types';
import type { RepositoryCreation } from '../data/repository-creations';
import { planWeeklyCity, type CityParcel, type WeeklyCity } from './city-parcels';
import type { CityImages, CitySprite } from './city-assets';
import { selectCityBuilding } from './city-building-style';
import { createGroundSelector } from './city-ground-style';
import { planCityRoadNetwork, cityTreeClearsBridges, type CityRoadNetwork } from './city-road-network';
import { cityExitWithSign, clipCityExit, createCityRoadPainter, cityRoadWidth, planRoadGeometry, type CityRoadRoute } from './city-roads';
import { createCityVehiclePainter } from './city-vehicles';
import { createCityBridgePainter, createHighwayBridgePainter } from './city-bridges';
import { createCityLayout, CITY_QUARTER_ROADS, CITY_ROAD_WIDTH as ROAD,
  CITY_YEAR_GAP as YEAR_GAP, CITY_PARK_DEPTH as PARK, type CityLayout } from './city-layout';
import { createCityYearMarkers } from './city-year-markers';
import { createCityOutskirtsPainter, createCitySceneryPainter, planCityRelief, CITY_OUTSKIRT_MARGIN, CITY_OUTSKIRT_IDS } from './city-outskirts';
import { boundsOverlap, planCityMountainRoads } from './city-mountain-roads';
import { CITY_GROUND_ATLAS, createCityGroundPainter } from './city-ground-tiles';
import { createCityWaterways, type CityRiver } from './city-waterways';
import type { CityShareCredit, LandscapeView, LandscapeViewport } from './types';
import { planCityRoadside } from './city-roadside';
import { cityVehicleSprites, planCityTransport } from './city-transport';
import { planDirectionBoard, type DirectionBoard } from './city-direction-boards';
import { organizationFace, planOrganizationBoards, type OrganizationBoard, type OrganizationPoster } from './city-organization-boards';

const project=(x:number,z:number):[number,number]=>[(x-z)*.5,(x+z)*.25];
function paintShareCredit(context:CanvasRenderingContext2D,{x,y,width,height,login,icon}:CityShareCredit) {
  const textX=x+58,textWidth=width-70;
  context.save();
  const background=context.createLinearGradient(x,y,x+width*.6,y+height);
  background.addColorStop(0,'#31463edb');background.addColorStop(1,'#162924ed');
  context.beginPath();context.roundRect(x,y,width,height,13);
  context.shadowColor='#131c1955';context.shadowBlur=13;context.shadowOffsetY=3;
  context.fillStyle=background;context.fill();
  context.shadowColor='transparent';context.lineWidth=1;context.strokeStyle='#e8e7c984';context.stroke();
  context.clip();
  if(icon)context.drawImage(icon,x+12,y+(height-36)/2,36,36);
  context.textBaseline='middle';context.textAlign='left';
  context.fillStyle='#fff9ea';context.font='700 17px system-ui, sans-serif';
  context.fillText('City of Code',textX,y+19,textWidth-19);
  context.fillStyle='#d3ded4';context.font='500 11px system-ui, sans-serif';
  context.fillText(`@${login} on GitHub`,textX,y+36,textWidth);
  context.fillStyle='#f2dfad';context.font='600 10px system-ui, sans-serif';
  context.fillText('Made with CodeYears · Chrome Web Store',textX,y+52,textWidth);
  context.fillText('↗',x+width-20,y+17);
  context.restore();
}

/** 相对原绘制尺寸。50% 保留远景占地，200%–250% 平滑过渡到近景的固定比例。 */
function roadsideScale(zoom:number):number {
  const relativeZoom=Math.max(1,zoom/.5);
  const start=4,end=5,exponent=.4;
  if(relativeZoom<=start)return relativeZoom**(exponent-1);
  const t=Math.min(relativeZoom,end),span=Math.log(end/start),u=Math.log(t/start)/span;
  // 对数增长率从 0.4 平滑变为 1，使放大和缩小在衔接处都有连续的速度。
  const growth=exponent*u+(1-exponent)*(u**3-u**4/2);
  return start**exponent*Math.exp(span*growth)/t;
}
// 素材首次命中时生成共享的一位透明度掩码，后续移动只查掩码、不重画城市。
const hitMasks=new WeakMap<HTMLCanvasElement,Uint8Array>();
export interface CitySceneItem { parcel?:CityParcel; id:string; factor:number; x:number; z:number; w:number; d:number; flat:boolean; elevation?:number }
export interface CityScene { weekly:WeeklyCity; layout:CityLayout; items:CitySceneItem[]; keys:string[]; parkStarts:number[]; width:number; depth:number; roadNetwork:CityRoadNetwork; rivers?:readonly CityRiver[] }

/** 数据/占地与素材选择只在创建时确定，观看缩放不改变城市。 */
export function planCityScene(days:readonly DailyContribution[],wonders=true,reservedYears?:readonly number[],joinedOn?:string,originYear?:number):CityScene {
  const weekly=planWeeklyCity(days,true,wonders,reservedYears,joinedOn),selectGround=createGroundSelector(weekly);
  const layout=createCityLayout(weekly,originYear);
  const items:CitySceneItem[]=weekly.parcels.map(parcel=>{
    const {w,d,kind}=parcel,hash=Math.imul(weekly.districts[parcel.block].year,73856093)^Math.imul(parcel.x+1,19349663)^Math.imul(parcel.z+1,83492791);
    const seed=(hash^(hash>>>16))>>>0,variant=seed%2?'b':'a';
    let id:string,factor=1,flat=kind==='grass';
    if(parcel.wonder)id=parcel.wonder;
    else if(kind==='grass')({id,factor,flat}=selectGround(parcel,seed));
    else if(kind==='shrub')id=`sapling-${variant}`;
    else if(kind==='tree')id=w===2&&d===2?`forest-2x2-${variant}`:w===2?`small-grove-2x1-${variant}`:d===2?`small-grove-1x2-${variant}`:variant==='a'?'broadleaf-a':'conifer-b';
    else ({id,factor}=selectCityBuilding(parcel,seed));
    return {parcel,id,factor,x:layout.districts[parcel.block].weekX(parcel.x),z:layout.districts[parcel.block].z+parcel.z,w,d,flat};
  });
  const parkStarts=layout.bandStarts.map(block=>layout.districts[block].z-PARK-YEAR_GAP/2);
  const width=layout.width;
  for(const start of parkStarts)for(let x=1;x<width;x+=2.6)for(const z of [start+.2,start+PARK-1]){
    items.push({id:Math.round(x)%2?'broadleaf-a':'conifer-b',factor:.75,x,z,w:.75,d:.75,flat:false});
  }
  // 信号灯仅装饰有建筑相邻的季度路口，摆在路缘，不占贡献日期格。
  weekly.districts.forEach((_,block)=>{
    const buildings=weekly.cells.filter(cell=>cell.block===block&&cell.kind==='building'),z=layout.districts[block].z;
    layout.districts[block].quarterWeeks.forEach((week,index)=>{
      const x=CITY_QUARTER_ROADS[index],shoulder=layout.districts[block].quarterPadding[index];
      for(const north of [true,false]){
        if(!buildings.some(cell=>Math.abs(cell.x-week)<=2&&(north?cell.z<=2:cell.z>=4)))continue;
        const curbZ=north?z-.3:z+7.05;
        items.push({id:'traffic-signal-w',factor:1,x:x-shoulder-.3,z:curbZ,w:.25,d:.25,flat:false});
        items.push({id:north?'traffic-signal-d-reverse':'traffic-signal-d',factor:1,x:x+ROAD+.05,z:curbZ,w:.25,d:.25,flat:false});
      }
    });
  });
  const depth=weekly.rows*(7+YEAR_GAP)-YEAR_GAP+parkStarts.length*PARK;
  const roadNetwork=planCityRoadNetwork(layout,depth);
  const visibleItems=items.filter(item=>item.parcel||!['broadleaf-a','conifer-b'].includes(item.id)
    ||cityTreeClearsBridges(item.x,item.z,item.w,item.d,roadNetwork.bridges));
  const keys=[...new Set([...visibleItems.map(i=>i.id),...CITY_OUTSKIRT_IDS,'direction-board-x','direction-board-z'])];
  return {weekly,layout,items:visibleItems,keys,parkStarts,width,depth,roadNetwork};
}

export function createCityView(scene:CityScene,images:CityImages,previouslyRevealedDays?:number,groundPainter?:(context:CanvasRenderingContext2D)=>void):LandscapeView {
  const {weekly,layout,items,parkStarts,width,depth,roadNetwork}=scene;
  const progressive=previouslyRevealedDays!==undefined;
  const wonderCount=weekly.parcels.filter(parcel=>parcel.wonder).length;
  const canvas=document.createElement('canvas'),context=canvas.getContext('2d')!;
  const atlas=images[CITY_GROUND_ATLAS],paintGroundTiles=atlas?createCityGroundPainter(atlas.canvas,atlas.groundDetail):undefined;
  const terrain=images['natural-ground'],terrainPattern=terrain?context.createPattern(terrain.canvas,'repeat'):null;
  // 图案坐标与城市共用地面投影和世界原点；缩放平移时不会像屏幕壁纸滑动。
  if(terrainPattern){const size=terrain.width/terrain.canvas.width;terrainPattern.setTransform(new DOMMatrix([size*.5,size*.25,-size*.5,size*.25,0,0]))}
  const projectItems=(entries:readonly CitySceneItem[])=>entries.flatMap(item=>{
    const sprite=images[item.id];
    // 空场地不等待图片，也不以程序地貌代替尚未加载的PNG。
    if(progressive&&!sprite)return [];
    const offsetX=(item.w-sprite.nativeWidth*item.factor)/2,offsetZ=(item.d-sprite.nativeDepth*item.factor)/2;
    const [x,y]=project(item.x+offsetX,item.z+offsetZ);
    const left=x+sprite.left*item.factor,top=y+sprite.top*item.factor-(item.elevation??0)*.5;
    // 所有成员已在本批真实days中，融合地块按首个成员进入呈现前缀时整体出现。
    return [{item,sprite,left,top,width:sprite.width*item.factor,height:sprite.height*item.factor,groundY:project(item.x+item.w/2,item.z+item.d/2)[1],after:progressive&&item.parcel?Math.min(...item.parcel.indices)+1:0}];
  });
  type PlacedItem = ReturnType<typeof projectItems>[number];
  const byDepth = (a:PlacedItem, b:PlacedItem) => a.groundY-b.groundY || a.left-b.left;
  let placed = projectItems(items).sort(byDepth);
  const outer=roadNetwork.ringOuter+CITY_OUTSKIRT_MARGIN+18;
  // 渐进场地的包围盒只取预留布局和既有外围余量，不随后到楼宇改变取景。
  const minX=Math.min(-depth/2-outer-.4,...(progressive?[]:placed.map(p=>p.left)))-.3,maxX=Math.max(width/2+outer+.4,...(progressive?[]:placed.map(p=>p.left+p.width)))+.3;
  const minY=Math.min(-outer/2-.4,...(progressive?[]:placed.map(p=>p.top)))-4.5,maxY=Math.max((width+depth)/4+outer/2+.5,...(progressive?[]:placed.map(p=>p.top+p.height)));
  // 路牌、路面名称和点击范围都沿近城直段，弯道从外侧接续。
  const direction=(road:CityRoadRoute)=>{
    const a=road.points[0],b=road.points.at(-1)!;
    return b[0]<a[0]?0:b[0]>a[0]?1:b[1]<a[1]?2:3;
  };
  const baseExits=(roadNetwork.exits??roadNetwork.roads.filter(road=>road.id.startsWith('exit-')).sort((a,b)=>direction(a)-direction(b))).map(cityExitWithSign);
  const waterways=scene.rivers?createCityWaterways(scene.rivers,roadNetwork.bridges,width,depth):undefined;
  const sceneryBounds={left:minX,top:minY,right:maxX,bottom:maxY};
  const relief=waterways?planCityRelief(width,depth,baseExits,sceneryBounds,waterways.clears):[];
  let highways=baseExits;
  if(waterways){
    const water=waterways.roadWater(sceneryBounds,1.75);
    // 并行谷带留不出通路时在地形阶段打开山口，再按可见山地重算整张图的公路。
    for(;;){
      const plan=planCityMountainRoads(baseExits,relief.map(ridge=>ridge.barrier),water,sceneryBounds);
      if(plan.highways){highways=plan.highways;break}
      relief.splice(plan.blockedRidge,1);
    }
  }
  const roadside=waterways&&planCityRoadside(scene,highways,(x,z,margin)=>{
    const [px,py]=project(x,z);
    const bounds={left:px-margin,right:px+margin,top:py-margin/2,bottom:py+margin/2};
    return waterways.clears(bounds.left,bounds.top,bounds.right,bounds.bottom)&&
      !relief.some(land=>boundsOverlap(bounds,land.barrier.bounds));
  });
  if(roadside)placed=placed.concat(projectItems(roadside.scenery)).sort(byDepth);
  let repositoryLandmarks:{year:number;entry:RepositoryCreation;plots:PlacedItem[]}[]=[];
  const scenery=waterways?createCitySceneryPainter(relief,images,sceneryBounds):undefined;
  const background=waterways?document.createElement('canvas'):undefined;
  let backdropKey='';
  const tallest=Math.max(1,...placed.filter(p=>!p.item.flat).map(p=>p.groundY-p.top));
  // 窗格在远景大幅缩小时容易随像素相位跳闪；逐级预滤波，避免每帧直接从384像素缩到十几像素。
  const samples=new Map<HTMLCanvasElement,HTMLCanvasElement[]>();
  const prepareSamples=(entries:readonly PlacedItem[])=>{
    for(const p of entries){
      if(p.item.flat||samples.has(p.sprite.canvas))continue;
      const levels=[p.sprite.canvas];
      while(Math.max(levels.at(-1)!.width,levels.at(-1)!.height)>32){
        const source=levels.at(-1)!,small=document.createElement('canvas');
        small.width=Math.max(1,Math.ceil(source.width/2));small.height=Math.max(1,Math.ceil(source.height/2));
        const target=small.getContext('2d')!;target.imageSmoothingQuality='high';target.drawImage(source,0,0,small.width,small.height);levels.push(small);
      }
      samples.set(p.sprite.canvas,levels);
    }
  };
  prepareSamples(placed);
  const ground=document.createElement('canvas'),unit=Math.min(48,3072/(maxX-minX));
  ground.width=Math.ceil((maxX-minX)*unit);ground.height=Math.ceil((maxY-minY)*unit);
  // 同一绘制序列供全景与近景缓存使用，避免缩放时改变遮挡与道路几何。
  const groundPaint:{after:number;paint:(target:CanvasRenderingContext2D)=>void}[]=[];
  let revealAfter=0;
  const polygon=(x:number,z:number,w:number,d:number,color:string)=>{
    if(w<=0||d<=0)return;
    const path=new Path2D();
    [project(x,z),project(x+w,z),project(x+w,z+d),project(x,z+d)].forEach((p,i)=>i?path.lineTo(...p):path.moveTo(...p));path.closePath();
    groundPaint.push({after:revealAfter,paint:target=>{target.fillStyle=color;target.fill(path)}});
  };
  const stroke=(path:Path2D,color:string,lineWidth:number,dash:number[]=[])=>{
    groundPaint.push({after:revealAfter,paint:target=>{target.lineJoin='round';target.strokeStyle=color;target.lineWidth=lineWidth;target.setLineDash(dash);target.stroke(path)}});
  };
  const line=(x:number,z:number,x2:number,z2:number,color:string,lineWidth:number,dash:number[]=[])=>{
    const path=new Path2D();path.moveTo(...project(x,z));path.lineTo(...project(x2,z2));stroke(path,color,lineWidth,dash);
  };
  const image=(p:{sprite:CityImages[string];left:number;top:number;width:number;height:number})=>{
    groundPaint.push({after:revealAfter,paint:target=>target.drawImage(p.sprite.canvas,p.left,p.top,p.width,p.height)});
  };
  if(groundPainter)groundPaint.push({after:0,paint:groundPainter});
  else{
    if(!progressive||CITY_OUTSKIRT_IDS.every(id=>images[id]))groundPaint.push({after:0,paint:createCityOutskirtsPainter(width,depth,roadNetwork.ringOuter,roadNetwork.roads.filter(road=>road.id.startsWith('exit-')),images)});
    // 静态地面与路网分层；路面/车道线只在缓存构建时提交。
    for(let edge=6;edge>0;edge--)polygon(-roadNetwork.ringOuter-edge*.05,-roadNetwork.ringOuter-edge*.05,width+roadNetwork.ringOuter*2+edge*.1,depth+roadNetwork.ringOuter*2+edge*.1,'rgba(130,152,117,0.025)');
    layout.districts.forEach(({z,quarterPadding})=>{
      const span=width;
      polygon(-YEAR_GAP/2,z-YEAR_GAP/2,span+YEAR_GAP,7+YEAR_GAP,'#606967');
      // 连续暖石人行道与细路缘包住年度街区，庭院不再逐格铺深色底。
      polygon(-.16,z-.16,span+.32,7.32,'#b6b5a4');
      polygon(-.12,z-.12,span+.24,7.24,'#d2cbb6');
      polygon(0,z,span,7,'#b3b4a2');
      CITY_QUARTER_ROADS.forEach((x,index)=>{
        polygon(x-quarterPadding[index]-.1,z,.1,7,'#d2cbb6');polygon(x+ROAD,z,.1,7,'#d2cbb6');
      });
    });
  }
  // 只沿建筑邻接的完整地块边界留窄步道；共享边去重，不切开合并建筑。
  const edges=new Map<string,{points:[number,number,number,number];after:number}>();
  for(const p of placed)if(p.item.parcel?.kind==='building'){
    const {item,sprite}=p,{x,z,w,d}=item;
    revealAfter=p.after;
    const pw=sprite.nativeWidth*item.factor,pd=sprite.nativeDepth*item.factor,px=x+(w-pw)/2,pz=z+(d-pd)/2;
    polygon(px+.08,pz+.08,pw-.16,pd-.16,'#c2bba6');
    polygon(x+w/2-.055,pz+pd-.08,.11,z+d-(pz+pd)+.08,'#d5ceb9');
    for(let i=0;i<w;i++)for(const ez of [z,z+d]){const key=`${x+i},${ez},x`;edges.set(key,{points:[x+i,ez,x+i+1,ez],after:Math.min(edges.get(key)?.after??Infinity,revealAfter)})}
    for(let i=0;i<d;i++)for(const ex of [x,x+w]){const key=`${ex},${z+i},z`;edges.set(key,{points:[ex,z+i,ex,z+i+1],after:Math.min(edges.get(key)?.after??Infinity,revealAfter)})}
  }
  for(const {points:[x,z,x2,z2],after}of edges.values()){revealAfter=after;line(x,z,x2,z2,'#d0c9b4',.055)}
  // 平地/水岸贴图覆盖自身庭院；树木与楼体在地面之后按深度绘制。
  for(const p of placed)if(p.item.flat){revealAfter=p.after;image(p)}
  revealAfter=0;
  const overlayStart=groundPaint.length;
  if(!groundPainter){
    for(const [band,start]of parkStarts.entries()){
      // 河道在既有四格景观带内起伏；两岸保留既有树木落地所需的草坡。
      polygon(0,start,width,PARK,'#98a88a');
      const samples=Array.from({length:Math.ceil(width*2)+1},(_,i)=>{
        const x=width*i/Math.ceil(width*2);
        const center=start+PARK*.5+.12*Math.sin(x*.22+band*.7);
        const half=.82+.09*Math.sin(x*.31+1.2);
        return {x,near:center-half,far:center+half};
      });
      const bankPath=(side:'near'|'far',offset:number)=>{
        const path=new Path2D();samples.forEach((p,i)=>{const point=project(p.x,p[side]+offset);if(i)path.lineTo(...point);else path.moveTo(...point)});return path;
      };
      const water=new Path2D();
      samples.forEach((p,i)=>{const point=project(p.x,p.near);if(i)water.lineTo(...point);else water.moveTo(...point)});
      for(const p of [...samples].reverse())water.lineTo(...project(p.x,p.far));water.closePath();
      stroke(bankPath('near',-.12),'#839578',.22);stroke(bankPath('far',.12),'#839578',.22);
      groundPaint.push({after:0,paint:target=>{target.fillStyle='#699c9c';target.fill(water)}});
      stroke(bankPath('near',0),'#b0c3ac',.055);stroke(bankPath('far',0),'#b0c3ac',.055);
      // 沿岸步道与水面轮廓共用采样，不出现独立池塘或穿水黄线。
      stroke(bankPath('near',-.3),'#b4b5a0',.18);stroke(bankPath('near',-.3),'#d8d1bb',.12);
      stroke(bankPath('far',.3),'#b4b5a0',.18);stroke(bankPath('far',.3),'#d8d1bb',.12);
    }
    groundPaint.push({after:0,paint:createCityRoadPainter(roadNetwork.roads,roadNetwork.junctions)});
    // 过街带跨越完整道路宽度；不在合并地块内部新增道路。
    layout.districts.forEach(({z,quarterPadding})=>{
      CITY_QUARTER_ROADS.forEach((x,index)=>{
        const shoulder=quarterPadding[index];
        for(let stripe=0;stripe<4;stripe++){
          for(const crossingZ of [z+.08,z+6.48])polygon(x-shoulder+.07,crossingZ+stripe*.12,ROAD+shoulder-.14,.065,'#dedccc');
          for(const crossingX of [x-shoulder-.55,x+ROAD+.15]){
            polygon(crossingX+stripe*.1,z-1.52,.055,1.44,'#dedccc');
            polygon(crossingX+stripe*.1,z+7.08,.055,1.44,'#dedccc');
          }
        }
      });
    });
    groundPaint.push({after:0,paint:createCityBridgePainter(roadNetwork.bridges)});
    groundPaint.push({after:0,paint:createCityVehiclePainter(roadNetwork.vehicles)});
    groundPaint.push({after:0,paint:createCityYearMarkers(layout)});
  }
  const overlayPaint=groundPaint.slice(groundPainter?0:overlayStart);

  // 二十年细节平移已在同环境对照；保留统一顺序，本轮不扩建剔除框架。
  let cachedPrefix=progressive?previouslyRevealedDays!:Infinity;
  const paintGround=(target:CanvasRenderingContext2D)=>{for(const command of groundPaint)if(command.after<=cachedPrefix)command.paint(target)};
  const g=ground.getContext('2d')!;g.setTransform(unit,0,0,unit,-minX*unit,-minY*unit);paintGround(g);
  const detailGround=document.createElement('canvas');let detailKey='';
  const highlight=document.createElement('canvas');highlight.className='building-highlight';highlight.hidden=true;highlight.setAttribute('aria-hidden','true');
  highlight.style.cssText='position:absolute;pointer-events:none;';
  let highlighted=-1;
  const clearHighlight=()=>{highlighted=-1;highlight.remove();highlight.hidden=true;highlight.width=highlight.height=0};
  let frameKey='',visiblePrefix=0;
  const fitScale=(viewport:LandscapeViewport)=>Math.min(Math.max(1,viewport.width-32)/(maxX-minX),Math.max(1,viewport.height-24)/(maxY-minY));
  // 接点只重画环路的相邻直段；与出口共同铺路/裁标线，避免独立圆端帽压进环路。
  const exitJunctions=baseExits.map(road=>({x:road.points[0][0],z:road.points[0][1],radius:cityRoadWidth(road)/2}));
  const joiningRoads:CityRoadRoute[]=baseExits.flatMap(exit=>{
    const p=exit.points[0],horizontal=exit.points[0][1]===exit.points[1][1];
    return roadNetwork.roads.filter(road=>road.closed).flatMap(road=>planRoadGeometry(road).straights.flatMap(({a,b},index)=>{
      if(horizontal?a[0]!==b[0]:a[1]!==b[1])return [];
      const across=horizontal?0:1,along=horizontal?1:0;
      if(Math.abs(a[across]-p[across])>1e-4||p[along]<Math.min(a[along],b[along])-1e-4||p[along]>Math.max(a[along],b[along])+1e-4)return [];
      const reach=(cityRoadWidth(exit)+cityRoadWidth(road))/2+.3;
      const low=Math.max(Math.min(a[along],b[along]),p[along]-reach),high=Math.min(Math.max(a[along],b[along]),p[along]+reach);
      const start:[number,number]=[...p],end:[number,number]=[...p];start[along]=low;end[along]=high;
      return [{...road,id:`${road.id}-exit-${index}`,closed:false,cornerRadius:undefined,junctionCorners:undefined,points:[start,end]}];
    }));
  });
  let returnRoadEnd=1;
  let boards:(DirectionBoard|undefined)[]=[],returnBoard:DirectionBoard|undefined;
  let posters:readonly OrganizationPoster[]=[],organizationBoards:OrganizationBoard[]=[];
  let organizationFrame:CitySprite|undefined;
  type PaintedBoard=Pick<DirectionBoard,'bounds'|'groundX'|'groundY'|'paint'>;
  let boardOrder:PaintedBoard[]=[];
  const updateBoards=()=>{
    const signs=boards.filter(board=>board!==undefined);
    if(returnBoard)signs.push(returnBoard);
    organizationBoards=organizationFrame?planOrganizationBoards(roadNetwork,baseExits,posters,organizationFrame,
      signs.flatMap(sign=>sign.bounds?[sign.bounds]:[]),placed):[];
    boardOrder=[...signs,...organizationBoards].sort((a,b)=>a.groundY-b.groundY);
    frameKey='';
  };
  let exitPaintKey='',paintExits:(target:CanvasRenderingContext2D)=>void;
  let highwayBridges:ReturnType<typeof createHighwayBridgePainter>;
  let shareCredit:CityShareCredit|undefined,creditChanged=false;
  const planBoard=(road:CityRoadRoute,label:string,kind:'outbound'|'return'|'temporary-return',range:readonly [number,number]=[0,1])=>{
    const sprite=images[`direction-board-${kind==='outbound'?'z':'x'}`];
    return sprite?planDirectionBoard(road,label,kind,context,sprite,baseExits,range):undefined;
  };
  const roadScreen=(x:number,z:number,viewport:LandscapeViewport):[number,number]=>{
    const [px,py]=project(x,z),scale=fitScale(viewport)*viewport.zoom;
    return [viewport.width/2+viewport.panX+(px-(minX+maxX)/2)*scale,viewport.height/2+viewport.panY+(py-(minY+maxY)/2)*scale];
  };
  // 同一个仿射变换用于画布、牌面链接及跨域头像，原点始终跟随路肩上的双脚中点。
  const boardProjection=(viewport:LandscapeViewport)=>{
    const mapScale=fitScale(viewport)*viewport.zoom;
    const scale=mapScale*roadsideScale(viewport.zoom/(viewport.zoomBase??1));
    const left=viewport.width/2+viewport.panX-(minX+maxX)/2*mapScale;
    const top=viewport.height/2+viewport.panY-(minY+maxY)/2*mapScale;
    const point=(board:PaintedBoard,x:number,y:number):[number,number]=>[
      left+board.groundX*mapScale+(x-board.groundX)*scale,
      top+board.groundY*mapScale+(y-board.groundY)*scale,
    ];
    return {scale,point,polygon:(board:DirectionBoard)=>board.polygon.map(([x,y])=>point(board,x,y))};
  };
  const hitItem=(x:number,y:number,viewport:LandscapeViewport)=>{
    if(!frameKey)return -1;
    const scale=fitScale(viewport)*viewport.zoom;
    const px=(x-viewport.width/2-viewport.panX)/scale+(minX+maxX)/2;
    const py=(y-viewport.height/2-viewport.panY)/scale+(minY+maxY)/2;
    for(let i=placed.length-1;i>=0;i--){
      const p=placed[i];
      if(p.item.flat||(progressive&&p.after>visiblePrefix)||px<p.left||px>=p.left+p.width||py<p.top||py>=p.top+p.height)continue;
      const source=p.sprite.canvas;
      let mask=hitMasks.get(source);
      if(!mask){
        const rgba=source.getContext('2d')!.getImageData(0,0,source.width,source.height).data;
        mask=new Uint8Array(Math.ceil(source.width*source.height/8));
        for(let pixel=0;pixel<source.width*source.height;pixel++)if(rgba[pixel*4+3]>=64)mask[pixel>>3]|=1<<(pixel&7);
        hitMasks.set(source,mask);
      }
      const pixel=Math.floor((py-p.top)/p.height*source.height)*source.width+Math.floor((px-p.left)/p.width*source.width);
      if(mask[pixel>>3]&(1<<(pixel&7)))return p.item.parcel?.kind==='building'?i:-1;
    }
    return -1;
  };
  return {
    canvas,
    setVehicles(vehicles){
      const traffic = projectItems(planCityTransport(vehicles, [], []));
      prepareSamples(traffic);
      placed = placed.filter(p => !cityVehicleSprites.has(p.item.id)).concat(traffic).sort(byDepth);
      clearHighlight();
      frameKey = '';
    },
    exitCount:baseExits.length,
    setRoadLabels(labels,returnLabel){
      returnRoadEnd=returnLabel&&labels[0]?.label ? .5 : 1;
      boards=baseExits.map((road,i)=>{
        const {label,returning}=labels[i]??{label:'',returning:false};
        // 第一块空牌可由独立返程牌占用，其余牌面的命中区仍使用各自的出口序号。
        if(i===0&&returnLabel&&!label)return;
        const start=i===0&&returnRoadEnd===.5 ? .5 : 0;
        return planBoard(road,label,returning?'return':'outbound',[start,1]);
      });
      returnBoard=returnLabel&&baseExits.length?planBoard(baseExits[0],returnLabel,'temporary-return',[0,returnRoadEnd]):undefined;
      updateBoards();
    },
    setOrganizationPosters(next,frame){posters=next;organizationFrame=frame;updateBoards()},
    setShareCredit(credit){
      const previous=shareCredit;
      if(previous?.login===credit.login&&previous.icon===credit.icon&&previous.visible===credit.visible&&
        previous.x===credit.x&&previous.y===credit.y&&
        previous.width===credit.width&&previous.height===credit.height)return;
      shareCredit=credit;creditChanged=true;
    },
    organizationFaces(viewport){
      const projection=boardProjection(viewport);
      return organizationBoards.map(board=>{
        const [left,top]=projection.point(board,board.left,board.top);
        return {left,top,size:organizationFace.size*projection.scale,slope:board.slope};
      });
    },
    setRepositoryCreations(entries){
      if(!roadside)return;
      const old=new Set(repositoryLandmarks.flatMap(site=>site.plots));
      repositoryLandmarks=roadside.repositorySites(entries).flatMap(({year,entry,items})=>{
        const plots=projectItems(items);
        return plots.length?[{year,entry,plots}]:[];
      });
      const landmarks=repositoryLandmarks.flatMap(site=>site.plots);
      prepareSamples(landmarks);
      placed=placed.filter(item=>!old.has(item)).concat(landmarks).sort(byDepth);
      clearHighlight();frameKey='';
    },
    repositorySites(viewport){
      const scale=fitScale(viewport)*viewport.zoom;
      const x=viewport.width/2+viewport.panX-(minX+maxX)*scale/2;
      const y=viewport.height/2+viewport.panY-(minY+maxY)*scale/2;
      return repositoryLandmarks.map(({year,entry,plots})=>({
        year,entry,buildings:plots.map(plot=>({
          left:x+plot.left*scale,top:y+plot.top*scale,width:plot.width*scale,height:plot.height*scale,
        })),
      }));
    },
    fitOverview(viewport,topInset,bottomInset){
      const signs=boardOrder.flatMap(board=>board.bounds?[board.bounds]:[]);
      if(!signs.length&&!shareCredit)return;
      const left=Math.min(minX,...signs.map(b=>b.left)),right=Math.max(maxX,...signs.map(b=>b.right));
      const top=Math.min(minY,...signs.map(b=>b.top)),bottom=Math.max(maxY,...signs.map(b=>b.bottom));
      // 远景占地是所有倍率下的最大占地，涵盖完整牌架并为提示、缩放工具和四边留空。
      const scale=Math.min(Math.max(1,viewport.width-32)/(right-left),Math.max(1,viewport.height-topInset-bottomInset-24)/(bottom-top));
      return {zoom:scale/fitScale(viewport),panX:(minX+maxX-left-right)*scale/2,
        panY:(topInset-bottomInset)/2+(minY+maxY-top-bottom)*scale/2};
    },
    roadExits(viewport){
      const screen=(x:number,z:number)=>roadScreen(x,z,viewport);
      const projection=boardProjection(viewport);
      return baseExits.map((road,i)=>{
        const a=road.points[0],b=road.points.at(-1)!,dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
        const half=cityRoadWidth(road)/2,nx=-dz/length*half,nz=dx/length*half;
        return {board:boards[i]?projection.polygon(boards[i]):[],polygon:[screen(a[0]+nx,a[1]+nz),screen(b[0]+nx,b[1]+nz),screen(b[0]-nx,b[1]-nz),screen(a[0]-nx,a[1]-nz)]};
      });
    },
    returnPost(viewport){
      if(!returnBoard)return;
      const road=baseExits[0],a=road.points[0],b=road.points.at(-1)!,dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),half=cityRoadWidth(road)/2;
      const screen=(x:number,z:number)=>roadScreen(x,z,viewport);
      const end:[number,number]=[a[0]+dx*returnRoadEnd,a[1]+dz*returnRoadEnd];
      return {board:boardProjection(viewport).polygon(returnBoard),polygon:[screen(...a),screen(...end),screen(end[0]-dz/length*half,end[1]+dx/length*half),screen(a[0]-dz/length*half,a[1]+dx/length*half)]};
    },
    buildingAt(x,y,viewport){
      return placed[hitItem(x,y,viewport)]?.item.parcel?.indices;
    },
    stepBuilding(backward,viewport){
      if(!frameKey)return;
      const scale=fitScale(viewport)*viewport.zoom;
      const start=highlighted>=0?highlighted:backward?0:-1;
      for(let offset=1;offset<=placed.length;offset++){
        const index=(start+(backward?-offset:offset)+placed.length)%placed.length;
        const p=placed[index];
        if(p.item.parcel?.kind!=='building'||(progressive&&p.after>visiblePrefix))continue;
        const x=viewport.width/2+viewport.panX+(p.left+p.width/2-(minX+maxX)/2)*scale;
        if(x<0||x>=viewport.width)continue;
        // 先试立面中心，再试屋顶。沿用指针实际命中，避免选中被前排完全挡住的楼。
        for(const height of [.55,.25]){
          const y=viewport.height/2+viewport.panY+(p.top+p.height*height-(minY+maxY)/2)*scale;
          if(y>=0&&y<viewport.height&&hitItem(x,y,viewport)===index)return {x,y};
        }
      }
    },
    highlightBuilding(point,viewport){
      const index=point?hitItem(point.x,point.y,viewport):-1;
      if(index===highlighted)return;
      clearHighlight();if(index<0||!canvas.parentElement)return;
      highlighted=index;
      const p=placed[index],padding=8;
      const scale=fitScale(viewport)*viewport.zoom;
      const left=viewport.width/2+viewport.panX+(p.left-(minX+maxX)/2)*scale-padding;
      const top=viewport.height/2+viewport.panY+(p.top-(minY+maxY)/2)*scale-padding;
      const w=p.width*scale,h=p.height*scale;
      const x=Math.max(0,left),y=Math.max(0,top),right=Math.min(viewport.width,left+w+padding*2),bottom=Math.min(viewport.height,top+h+padding*2);
      highlight.width=Math.ceil((right-x)*viewport.dpr);highlight.height=Math.ceil((bottom-y)*viewport.dpr);
      Object.assign(highlight.style,{left:`${x}px`,top:`${y}px`,width:`${right-x}px`,height:`${bottom-y}px`});
      const target=highlight.getContext('2d')!;target.setTransform(viewport.dpr,0,0,viewport.dpr,0,0);target.imageSmoothingQuality='high';
      target.shadowColor='rgba(255,233,153,.9)';target.shadowBlur=7*viewport.dpr;
      target.drawImage(p.sprite.canvas,left-x+padding,top-y+padding,w,h);target.shadowBlur=0;
      target.globalCompositeOperation='source-atop';target.fillStyle='rgba(255,247,205,.24)';target.fillRect(0,0,right-x,bottom-y);
      // 前景设施与楼体仍遮住被选建筑，高光不能透过它们浮到最前面。
      target.globalCompositeOperation='destination-out';
      for(let i=index+1;i<placed.length;i++){
        const front=placed[i];if(front.item.flat||(progressive&&front.after>visiblePrefix))continue;
        const fx=left+(front.left-p.left)*scale+padding-x,fy=top+(front.top-p.top)*scale+padding-y,fw=front.width*scale,fh=front.height*scale;
        if(fx+fw<0||fy+fh<0||fx>right-x||fy>bottom-y)continue;
        target.drawImage(front.sprite.canvas,fx,fy,fw,fh);
      }
      highlight.hidden=false;canvas.after(highlight);
    },
    maxZoom:viewport=>Math.max(5,192/fitScale(viewport)),
    description:()=>groundPainter?`固定视角 · ${wonderCount} 处奇观 · 沿街区外缘环路 / 内部共用道路 · 拖动平移`:`固定视角 · ${wonderCount} 处奇观 · 双向2/4/8车道 / 路口对齐河桥 / 静态车辆 · 拖动平移`,
    draw(progress,viewport:LandscapeViewport){
      // 同一实例的数据已固定；恢复可见性时沿用已有像素，取景或进度变化才重画。
      const nextFrameKey=[progress,viewport.width,viewport.height,viewport.dpr,viewport.zoom,viewport.zoomBase,viewport.panX,viewport.panY,viewport.dark].join(':');
      if(nextFrameKey===frameKey&&!creditChanged)return;
      if(nextFrameKey!==frameKey)clearHighlight();
      const prefix=progress===1?weekly.cells.length:Math.floor(progress*weekly.cells.length);
      // 新批次只有短填入期间逐帧画增量地面；完成后恢复整块缓存，不续连续帧。
      if(progressive&&prefix===weekly.cells.length&&cachedPrefix<prefix){
        cachedPrefix=prefix;g.resetTransform();g.clearRect(0,0,ground.width,ground.height);g.setTransform(unit,0,0,unit,-minX*unit,-minY*unit);paintGround(g);detailKey='';
      }
      const pw=Math.round(viewport.width*viewport.dpr),ph=Math.round(viewport.height*viewport.dpr);
      if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph}
      context.setTransform(viewport.dpr,0,0,viewport.dpr,0,0);context.clearRect(0,0,viewport.width,viewport.height);
      const scale=fitScale(viewport)*viewport.zoom;
      const sx=(x:number)=>viewport.width/2+viewport.panX+(x-(minX+maxX)/2)*scale,sy=(y:number)=>viewport.height/2+viewport.panY+(y-(minY+maxY)/2)*scale;
      const left=-sx(0)/scale,top=-sy(0)/scale,right=left+viewport.width/scale,bottom=top+viewport.height/scale;
      const exitKey=[left,top,right,bottom].join(':');
      if(exitKey!==exitPaintKey){
        const routes=highways.flatMap(route=>clipCityExit(route,left,top,right,bottom)??[]);
        paintExits=createCityRoadPainter([...joiningRoads,...routes],exitJunctions,'butt');
        highwayBridges=waterways&&createHighwayBridgePainter(routes,waterways.roadWater({left,top,right,bottom}));
        exitPaintKey=exitKey;
      }
      context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
      // 河道重算与视口绑定，渐进绘制建筑时复用同一层地貌。
      const nextBackdropKey=[pw,ph,left,top,right,bottom].join(':');
      if(!background||backdropKey!==nextBackdropKey){
        if(background&&(background.width!==pw||background.height!==ph)){background.width=pw;background.height=ph}
        const land=background?.getContext('2d')??context;
        land.setTransform(viewport.dpr,0,0,viewport.dpr,0,0);
        land.imageSmoothingEnabled=true;land.imageSmoothingQuality='high';
        land.fillStyle='#a3b58d';land.fillRect(0,0,viewport.width,viewport.height);
        land.save();
        land.setTransform(viewport.dpr*scale,0,0,viewport.dpr*scale,sx(0)*viewport.dpr,sy(0)*viewport.dpr);
        if(paintGroundTiles){
          paintGroundTiles(land,{left,top,right,bottom},scale);
          // 在整个拼贴层上统一柔化远景，避免单块透明度叠加导致深浅接缝。
          land.globalAlpha=Math.max(0,.48-scale/160);
          land.fillStyle='#a3b58d';land.fillRect(left,top,viewport.width/scale,viewport.height/scale);
          land.globalAlpha=1;
        }else if(terrainPattern){
          // 远景让城外的细碎草纹融入底色。
          land.globalAlpha=Math.min(1,(groundPainter ? .52 : .65)+scale/160);
          land.fillStyle=terrainPattern;land.fillRect(left,top,viewport.width/scale,viewport.height/scale);
          land.globalAlpha=1;
        }
        const paintWater=()=>waterways?.paint(land,left,top,right,bottom);
        if(scenery)scenery(land,paintWater,{left,top,right,bottom});
        else paintWater();
        land.restore();
        backdropKey=nextBackdropKey;
      }
      if(background)context.drawImage(background,0,0,viewport.width,viewport.height);
      if(scale<=unit*1.25)context.drawImage(ground,sx(minX),sy(minY),(maxX-minX)*scale,(maxY-minY)*scale);
      else{
        const key=[pw,ph,scale,viewport.panX,viewport.panY].join(',');
        if(key!==detailKey){
          detailGround.width=pw;detailGround.height=ph;const d=detailGround.getContext('2d')!;
          d.setTransform(viewport.dpr*scale,0,0,viewport.dpr*scale,sx(0)*viewport.dpr,sy(0)*viewport.dpr);d.imageSmoothingQuality='high';
          paintGround(d);
          detailKey=key;
        }
        context.drawImage(detailGround,0,0,viewport.width,viewport.height);
      }
      if(progressive&&prefix>cachedPrefix){
        context.save();context.setTransform(viewport.dpr*scale,0,0,viewport.dpr*scale,sx(0)*viewport.dpr,sy(0)*viewport.dpr);
        for(const command of groundPaint)if(command.after>cachedPrefix&&command.after<=prefix)command.paint(context);
        // 增量平地仍位于既有河岸/道路/年份之下，顺序与最终缓存一致。
        for(const command of overlayPaint)command.paint(context);
        context.restore();
      }
      const level=(1-Math.pow(1-progress,1.4))*tallest;
      {
        context.save();context.setTransform(viewport.dpr*scale,0,0,viewport.dpr*scale,sx(0)*viewport.dpr,sy(0)*viewport.dpr);
        highwayBridges?.deck(context);
        paintExits(context);
        highwayBridges?.rails(context);
        for(const board of boards)board?.paintRoad(context);
        returnBoard?.paintRoad(context);
        context.restore();
      }
      let boardIndex=0;
      const projection=boardProjection(viewport),boardPixels=viewport.dpr*projection.scale;
      const paintBoard=(board:PaintedBoard)=>{
        const [left,top]=projection.point(board,0,0);
        context.save();context.setTransform(boardPixels,0,0,boardPixels,left*viewport.dpr,top*viewport.dpr);
        board.paint(context);context.restore();
      };
      for(const p of placed){
        while(boardIndex<boardOrder.length&&boardOrder[boardIndex].groundY<=p.groundY)paintBoard(boardOrder[boardIndex++]);
        if(p.item.flat||(progressive&&p.after>prefix))continue;
        const x=sx(p.left),y=sy(p.top),w=p.width*scale,h=p.height*scale;
        if(x+w<0||x>viewport.width||y+h<0||y>viewport.height)continue;
        const growth=progressive?1:Math.min(1,level/Math.max(.1,p.groundY-p.top));if(growth<=0)continue;
        context.save();
        if(growth<1){context.beginPath();context.rect(x-1,sy(p.groundY)-(p.groundY-p.top)*scale*growth,w+2,h+2);context.clip();context.globalAlpha=Math.min(1,growth*4)}
        let source=p.sprite.canvas;
        const levels=samples.get(p.sprite.canvas)!;
        for(let i=1;i<levels.length;i++){
          const sample=levels[i];
          if(sample.width<w*viewport.dpr||sample.height<h*viewport.dpr)break;
          source=sample;
        }
        context.drawImage(source,x,y,w,h);context.restore();
      }
      while(boardIndex<boardOrder.length)paintBoard(boardOrder[boardIndex++]);
      if(shareCredit?.visible){
        paintShareCredit(context,shareCredit);
        // 把主画布已合成的牌面铺在组织图标上方，屏幕与保存用同一份像素。
        const {x,y,width,height,foreground}=shareCredit,{dpr}=viewport;
        const w=Math.round(width*dpr),h=Math.round(height*dpr);
        if(foreground.width!==w||foreground.height!==h){foreground.width=w;foreground.height=h}
        const target=foreground.getContext('2d')!;
        target.globalCompositeOperation='copy';
        target.drawImage(canvas,Math.round(x*dpr),Math.round(y*dpr),w,h,0,0,w,h);
      }
      creditChanged=false;
      frameKey=nextFrameKey;
      visiblePrefix=prefix;
    },
    dispose(){clearHighlight();canvas.remove();canvas.width=canvas.height=0;if(background)background.width=background.height=0;ground.width=ground.height=0;detailGround.width=detailGround.height=0;groundPaint.length=0;edges.clear();for(const levels of samples.values())for(const sample of levels.slice(1))sample.width=sample.height=0;samples.clear()},
  };
}
