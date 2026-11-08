import type { OrganicCity } from '../../../src/renderers/city-organic-layout';

/** 小样板：只使用已存在的建筑地块边界，不规划新车行道路。 */
export function planStreetGround(plan: OrganicCity) {
  const source = plan.regions.find(r => !r.milestone && r.right-r.left>=4 && r.bottom-r.top>=3);
  const region=source?{...source,right:Math.min(source.right,source.left+12)}:undefined;
  const buildings=plan.scene.items.filter(i=>i.parcel?.kind==='building');
  const selected=region?buildings.filter(i=>i.x>=region.left&&i.x+i.w<=region.right&&i.z>=region.top&&i.z+i.d<=region.bottom):[];
  // 采用 CITY_UNIT_SPEC 的每边至少 0.1 格标定退让；nativeWidth 是素材单元，不能当成实际楼脚包络。
  const footprints=buildings.map(i=>({x:i.x+.1,z:i.z+.1,w:i.w-.2,d:i.d-.2}));
  const segments=new Map<string,[number,number,number,number]>();
  for(const i of selected){
    for(let x=i.x;x<i.x+i.w;x++)for(const z of [i.z,i.z+i.d])segments.set(`${x},${z},x`,[x,z,x+1,z]);
    for(let z=i.z;z<i.z+i.d;z++)for(const x of [i.x,i.x+i.w])segments.set(`${x},${z},z`,[x,z,x,z+1]);
  }
  // 缓冲包络检验在规划时执行；不在画完以后挪楼、擦路或补布局。
  const safe=[...segments.values()].filter(([x,z,xx,zz])=>!footprints.some(f=>Math.max(x,xx)+.08>f.x-.01&&Math.min(x,xx)-.08<f.x+f.w+.01&&Math.max(z,zz)+.08>f.z-.01&&Math.min(z,zz)-.08<f.z+f.d+.01));
  const project=(x:number,z:number):[number,number]=>[(x-z)*.5,(x+z)*.25];
  const paving=new Path2D(),joints=new Path2D();
  for(const [x,z,xx,zz] of safe){
    const horizontal=z===zz;
    const corners=horizontal?[[x,z-.08],[xx,z-.08],[xx,z+.08],[x,z+.08]]:[[x-.08,z],[x+.08,z],[x+.08,zz],[x-.08,zz]];
    corners.forEach(([a,b],i)=>i?paving.lineTo(...project(a,b)):paving.moveTo(...project(a,b)));paving.closePath();
    // 中心仍由正式窄步道覆盖，两侧只留下克制的暖石边与半格接缝。
    for(const t of [.25,.75]){const a=x+(xx-x)*t,b=z+(zz-z)*t;joints.moveTo(...project(a-(horizontal?0:.08),b-(horizontal?.08:0)));joints.lineTo(...project(a+(horizontal?0:.08),b+(horizontal?.08:0)))}
  }
  const clip=new Path2D();
  if(region){[[region.left+.01,region.top+.01],[region.right-.01,region.top+.01],[region.right-.01,region.bottom-.01],[region.left+.01,region.bottom-.01]].forEach(([x,z],i)=>i?clip.lineTo(...project(x,z)):clip.moveTo(...project(x,z)));clip.closePath()}
  let paints=0;
  return {region,segments:safe,selected:selected.length,rejected:segments.size-safe.length,get paints(){return paints},paint(context:CanvasRenderingContext2D){
    paints++;if(!region)return;context.save();context.clip(clip);context.fillStyle='#cec8b6';context.fill(paving);context.strokeStyle='#9f9f8e';context.lineWidth=.008;context.stroke(joints);context.restore();
  }};
}
