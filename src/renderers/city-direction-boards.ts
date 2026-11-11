import { cityRoadWidth, type CityRoadRoute, type RoadPoint } from './city-roads';

const project=(x:number,z:number):RoadPoint=>[(x-z)*.5,(x+z)*.25];
export interface DirectionBoard {
  polygon:RoadPoint[];
  groundY:number;
  paint(context:CanvasRenderingContext2D):void;
}

/** 立面横轴沿道路切向，竖轴沿真实高度；绘制和点击共用同一块世界牌面。 */
export function planDirectionBoard(route:CityRoadRoute,label:string,town:boolean,returning:boolean,measure:CanvasRenderingContext2D):DirectionBoard {
  const a=route.points[0],b=route.points.at(-1)!,dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),ux=dx/length,uz=dz/length;
  let [vx,vy]=project(ux,uz),arrow=1;
  // 斜向分岔可能与视线平行；实测有牌面宽度为零，向邻近道路轴轻转30°露出正面。
  if(Math.abs(vx)<.3){
    const angle=Math.atan2(uz,ux),turn=(Math.abs(ux)>=Math.abs(uz)?-1:1)*Math.PI/6;
    [vx,vy]=project(Math.cos(angle+turn),Math.sin(angle+turn));
  }
  // 两面牌都保持文字正向；箭头仍指向出城，返程牌反向。
  if(vx<0){vx=-vx;vy=-vy;arrow=-1}
  if(returning)arrow=-arrow;
  measure.save();measure.font='700 100px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
  const textWidth=(text:string)=>measure.measureText(text).width/100;
  const width=Math.min(12,Math.max(8,textWidth(label)+2.6));
  let lines=[label];
  if(textWidth(label)>width-2.6){
    const middle=Math.ceil(label.length/2),space=label.lastIndexOf(' ',middle),cut=space>=label.length/3?space:middle;
    lines=[label.slice(0,cut).trim(),label.slice(cut).trim()];
  }
  const font=label==='?'?1.9:Math.min(1.05,(width-2.6)/Math.max(...lines.map(textWidth)));
  measure.restore();
  const height=lines.length>1?3.2:2.4,lift=3.2;
  const extra=route.id.startsWith('extra-exit-');
  const half=town?.12:cityRoadWidth(route)/2,side=returning||extra?-1:1;
  // 大牌在小镇窄路两侧曾互相遮挡；返程牌退到对侧草地，留足两行牌面的间距。
  const shoulder=half+(returning?5.5:1.05);
  const along=returning?Math.min(length*.22,2):extra?length:length-width*.4;
  const [px,py]=project(a[0]+ux*along-uz*shoulder*side,a[1]+uz*along+ux*shoulder*side);
  const point=(s:number,h:number):RoadPoint=>[px+vx*s,py+vy*s-h];
  const polygon=[point(-width/2,lift+height),point(width/2,lift+height),point(width/2,lift),point(-width/2,lift)];
  const panel=town?'#94683f':returning?'#3d667c':'#306956',edge=town?'#583d29':'#233f39';
  return {
    polygon,groundY:py,
    paint(context){
      context.save();
      context.fillStyle='#23302525';context.beginPath();context.ellipse(px+.25,py+.12,.85,.38,0,0,Math.PI*2);context.fill();
      context.fillStyle=town?'#9f967c':'#8b9590';context.beginPath();context.moveTo(px-.45,py);context.lineTo(px,py-.23);context.lineTo(px+.45,py);context.lineTo(px,py+.23);context.closePath();context.fill();
      context.fillStyle=town?'#65492f':'#7f8d8b';context.fillRect(px-.16,py-lift-.2,.32,lift+.2);
      context.fillStyle=town?'#b08c59':'#cad3cd';context.fillRect(px+.03,py-lift,.07,lift);
      const shape=(offset:number)=>{context.beginPath();polygon.forEach(([x,y],i)=>i?context.lineTo(x+.12*offset,y+.12*offset):context.moveTo(x+.12*offset,y+.12*offset));context.closePath()};
      shape(1);context.fillStyle=edge;context.fill();shape(0);context.fillStyle=panel;context.fill();context.strokeStyle=edge;context.lineWidth=.1;context.stroke();
      // 牌内坐标同样在世界空间中，字体不设置屏幕像素下限。
      context.transform(vx,vy,0,1,px,py-lift-height);
      context.strokeStyle=town?'#cfad70':'#c2d8cc';context.lineWidth=.06;context.strokeRect(-width/2+.18,.18,width-.36,height-.36);
      const ax=arrow*(width/2-.8),ay=height/2;
      context.strokeStyle='#f5eed3';context.lineWidth=.15;context.lineCap='round';context.lineJoin='round';context.beginPath();context.moveTo(ax-arrow*.45,ay);context.lineTo(ax+arrow*.4,ay);context.moveTo(ax,ay-.35);context.lineTo(ax+arrow*.4,ay);context.lineTo(ax,ay+.35);context.stroke();
      context.scale(.01,.01);context.font=`700 ${font*100}px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif`;context.textAlign='center';context.textBaseline='middle';context.fillStyle='#fff3d4';
      lines.forEach((line,i)=>context.fillText(line,-arrow*55,(height/2+(i-(lines.length-1)/2)*font*1.15)*100));
      context.restore();
    },
  };
}
