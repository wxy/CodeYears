import { cityRoadWidth, type CityRoadRoute, type RoadPoint } from './city-roads';
import type { CitySprite } from './city-assets';
import face from './direction-board-layout.json';

const project=(x:number,z:number):RoadPoint=>[(x-z)*.5,(x+z)*.25];
export interface DirectionBoard {
  polygon:RoadPoint[];
  groundY:number;
  paintRoad(context:CanvasRenderingContext2D):void;
  paint(context:CanvasRenderingContext2D):void;
}

/** 精绘牌面、道路名称和命中区域共用世界坐标；两种朝向保持文字正向。 */
export function planDirectionBoard(route:CityRoadRoute,label:string,kind:'outbound'|'return'|'temporary-return',measure:CanvasRenderingContext2D,sprite:CitySprite,roads:readonly CityRoadRoute[],range:readonly [number,number]):DirectionBoard {
  const a=route.points[0],b=route.points.at(-1)!,dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),ux=dx/length,uz=dz/length;
  const temporary=kind==='temporary-return';
  // 牌面横轴沿道路法线，立杆保持竖直；不再沿路纵向或人为旋转斜路。
  let [vx,vy]=project(-uz,ux);
  if(vx<0){vx=-vx;vy=-vy}
  const arrow=(ux-uz)>=0?1:-1;
  const {width,height,top}=face;
  measure.save();
  measure.font='700 100px ui-monospace,monospace';
  const textWidth=(text:string)=>measure.measureText(text).width/100;
  const roadDirection=(ux-uz)>=0?1:-1,roadText=roadDirection>0?`${label} →`:`← ${label}`;
  const roadFont=Math.min(1.05,(length*(range[1]-range[0])-6)/textWidth(roadText));
  // 字号在牌面标定空间中计算，箭头单独占位。短名保留整行，长名最多两行。
  const signTypeface='system-ui, sans-serif';
  measure.font=`650 100px ${signTypeface}`;
  const targetFont=height*.57, labelWidth=width-1.75;
  const split=Math.ceil(label.length/2);
  const lines=textWidth(label)*targetFont>labelWidth?[label.slice(0,split),label.slice(split)]:[label];
  const font=label?Math.min(targetFont,labelWidth/Math.max(...lines.map(textWidth)),(height-.38)/(lines.length*1.08)):targetFont;
  measure.restore();
  // 所有目的地都位于离城右侧，返程沿路错开普通牌。
  const half=cityRoadWidth(route)/2;
  // 双柱及脚座的完整包络都要落在道路右侧。
  const reach=Math.max(Math.abs(sprite.left),Math.abs(sprite.left+sprite.width));
  const along=length-(temporary?8:1);
  let shoulder=half+reach+.8;
  // 出口均为直段；在安装位置横切可见路面，站到最右边缘之外，避免压到分岔。
  for(const road of roads){
    const p=road.points[0],q=road.points.at(-1)!,ex=q[0]-p[0],ez=q[1]-p[1],size=Math.hypot(ex,ez),edge=cityRoadWidth(road)/2+.1;
    const nx=-ez/size*edge,nz=ex/size*edge;
    const corners=[[p[0]+nx,p[1]+nz],[q[0]+nx,q[1]+nz],[q[0]-nx,q[1]-nz],[p[0]-nx,p[1]-nz]]
      .map(([x,z])=>[(x-a[0])*ux+(z-a[1])*uz,-(x-a[0])*uz+(z-a[1])*ux]);
    const cuts:number[]=[];
    corners.forEach((p,i)=>{
      const q=corners[(i+1)%4];
      if((p[0]<=along&&along<q[0])||(q[0]<=along&&along<p[0]))cuts.push(p[1]+(q[1]-p[1])*(along-p[0])/(q[0]-p[0]));
      else if(p[0]===along&&q[0]===along)cuts.push(p[1],q[1]);
    });
    if(cuts.length)shoulder=Math.max(shoulder,Math.max(...cuts)+reach+.8);
  }
  const [px,py]=project(a[0]+ux*along-uz*shoulder,a[1]+uz*along+ux*shoulder);
  const point=(s:number,y:number):RoadPoint=>[px+vx*s,py+vy*s+y];
  const polygon=[point(-width/2-.55,top-.5),point(width/2+.55,top-.5),point(width/2+.55,top+height+.45),point(-width/2-.55,top+height+.45)];
  return {
    polygon,groundY:py,
    paintRoad(context){
      if(!label)return;
      // 临时返程也是离城目的地，标字始终位于右半幅；共路时沿路分段。
      const offset=cityRoadWidth(route)/4,at=range[0]+(range[1]-range[0])*.52;
      const [x,y]=project(a[0]+dx*at-uz*offset,a[1]+dz*at+ux*offset),d=roadDirection;
      context.save();context.transform(d*(ux-uz)*.5,d*(ux+uz)*.25,d*(-uz-ux)*.5,d*(-uz+ux)*.25,x,y);context.scale(.01,.01);
      context.font=`700 ${roadFont*100}px ui-monospace,monospace`;context.textAlign='center';context.textBaseline='middle';
      const span=context.measureText(roadText).width;
      context.fillStyle='#626d68';context.fillRect(-span/2-16,-roadFont*65,span+32,roadFont*130);
      context.fillStyle='#eff2df';context.fillText(roadText,0,0);context.restore();
    },
    paint(context){
      // 正视母版与文字接受同一个竖直平面投影；支架和法兰一并落在安装点。
      context.save();
      context.transform(vx,vy,0,1,px,py);
      context.drawImage(sprite.canvas,sprite.left,sprite.top,sprite.width,sprite.height);
      if(label){
        context.translate(0,top+height/2);
        context.fillStyle='#fff9e8';
        // 实心方向箭头在总览缩小时仍能和字形分开。
        context.save();context.translate(arrow*(width/2-.88),0);context.scale(arrow,1);
        context.beginPath();context.moveTo(-.39,-.095);context.lineTo(.04,-.095);
        context.lineTo(.04,-.31);context.lineTo(.43,0);context.lineTo(.04,.31);
        context.lineTo(.04,.095);context.lineTo(-.39,.095);context.closePath();context.fill();context.restore();
        context.scale(.01,.01);context.font=`650 ${font*100}px ${signTypeface}`;
        context.textAlign='center';context.textBaseline='middle';
        lines.forEach((line,i)=>context.fillText(line,-arrow*48,(i-(lines.length-1)/2)*font*108));
      }
      context.restore();
    },
  };
}
