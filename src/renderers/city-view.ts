import type { DailyContribution } from '../data/types';
import { planWeeklyCity, type CityParcel, type WeeklyCity } from './city-parcels';
import type { CityImages } from './city-assets';
import { selectCityBuilding } from './city-building-style';
import type { LandscapeView, LandscapeViewport } from './types';

const project=(x:number,z:number):[number,number]=>[(x-z)*.5,(x+z)*.25];
const ROAD=.8,YEAR_GAP=1.6,PARK=4;
export interface CitySceneItem { parcel?:CityParcel; id:string; factor:number; x:number; z:number; w:number; d:number; flat:boolean }
export interface CityScene { weekly:WeeklyCity; items:CitySceneItem[]; keys:string[]; parkStarts:number[]; width:number; depth:number }
const districtX=(weekly:WeeklyCity,block:number,x:number)=>x+weekly.districts[block].breaks.filter(b=>b<=x).length*ROAD;
const districtZ=(block:number)=>block*(7+YEAR_GAP)+Math.floor(block/5)*PARK;

/** 数据/占地与素材选择只在创建时确定，观看缩放不改变城市。 */
export function planCityScene(days:readonly DailyContribution[]):CityScene {
  const weekly=planWeeklyCity(days);
  const items:CitySceneItem[]=weekly.parcels.map(parcel=>{
    const {w,d,kind}=parcel,hash=Math.imul(parcel.block+1,73856093)^Math.imul(parcel.x+1,19349663)^Math.imul(parcel.z+1,83492791);
    const seed=(hash^(hash>>>16))>>>0,variant=seed%2?'b':'a';
    let id:string,factor=1;
    if(kind==='grass')id=w===2?(seed%12===0?'pond-a':seed%12===1?'pond-b':seed%12===2?'plaza-a':seed%12===3?'plaza-b':`grass-2x2-${variant}`):`grass-1x1-${variant}`;
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
  const g=ground.getContext('2d')!;g.setTransform(unit,0,0,unit,-minX*unit,-minY*unit);
  const groundShapes:{path:Path2D;color:string;left:number;right:number;top:number;bottom:number}[]=[],groundStrokes:{path:Path2D;color:string;width:number;dash:number[]}[]=[];
  const polygon=(x:number,z:number,w:number,d:number,color:string)=>{
    const points=[project(x,z),project(x+w,z),project(x+w,z+d),project(x,z+d)],path=new Path2D();
    points.forEach((p,i)=>i?path.lineTo(...p):path.moveTo(...p));path.closePath();g.fillStyle=color;g.fill(path);
    groundShapes.push({path,color,left:Math.min(...points.map(p=>p[0])),right:Math.max(...points.map(p=>p[0])),top:points[0][1],bottom:points[2][1]});
  };
  g.filter='blur(13px)';g.globalAlpha=.35;polygon(-1,-1,width+2,depth+2,'#829875');g.filter='none';g.globalAlpha=1;
  groundShapes.pop(); // 只在远景缓存保留柔和边缘，近景不会露出外围光晕。
  weekly.districts.forEach((district,block)=>{
    const z=districtZ(block),span=district.weeks+district.breaks.length*ROAD;
    polygon(-YEAR_GAP/2,z-YEAR_GAP/2,span+YEAR_GAP,7+YEAR_GAP,'#505b60');polygon(-.12,z-.12,span+.24,7.24,'#8fa17c');
    g.strokeStyle='#d6d0ad';g.lineWidth=.025;g.setLineDash([.19,.22]);
    for(const [from,to]of [[[-.4,z-.4],[span+.4,z-.4]],[[span+.4,z-.4],[span+.4,z+7.4]],[[span+.4,z+7.4],[-.4,z+7.4]],[[-.4,z+7.4],[-.4,z-.4]]]){
      const path=new Path2D();path.moveTo(...project(...from as [number,number]));path.lineTo(...project(...to as [number,number]));g.stroke(path);groundStrokes.push({path,color:'#d6d0ad',width:.025,dash:[.19,.22]});
    }
    g.setLineDash([]);
    district.breaks.forEach((week,index)=>{
      const roadX=week+index*ROAD;polygon(roadX,z-.8,ROAD,8.6,'#505b60');
      const path=new Path2D();path.moveTo(...project(roadX+ROAD/2,z-.6));path.lineTo(...project(roadX+ROAD/2,z+7.6));g.strokeStyle='#d6d0ad';g.setLineDash([.16,.2]);g.stroke(path);groundStrokes.push({path,color:'#d6d0ad',width:.025,dash:[.16,.2]});g.setLineDash([]);
      for(let stripe=0;stripe<5;stripe++){polygon(roadX+.07+stripe*.14,z-.45,.07,.45,'#e1e5d8');polygon(roadX+.07+stripe*.14,z+7,.07,.45,'#e1e5d8')}
    });
  });
  // 庭院和支路沿已合并地块铺设，不在大建筑的内部画穿行道路。
  const lanes=new Path2D();
  for(const p of placed)if(p.item.parcel){
    const {item,sprite}=p,{x,z,w,d}=item;
    const green=item.flat?'#92a87e':item.parcel!.kind==='building'?'#829875':'#8da578';
    polygon(x+.1,z+.1,w-.2,d-.2,green);
    if(item.parcel!.kind==='building'){
      const pw=sprite.nativeWidth*item.factor,pd=sprite.nativeDepth*item.factor,px=x+(w-pw)/2,pz=z+(d-pd)/2;
      polygon(px+.13,pz+.13,pw-.26,pd-.26,'#b1b19f');
      polygon(x+w/2-.045,pz+pd-.13,.09,z+d-(pz+pd)+.13,'#c3bea8');
    }
    [project(x,z),project(x+w,z),project(x+w,z+d),project(x,z+d)].forEach((point,i)=>i?lanes.lineTo(...point):lanes.moveTo(...point));lanes.closePath();
  }
  // 数据平地一次画入地面缓存；每帧只绘制正在生长的建筑和植被。
  for(const p of placed)if(p.item.flat)g.drawImage(p.sprite.canvas,p.left,p.top,p.width,p.height);
  g.lineJoin='round';g.strokeStyle='#bbbda6';g.lineWidth=.12;g.stroke(lanes);g.strokeStyle='#65736b';g.lineWidth=.065;g.stroke(lanes);
  groundStrokes.push({path:lanes,color:'#bbbda6',width:.12,dash:[]},{path:lanes,color:'#65736b',width:.065,dash:[]});
  const parkPonds:{left:number;top:number;width:number;height:number}[]=[];
  for(const start of parkStarts){
    polygon(0,start,width,PARK,'#759765');
    const path=new Path2D();path.moveTo(...project(0,start+PARK*.36));path.bezierCurveTo(...project(width*.3,start+PARK*.85),...project(width*.65,start+PARK*.12),...project(width,start+PARK*.65));
    g.strokeStyle='#d5c9a6';g.lineWidth=.13;g.stroke(path);groundStrokes.push({path,color:'#d5c9a6',width:.13,dash:[]});
    const pond=images['pond-a'],factor=1.4,[x,y]=project(width*.61-1.4,start+.6);
    g.drawImage(pond.canvas,x+pond.left*factor,y+pond.top*factor,pond.width*factor,pond.height*factor);
    parkPonds.push({left:x+pond.left*factor,top:y+pond.top*factor,width:pond.width*factor,height:pond.height*factor});
  }
  const detailGround=document.createElement('canvas');let detailKey='';
  const fitScale=(viewport:LandscapeViewport)=>Math.min(Math.max(1,viewport.width-32)/(maxX-minX),Math.max(1,viewport.height-24)/(maxY-minY));
  return {
    canvas,
    maxZoom:viewport=>Math.max(5,192/fitScale(viewport)),
    description:()=> '固定视角 · 标定单元居中留距 · 庭院支路 / 季度交叉路 / 每五年景观带 · 可放大查看建筑细节 · 拖动平移',
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
          for(const shape of groundShapes){if(sx(shape.right)<0||sx(shape.left)>viewport.width||sy(shape.bottom)<0||sy(shape.top)>viewport.height)continue;d.fillStyle=shape.color;d.fill(shape.path)}
          for(const p of placed)if(p.item.flat&&sx(p.left+p.width)>=0&&sx(p.left)<=viewport.width&&sy(p.top+p.height)>=0&&sy(p.top)<=viewport.height)d.drawImage(p.sprite.canvas,p.left,p.top,p.width,p.height);
          d.lineJoin='round';for(const stroke of groundStrokes){d.strokeStyle=stroke.color;d.lineWidth=stroke.width;d.setLineDash(stroke.dash);d.stroke(stroke.path)}
          if(parkPonds.length)for(const p of parkPonds)d.drawImage(images['pond-a'].canvas,p.left,p.top,p.width,p.height);
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
    dispose(){canvas.remove();canvas.width=canvas.height=0;ground.width=ground.height=0;detailGround.width=detailGround.height=0},
  };
}
