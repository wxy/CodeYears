import type { ProfileOrganization } from '../data/profile-places';
import type { CitySprite } from './city-assets';
import type { CityRoadNetwork } from './city-road-network';
import { CITY_QUARTER_ROADS, CITY_ROAD_WIDTH } from './city-layout';
import { cityRoadWidth, isCityOuterRing, planRoadGeometry, type CityRoadRoute, type RoadPoint } from './city-roads';

type Bounds = { left:number; right:number; top:number; bottom:number };
export type OrganizationPoster = { login:string; artwork:HTMLCanvasElement; displayOnly:boolean };
export interface OrganizationBoard {
  left:number; top:number; slope:number; bounds:Bounds; groundX:number; groundY:number;
  paint(context:CanvasRenderingContext2D):void;
}

const boardScale=.8;
const faceSize=2.3*boardScale;
const logoInset=.18*boardScale;
const logoSize=faceSize-2*logoInset;
export const organizationFace = { size:faceSize, inset:logoInset };
export const organizationFrameId='organization-billboard';
export const CITY_ORGANIZATION_BOARD_LIMIT=(CITY_QUARTER_ROADS.length+1)*4;
// 正视母版以双脚落地中点为原点，664px 方窗顶端 y=223，落地线 y=1372。
const logoTop=(223-1372)*logoSize/664;

/** 只采样主页已经解码的图片。跨域图片只出现在自己的显示层，主画布始终可导出。 */
export function prepareOrganizationPoster({login,avatar}:ProfileOrganization):OrganizationPoster {
  const artwork=document.createElement('canvas');
  artwork.width=artwork.height=112;
  const pen=artwork.getContext('2d')!;
  let displayOnly=false;
  if(avatar){
    pen.fillStyle='#fff';pen.fillRect(0,0,112,112);
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

export function planOrganizationBoards(network:CityRoadNetwork,exits:readonly CityRoadRoute[],posters:readonly OrganizationPoster[],frame:CitySprite,
  signs:readonly Bounds[],objects:readonly {left:number;top:number;width:number;height:number;groundY:number;item:{flat:boolean}}[],
  clearsGround:(x:number,z:number,margin:number)=>boolean):OrganizationBoard[] {
  if(!posters.length)return [];
  const strips=[...network.roads,...exits].flatMap(road=>planRoadGeometry(road).straights
    .map(({a,b})=>({road,a,b,half:cityRoadWidth(road)/2})));
  const blockEdges=[-Infinity,...CITY_QUARTER_ROADS.map(x=>x+CITY_ROAD_WIDTH/2),Infinity];
  // 牌脚从外侧路缘退开，给贴着路边的树列留出空间。
  const setbacks=[2.3,3.5,4.7];
  type Site={x:number;z:number;roadZ:number;verge:number;offset:number;length:number};
  const slots=blockEdges.slice(1).map(():[Site[],Site[]]=>[[],[]]);
  const banks=strips.filter(({road,a,b})=>isCityOuterRing(road)&&a[1]===b[1]);
  for(const {road,a,b,half} of banks){
    const ux=Math.sign(b[0]-a[0]),side=ux>0?0:1,roadZ=a[1];
    // 南北各四个街区。在相同街区轴上遇到退台时，继续沿露出的外环找牌位。
    for(const [block,sides] of slots.entries()){
      const start=Math.max(Math.min(a[0],b[0]),blockEdges[block]),end=Math.min(Math.max(a[0],b[0]),blockEdges[block+1]);
      const length=end-start,available=length-frame.width*2-.4;
      if(available<0)continue;
      const steps=Math.floor(available/1.1);
      // 出城口切开同一街区的路肩时，第二块牌可以向外退一步。
      for(const verge of setbacks)for(let i=0;i<=steps;i++){
        const offset=(i-steps/2)*1.1,x=(start+end)/2+offset,z=roadZ-ux*(half+verge);
        if(banks.some(other=>ux*(other.b[0]-other.a[0])>0&&ux*(a[1]-other.a[1])>0&&
          x>=Math.min(other.a[0],other.b[0])&&x<=Math.max(other.a[0],other.b[0])))continue;
        if(!clearsGround(x,z,.86))continue;
        if(network.junctions.some(j=>Math.hypot(x-j.x,z-j.z)<j.radius+2.8))continue;
        if(network.bridges.some(bridge=>distanceToSegment(x,z,bridge.landings.from,bridge.landings.to)<4))continue;
        if(strips.some(s=>s.road!==road&&distanceToSegment(x,z,s.a,s.b)<s.half+2.55))continue;
        sides[side].push({x,z,roadZ,verge,offset:Math.abs(offset),length});
      }
    }
  }
  type Placement=Omit<OrganizationBoard,'paint'>;
  const first:Placement[]=[],second:Placement[]=[],reserved:Placement[]=[];
  const overlaps=(a:Bounds,b:Bounds,margin:number)=>a.left<b.right+margin&&a.right>b.left-margin&&a.top<b.bottom+margin&&a.bottom>b.top-margin;
  const needPairs=posters.length>slots.flat().filter(sites=>sites.length>0).length;
  for(const sides of slots){
    for(const [i,sites] of sides.entries()){
      sites.sort((a,b)=>(i===0?a.roadZ-b.roadZ:b.roadZ-a.roadZ)||a.verge-b.verge||a.offset-b.offset||b.length-a.length);
      const candidates=sites.flatMap(({x,z})=>{
        const slope=.5,px=(x-z)/2,groundY=(x+z)/4;
        const left=px-faceSize/2,top=groundY+logoTop-logoInset-slope*faceSize/2;
        const frameRight=frame.left+frame.width;
        const bounds={left:px+frame.left,right:px+frameRight,
          top:groundY+frame.top+Math.min(slope*frame.left,slope*frameRight),
          bottom:groundY+frame.top+frame.height+Math.max(slope*frame.left,slope*frameRight)};
        if(signs.some(s=>overlaps(s,bounds,.45))||reserved.some(s=>overlaps(s.bounds,bounds,.45)))return [];
        if(objects.some(o=>!o.item.flat&&o.groundY>groundY&&o.left<bounds.right&&o.left+o.width>bounds.left&&o.top<bounds.bottom&&o.top+o.height>bounds.top))return [];
        return [{left,top,slope,bounds,groundX:px,groundY}];
      });
      const apart=(a:Placement,b:Placement)=>!overlaps(a.bounds,b.bounds,.45);
      const chosen=(needPairs?candidates.find(a=>candidates.some(b=>apart(a,b))):undefined)??candidates[0];
      if(!chosen)continue;
      first.push(chosen);reserved.push(chosen);
      if(needPairs){
        const companion=candidates.find(site=>apart(chosen,site));
        if(companion){second.push(companion);reserved.push(companion)}
      }
    }
  }
  return [...first,...second].slice(0,posters.length).map((placement,index)=>({
    ...placement,paint(context){
      const {slope,groundX,groundY}=placement,poster=posters[index];
      context.save();
      context.transform(1,slope,0,1,groundX,groundY);
      context.drawImage(frame.canvas,frame.left,frame.top,frame.width,frame.height);
      if(!poster.displayOnly)context.drawImage(poster.artwork,-logoSize/2,logoTop,logoSize,logoSize);
      else{
        context.fillStyle='#275655';context.textAlign='center';context.textBaseline='middle';
        context.translate(0,logoTop+logoSize/2);context.scale(.01*boardScale,.01*boardScale);
        context.font='bold 105px system-ui,sans-serif';context.fillText(poster.login.slice(0,2).toUpperCase(),0,0,170);
      }
      context.restore();
    },
  }));
}
