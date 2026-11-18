import type { ProfileOrganization } from '../data/profile-places';
import type { CityRoadNetwork } from './city-road-network';
import { cityRoadWidth, planRoadGeometry, type CityRoadRoute, type RoadPoint } from './city-roads';

type Bounds = { left:number; right:number; top:number; bottom:number };
export type OrganizationPoster = { login:string; artwork:HTMLCanvasElement; displayOnly:boolean };
export interface OrganizationBoard {
  left:number; top:number; slope:number; bounds:Bounds; groundY:number;
  paint(context:CanvasRenderingContext2D):void;
}

const faceSize=2.3;
const logoInset=.18;
export const organizationFace = { size:faceSize, inset:logoInset };

/** 只采样主页已经解码的图片。跨域图片只出现在自己的显示层，主画布始终可导出。 */
export function prepareOrganizationPoster({login,avatar}:ProfileOrganization):OrganizationPoster {
  const artwork=document.createElement('canvas');
  artwork.width=artwork.height=112;
  const pen=artwork.getContext('2d')!;
  pen.fillStyle='#fff';pen.fillRect(0,0,112,112);
  let displayOnly=false;
  if(avatar){
    const scale=Math.min(104/avatar.naturalWidth,104/avatar.naturalHeight);
    const w=avatar.naturalWidth*scale,h=avatar.naturalHeight*scale;
    pen.drawImage(avatar,(112-w)/2,(112-h)/2,w,h);
    try { pen.getImageData(0,0,1,1) }
    catch(error){if(!(error instanceof DOMException&&error.name==='SecurityError'))throw error;displayOnly=true}
  }else{
    pen.font='bold 62px system-ui,sans-serif';pen.fillStyle='#275655';
    pen.textAlign='center';pen.textBaseline='middle';pen.fillText(login.slice(0,2).toUpperCase(),56,56,106);
  }
  return {login,artwork,displayOnly};
}

function distanceToSegment(x:number,z:number,a:RoadPoint,b:RoadPoint):number {
  const dx=b[0]-a[0],dz=b[1]-a[1],length=dx*dx+dz*dz;
  const t=length?Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/length)):0;
  return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);
}

export function planOrganizationBoards(network:CityRoadNetwork,exits:readonly CityRoadRoute[],posters:readonly OrganizationPoster[],
  signs:readonly Bounds[],objects:readonly {left:number;top:number;width:number;height:number;groundY:number;item:{flat:boolean}}[]):OrganizationBoard[] {
  if(!posters.length)return [];
  const strips=[...network.roads,...exits].flatMap(road=>planRoadGeometry(road).straights
    .map(({a,b})=>({road,a,b,half:cityRoadWidth(road)/2})));
  const sides:{x:number;z:number;slope:number;offset:number;length:number}[][]=[[],[],[],[]];
  for(const {road,a,b,half} of strips){
    if(road.id!=='ring'&&!road.id.startsWith('organic-ring-'))continue;
    const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
    if(length<faceSize*2+.4)continue;
    const ux=dx/length,uz=dz/length;
    // 外边界按顺时针排列，向外移到路肩。短切线保留两端圆角和灯箱脚座。
    const steps=Math.floor((length-faceSize*2-.4)/3);
    for(let i=0;i<=steps;i++){
      const offset=(i-steps/2)*3,x=(a[0]+b[0])/2+ux*offset+uz*(half+.95),
        z=(a[1]+b[1])/2+uz*offset-ux*(half+.95);
      if(network.junctions.some(j=>Math.hypot(x-j.x,z-j.z)<j.radius+2.8))continue;
      if(network.bridges.some(bridge=>distanceToSegment(x,z,bridge.landings.from,bridge.landings.to)<4))continue;
      if(strips.some(s=>s.road!==road&&distanceToSegment(x,z,s.a,s.b)<s.half+2.55))continue;
      sides[ux<0?0:uz>0?1:ux>0?2:3].push({x,z,slope:ux===0?-.5:.5,offset:Math.abs(offset),length});
    }
  }
  // 多个组织先分布到不同方位，再沿同侧延伸；有前景建筑遮挡的候选不占名额。
  for(const side of sides)side.sort((a,b)=>a.offset-b.offset||b.length-a.length);
  const boards:OrganizationBoard[]=[],indices=[0,0,0,0];
  const overlaps=(a:Bounds,b:Bounds,margin:number)=>a.left<b.right+margin&&a.right>b.left-margin&&a.top<b.bottom+margin&&a.bottom>b.top-margin;
  while(boards.length<posters.length){
    let added=false;
    for(const [i,side] of sides.entries()){
      while(indices[i]<side.length){
        const {x,z,slope}=side[indices[i]++],px=(x-z)/2,groundY=(x+z)/4;
        const left=px-faceSize/2,top=groundY-.7-faceSize-slope*faceSize/2;
        const bounds={left:left-.14,right:left+faceSize+.18,top:Math.min(top,top+slope*faceSize)-.15,bottom:groundY+.32};
        if(signs.some(s=>overlaps(s,bounds,.45))||boards.some(s=>overlaps(s.bounds,bounds,1.3)))continue;
        if(objects.some(o=>!o.item.flat&&o.groundY>groundY&&o.left<bounds.right&&o.left+o.width>bounds.left&&o.top<bounds.bottom&&o.top+o.height>bounds.top))continue;
        const poster=posters[boards.length];
        boards.push({left,top,slope,bounds,groundY,paint(context){
          context.save();context.translate(px,groundY);
          context.fillStyle='#31473c45';context.beginPath();context.ellipse(.32,.1,1.12,.22,-.12,0,Math.PI*2);context.fill();
          context.transform(1,slope,0,1,-faceSize/2,-slope*faceSize/2);
          for(const toe of [.42,faceSize-.52]){
            context.fillStyle='#68706c';context.fillRect(toe-.13,-.1,.37,.16);
            context.fillStyle='#334849';context.fillRect(toe,-.94,.14,.92);
            context.fillStyle='#97a59b';context.fillRect(toe,-.94,.045,.92);
          }
          context.translate(0,-.7-faceSize);
          context.fillStyle='#566b63';context.fillRect(.09,-.1,faceSize+.06,faceSize+.11);
          context.fillStyle='#263c3a';context.fillRect(0,0,faceSize,faceSize);
          context.fillStyle='#d4d9ca';context.fillRect(.07,.07,faceSize-.14,faceSize-.14);
          context.fillStyle='#fff';context.fillRect(logoInset,logoInset,faceSize-2*logoInset,faceSize-2*logoInset);
          if(!poster.displayOnly)context.drawImage(poster.artwork,logoInset,logoInset,faceSize-2*logoInset,faceSize-2*logoInset);
          else{
            context.fillStyle='#275655';context.textAlign='center';context.textBaseline='middle';
            context.scale(.01,.01);context.font='bold 105px system-ui,sans-serif';context.fillText(poster.login.slice(0,2).toUpperCase(),faceSize*50,faceSize*50,170);
          }
          context.restore();
        }});
        added=true;break;
      }
      if(boards.length===posters.length)break;
    }
    if(!added)break;
  }
  return boards;
}
