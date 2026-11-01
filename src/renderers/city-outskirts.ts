import type { CityRoadRoute } from './city-roads';

export const CITY_OUTSKIRT_MARGIN=12;

/** 装饰只由城市外包络决定，世界几何一次预编译，paint使用现有地面上下文。 */
export function createCityOutskirtsPainter(width:number,depth:number,ringOuter:number,exits:readonly CityRoadRoute[]):(context:CanvasRenderingContext2D)=>void {
  const margin=CITY_OUTSKIRT_MARGIN,min=-ringOuter-margin,maxX=width+ringOuter+margin,maxZ=depth+ringOuter+margin;
  const project=(x:number,z:number,h=0):[number,number]=>[(x-z)*.5,(x+z)*.25-h];
  const commands:{path:Path2D;color:string;alpha:number;order:number}[]=[];
  const path=(points:readonly [number,number,number?][])=>{
    const result=new Path2D();points.forEach(([x,z,h],i)=>{const p=project(x,z,h);if(i)result.lineTo(...p);else result.moveTo(...p)});result.closePath();return result;
  };
  const outer=path([[min,min],[maxX,min],[maxX,maxZ],[min,maxZ]]);
  const exclusion=(hole:Path2D)=>{const p=new Path2D(outer);p.addPath(hole);return p};
  // 每个排除区独立clip，交叠道路廊道不会因even-odd抵消而重新长出树。
  const clips=[exclusion(path([[-ringOuter,-ringOuter],[width+ringOuter,-ringOuter],[width+ringOuter,depth+ringOuter],[-ringOuter,depth+ringOuter]]))];
  for(const route of exits){
    const count=route.closed?route.points.length:route.points.length-1;
    for(let i=0;i<count;i++){
      const a=route.points[i],b=route.points[(i+1)%route.points.length],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);if(!length)continue;
      const ux=dx/length,uz=dz/length,clearance=route.lanes*.4/2+.55;
      clips.push(exclusion(path([[a[0]-ux*clearance-uz*clearance,a[1]-uz*clearance+ux*clearance],[b[0]+ux*clearance-uz*clearance,b[1]+uz*clearance+ux*clearance],[b[0]+ux*clearance+uz*clearance,b[1]+uz*clearance-ux*clearance],[a[0]-ux*clearance+uz*clearance,a[1]-uz*clearance-ux*clearance]])));
    }
  }
  const add=(points:readonly [number,number,number?][],color:string,alpha=1,order=-Infinity)=>commands.push({path:path(points),color,alpha,order});
  const noise=(i:number)=>{const n=Math.sin(i*127.1+31.7)*43758.5453;return n-Math.floor(n)};
  const fade=(x:number,z:number)=>Math.max(0,Math.min(1,(Math.min(x-min,maxX-x,z-min,maxZ-z)-.6)/3));
  const blob=(x:number,z:number,rx:number,rz:number,seed:number,color:string,alpha:number)=>{
    const points:[number,number][]=[];for(let i=0;i<12;i++){const angle=i*Math.PI/6,r=.82+noise(seed+i)*.18;points.push([x+Math.cos(angle)*rx*r,z+Math.sin(angle)*rz*r])}add(points,color,alpha);
  };
  // 固定每边十个地景组，不随长历史逐格铺树；外侧稀疏、边缘低透明度碎化。
  for(let side=0;side<4;side++)for(let group=0;group<10;group++){
    const seed=side*101+group*13,t=(group+.5+(noise(seed+6)-.5)*.4)/10;
    const along=(side%2?depth:width)+ringOuter*2;
    const center=-ringOuter+t*along,offset=ringOuter+3.5+noise(seed)*3;
    const x=side===0?center:side===1?width+offset:side===2?center:-offset;
    const z=side===0?-offset:side===1?center:side===2?depth+offset:center;
    const rx=side%2?4.8:along/13,rz=side%2?along/13:4.8;
    blob(x,z,rx*1.3,rz*1.3,seed,'#a3ad8c',.06);
    blob(x,z,rx*1.12,rz*1.12,seed+2,'#9caa88',.12);
    blob(x,z,rx,rz,seed+4,group%3?'#91a180':'#c0b899',.28);
    if(group%3===0){
      const hx=x+(noise(seed+2)-.5)*2,hz=z+(noise(seed+3)-.5)*2,r=1.5+noise(seed+8),h=.5+noise(seed+9)*.65;
      // 所有高度也被外包络投影clip约束，不向包络外抬升山尖。
      const peak:[number,number,number]=[hx-.25,hz-.2,h];
      add([[hx-r,hz,0],peak,[hx,hz+r,0]],'#829583',.85, hx+hz);
      add([peak,[hx+r,hz,0],[hx,hz+r,0]],'#687f75',.85,hx+hz);
      add([[hx-r,hz,0],[hx,hz-r,0],peak],'#a5b09a',.85,hx+hz);
    }
    // 留出整组沙地和无树间隔，混交林以小簇而非均匀点阵出现。
    if(group%3===0)continue;
    for(let tree=0;tree<4;tree++){
      const tx=x+(noise(seed+tree*7+10)-.5)*Math.min(rx*1.5,5),tz=z+(noise(seed+tree*7+11)-.5)*Math.min(rz*1.5,5);
      const alpha=fade(tx,tz),r=.28+noise(seed+tree+17)*.22,h=.65+noise(seed+tree+19)*.6;
      if(alpha<=0)continue;
      add([[tx-.045,tz,.0],[tx+.045,tz,0],[tx+.045,tz,h*.5],[tx-.045,tz,h*.5]],'#7e8166',alpha,tx+tz);
      if(tree%2){
        add([[tx-r,tz,h*.28],[tx,tz,h],[tx+r,tz,h*.28]],'#567c68',alpha,tx+tz);
        add([[tx,tz,h],[tx+r,tz,h*.28],[tx+.03,tz,h*.23]],'#456b5c',alpha,tx+tz);
      }else{
        add([[tx-r,tz,h*.45],[tx-r*.8,tz,h*.85],[tx,tz,h],[tx+r*.8,tz,h*.8],[tx+r,tz,h*.4],[tx,tz,h*.3]],'#759374',alpha,tx+tz);
        add([[tx,tz,h],[tx+r*.8,tz,h*.8],[tx+r,tz,h*.4],[tx,tz,h*.3]],'#567b62',alpha,tx+tz);
      }
    }
  }
  commands.sort((a,b)=>a.order-b.order);
  return context=>{
    context.save();context.clip(outer);for(const clip of clips)context.clip(clip,'evenodd');
    for(const command of commands){context.fillStyle=command.color;context.globalAlpha=command.alpha;context.fill(command.path)}
    context.restore();
  };
}
