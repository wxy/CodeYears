import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

// 与建筑一样：保留源图，按实测牌面控制点离线校准，运行时只解码小尺寸PNG。
const calibration=JSON.parse(await readFile('docs/design/city-wayposts/v1/calibration.json','utf8'));
const sources=await Promise.all(Object.entries(calibration).map(async([style,entry])=>({style,...entry,image:'data:image/png;base64,'+(await readFile(entry.source)).toString('base64')})));
const temporary=await mkdtemp(join(tmpdir(),'codeyears-waypost-bake-'));
try{
  const page=`<!doctype html><meta charset="utf-8"><script>
  (async()=>{
    document.currentScript.remove();
    const records=[];
    for(const entry of ${JSON.stringify(sources)}){
      const image=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=entry.image;});
      const [a,b,c]=entry.face,sx=entry.width*.5/(b[0]-a[0]),sy=entry.height/(c[1]-a[1]),shear=.5*sx-sy*(b[1]-a[1])/(b[0]-a[0]);
      const point=(x,y)=>[(x-entry.anchor[0])*sx,(x-entry.anchor[0])*shear+(y-entry.anchor[1])*sy];
      const corners=[[0,0],[image.width,0],[image.width,image.height],[0,image.height]].map(([x,y])=>point(x,y));
      const left=Math.min(...corners.map(p=>p[0])),top=Math.min(...corners.map(p=>p[1])),right=Math.max(...corners.map(p=>p[0])),bottom=Math.max(...corners.map(p=>p[1]));
      const ratio=512/Math.max(right-left,bottom-top),padding=2;
      const canvas=document.createElement('canvas');canvas.width=Math.ceil((right-left)*ratio)+padding*2;canvas.height=Math.ceil((bottom-top)*ratio)+padding*2;
      const ctx=canvas.getContext('2d');ctx.imageSmoothingQuality='high';ctx.translate(padding-left*ratio,padding-top*ratio);ctx.scale(ratio,ratio);ctx.transform(sx,shear,0,sy,0,0);ctx.translate(-entry.anchor[0],-entry.anchor[1]);ctx.drawImage(image,0,0);ctx.resetTransform();
      const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);let x0=canvas.width,y0=canvas.height,x1=-1,y1=-1;
      for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
        const i=(y*canvas.width+x)*4+3;if(pixels.data[i]<=8)pixels.data[i]=0;
        if(pixels.data[i]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
      }
      ctx.putImageData(pixels,0,0);const trimmed=document.createElement('canvas');trimmed.width=x1-x0+3;trimmed.height=y1-y0+3;trimmed.getContext('2d').drawImage(canvas,x0,y0,x1-x0+1,y1-y0+1,1,1,x1-x0+1,y1-y0+1);
      const centerX=(a[0]+b[0])/2,faceTop=point(centerX,a[1]+(b[1]-a[1])*.5)[1];
      records.push({style:entry.style,png:trimmed.toDataURL('image/png').split(',')[1],layout:{width:entry.width,height:entry.height,top:faceTop},metadata:{left:left+(x0-padding-1)/ratio,top:top+(y0-padding-1)/ratio,width:trimmed.width/ratio,height:trimmed.height/ratio,nativeWidth:entry.width,nativeDepth:.5,baselineHeight:entry.height},proof:{sourceSlope:(b[1]-a[1])/(b[0]-a[0]),mappedSlope:(shear+sy*(b[1]-a[1])/(b[0]-a[0]))/sx}});
    }
    document.body.innerHTML='<pre id="result"></pre>';document.querySelector('#result').textContent=JSON.stringify(records);
  })().catch(error=>{document.body.innerHTML='<pre id="error"></pre>';document.querySelector('#error').textContent=String(error.stack||error)});
  </script>`;
  await writeFile(join(temporary,'index.html'),page);
  const {stdout}=await promisify(execFile)('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-sync','--virtual-time-budget=12000','--user-data-dir='+join(temporary,'profile'),'--dump-dom','file://'+join(temporary,'index.html')],{timeout:90000,maxBuffer:8*1024*1024});
  const result=[...stdout.matchAll(/<pre id="result">([\s\S]*?)<\/pre>/g)].at(-1);
  if(!result)throw new Error('路牌预烘焙失败：'+stdout.slice(-2000));
  const records=JSON.parse(result[1].replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&'));
  for(const record of records){
    const kind=record.style.startsWith('modern')?'city':'town',id='direction-board-'+(record.style.endsWith('-z')?'z':'x'),catalogPath='src/renderers/'+kind+'-baked-catalog.json';
    await writeFile('public/assets/'+kind+'-runtime/'+id+'.png',Buffer.from(record.png,'base64'));
    const catalog=JSON.parse(await readFile(catalogPath,'utf8'));catalog[id]={file:id+'.png',...record.metadata,sampleId:id};await writeFile(catalogPath,JSON.stringify(catalog,null,2)+'\n');
  }
  await writeFile('src/renderers/direction-board-layout.json',JSON.stringify(Object.fromEntries(records.map(record=>[record.style,record.layout])),null,2)+'\n');
  console.log(JSON.stringify(records.map(({style,layout,proof})=>({style,layout,proof})),null,2));
}finally{await rm(temporary,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
