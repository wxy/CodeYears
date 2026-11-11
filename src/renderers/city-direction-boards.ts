import { cityRoadWidth, type CityRoadRoute, type RoadPoint } from './city-roads';
import type { CitySprite } from './city-assets';
import layouts from './direction-board-layout.json';

const project=(x:number,z:number):RoadPoint=>[(x-z)*.5,(x+z)*.25];
export interface DirectionBoard {
  polygon:RoadPoint[];
  groundY:number;
  paintRoad(context:CanvasRenderingContext2D):void;
  paint(context:CanvasRenderingContext2D):void;
}

/** 精绘牌面、道路名称和命中区域共用世界坐标；两种朝向保持文字正向。 */
export function planDirectionBoard(route:CityRoadRoute,label:string,town:boolean,kind:'outbound'|'return'|'temporary-return',measure:CanvasRenderingContext2D,sprite:CitySprite):DirectionBoard {
  const a=route.points[0],b=route.points.at(-1)!,dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),ux=dx/length,uz=dz/length;
  const returning=kind!=='outbound',temporary=kind==='temporary-return';
  // 牌面横轴沿道路法线，立杆保持竖直；不再沿路纵向或人为旋转斜路。
  let [vx,vy]=project(-uz,ux);
  if(vx<0){vx=-vx;vy=-vy}
  const arrow=(ux-uz)>=0?1:-1;
  // x/z 是原素材键；现在蓝色款用于出城，绿色款用于返程，与道路朝向无关。
  const layout=layouts[`${town?'town':'modern'}-${returning?'x':'z'}`];
  const unit=.8,postScale=town?.65:.35,split=layout.top+layout.height+.3,lift=split*(postScale-1);
  const width=layout.width*unit,height=layout.height*unit,top=(layout.top+lift)*unit;
  measure.save();measure.font='700 100px ui-monospace,monospace';
  const textWidth=(text:string)=>measure.measureText(text).width/100;
  const lines=textWidth(label)>width-2.6?[label.slice(0,Math.ceil(label.length/2)),label.slice(Math.ceil(label.length/2))]:[label];
  const font=label?Math.min(1.35,(width-2.6)/Math.max(...lines.map(textWidth)),(height-.4)/(lines.length*1.1)):1.35;
  const roadDirection=(ux-uz)>=0?1:-1,roadText=roadDirection>0?`${label} →`:`← ${label}`;
  const roadFont=Math.min(1.05,(length-6)/textWidth(roadText));measure.restore();
  const half=cityRoadWidth(route)/2,side=temporary||route.id.startsWith('extra-exit-')?-1:1;
  const shoulder=half+2,along=length-(temporary?4:1);
  const [px,py]=project(a[0]+ux*along-uz*shoulder*side,a[1]+uz*along+ux*shoulder*side);
  const point=(s:number,y:number):RoadPoint=>[px+vx*s,py+vy*s+y];
  const polygon=[point(-width/2-.55,top-.5),point(width/2+.55,top-.5),point(width/2+.55,top+height+.45),point(-width/2-.55,top+height+.45)];
  return {
    polygon,groundY:py,
    paintRoad(context){
      if(!label)return;
      // 临时返程使用原来留白的半幅；复用已有出口的返程仍使用该出口半幅。
      const offset=cityRoadWidth(route)/4*(temporary?-1:1);
      const [x,y]=project(a[0]+dx*.52-uz*offset,a[1]+dz*.52+ux*offset),d=roadDirection;
      context.save();context.transform(d*(ux-uz)*.5,d*(ux+uz)*.25,d*(-uz-ux)*.5,d*(-uz+ux)*.25,x,y);context.scale(.01,.01);
      context.font=`700 ${roadFont*100}px ui-monospace,monospace`;context.textAlign='center';context.textBaseline='middle';
      const span=context.measureText(roadText).width;
      context.fillStyle=town?'#ad9c79':'#626d68';context.fillRect(-span/2-16,-roadFont*65,span+32,roadFont*130);
      context.fillStyle=town?'#f6edce':'#eff2df';context.fillText(roadText,0,0);context.restore();
    },
    paint(context){
      // 在竖直牌面坐标中保留原图牌面比例，只缩短牌面以下的支架。
      const facing=vy>=0?1:-1;
      context.save();context.transform(vx*unit,vy*unit,0,unit,px,py);
      const draw=()=>{context.save();context.transform(facing*2,-.5,0,1,0,0);context.drawImage(sprite.canvas,sprite.left,sprite.top,sprite.width,sprite.height);context.restore()};
      const extent=sprite.height+sprite.width*2;
      context.save();context.beginPath();context.rect(-extent,-extent,extent*2,extent+split*postScale);context.clip();context.translate(0,lift);draw();context.restore();
      context.save();context.beginPath();context.rect(-extent,split*postScale,extent*2,extent-split*postScale);context.clip();context.scale(1,postScale);draw();context.restore();
      context.restore();
      if(town&&returning){
        // 木框/石基保留，空木牌面呈现绿色漆面，颜色只编码返程。
        context.save();context.transform(vx,vy,0,1,px,py+top);context.fillStyle='#106344cc';context.fillRect(-width/2+.22,.16,width-.44,height-.32);context.restore();
      }
      if(!label)return;
      context.save();context.transform(vx,vy,0,1,px,py+top);
      const ax=arrow*(width/2-.8),ay=height/2;
      context.strokeStyle='#fff8df';context.lineWidth=.16;context.lineCap='round';context.lineJoin='round';context.beginPath();
      context.moveTo(ax-.55,ay);context.lineTo(ax+.55,ay);
      const tip=(direction:number)=>{context.moveTo(ax+direction*.2,ay-.3);context.lineTo(ax+direction*.55,ay);context.lineTo(ax+direction*.2,ay+.3)};
      tip(arrow);context.stroke();
      context.scale(.01,.01);context.font=`700 ${font*100}px ui-monospace,monospace`;context.textAlign='center';context.textBaseline='middle';context.fillStyle='#fff8df';
      lines.forEach((line,i)=>context.fillText(line,-arrow*48,(height/2+(i-(lines.length-1)/2)*font*1.1)*100));context.restore();
    },
  };
}
