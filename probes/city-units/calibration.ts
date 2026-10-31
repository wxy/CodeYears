export type Point = [number, number];
export type Axis = { points: [Point, Point]; basis: string };
export interface UnitSample {
  id: string; file: string; kind: 'building' | 'ground' | 'vegetation';
  footprint: Point; targetHeight: number; crop: [number, number, number, number]; anchor: Point;
  axes: { W: Axis; D: Axis } | null;
  heightReference: { base: Point; top: Point; basis: string } | null;
  supportEnvelope?: { L: Point; F: Point; R: Point; basis: string };
  footprintCorners?: { T: Point; R: Point; B: Point; L: Point };
  notes: string[];
}
export interface UnitImage { raw: ImageBitmap; clean: HTMLCanvasElement; sourceWidth: number; sourceHeight: number; close(): void }
export const project = (w: number, d: number, h = 0): Point => [48 * (w - d), 24 * (w + d) - 48 * h];
export const slope = (axis: Axis) => (axis.points[1][1] - axis.points[0][1]) / (axis.points[1][0] - axis.points[0][0]);

/** 已量测主边的方向校正；不旋转竖边，不改原始PNG。 */
export function calibrate(sample: UnitSample) {
  const mw = sample.axes ? slope(sample.axes.W) : .5, md = sample.axes ? slope(sample.axes.D) : -.5;
  const vertical = 1 / (mw - md), shear = -(mw + md) / (2 * (mw - md));
  const map = ([x,y]: Point): Point => [x, shear * x + vertical * y];
  const envelope=sample.supportEnvelope;
  // 建筑以地面包络中心定位；四周退让，不能用冠部或整张透明图的中心。
  const anchor:Point=envelope?[(envelope.L[0]+envelope.R[0])/2,(envelope.L[1]+envelope.R[1])/2]:sample.anchor;
  let fitScale = Infinity,wSpan=0,dSpan=0;
  if (envelope) {
    const back:Point=[envelope.L[0]+envelope.R[0]-envelope.F[0],envelope.L[1]+envelope.R[1]-envelope.F[1]];
    const plane=[envelope.L,envelope.F,envelope.R,back].map(map);
    const ws=plane.map(([x,y])=>x/2+y),ds=plane.map(([x,y])=>-x/2+y);
    wSpan=Math.max(...ws)-Math.min(...ws);dSpan=Math.max(...ds)-Math.min(...ds);
    fitScale=Math.min((sample.footprint[0]-.2)*48/wSpan,(sample.footprint[1]-.2)*48/dSpan);
  }
  const ref = sample.heightReference;
  const sourceHeight = ref ? map(ref.base)[1]-map(ref.top)[1] : 0;
  const heightScale = ref ? sample.targetHeight*48/sourceHeight : 1;
  // 在逻辑占地和高度上限内等比放置，不通过拉高楼身改变地面轴。
  const scale = Math.min(fitScale, heightScale);
  const target=project(sample.footprint[0]/2,sample.footprint[1]/2);
  const point = (p: Point): Point => {
    const q=map([p[0]-anchor[0],p[1]-anchor[1]]);
    return [target[0]+q[0]*scale,target[1]+q[1]*scale];
  };
  const rawScale=sample.kind==='ground'?48*(sample.footprint[0]+sample.footprint[1])/(sample.footprintCorners!.R[0]-sample.footprintCorners!.L[0]):scale;
  const rawPoint=([x,y]:Point):Point=>[target[0]+(x-anchor[0])*rawScale,target[1]+(y-anchor[1])*rawScale];
  return { shear, vertical, scale, rawScale, rawPoint, anchor, target, point, actualHeight: sourceHeight*scale/48,
    mappedW: shear+vertical*mw, mappedD: shear+vertical*md,
    clearance:envelope?[(sample.footprint[0]-wSpan*scale/48)/2,(sample.footprint[1]-dSpan*scale/48)/2] as Point:null,
    heightLimitedByFootprint: !!ref && fitScale < heightScale };
}

function cropImage(ctx: CanvasRenderingContext2D, sample: UnitSample, image: UnitImage, clean: boolean) {
  const source=clean?image.clean:image.raw, fx=source.width/image.sourceWidth,fy=source.height/image.sourceHeight;
  const [x0,y0,x1,y1]=sample.crop;
  ctx.drawImage(source,x0*fx,y0*fy,(x1-x0)*fx,(y1-y0)*fy,x0,y0,x1-x0,y1-y0);
}

/** 四点地表映射。四角是记录的逻辑包络，不声称恢复了隐藏的物理地面。 */
function groundSurface(ctx: CanvasRenderingContext2D, sample: UnitSample, image: UnitImage, clean: boolean) {
  const {T:p0,R:p1,B:p2,L:p3}=sample.footprintCorners!;
  const dx1=p1[0]-p2[0],dx2=p3[0]-p2[0],dx3=p0[0]-p1[0]+p2[0]-p3[0];
  const dy1=p1[1]-p2[1],dy2=p3[1]-p2[1],dy3=p0[1]-p1[1]+p2[1]-p3[1],den=dx1*dy2-dx2*dy1;
  const g=(dx3*dy2-dx2*dy3)/den,h=(dx1*dy3-dx3*dy1)/den;
  const a=p1[0]-p0[0]+g*p1[0],b=p3[0]-p0[0]+h*p3[0],d=p1[1]-p0[1]+g*p1[1],e=p3[1]-p0[1]+h*p3[1];
  const source=(u:number,v:number):Point=>[(a*u+b*v+p0[0])/(g*u+h*v+1),(d*u+e*v+p0[1])/(g*u+h*v+1)];
  const dest=(u:number,v:number)=>project(u*sample.footprint[0],v*sample.footprint[1]);
  const triangle=(s:Point[],t:Point[])=>{
    const [p,q,r]=s,[x,y,z]=t,det=p[0]*(q[1]-r[1])+q[0]*(r[1]-p[1])+r[0]*(p[1]-q[1]);
    const coefficients=(k:number)=>[
      (x[k]*(q[1]-r[1])+y[k]*(r[1]-p[1])+z[k]*(p[1]-q[1]))/det,
      (x[k]*(r[0]-q[0])+y[k]*(p[0]-r[0])+z[k]*(q[0]-p[0]))/det,
      (x[k]*(q[0]*r[1]-r[0]*q[1])+y[k]*(r[0]*p[1]-p[0]*r[1])+z[k]*(p[0]*q[1]-q[0]*p[1]))/det
    ];
    const [aa,cc,ee]=coefficients(0),[bb,dd,ff]=coefficients(1);
    ctx.save();ctx.beginPath();ctx.moveTo(...x);ctx.lineTo(...y);ctx.lineTo(...z);ctx.closePath();ctx.clip();
    ctx.transform(aa,bb,cc,dd,ee,ff);cropImage(ctx,sample,image,clean);ctx.restore();
  };
  // 包络外留出草岸、花池的显示余量；源图 crop 仍限制读取范围。
  const stops=[-.25,0,.25,.5,.75,1,1.25];
  for(let i=0;i<stops.length-1;i++)for(let j=0;j<stops.length-1;j++){
    const uv:Point[]=[[stops[i],stops[j]],[stops[i+1],stops[j]],[stops[i+1],stops[j+1]],[stops[i],stops[j+1]]];
    const s=uv.map(p=>source(...p)),t=uv.map(p=>dest(...p));
    triangle([s[0],s[1],s[2]],[t[0],t[1],t[2]]);triangle([s[0],s[2],s[3]],[t[0],t[2],t[3]]);
  }
}

export function drawUnit(ctx: CanvasRenderingContext2D, sample: UnitSample, image: UnitImage, corrected: boolean, clean: boolean) {
  if(corrected&&sample.kind==='ground'){groundSurface(ctx,sample,image,clean);return}
  const c=calibrate(sample);
  const scale=corrected?c.scale:c.rawScale;
  ctx.save();ctx.translate(...c.target);ctx.scale(scale,scale);
  if(corrected)ctx.transform(1,c.shear,0,c.vertical,0,0);
  ctx.translate(-c.anchor[0],-c.anchor[1]);cropImage(ctx,sample,image,clean);ctx.restore();
}

export async function loadUnit(url:string,signal:AbortSignal):Promise<UnitImage> {
  const response=await fetch(url,{signal});if(!response.ok)throw new Error(`素材读取失败：${response.status}`);
  const decoded=await createImageBitmap(await response.blob()),sourceWidth=decoded.width,sourceHeight=decoded.height;
  const ratio=Math.min(1,768/Math.max(sourceWidth,sourceHeight));
  const raw=await createImageBitmap(decoded,{resizeWidth:Math.round(sourceWidth*ratio),resizeHeight:Math.round(sourceHeight*ratio),resizeQuality:'high'});decoded.close();
  const clean=document.createElement('canvas');clean.width=raw.width;clean.height=raw.height;
  const ctx=clean.getContext('2d')!;ctx.drawImage(raw,0,0);
  const pixels=ctx.getImageData(0,0,clean.width,clean.height);
  for(let i=3;i<pixels.data.length;i+=4){const alpha=pixels.data[i];if(alpha<=8)pixels.data[i]=0;else if(alpha<32)pixels.data[i]=Math.round(alpha*(alpha-8)/24)}
  ctx.putImageData(pixels,0,0);
  return {raw,clean,sourceWidth,sourceHeight,close(){raw.close();clean.width=clean.height=0}};
}
