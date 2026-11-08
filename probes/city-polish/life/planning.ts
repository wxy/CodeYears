import type { OrganicCity } from '../../../src/renderers/city-organic-layout';
import type { CityImages } from '../../../src/renderers/city-assets';
import { planRoadGeometry } from '../../../src/renderers/city-roads';
import { cityRoadLabelLength } from '../../../src/renderers/city-year-markers';
import { CITY_OUTSKIRT_MARGIN } from '../../../src/renderers/city-outskirts';
import type { LandscapeViewport } from '../../../src/renderers/types';

export const project = (x:number,z:number):[number,number] => [(x-z)*.5,(x+z)*.25];
export interface Track { x:number; z:number; dx:number; dz:number; length:number; id:string; road:string }
/** Conservative swept image rectangles: reject overlaps instead of repairing the finished map.
 * Only use ring straights, never bridge approaches, curves, crossings, or unknown roads. */
export function planTracks(plan:OrganicCity, images:CityImages):Track[] {
  const boxes=plan.scene.items.filter(i=>!i.flat).map(i=>{
    const s=images[i.id], [x,y]=project(i.x+(i.w-s.nativeWidth*i.factor)/2,i.z+(i.d-s.nativeDepth*i.factor)/2);
    return {left:x+s.left*i.factor,top:y+s.top*i.factor-(i.elevation??0)*.5,right:x+(s.left+s.width)*i.factor,bottom:y+(s.top+s.height)*i.factor};
  });
  const tracks:Track[]=[];
  for(const road of plan.scene.roadNetwork.roads.filter(r=>r.id.startsWith('organic-ring'))){
    for(const {a,b} of planRoadGeometry(road).straights){
      const length=Math.hypot(b[0]-a[0],b[1]-a[1]), dx=(b[0]-a[0])/length,dz=(b[1]-a[1])/length;
      if(!length || dx!==0 && dz!==0)continue;
      // Same right-hand lane convention as formal static vehicles; outer lane offers better visibility.
      for(const direction of [1,-1])for(let lane=road.lanes/2-1;lane>=0;lane--){
      const offset=(road.laneWidth??.4)*(lane+.5)*direction;
      const vx=dx*direction,vz=dz*direction;
      const id=`transport-sedan-${vx>0?'xp':vx<0?'xm':vz>0?'zp':'zm'}`,s=images[id];
      for(let start=2;start+4<length-2;start+=5){
        const at=direction===1?start:start+4;
        const x=a[0]+dx*at+dz*offset,z=a[1]+dz*at-dx*offset;
        const [px,py]=project(x-s.nativeWidth/2,z-s.nativeDepth/2),[qx,qy]=project(x+vx*4-s.nativeWidth/2,z+vz*4-s.nativeDepth/2);
        const left=Math.min(px,qx)+s.left-.06,right=Math.max(px,qx)+s.left+s.width+.06;
        const top=Math.min(py,qy)+s.top-.06,bottom=Math.max(py,qy)+s.top+s.height+.06;
        if(boxes.some(b=>b.left<right&&b.right>left&&b.top<bottom&&b.bottom>top))continue;
        const distance=(cx:number,cz:number)=>{
          const t=Math.max(0,Math.min(4,(cx-x)*vx+(cz-z)*vz));return Math.hypot(cx-x-vx*t,cz-z-vz*t);
        };
        if(plan.scene.roadNetwork.junctions.some(j=>distance(j.x,j.z)<j.radius+1))continue;
        if(plan.labels.some(l=>distance(l.x,l.z)<cityRoadLabelLength(l.text,l.kind)/2+1))continue;
        // No shared or adjacent track, including a different settlement's ring.
        if(tracks.some(t=>Math.min(distance(t.x,t.z),distance(t.x+t.dx*4,t.z+t.dz*4),distance(t.x+t.dx*2,t.z+t.dz*2))<.85))continue;
        tracks.push({x,z,dx:vx,dz:vz,length:4,id,road:road.id});
      }
    }
    }
  }
  return tracks.slice(0,2);
}
/** Matches createCityView(..., 0, ground): its reserved bounds never depend on sprites. */
export function camera(plan:OrganicCity,v:LandscapeViewport){
  const {width,depth,roadNetwork}=plan.scene,outer=roadNetwork.ringOuter+CITY_OUTSKIRT_MARGIN;
  const minX=-depth/2-outer-.7,maxX=width/2+outer+.7,minY=-outer/2-.9,maxY=(width+depth)/4+outer/2+.5;
  const fit=Math.min(Math.max(1,v.width-32)/(maxX-minX),Math.max(1,v.height-24)/(maxY-minY)),scale=fit*v.zoom;
  return {fit,scale,x:(p:number)=>v.width/2+v.panX+(p-(minX+maxX)/2)*scale,y:(p:number)=>v.height/2+v.panY+(p-(minY+maxY)/2)*scale};
}
