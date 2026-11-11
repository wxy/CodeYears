import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { parseArgs } from 'node:util';

const { values }=parseArgs({options:{outDir:{type:'string'},catalog:{type:'string'},board:{type:'string'}}});
if(!values.outDir)throw new Error('请用 --outDir 指定运行素材目录。');
const root=fileURLToPath(new URL('..',import.meta.url)),out=resolve(values.outDir);
const temporary=await mkdtemp(join(tmpdir(),'codeyears-town-bake-'));
const json=async path=>JSON.parse(await readFile(resolve(root,path),'utf8'));
const prior='docs/design/ancient-town-concepts/2026-11-10/',current='docs/design/ancient-town-concepts/2026-11-11/';
const [cottages,forms,magic,life,correction]=await Promise.all([
  json(prior+'fantasy-sprites-v1.json'),json(prior+'fantasy-building-forms-v1.json'),
  json(current+'magic-town-v2.json'),json(current+'town-life-v1.json'),json(current+'classic-projection-v2.json'),
]);
correction.cottages.forEach((entry,index)=>Object.assign(cottages.frames[index],entry));
correction.forms.forEach((entry,index)=>Object.assign(forms.frames[index],entry));
for(const index of [10,11])Object.assign(cottages.frames[index],{
  anchor:[cottages.frames[index].footx,cottages.frames[index].footy],
  worldHeight:index===10?1.25:.38,footprint:index===10?[.75,.75]:[.55,.5],
});
const sources={cottages,forms,magic,life};
const paths={
  '/cottages.png':prior+'fantasy-sprites-v1.png','/forms.png':prior+'fantasy-building-forms-v1.png',
  '/magic.png':current+'magic-town-v2.png','/magic-compact.png':current+'magic-town-v1.png','/life.png':current+'town-life-v1.png',
  '/projection.js':'probes/fantasy-city/project-sprites.js',
};
const page=`<!doctype html><meta charset="utf-8"><script src="/projection.js"></script><script>
(async()=>{
  const sources=${JSON.stringify(sources)},records=[],proof=[];
  const load=url=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=url;});
  for(const [name,source]of Object.entries(sources)){
    const image=await load('/'+name+'.png'),compact=name==='magic'?await load('/magic-compact.png'):undefined;
    for(let index=0;index<source.frames.length;index++){
      const frame=source.frames[index],cal=prepareFantasyProjection(frame),mirrors=(name==='forms'&&[0,1,3,4,7].includes(index))||(name==='magic'&&index===2)?[false,true]:[false];
      if(frame.ground){
        const [l,f,r]=frame.ground,mw=(f[1]-l[1])/(f[0]-l[0]),md=(r[1]-f[1])/(r[0]-f[0]);
        if(Math.abs(cal.shear+cal.vertical*mw-.5)>1e-9||Math.abs(cal.shear+cal.vertical*md+.5)>1e-9)throw new Error('地面轴校准失败');
        proof.push({id:name+'-'+index,original:[mw,md],mapped:[cal.shear+cal.vertical*mw,cal.shear+cal.vertical*md]});
      }
      if(frame.ellipse){const rx=frame.ellipse[2],ry=frame.ellipse[3];if(Math.abs(rx/(cal.vertical*ry)-2)>1e-9)throw new Error('圆形地面校准失败');}
      for(const mirror of mirrors){
        const id=name+'-'+index+(mirror?'-x':''),nw=frame.footprint[mirror?1:0],nd=frame.footprint[mirror?0:1];
        const center=[(nw-nd)/4,(nw+nd)/8];
        const corners=cal.corners.map(([x,y])=>[center[0]+(mirror?-x:x)/2,center[1]+y/2]);
        const left=Math.min(...corners.map(p=>p[0])),top=Math.min(...corners.map(p=>p[1])),right=Math.max(...corners.map(p=>p[0])),bottom=Math.max(...corners.map(p=>p[1]));
        const ratio=376/Math.max(right-left,bottom-top),padding=4;
        const canvas=document.createElement('canvas');canvas.width=Math.ceil((right-left)*ratio)+padding*2;canvas.height=Math.ceil((bottom-top)*ratio)+padding*2;
        const ctx=canvas.getContext('2d');ctx.imageSmoothingQuality='high';ctx.translate(padding+(center[0]-left)*ratio,padding+(center[1]-top)*ratio);
        if(mirror)ctx.scale(-1,1);ctx.scale(cal.scale*ratio/2,cal.scale*ratio/2);ctx.transform(1,cal.shear,0,cal.vertical,0,0);ctx.translate(-cal.anchor[0],-cal.anchor[1]);
        ctx.drawImage(frame.source?compact:image,frame.sx,frame.sy,frame.sw,frame.sh,0,0,frame.sw,frame.sh);ctx.resetTransform();
        const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);let x0=canvas.width,y0=canvas.height,x1=-1,y1=-1;
        for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
          const i=(y*canvas.width+x)*4+3,a=pixels.data[i];
          if(a<=8)pixels.data[i]=0;else if(a<32)pixels.data[i]=Math.round(a*(a-8)/24);
          if(pixels.data[i]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
        }
        if(x1<0)throw new Error('透明空素材：'+id);ctx.putImageData(pixels,0,0);
        const trimmed=document.createElement('canvas');trimmed.width=x1-x0+3;trimmed.height=y1-y0+3;
        trimmed.getContext('2d').drawImage(canvas,x0,y0,x1-x0+1,y1-y0+1,1,1,x1-x0+1,y1-y0+1);
        const measured=frame.ground||frame.ellipse;
        const metadata={file:id+'.png',left:left+(x0-padding-1)/ratio,top:top+(y0-padding-1)/ratio,width:trimmed.width/ratio,height:trimmed.height/ratio,nativeWidth:nw,nativeDepth:nd,groundWidth:measured?cal.span[mirror?1:0]:nw,groundDepth:measured?cal.span[mirror?0:1]:nd,groundBasis:measured?'manual-source-envelope':'declared-decoration',baselineHeight:frame.worldHeight??1,sampleId:id};
        records.push({id,png:trimmed.toDataURL('image/png').split(',')[1],metadata});
      }
    }
  }
  const board=document.createElement('canvas');board.width=1800;board.height=Math.ceil(records.length/6)*330;const c=board.getContext('2d');c.fillStyle='#e4dfce';c.fillRect(0,0,board.width,board.height);
  for(let i=0;i<records.length;i++){
    const entry=records[i],m=entry.metadata,x=(i%6)*300,y=Math.floor(i/6)*330,im=await load('data:image/png;base64,'+entry.png),scale=Math.min(250/m.width,250/m.height,110);
    const px=x+150-(m.nativeWidth-m.nativeDepth)/4*scale,py=y+270-(m.nativeWidth+m.nativeDepth)/8*scale;
    c.strokeStyle='#82937d';c.lineWidth=1;c.beginPath();[[0,0],[m.nativeWidth,0],[m.nativeWidth,m.nativeDepth],[0,m.nativeDepth]].forEach(([a,b],index)=>{const xx=px+(a-b)*.5*scale,yy=py+(a+b)*.25*scale;if(index)c.lineTo(xx,yy);else c.moveTo(xx,yy);});c.closePath();c.stroke();
    c.drawImage(im,px+m.left*scale,py+m.top*scale,m.width*scale,m.height*scale);c.fillStyle='#26362c';c.font='17px sans-serif';c.fillText(entry.id,x+12,y+312);
  }
  await fetch('/result',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({records,proof,board:board.toDataURL('image/png').split(',')[1]})});document.title='READY';
})().catch(async error=>{await fetch('/error',{method:'POST',body:String(error.stack||error)});document.title='ERROR';});
</script>`;
let result,error;
const server=createServer(async(req,res)=>{
  if(req.url==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(page);return;}
  if(paths[req.url]){res.setHeader('Content-Type',req.url.endsWith('.png')?'image/png':'text/javascript');res.end(await readFile(resolve(root,paths[req.url])));return;}
  if(req.method==='POST'&&(req.url==='/result'||req.url==='/error')){
    const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=Buffer.concat(chunks).toString();
    if(req.url==='/result')result=JSON.parse(body);else error=body;res.end('ok');return;
  }
  res.writeHead(404).end();
});
try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  await promisify(execFile)('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',[
    '--headless=new','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-sync','--hide-scrollbars',
    '--virtual-time-budget=12000','--user-data-dir='+join(temporary,'profile'),'--dump-dom','http://127.0.0.1:'+port,
  ],{timeout:90000,maxBuffer:4*1024*1024});
  if(error)throw new Error(error);if(!result)throw new Error('浏览器没有返回素材。');
  await mkdir(out,{recursive:true});
  for(const entry of result.records)await writeFile(join(out,entry.metadata.file),Buffer.from(entry.png,'base64'));
  const target=values.catalog?resolve(values.catalog):join(out,'catalog.json');await mkdir(resolve(target,'..'),{recursive:true});
  await writeFile(target,JSON.stringify(Object.fromEntries(result.records.map(e=>[e.id,e.metadata])),null,2)+'\n');
  if(values.board){await mkdir(resolve(values.board,'..'),{recursive:true});await writeFile(values.board,Buffer.from(result.board,'base64'));}
  console.log(JSON.stringify({files:result.records.length,catalog:target,proof:result.proof},null,2));
}finally{await new Promise(resolve=>server.close(resolve));await rm(temporary,{recursive:true,force:true});}
