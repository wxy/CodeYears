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

/** 提取浅草中的细纹。中性灰让叠层沿用下面四种地块的颜色。 */
function createGroundDetail(context:CanvasRenderingContext2D,cell:ReturnType<typeof atlasCells>[number]) {
  const size=Math.floor(Math.min(cell.width,cell.height)*tileSize/drawSize)-8,radius=3;
  const image=context.getImageData(cell.x+4,cell.y+4,size,size),data=image.data;
  const light=new Uint8Array(size*size);
  for(let i=0;i<light.length;i++){
    const byte=i*4;
    light[i]=(54*data[byte]+183*data[byte+1]+19*data[byte+2])>>8;
  }
  for(let y=0;y<size;y++){
    const row=y*size,above=Math.max(0,y-radius)*size,below=Math.min(size-1,y+radius)*size;
    for(let x=0;x<size;x++){
      const left=Math.max(0,x-radius),right=Math.min(size-1,x+radius);
      const average=(light[row+left]+light[row+right]+light[above+x]+light[below+x]+
        (light[above+left]+light[above+right]+light[below+left]+light[below+right])*.5)/6;
      const detail=128+(light[row+x]-average)*2.2,byte=(row+x)*4;
      data[byte]=data[byte+1]=data[byte+2]=detail;
      data[byte+3]=255;
    }
  }
  const sample=document.createElement('canvas'),texture=document.createElement('canvas');
  sample.width=sample.height=size;
  sample.getContext('2d')!.putImageData(image,0,0);
  texture.width=texture.height=size*2;
  const paint=texture.getContext('2d')!;
  // 镜像边缘在重复时连续。细纹和大地块分别使用固定的地图尺度。
  for(let y=0;y<2;y++)for(let x=0;x<2;x++){
    paint.setTransform(x?-1:1,0,0,y?-1:1,x*texture.width,y*texture.height);
    paint.drawImage(sample,0,0);
  }
  sample.width=sample.height=0;
  return texture;
}

/** 解码时制作地块的透明边与共享细纹，由城市素材生命周期释放。 */
export function prepareCityGroundAtlas(context:CanvasRenderingContext2D) {
  const mask=document.createElement('canvas'),size=96;
  mask.width=mask.height=size;
  const target=mask.getContext('2d')!;
  const pixels=target.createImageData(size,size);
  const cells=atlasCells(context.canvas);
  for(const [index,{x,y,width,height}] of cells.entries()){
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
  return createGroundDetail(context,cells[0]);
}

function tileVariant(x:number,z:number) {
  let hash=Math.imul(x,0x85ebca6b)^Math.imul(z,0xc2b2ae35)^0x27d4eb2d;
  hash=Math.imul(hash^(hash>>>16),0x45d9f3b);
  return (hash^(hash>>>16))&3;
}

export function createCityGroundPainter(atlas:HTMLCanvasElement,detail?:HTMLCanvasElement) {
  const cells=atlasCells(atlas);
  let detailPattern:CanvasPattern;
  return (context:CanvasRenderingContext2D,{left,top,right,bottom}:ProjectedBounds,scale:number)=>{
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
    if(!detail||scale<=36)return;
    if(!detailPattern){
      detailPattern=context.createPattern(detail,'repeat')!;
      const ratio=6.75/detail.width;
      detailPattern.setTransform(new DOMMatrix([ratio*.5,ratio*.25,-ratio*.5,ratio*.25,0,0]));
    }
    context.save();
    context.globalAlpha=.94*Math.min(1,(scale-36)/78);
    context.globalCompositeOperation='soft-light';
    context.fillStyle=detailPattern;
    context.fillRect(left,top,right-left,bottom-top);
    context.restore();
  };
}
