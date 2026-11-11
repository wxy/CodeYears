import type { CityImages } from './city-assets';
import { createCityOutskirtsPainter } from './city-outskirts';
import type { TownPlan } from './town-layout';

type Point=[number,number];

/** 纹理与路径在创建时准备；远近缓存共用世界坐标，观看不重新规划道路。 */
export function createTownGround(plan:TownPlan,images:CityImages):(context:CanvasRenderingContext2D)=>void {
  const source=images['natural-ground'].canvas.getContext('2d')!;
  const material=(id:string)=>{
    const sprite=images[id],pattern=source.createPattern(sprite.canvas,'repeat')!;
    pattern.setTransform(new DOMMatrix([sprite.width/sprite.canvas.width,0,0,sprite.height/sprite.canvas.height,0,0]));
    return pattern;
  };
  const grass=material('natural-ground'),stone=material('town-stone'),earth=material('town-earth'),paving=material('town-paving');
  const outside=createCityOutskirtsPainter(plan.scene.width,plan.scene.depth,.7,[],images);
  const line=(points:Point[])=>{
    const path=new Path2D();points.forEach(([x,z],i)=>i?path.lineTo(x,z):path.moveTo(x,z));return path;
  };
  const streets=new Path2D(),avenues=new Path2D();
  for(const edge of plan.roads)streets.addPath(line(edge));
  plan.yearZ.forEach((z,i)=>avenues.addPath(line([[-.7,z-.55],[plan.yearWidth[i]+.7,z-.55]])));
  if(plan.yearZ.length>1)avenues.addPath(line([[-.7,plan.yearZ[0]-.55],[-.7,plan.yearZ.at(-1)!-.55]]));
  const plots=plan.plots.map(plot=>({...plot,access:plot.paths.map(line),doors:plot.courts.map(court=>line([court.door,[court.gate[0],Math.max(court.door[1],court.z+court.d-.3)],court.gate]))}));
  const squares=plan.squares.map(square=>({...square,path:line([[square.x,square.z],square.road])}));
  return ctx=>{
    ctx.save();ctx.transform(.5,.25,-.5,.25,0,0);
    ctx.fillStyle=grass;ctx.fillRect(-13,-13,plan.scene.width+26,plan.scene.depth+26);ctx.restore();
    outside(ctx);
    ctx.save();ctx.transform(.5,.25,-.5,.25,0,0);ctx.lineJoin='round';ctx.lineCap='round';
    const road=(path:Path2D,width:number,kind:CanvasPattern=stone)=>{
      // 石面、磨损泥土路肩都使用生成的实景材料；交叉处共享纹理相位。
      ctx.globalAlpha=.72;ctx.strokeStyle=earth;ctx.lineWidth=width+.16;ctx.stroke(path);
      ctx.globalAlpha=1;ctx.strokeStyle=kind;ctx.lineWidth=width;ctx.stroke(path);
    };
    for(const plot of plots){
      for(const bed of plot.beds){
        ctx.fillStyle=earth;ctx.fillRect(bed.x,bed.z,bed.w,bed.d);
        ctx.strokeStyle=plot.parcel.band<=1?'#79964d':'#6d8c56';ctx.lineWidth=.045;
        for(let row=0;row<4;row++){ctx.beginPath();ctx.moveTo(bed.x+.04,bed.z+.055+row*.1);ctx.lineTo(bed.x+bed.w-.04,bed.z+.055+row*.1);ctx.stroke()}
      }
      plot.courts.forEach((court,i)=>{
        ctx.fillStyle=plot.parcel.band<=1?earth:paving;
        ctx.fillRect(court.x+.04,court.z+.04,court.w-.08,court.d-.08);
        road(plot.doors[i],.18,plot.parcel.band<=1?earth:stone);
      });
      for(const path of plot.access)road(path,.18,earth);
    }
    road(streets,.42);road(avenues,.70);
    for(const square of squares){ctx.fillStyle=paving;ctx.fillRect(square.x-.65,square.z-.65,1.3,1.3);road(square.path,.24)}
    ctx.restore();
    plan.yearZ.forEach((z,i)=>{
      const x=plan.yearWidth[i]+1.2;
      ctx.font='600 .55px system-ui';ctx.textAlign='left';ctx.fillStyle='#ecf0d9';
      ctx.fillText(String(plan.scene.weekly.districts[i].year),(x-z)*.5,(x+z)*.25);
    });
  };
}
