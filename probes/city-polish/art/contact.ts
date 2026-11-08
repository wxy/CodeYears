import type { CityScene } from '../../../src/renderers/city-view';
import type { CityImages } from '../../../src/renderers/city-assets';
export const samples=['cottage-gable','tower-h4-a','police-a'];
const project=(x:number,z:number)=>[(x-z)*.5,(x+z)*.25];
/** 在地面缓存构建阶段绘制，限定地块内部；不移动楼体或修改素材。 */
export function contactGround(scene:CityScene,images:CityImages,base:(ctx:CanvasRenderingContext2D)=>void){
 const footprints=scene.items.filter(i=>samples.includes(i.id)).map(i=>{
  const s=images[i.id],w=s.nativeWidth*i.factor,d=s.nativeDepth*i.factor;
  const x=i.x+(i.w-w)/2,z=i.z+(i.d-d)/2;
  const fraction=i.id==='cottage-gable'?.60:i.id==='tower-h4-a'?.40:.84;
  const offset=i.id==='tower-h4-a'?.06:0;
  return {x:x+w*(1-fraction)/2+offset,z:z+d*(1-fraction)/2+offset,w:w*fraction,d:d*fraction};
 });
 return (ctx:CanvasRenderingContext2D)=>{base(ctx);ctx.save();
  // 三层收缩半透明菱形，无模糊滤镜；统一中性环境遮蔽，不伪造方向性长投影。
  for(const {x,z,w,d} of footprints)for(const [inset,alpha] of [[0,.025],[.025,.035],[.05,.045]]){
   if(w<=inset*2||d<=inset*2)continue;
   ctx.beginPath();[[x+inset,z+inset],[x+w-inset,z+inset],[x+w-inset,z+d-inset],[x+inset,z+d-inset]].forEach(([a,b],n)=>{const [px,py]=project(a,b);if(n)ctx.lineTo(px,py);else ctx.moveTo(px,py)});ctx.closePath();ctx.fillStyle=`rgba(38,43,39,${alpha})`;ctx.fill();
  }ctx.restore();
 };
}

/** 平地贴图阶段在铺装之后、楼体之前；直接复用正式地面缓存与排序。 */
export function contactScene(scene:CityScene,images:CityImages):CityScene{
 for(const id of samples){
  const s=images[id],canvas=document.createElement('canvas');
  const width=(s.nativeWidth+s.nativeDepth)*.5,height=width*.5;
  canvas.width=384;canvas.height=Math.round(384*height/width);
  const ctx=canvas.getContext('2d')!,scale=384/width,left=-s.nativeDepth*.5;
  ctx.setTransform(scale,0,0,scale,-left*scale,0);
  contactGround({...scene,items:[{id,x:0,z:0,w:s.nativeWidth,d:s.nativeDepth,factor:1,flat:false}]},images,()=>{})(ctx);
  images['art-contact-'+id]={canvas,left,top:0,width,height,nativeWidth:s.nativeWidth,nativeDepth:s.nativeDepth,baselineHeight:0,sampleId:'art-contact-'+id};
 }
 return {...scene,items:[...scene.items,...scene.items.filter(i=>samples.includes(i.id)).map(i=>({...i,id:'art-contact-'+i.id,flat:true,parcel:undefined}))]};
}
