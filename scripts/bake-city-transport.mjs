import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL,fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

// 仅用于素材制作。显式传入已有Canvas模块，不增加运行依赖，不改写精绘源图。
const {values}=parseArgs({options:{outDir:{type:'string'},canvasModule:{type:'string'}}});
if(!values.outDir||!values.canvasModule)throw new Error('请指定 --outDir 和 --canvasModule。');
const {createCanvas,loadImage}=await import(pathToFileURL(resolve(values.canvasModule)).href);
const root=fileURLToPath(new URL('..',import.meta.url)),source=resolve(root,'docs/design/city-transport/v1');
const config=JSON.parse(await readFile(resolve(source,'calibration.json'),'utf8'));
const catalog=JSON.parse(await readFile(resolve(root,'src/renderers/city-baked-catalog.json'),'utf8'));
await mkdir(values.outDir,{recursive:true});const report=[];
async function load(name){
  const image=await loadImage(resolve(source,name)),canvas=createCanvas(image.width,image.height),c=canvas.getContext('2d');
  c.drawImage(image,0,0);const pixels=c.getImageData(0,0,canvas.width,canvas.height);
  for(let i=0;i<pixels.data.length;i+=4)if(pixels.data[i+3]<config.alphaCutoff)pixels.data.fill(0,i,i+4);
  c.putImageData(pixels,0,0);return canvas;
}
async function save(id,canvas,metadata){
  const png=await canvas.encode('png'),decoded=await loadImage(png),copy=createCanvas(canvas.width,canvas.height);
  copy.getContext('2d').drawImage(decoded,0,0);
  const a=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data,b=copy.getContext('2d').getImageData(0,0,copy.width,copy.height).data;
  let differences=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i])differences++;
  if(differences)throw new Error(`${id} PNG重载RGBA差异：${differences}`);
  await writeFile(resolve(values.outDir,`${id}.png`),png);
  catalog[id]={file:`${id}.png`,...metadata,sampleId:id};report.push({id,pixels:[canvas.width,canvas.height],bytes:png.length,rgbaDifference:0});
}
async function cell(atlas,columns,rows,column,row,id,w,d,maxPixels,fixedHeight){
  const x0=Math.round(atlas.width*column/columns),x1=Math.round(atlas.width*(column+1)/columns),y0=Math.round(atlas.height*row/rows),y1=Math.round(atlas.height*(row+1)/rows);
  const data=atlas.getContext('2d').getImageData(x0,y0,x1-x0,y1-y0).data;
  let left=x1-x0,top=y1-y0,right=0,bottom=0;
  for(let y=0;y<y1-y0;y++)for(let x=0;x<x1-x0;x++)if(data[(y*(x1-x0)+x)*4+3]>=config.alphaCutoff){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1)}
  if(right<=left||bottom<=top)throw new Error(`素材单元为空：${id}`);
  const sw=right-left,sh=bottom-top,ratio=Math.min(1,maxPixels/Math.max(sw,sh)),canvas=createCanvas(Math.ceil(sw*ratio)+4,Math.ceil(sh*ratio)+4),c=canvas.getContext('2d');
  c.imageSmoothingQuality='high';c.drawImage(atlas,x0+left,y0+top,sw,sh,2,2,sw*ratio,sh*ratio);
  const unit=fixedHeight?sh*ratio/fixedHeight:sw*ratio/((w+d)/2),width=canvas.width/unit,height=canvas.height/unit;
  await save(id,canvas,{left:(w-d)/4-width/2,top:(w+d)/4-height,width,height,nativeWidth:w,nativeDepth:d,baselineHeight:fixedHeight??.2});
}
const cars=await load('vehicles.png');
for(const [row,direction]of config.vehicles.rows.entries())for(const [column,vehicle]of config.vehicles.columns.entries()){
  const alongX=direction.startsWith('x'),w=alongX?vehicle.length:vehicle.width,d=alongX?vehicle.width:vehicle.length;
  await cell(cars,4,4,column,row,`transport-${vehicle.kind}-${direction}`,w,d,config.vehicles.maxPixels);
}
const signals=await load('signals.png');
for(const [index,id]of config.signals.ids.entries())await cell(signals,2,2,index%2,Math.floor(index/2),`transport-signal-${id}`,...config.signals.footprint,config.signals.maxPixels,config.signals.height);
// 两款桥共享同一套道路端点/竖向标定，原始源图保持不变。
const bridgeRoot=resolve(root,'docs/design/city-transport/v2');
const bridgeConfig=JSON.parse(await readFile(resolve(bridgeRoot,'calibration.json'),'utf8'));
const levels=JSON.parse(await readFile(resolve(root,'src/renderers/city-bridge-levels.json'),'utf8'));
delete catalog['transport-bridge-arch'];
for(const [style,spec]of Object.entries(bridgeConfig.bridges)){
  const raw=await loadImage(resolve(bridgeRoot,spec.file)),bridge=createCanvas(raw.width,raw.height),bridgeContext=bridge.getContext('2d');
  bridgeContext.drawImage(raw,0,0);const pixels=bridgeContext.getImageData(0,0,bridge.width,bridge.height);
  for(let i=0;i<pixels.data.length;i+=4)if(pixels.data[i+3]<bridgeConfig.alphaCutoff)pixels.data.fill(0,i,i+4);
  bridgeContext.putImageData(pixels,0,0);
  const [w,d]=spec.footprint,[ax,ay]=spec.farRoadCenter,[bx,by]=spec.nearRoadCenter;
  bridgeContext.save();bridgeContext.globalCompositeOperation='destination-out';bridgeContext.beginPath();
  spec.nearEndFace.forEach(([x,y],index)=>index?bridgeContext.lineTo(x,y):bridgeContext.moveTo(x,y));bridgeContext.closePath();bridgeContext.fill();bridgeContext.restore();
  const a=(-d/2)/(bx-ax),slope=(by-ay)/(bx-ax),vertical=a/(spec.crossRoadSlope-slope),shear=-(spec.crossRoadSlope+slope)*vertical/2;
  const tx=w/4-a*ax,ty=w/8-shear*ax-vertical*ay;
  const point=([x,y])=>[a*x+tx,shear*x+vertical*y+ty];
  const points=[[0,0],[bridge.width,0],[bridge.width,bridge.height],[0,bridge.height]].map(([x,y])=>[a*x+tx,shear*x+vertical*y+ty]);
  const left=Math.min(...points.map(p=>p[0])),top=Math.min(...points.map(p=>p[1])),right=Math.max(...points.map(p=>p[0])),bottom=Math.max(...points.map(p=>p[1]));
  const unit=spec.maxPixels/(right-left),canvas=createCanvas(Math.ceil((right-left)*unit)+4,Math.ceil((bottom-top)*unit)+4),c=canvas.getContext('2d');
  c.setTransform(a*unit,shear*unit,0,vertical*unit,(tx-left)*unit+2,(ty-top)*unit+2);c.imageSmoothingQuality='high';c.drawImage(bridge,0,0);
  // 原画下部结构的高度/透视未随桥面标定；按真实水位校准桥墩落点。
  // 在本轮桥跨的标定坐标内，仅修正前侧桥面以下的竖直投影；实际桥位由规划器按基础落岸。
  const feet=spec.supportFeet.map(point).sort((p,q)=>p[0]-q[0]);
  const supportW=d/2+2*feet.reduce((sum,p)=>sum+p[0],0)/feet.length;
  const underDeck=x=>(w+spec.deckWidth)/4-x/2;
  const waterDrop=(levels.deckElevation+levels.riverDepth)/2;
  const anchors=feet.map(([x,y])=>{
    const z=supportW-2*x,target=(supportW+z)/4+waterDrop,edge=underDeck(x);
    return {x,y,z,target,scale:(target-edge)/(y-edge)};
  });
  const originalPixels=c.getImageData(0,0,canvas.width,canvas.height),rgba=originalPixels.data,columns=[];
  let correctedHeight=canvas.height;
  for(let column=0;column<canvas.width;column++){
    const x=left+(column-2)/unit,first=anchors[0],last=anchors.at(-1);
    const scale=anchors.length===1?first.scale:first.scale+(last.scale-first.scale)*(x-first.x)/(last.x-first.x);
    const cut=Math.max(0,Math.min(canvas.height,(underDeck(x)-top)*unit+2));
    columns.push({column,cut,scale});
    // 延长的桥脚也必须完整留在输出图内，保留透明边。
    for(let row=canvas.height-1;row>=cut;row--)if(rgba[(row*canvas.width+column)*4+3]){
      correctedHeight=Math.max(correctedHeight,Math.ceil(cut+(row+1-cut)*scale)+4);break;
    }
  }
  const corrected=createCanvas(canvas.width,correctedHeight),target=corrected.getContext('2d');
  target.imageSmoothingQuality='high';target.putImageData(originalPixels,0,0);
  for(const {column,cut,scale}of columns)if(cut<canvas.height){
    target.clearRect(column,Math.floor(cut),1,canvas.height-Math.floor(cut));
    target.drawImage(canvas,column,cut,1,canvas.height-cut,column,cut,1,(canvas.height-cut)*scale);
  }
  await save(`transport-bridge-${style}`,corrected,{left:left-2/unit,top:top-2/unit,width:corrected.width/unit,height:corrected.height/unit,nativeWidth:w,nativeDepth:d,baselineHeight:spec.height,carriageway:spec.carriageway,deckWidth:spec.deckWidth,curb:spec.curb,supportAnchors:anchors.map(({z})=>({w:supportW,z}))});
  report.at(-1).supports=anchors.map(({x,y,z,target,scale})=>({reference:[x,y],scale,
    before:{w:x+2*y-waterDrop*2,z:-x+2*y-waterDrop*2},
    after:{w:x+2*target-waterDrop*2,z:-x+2*target-waterDrop*2},targetZ:z}));
}
await writeFile(resolve(values.outDir,'catalog.json'),JSON.stringify(catalog,null,2)+'\n');
await writeFile(resolve(values.outDir,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({sprites:report.length,bytes:report.reduce((n,r)=>n+r.bytes,0),rgbaDifference:0}));
