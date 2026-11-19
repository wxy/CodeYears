import type { ProjectedBounds } from './city-mountain-roads';

export const CITY_GROUND_ATLAS='outskirts-ground-tiles';

const tileSize=18;
const overlap=9;
const drawSize=tileSize+overlap;

function atlasCells(atlas:HTMLCanvasElement) {
  const width=Math.floor(atlas.width/2),height=Math.floor(atlas.height/2);
  // 四格原画按各自的内部取样，留出中线与外缘的安全区。
  const insetX=Math.round(width*.04),insetY=Math.round(height*.04);
  return Array.from({length:4},(_,index)=>({
    x:(index%2)*width+insetX,y:Math.floor(index/2)*height+insetY,
    width:width-2*insetX,height:height-2*insetY,
  }));
}

function feather(t:number,side:number,phase:number) {
  const blend=Math.max(0,(t*drawSize-tileSize)/overlap);
  const irregularity=.78*Math.sin(side*10.2+phase)+.16*Math.sin(side*23.1-phase);
  const u=blend+irregularity*blend*(1-blend);
  return 1-u*u*(3-2*u);
}

/** 图集解码后，四格只制作一次不规则的透明边。图集由城市素材生命周期释放。 */
export function prepareCityGroundAtlas(context:CanvasRenderingContext2D) {
  const mask=document.createElement('canvas'),size=96;
  mask.width=mask.height=size;
  const target=mask.getContext('2d')!;
  const pixels=target.createImageData(size,size);
  for(const [index,{x,y,width,height}] of atlasCells(context.canvas).entries()){
    const basis=index*2.3;
    for(let row=0;row<size;row++)for(let column=0;column<size;column++){
      const u=column/(size-1),v=row/(size-1);
      pixels.data[(row*size+column)*4+3]=Math.round(255*feather(u,v,basis)*feather(v,u,basis+1.9));
    }
    target.putImageData(pixels,0,0);
    context.save();
    context.beginPath();context.rect(x,y,width,height);context.clip();
    context.globalCompositeOperation='destination-in';
    context.drawImage(mask,x,y,width,height);
    context.restore();
  }
  mask.width=mask.height=0;
}

function tileVariant(x:number,z:number) {
  let hash=Math.imul(x,0x85ebca6b)^Math.imul(z,0xc2b2ae35)^0x27d4eb2d;
  hash=Math.imul(hash^(hash>>>16),0x45d9f3b);
  return (hash^(hash>>>16))&3;
}

export function createCityGroundPainter(atlas:HTMLCanvasElement) {
  const cells=atlasCells(atlas);
  return (context:CanvasRenderingContext2D,{left,top,right,bottom}:ProjectedBounds)=>{
    // 反解投影边角，连同与视口相交的重叠边一起绘制。
    const x0=Math.floor((left+2*top-overlap)/tileSize),x1=Math.floor((right+2*bottom)/tileSize);
    const z0=Math.floor((2*top-right-overlap)/tileSize),z1=Math.floor((2*bottom-left)/tileSize);
    context.save();
    context.transform(.5,.25,-.5,.25,0,0);
    // 东、南的整块先铺底，西、北的透明边相叠。角落也始终有实体纹理覆盖。
    for(let row=z1;row>=z0;row--)for(let column=x1;column>=x0;column--){
      const x=column*tileSize,z=row*tileSize;
      if((x-z-drawSize)*.5>=right||(x-z+drawSize)*.5<=left||
        (x+z)*.25>=bottom||(x+z+drawSize*2)*.25<=top)continue;
      const image=cells[tileVariant(column,row)];
      context.drawImage(atlas,image.x,image.y,image.width,image.height,x,z,drawSize,drawSize);
    }
    context.restore();
  };
}
