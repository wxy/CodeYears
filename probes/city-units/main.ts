import buildings from '../../docs/design/city-units/v2/calibration/buildings.json';
import ground from '../../docs/design/city-units/v2/calibration/ground.json';
import vegetation from '../../docs/design/city-units/v2/calibration/vegetation.json';
import h2 from '../../docs/design/city-units/v3/calibration/h2.json';
import h3 from '../../docs/design/city-units/v3/calibration/h3.json';
import h4 from '../../docs/design/city-units/v3/calibration/h4.json';
import h3Rect from '../../docs/design/city-units/v3/calibration/h3-rect.json';
import h4Rect from '../../docs/design/city-units/v3/calibration/h4-rect.json';
import {calibrate,drawUnit,loadUnit,project,slope,type Point,type UnitImage,type UnitSample} from './calibration';

const samples=[...buildings.assets,...ground.assets,...vegetation.assets,...h2.assets,...h3.assets,...h4.assets,...h3Rect.assets,...h4Rect.assets] as UnitSample[];
const urls=import.meta.glob<string>('../../docs/design/city-units/v{2,3}/candidates/**/*.png',{eager:true,query:'?url',import:'default'});
const sourceFolder=(s:UnitSample)=>s.id.includes('-h2-')||s.id.includes('-h3-')||s.id.includes('-h4-')?'v3':'v2';
const labels:Record<string,string>={
 'townhouse-a':'砖石住宅 A','mixed-use-b':'石材商住 B','police-a':'警局 A','fire-b':'消防局 B','stadium-a':'体育场 A','terminal-b':'铁路总站 B',
 'apartment-h2-a':'赤陶公寓 A · H2','apartment-h2-b':'浅石住宅 B · H2','office-h3-a':'棕铜退台办公 A · H3','office-h3-b':'蓝灰办公 B · H3','tower-h4-a':'蓝玻璃直塔 A · H4','tower-h4-b':'青绿退台塔 B · H4',
 'office-wide-h3-a':'横向铜色办公 A · H3','office-wide-h3-b':'横向蓝灰办公 B · H3','office-deep-h3-a':'纵深铜色办公 A · H3','office-deep-h3-b':'纵深蓝灰办公 B · H3',
 'tower-wide-h4-a':'横向蓝玻璃塔 A · H4','tower-wide-h4-b':'横向青绿退台 B · H4','tower-deep-h4-a':'纵深蓝玻璃塔 A · H4','tower-deep-h4-b':'纵深青绿退台 B · H4',
 'pond-a':'池塘 A','pond-b':'浅湖 B','plaza-a':'暖石广场 A','plaza-b':'灰石广场 B',
 'grass-1x1-a':'单格草坪 A','grass-1x1-b':'单格野草 B','grass-2x2-a':'四格草坪 A','grass-2x2-b':'四格野草 B',
 'broadleaf-a':'阔叶单树 A','conifer-b':'针叶单树 B','small-grove-2x1-a':'横向树丛 A','small-grove-2x1-b':'横向林带 B',
 'small-grove-1x2-a':'纵向树丛 A','small-grove-1x2-b':'纵向林带 B','forest-2x2-a':'阔叶树林 A','forest-2x2-b':'混合树林 B'
};
const $=<T extends Element>(selector:string)=>document.querySelector<T>(selector)!;
const list=$<HTMLElement>('#asset-list'),detail=$<HTMLElement>('#detail'),summary=$<HTMLElement>('#summary');
const images=new Map<string,UnitImage>(),abort=new AbortController();
const scene=$<HTMLCanvasElement>('#scene'),raw=$<HTMLCanvasElement>('#raw'),corrected=$<HTMLCanvasElement>('#corrected');
const guides=$<HTMLInputElement>('#guides'),edge=$<HTMLInputElement>('#edge-clean'),zoom=$<HTMLSelectElement>('#zoom');
let selected=samples[0],disposed=false,frame=0,draws=0;
for(const sample of samples){
 const button=document.createElement('button');button.textContent=`${labels[sample.id]} · ${sample.footprint.join('×')}`;button.dataset.id=sample.id;
 button.onclick=()=>{selected=sample;updateDetail();schedule()};list.append(button);
}
function canvasContext(canvas:HTMLCanvasElement){
 const dpr=Math.min(devicePixelRatio,1.5),w=canvas.clientWidth,h=canvas.clientHeight;
 canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
 const ctx=canvas.getContext('2d')!;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingQuality='high';return {ctx,w,h};
}
function polygon(ctx:CanvasRenderingContext2D,x:number,z:number,w:number,d:number,fill:string){
 ctx.beginPath();[project(x,z),project(x+w,z),project(x+w,z+d),project(x,z+d)].forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=fill;ctx.fill();
}
function footprint(ctx:CanvasRenderingContext2D,s:UnitSample){
 const [w,d]=s.footprint;
 ctx.save();ctx.strokeStyle='#53a080';ctx.lineWidth=.8;ctx.fillStyle='rgba(98,160,110,.07)';ctx.beginPath();
 [project(0,0),project(w,0),project(w,d),project(0,d)].forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fill();ctx.stroke();
 ctx.globalAlpha=.45;for(let x=1;x<w;x++){ctx.beginPath();ctx.moveTo(...project(x,0));ctx.lineTo(...project(x,d));ctx.stroke()}
 for(let y=1;y<d;y++){ctx.beginPath();ctx.moveTo(...project(0,y));ctx.lineTo(...project(w,y));ctx.stroke()}ctx.restore();
}
function line(ctx:CanvasRenderingContext2D,points:Point[],color:string){ctx.strokeStyle=color;ctx.lineWidth=.9;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke()}
function compare(canvas:HTMLCanvasElement,after:boolean){
 const {ctx,w,h}=canvasContext(canvas),s=selected,image=images.get(s.id);if(!image)return;
 const c=calibrate(s),[x0,y0,x1,y1]=s.crop,sourceCorners:Point[]=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
 const points:Point[]=[project(0,0),project(s.footprint[0],0),project(...s.footprint),project(0,s.footprint[1])];
 if(s.kind==='ground')for(const u of [-.25,1.25])for(const v of [-.25,1.25])points.push(project(u*s.footprint[0],v*s.footprint[1]));
 else points.push(...sourceCorners.map(c.point),...sourceCorners.map(c.rawPoint));
 const minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0])),minY=Math.min(...points.map(p=>p[1])),maxY=Math.max(...points.map(p=>p[1]));
 const fit=Math.min((w-32)/(maxX-minX+24),(h-32)/(maxY-minY+24))*Number(zoom.value);
 ctx.translate(w/2,h/2);ctx.scale(fit,fit);ctx.translate(-(minX+maxX)/2,-(minY+maxY)/2);
 if(guides.checked)footprint(ctx,s);
 drawUnit(ctx,s,image,after,edge.checked);
 if(!guides.checked)return;
 const point=after?c.point:c.rawPoint;
 if(s.kind==='ground'){
  const corners=s.footprintCorners!,targets=[project(0,0),project(s.footprint[0],0),project(...s.footprint),project(0,s.footprint[1])];
  line(ctx,after?[...targets,targets[0]]:[corners.T,corners.R,corners.B,corners.L,corners.T].map(point),'#dc976a');
 }else{
  if(s.axes){line(ctx,s.axes.W.points.map(point),'#d48055');line(ctx,s.axes.D.points.map(point),'#739ed2')}
  if(s.heightReference){line(ctx,[point(s.heightReference.base),point(s.heightReference.top)],'#b082c6')}
  ctx.fillStyle='#dc976a';ctx.beginPath();ctx.arc(...c.target,1.7,0,Math.PI*2);ctx.fill();
 }
}
function montage(){
 const buildingWidth=samples.filter(s=>s.kind==='building').reduce((sum,s)=>sum+s.footprint[0],0);
 const {ctx,w,h}=canvasContext(scene),cols=Math.max(6,Math.ceil((buildingWidth+2)/4)),rows=1+Math.ceil(samples.filter(s=>s.kind!=='building').length/cols),worldW=cols*4,worldD=rows*4;
 const fit=Math.min((w-30)/(48*(worldW+worldD)),(h-80)/(24*(worldW+worldD)+100))*Number(zoom.value);
 ctx.translate(w/2,h*.49);ctx.scale(fit,fit);ctx.translate(-24*(worldW-worldD),-12*(worldW+worldD)+20);
 const dark=document.documentElement.dataset.appearance==='dark';
 polygon(ctx,0,0,worldW,worldD,dark?'#2c3a32':'#e4eadb');
 for(let col=1;col<cols;col++)polygon(ctx,col*4-.65,4,.65,worldD-4,dark?'#4d5559':'#738078');
 for(let row=1;row<rows;row++)polygon(ctx,0,row*4-.65,worldW,.65,dark?'#4d5559':'#738078');
 let buildingX=(worldW-buildingWidth)/2,natural=0;
 const positions=samples.map(s=>{if(s.kind==='building'){const p={s,x:buildingX,z:.15};buildingX+=s.footprint[0];return p}const i=natural++;return {s,x:i%cols*4+.15,z:(1+Math.floor(i/cols))*4+.15}});
 positions.sort((a,b)=>(a.s.kind==='ground'?0:1)-(b.s.kind==='ground'?0:1)||(a.x+a.z)-(b.x+b.z));
 for(const {s,x,z}of positions){
  const image=images.get(s.id);if(!image)continue;
  ctx.save();ctx.translate(...project(x,z));if(guides.checked)footprint(ctx,s);drawUnit(ctx,s,image,true,edge.checked);
  if(s.id===selected.id){ctx.setLineDash([3,2]);footprint(ctx,s)}ctx.restore();
 }
}
function updateDetail(){
 list.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===selected.id)));
 const s=selected,c=calibrate(s);detail.replaceChildren();
 const heading=document.createElement('h3');heading.textContent=labels[s.id];detail.append(heading);
 const metrics=s.kind==='ground'?`四角包络 → ${s.footprint.join('×')} 标准地块；四条目标边斜率 ±0.5。花池等立体附属物可能轻微变形，源角的可见/推断依据仍保留。`
 :s.axes?`主轴：${slope(s.axes.W).toFixed(4)} / ${slope(s.axes.D).toFixed(4)} → ${c.mappedW.toFixed(4)} / ${c.mappedD.toFixed(4)}；竖边保持竖直。楼身基准 ${c.actualHeight.toFixed(3)} H（目标上限 ${s.targetHeight} H）。`
 :`按单株根→顶统一到 ${c.actualHeight.toFixed(3)} 自然高度；未从树冠推断地面双轴。`;
 const p=document.createElement('p');p.textContent=metrics;detail.append(p);
 if(c.clearance){const placement=document.createElement('p');placement.textContent=`地面包络居中；W/D 两向每侧退让 ${c.clearance[0].toFixed(3)} / ${c.clearance[1].toFixed(3)} 格（至少0.100格）。`;detail.append(placement)}
 const state=document.createElement('p');state.textContent=c.heightLimitedByFootprint?'占地限制使参考高度小于目标；保留比例，需美术复核。':'这是渲染时标定，不改原PNG；完整楼顶、冠部和未测边仍需目视检查。';detail.append(state);
 const evidence=document.createElement('details'),label=document.createElement('summary');label.textContent='查看量测依据与未确认项';evidence.append(label);
 const ul=document.createElement('ul');for(const text of s.notes){const li=document.createElement('li');li.textContent=text;ul.append(li)}evidence.append(ul);detail.append(evidence);
 detail.dataset.id=s.id;detail.dataset.kind=s.kind;detail.dataset.height=String(c.actualHeight);detail.dataset.targetHeight=String(s.targetHeight);
 detail.dataset.w=s.kind==='building'?String(c.mappedW):'';detail.dataset.d=s.kind==='building'?String(c.mappedD):'';detail.dataset.scale=String(c.scale);detail.dataset.limited=String(c.heightLimitedByFootprint);
 if(s.supportEnvelope){const l=c.point(s.supportEnvelope.L),r=c.point(s.supportEnvelope.R);detail.dataset.centerError=String(Math.hypot((l[0]+r[0])/2-c.target[0],(l[1]+r[1])/2-c.target[1]))}else detail.dataset.centerError='';detail.dataset.clearanceW=c.clearance?String(c.clearance[0]):'';detail.dataset.clearanceD=c.clearance?String(c.clearance[1]):'';
}
function schedule(){if(disposed||frame)return;frame=requestAnimationFrame(()=>{frame=0;montage();compare(raw,false);compare(corrected,true);draws++;summary.dataset.draws=String(draws)})}
document.documentElement.dataset.appearance=$<HTMLSelectElement>('#appearance').value;
$<HTMLSelectElement>('#appearance').onchange=e=>{document.documentElement.dataset.appearance=(e.target as HTMLSelectElement).value;schedule()};
for(const el of [guides,edge,zoom])el.addEventListener('change',schedule);
const observer=new ResizeObserver(schedule);for(const el of [scene,raw,corrected])observer.observe(el);
window.addEventListener('pagehide',()=>{disposed=true;abort.abort();cancelAnimationFrame(frame);observer.disconnect();for(const image of images.values())image.close();images.clear();for(const canvas of [scene,raw,corrected])canvas.width=canvas.height=0},{once:true});
updateDetail();summary.textContent=`正在读取 ${samples.length} 款本地候选…`;
void(async()=>{
 const results=await Promise.allSettled(samples.map(async s=>[s.id,await loadUnit(urls[`../../docs/design/city-units/${sourceFolder(s)}/${s.file}`],abort.signal)] as const));
 for(const r of results)if(r.status==='fulfilled'){if(disposed)r.value[1].close();else images.set(...r.value)}
 if(disposed)return;
 const failed=results.filter(r=>r.status==='rejected').length;
 if(failed)$<HTMLElement>('#error').textContent=`${failed} 款素材未能读取，当前只显示已成功加载的素材。`;
 summary.textContent=`已加载 ${images.size} / ${samples.length} 款 · 绘制时标定 · 原始 PNG 保留`;
 summary.dataset.loaded=String(images.size);summary.dataset.expected=String(samples.length);summary.dataset.failed=String(failed);
 schedule();
})();
