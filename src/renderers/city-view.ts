import type { DailyContribution } from '../data/types';
import { planWeeklyCity, type CityParcel, type WeeklyCity } from './city-parcels';
import type { CityImages } from './city-assets';
import { selectCityBuilding } from './city-building-style';
import { createGroundSelector } from './city-ground-style';
import type { LandscapeView, LandscapeViewport } from './types';

const project=(x:number,z:number):[number,number]=>[(x-z)*.5,(x+z)*.25];
const ROAD=.8,YEAR_GAP=1.6,PARK=4;
export interface CitySceneItem { parcel?:CityParcel; id:string; factor:number; x:number; z:number; w:number; d:number; flat:boolean }
export interface CityScene { weekly:WeeklyCity; items:CitySceneItem[]; keys:string[]; parkStarts:number[]; width:number; depth:number }
const districtX=(weekly:WeeklyCity,block:number,x:number)=>x+weekly.districts[block].breaks.filter(b=>b<=x).length*ROAD;
const districtZ=(block:number)=>block*(7+YEAR_GAP)+Math.floor(block/5)*PARK;

/** 数据/占地与素材选择只在创建时确定，观看缩放不改变城市。 */
export function planCityScene(days:readonly DailyContribution[]):CityScene {
  const weekly=planWeeklyCity(days,true),selectGround=createGroundSelector(weekly);
  const items:CitySceneItem[]=weekly.parcels.map(parcel=>{
    const {w,d,kind}=parcel,hash=Math.imul(parcel.block+1,73856093)^Math.imul(parcel.x+1,19349663)^Math.imul(parcel.z+1,83492791);
    const seed=(hash^(hash>>>16))>>>0,variant=seed%2?'b':'a';
    let id:string,factor=1;
    if(kind==='grass')({id,factor}=selectGround(parcel,seed));
    else if(kind==='shrub')id=`sapling-${variant}`;
    else if(kind==='tree')id=w===2&&d===2?`forest-2x2-${variant}`:w===2?`small-grove-2x1-${variant}`:d===2?`small-grove-1x2-${variant}`:variant==='a'?'broadleaf-a':'conifer-b';
    else ({id,factor}=selectCityBuilding(parcel,seed));
    return {parcel,id,factor,x:districtX(weekly,parcel.block,parcel.x),z:districtZ(parcel.block)+parcel.z,w,d,flat:kind==='grass'};
  });
  const parkStarts=Array.from({length:Math.floor((weekly.rows-1)/5)},(_,i)=>(i+1)*5*(7+YEAR_GAP)+i*PARK-YEAR_GAP/2);
  const width=Math.max(...weekly.districts.map(d=>d.weeks+d.breaks.length*ROAD));
  for(const start of parkStarts)for(let x=1;x<width;x+=2.6)for(const z of [start+.2,start+PARK-1]){
    items.push({id:Math.round(x)%2?'broadleaf-a':'conifer-b',factor:.75,x,z,w:.75,d:.75,flat:false});
  }
  // 信号灯仅装饰有建筑相邻的季度路口，摆在路缘，不占贡献日期格。
  weekly.districts.forEach((district,block)=>{
    const buildings=weekly.cells.filter(cell=>cell.block===block&&cell.kind==='building'),z=districtZ(block);
    district.breaks.forEach((week,index)=>{
      const x=week+index*ROAD;
      for(const north of [true,false]){
        if(!buildings.some(cell=>Math.abs(cell.x-week)<=2&&(north?cell.z<=2:cell.z>=4)))continue;
        const curbZ=north?z-.3:z+7.05;
        items.push({id:'traffic-signal-w',factor:1,x:x-.3,z:curbZ,w:.25,d:.25,flat:false});
        items.push({id:north?'traffic-signal-d-reverse':'traffic-signal-d',factor:1,x:x+ROAD+.05,z:curbZ,w:.25,d:.25,flat:false});
      }
    });
  });
  const keys=[...new Set([...items.map(i=>i.id),...(parkStarts.length?['pond-a']:[])])];
  return {weekly,items,keys,parkStarts,width,depth:weekly.rows*(7+YEAR_GAP)-YEAR_GAP+parkStarts.length*PARK};
}

export function createCityView(scene:CityScene,images:CityImages):LandscapeView {
  const {weekly,items,parkStarts,width,depth}=scene;
  const canvas=document.createElement('canvas'),context=canvas.getContext('2d')!;
  const placed=items.map(item=>{
    const sprite=images[item.id];
    const offsetX=(item.w-sprite.nativeWidth*item.factor)/2,offsetZ=(item.d-sprite.nativeDepth*item.factor)/2;
    const [x,y]=project(item.x+offsetX,item.z+offsetZ);
    const left=x+sprite.left*item.factor,top=y+sprite.top*item.factor;
    return {item,sprite,left,top,width:sprite.width*item.factor,height:sprite.height*item.factor,groundY:project(item.x+item.w/2,item.z+item.d/2)[1]};
  }).sort((a,b)=>a.groundY-b.groundY||a.left-b.left);
  const minX=Math.min(-depth/2-2,...placed.map(p=>p.left))-.3,maxX=Math.max(width/2+2,...placed.map(p=>p.left+p.width))+.3;
  const minY=Math.min(-2,...placed.map(p=>p.top))-.5,maxY=Math.max((width+depth)/4+2,...placed.map(p=>p.top+p.height));
  const tallest=Math.max(1,...placed.filter(p=>!p.item.flat).map(p=>p.groundY-p.top));
  const ground=document.createElement('canvas'),unit=Math.min(48,3072/(maxX-minX));
  ground.width=Math.ceil((maxX-minX)*unit);ground.height=Math.ceil((maxY-minY)*unit);
  // 同一绘制序列供全景与近景缓存使用，避免缩放时改变遮挡与道路几何。
  const groundPaint:((target:CanvasRenderingContext2D)=>void)[]=[];
  const polygon=(x:number,z:number,w:number,d:number,color:string)=>{
    if(w<=0||d<=0)return;
    const path=new Path2D();
    [project(x,z),project(x+w,z),project(x+w,z+d),project(x,z+d)].forEach((p,i)=>i?path.lineTo(...p):path.moveTo(...p));path.closePath();
    groundPaint.push(target=>{target.fillStyle=color;target.fill(path)});
  };
  const stroke=(path:Path2D,color:string,lineWidth:number,dash:number[]=[])=>{
    groundPaint.push(target=>{target.lineJoin='round';target.strokeStyle=color;target.lineWidth=lineWidth;target.setLineDash(dash);target.stroke(path)});
  };
  const line=(x:number,z:number,x2:number,z2:number,color:string,lineWidth:number,dash:number[]=[])=>{
    const path=new Path2D();path.moveTo(...project(x,z));path.lineTo(...project(x2,z2));stroke(path,color,lineWidth,dash);
  };
  const image=(p:{sprite:CityImages[string];left:number;top:number;width:number;height:number})=>{
    groundPaint.push(target=>target.drawImage(p.sprite.canvas,p.left,p.top,p.width,p.height));
  };
  // 低透明度的外围层逐步淡出，两个缓存使用相同世界坐标，不依赖像素模糊。
  for(let edge=6;edge>0;edge--)polygon(-edge*.12,-edge*.12,width+edge*.24,depth+edge*.24,'rgba(130,152,117,0.035)');
  weekly.districts.forEach((district,block)=>{
    const z=districtZ(block),span=district.weeks+district.breaks.length*ROAD;
    polygon(-YEAR_GAP/2,z-YEAR_GAP/2,span+YEAR_GAP,7+YEAR_GAP,'#606967');
    // 连续暖石人行道与细路缘包住年度街区，庭院不再逐格铺深色底。
    polygon(-.16,z-.16,span+.32,7.32,'#b6b5a4');
    polygon(-.12,z-.12,span+.24,7.24,'#d2cbb6');
    polygon(0,z,span,7,'#b3b4a2');
    line(-.4,z-.4,span+.4,z-.4,'#c6c3aa',.022,[.25,.3]);
    line(-.4,z+7.4,span+.4,z+7.4,'#c6c3aa',.022,[.25,.3]);
    district.breaks.forEach((week,index)=>{
      const x=week+index*ROAD;
      polygon(x-.1,z,.1,7,'#d2cbb6');polygon(x+ROAD,z,.1,7,'#d2cbb6');
      polygon(x,z-.8,ROAD,8.6,'#6c7470');
      line(x+ROAD/2,z+.3,x+ROAD/2,z+6.7,'#c6c3aa',.02,[.18,.25]);
      // 横跨季度路：条纹沿行进轴排列；主路方向的过街带位于交叉口两侧。
      for(let stripe=0;stripe<4;stripe++){
        for(const crossingZ of [z+.08,z+6.48])polygon(x+.09,crossingZ+stripe*.12,ROAD-.18,.065,'#dedccc');
        for(const crossingX of [x-.5,x+ROAD+.12]){
          polygon(crossingX+stripe*.1,z-.67,.055,.46,'#dedccc');
          polygon(crossingX+stripe*.1,z+7.21,.055,.46,'#dedccc');
        }
      }
    });
  });
  // 只沿建筑邻接的完整地块边界留窄步道；共享边去重，不切开合并建筑。
  const edges=new Map<string,[number,number,number,number]>();
  for(const p of placed)if(p.item.parcel?.kind==='building'){
    const {item,sprite}=p,{x,z,w,d}=item;
    const pw=sprite.nativeWidth*item.factor,pd=sprite.nativeDepth*item.factor,px=x+(w-pw)/2,pz=z+(d-pd)/2;
    polygon(px+.08,pz+.08,pw-.16,pd-.16,'#c2bba6');
    polygon(x+w/2-.055,pz+pd-.08,.11,z+d-(pz+pd)+.08,'#d5ceb9');
    for(let i=0;i<w;i++)for(const ez of [z,z+d])edges.set(`${x+i},${ez},x`,[x+i,ez,x+i+1,ez]);
    for(let i=0;i<d;i++)for(const ex of [x,x+w])edges.set(`${ex},${z+i},z`,[ex,z+i,ex,z+i+1]);
  }
  for(const [x,z,x2,z2]of edges.values())line(x,z,x2,z2,'#d0c9b4',.055);
  // 平地/水岸贴图覆盖自身庭院；树木与楼体在地面之后按深度绘制。
  for(const p of placed)if(p.item.flat)image(p);
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
    groundPaint.push(target=>{target.fillStyle='#699c9c';target.fill(water)});
    stroke(bankPath('near',0),'#b0c3ac',.055);stroke(bankPath('far',0),'#b0c3ac',.055);
    // 沿岸步道与水面轮廓共用采样，不出现独立池塘或穿水黄线。
    stroke(bankPath('near',-.3),'#b4b5a0',.18);stroke(bankPath('near',-.3),'#d8d1bb',.12);
    stroke(bankPath('far',.3),'#b4b5a0',.18);stroke(bankPath('far',.3),'#d8d1bb',.12);
    // 每带一座桥对齐前一年度中间季度路，桥头仅在年间道路内衔接。
    const before=weekly.districts[(band+1)*5-1],after=weekly.districts[(band+1)*5];
    const index=Math.floor(before.breaks.length/2),week=before.breaks[index];
    if(week!==undefined){
      const roadX=week+index*ROAD;
      // 桥从既有岸树之间的空隙通过，避免把保留的场景树画在桥面上。
      const bankTrees=items.filter(item=>!item.parcel&&item.z>=start&&item.z<start+PARK).sort((a,b)=>a.x-b.x);
      const gaps=bankTrees.flatMap((tree,i)=>{
        const next=bankTrees[i+1];return next&&next.x-(tree.x+tree.w)>ROAD+.6?[(tree.x+tree.w+next.x-ROAD)/2]:[];
      });
      const x=gaps.sort((a,b)=>Math.abs(a-roadX)-Math.abs(b-roadX))[0]??roadX;
      const bridgeZ=start-.4,bridgeDepth=PARK+.8;
      polygon(x-.14,bridgeZ,ROAD+.28,bridgeDepth,'#a7afa3');
      polygon(x,bridgeZ,ROAD,bridgeDepth,'#747e79');
      line(x+ROAD/2,bridgeZ+.1,x+ROAD/2,bridgeZ+bridgeDepth-.1,'#d4d0b7',.02,[.18,.25]);
      for(const railX of [x-.1,x+ROAD+.1])line(railX,start+.15,railX,start+PARK-.15,'#e0ddcd',.035);
      polygon(Math.min(x,roadX),start-.6,Math.abs(x-roadX)+ROAD,.4,'#747e79');
      const nextWeek=after?.breaks[index];
      if(nextWeek!==undefined){
        const nextX=nextWeek+index*ROAD;
        polygon(Math.min(x,nextX),start+PARK+.2,Math.abs(nextX-x)+ROAD,.4,'#747e79');
      }
    }
  }
  // 二十年细节平移已在同环境对照；保留统一顺序，本轮不扩建剔除框架。
  const paintGround=(target:CanvasRenderingContext2D)=>{for(const paint of groundPaint)paint(target)};
  const g=ground.getContext('2d')!;g.setTransform(unit,0,0,unit,-minX*unit,-minY*unit);paintGround(g);
  const detailGround=document.createElement('canvas');let detailKey='';
  const fitScale=(viewport:LandscapeViewport)=>Math.min(Math.max(1,viewport.width-32)/(maxX-minX),Math.max(1,viewport.height-24)/(maxY-minY));
  return {
    canvas,
    maxZoom:viewport=>Math.max(5,192/fitScale(viewport)),
    description:()=> '固定视角 · 标定单元居中留距 · 连续庭院步道 / 季度交叉路 / 每五年滨河带 · 可放大查看建筑细节 · 拖动平移',
    draw(progress,viewport:LandscapeViewport){
      const pw=Math.round(viewport.width*viewport.dpr),ph=Math.round(viewport.height*viewport.dpr);
      if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph}
      context.setTransform(viewport.dpr,0,0,viewport.dpr,0,0);context.clearRect(0,0,viewport.width,viewport.height);
      const scale=fitScale(viewport)*viewport.zoom;
      const sx=(x:number)=>viewport.width/2+viewport.panX+(x-(minX+maxX)/2)*scale,sy=(y:number)=>viewport.height/2+viewport.panY+(y-(minY+maxY)/2)*scale;
      context.imageSmoothingEnabled=true;context.imageSmoothingQuality=scale<10?'medium':'high';
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
      const level=(1-Math.pow(1-progress,1.4))*tallest;
      for(const p of placed){
        if(p.item.flat)continue;
        const x=sx(p.left),y=sy(p.top),w=p.width*scale,h=p.height*scale;
        if(x+w<0||x>viewport.width||y+h<0||y>viewport.height)continue;
        const growth=Math.min(1,level/Math.max(.1,p.groundY-p.top));if(growth<=0)continue;
        context.save();context.beginPath();context.rect(x-1,sy(p.groundY)-(p.groundY-p.top)*scale*growth,w+2,h+2);context.clip();context.globalAlpha=Math.min(1,growth*4);
        context.drawImage(p.sprite.canvas,x,y,w,h);context.restore();
      }
      context.font='11px -apple-system,BlinkMacSystemFont,sans-serif';context.textAlign='right';context.fillStyle=viewport.dark?'#aab7ac':'#536451';
      weekly.districts.forEach((district,block)=>{const p=project(-1.2,districtZ(block)+3.5);context.fillText(String(district.year),sx(p[0]),sy(p[1]))});
    },
    dispose(){canvas.remove();canvas.width=canvas.height=0;ground.width=ground.height=0;detailGround.width=detailGround.height=0;groundPaint.length=0;edges.clear()},
  };
}
