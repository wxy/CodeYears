import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { runInNewContext } from 'node:vm';

/** Design preview and runtime bake share measured human scale; no ground-fit cap. */
export async function prepareTownScale({root, collection = 'design'}) {
const design=resolve(root,'docs/design/ancient-town-concepts/2026-11-11');
const readJSON=async path=>JSON.parse(await readFile(path,'utf8'));
const [classic,magicLife,mage,newHalls,newStable,cottages,forms,magic,life,correction]=await Promise.all([
  ...['scale-classic-v1','scale-magic-life-v1','scale-mage-workshop-v1','scale-guild-academy-v1','scale-stable-v2'].map(n=>readJSON(join(design,n+'.json'))),
  readJSON(resolve(design,'../2026-11-10/fantasy-sprites-v1.json')),
  readJSON(resolve(design,'../2026-11-10/fantasy-building-forms-v1.json')),
  readJSON(join(design,'magic-town-v2.json')),readJSON(join(design,'town-life-v1.json')),
  readJSON(join(design,'classic-projection-v2.json')),
]);
correction.cottages.forEach((entry,i)=>Object.assign(cottages.frames[i],entry));
correction.forms.forEach((entry,i)=>Object.assign(forms.frames[i],entry));
const context={window:{}};runInNewContext(await readFile(resolve(root,'probes/fantasy-city/project-sprites.js'),'utf8'),context);
const sources=new Map(),frames=[];
const lineHeight=(line,cal)=>Math.abs(cal.shear*(line.bottom[0]-line.top[0])+cal.vertical*(line.bottom[1]-line.top[1]));
const add=(id,label,frame,observation,reference,target,kind)=>{
  const source=resolve(design,observation.source),url='/source/'+sources.size+'.png';
  sources.set(url,source);
  const f={...frame},cal=context.window.prepareFantasyProjection(f);
  const height=reference.top?lineHeight(reference,cal):cal.vertical*reference.heightPx;
  // The measured doorway/adult sets the scale. Ground fit never caps it again.
  const scale=target/height,measured=!!(f.ground||f.ellipse);
  const nw=measured?cal.span[0]/cal.scale*scale:f.footprint[0];
  const nd=measured?cal.span[1]/cal.scale*scale:f.footprint[1];
  const center=[(nw-nd)/4,(nw+nd)/8];
  const screen=([x,y])=>[center[0]+(x-cal.anchor[0])*scale/2,
    center[1]+(cal.shear*(x-cal.anchor[0])+cal.vertical*(y-cal.anchor[1]))*scale/2];
  const floor=p=>{const [x,y]=screen(p);return [x+2*y,-x+2*y];};
  const corners=[[0,0],[f.sw,0],[f.sw,f.sh],[0,f.sh]].map(screen);
  const door=observation.door?.top?observation.door:undefined;
  const win=observation.window?.top?observation.window:undefined;
  let doorWidth;
  if(door?.width){const [a,b]=door.width.map(floor);doorWidth=Math.hypot(b[0]-a[0],b[1]-a[1]);}
  if(door?.leftAtY660){const [a,b]=[door.leftAtY660,door.rightAtY660].map(floor);doorWidth=Math.hypot(b[0]-a[0],b[1]-a[1]);}
  const workWindow=observation.workWindow?{
    clipPolygon:observation.workWindow.clipPolygon.map(screen),
    exclusions:observation.workWindow.clipExcludePolygons.map(p=>p.polygon.map(screen)),
  }:undefined;
  frames.push({id,label,source:url,crop:[f.sx??0,f.sy??0,f.sw,f.sh],
    projection:{anchor:cal.anchor,shear:cal.shear,vertical:cal.vertical,scale,center},
    left:Math.min(...corners.map(p=>p[0])),top:Math.min(...corners.map(p=>p[1])),
    width:Math.max(...corners.map(p=>p[0]))-Math.min(...corners.map(p=>p[0])),
    height:Math.max(...corners.map(p=>p[1]))-Math.min(...corners.map(p=>p[1])),
    nativeWidth:nw,nativeDepth:nd,directionBasis:cal.directionBasis,
    ...(observation.runtimeEdge ? {runtimeEdge:observation.runtimeEdge} : {}),
    doorPoint:door?floor(door.bottom):[nw/2,nd],
    residentSlots:observation.residentSlots?.map(floor),
    crownPoint:kind==='adult'?screen(reference.top):undefined,workWindow,
    metrics:{referenceType:kind,referenceHeight:target,basis:reference.basis??reference.note,
      doorHeight:door?lineHeight(door,cal)*scale:undefined,doorWidth,
      windowHeight:win?lineHeight(win,cal)*scale:undefined,
      personHeight:kind==='adult'?.8:kind==='upper-body'?.8:undefined,
      personVisibility:kind==='upper-body'?'inferred from 0.55H visible upper body':undefined,
      scale,groundSpan:[nw,nd],postPlacementFactor:1}});
};
for(const obs of classic.cottages.filter(o=>o.id==='cottages-1')){
  const i=Number(obs.id.split('-')[1]),door=obs.door?.top?obs.door:{heightPx:88,basis:'inferred: shared cottage structural family; no visible door in this variant'};
  add(obs.id,i===1?'农舍':'小屋 '+i,cottages.frames[i],obs,door,1,'door');
}
for(const obs of classic.forms.filter(o=>o.id==='forms-0')){
  const i=Number(obs.id.split('-')[1]);if(i===7)continue;
  add(obs.id,['长屋','工坊长屋','侧翼庄园','深长屋','深工坊'][i],forms.frames[i],obs,obs.door,1,'door');
}
for(const obs of newStable.frames){const [, ,sw,sh]=obs.crop;
  add(obs.id,'单体畜舍',{sw,sh,ground:obs.ground,axes:obs.axes,footprint:[1,1]},obs,obs.door,1,'door');}
for(const i of collection === 'rustic' ? [0] : [0,2,3]){
  const obs=magicLife.magic.find(f=>f.id==='magic-'+i),person=obs.embeddedPeople[0];
  add(obs.id,['圆形观星台','','温室','炼金庄园'][i],magic.frames[i],obs,person.reference,
    i===2?.44:.8,i===2?'upper-body':'adult');
}
add('mage-0','圆形法师工坊',{sw:mage.sw,sh:mage.sh,ground:mage.ground,axes:mage.axes,footprint:[1,1]},mage,mage.door,1,'door');
if (collection === 'rustic') {
  const {front, back} = await readJSON(join(design, 'rustic-courts/observations.json'));
  // 同一屋型的角柱贯穿两幅图。背面以柱高迁移正面门尺，隐藏主门只作位置推定。
  const postHeight = (front.post.bottom[1] - front.post.top[1]) / (front.door.bottom[1] - front.door.top[1]);
  for (const obs of [front, back]) {
    const [sx, sy, sw, sh] = obs.crop;
    const visible = obs === front;
    add(obs.id, obs.label, {sx, sy, sw, sh, ground: obs.ground, axes: obs.axes, footprint: [1,1]},
      obs, visible ? obs.door : obs.post, visible ? 1 : postHeight, visible ? 'door' : 'matching-corner-post');
    const frame = frames.at(-1);
    frame.entranceSide = obs.entranceSide;
    frame.entranceBasis = obs.entranceBasis;
    if (!visible) {
      const face = frames.at(-2);
      frame.doorPoint = [frame.nativeWidth * (1 - face.doorPoint[0] / face.nativeWidth), 0];
    }
  }
} else {
  for(const obs of newHalls.frames){const [, ,sw,sh]=obs.crop;
    add(obs.id,obs.id==='guild-0'?'行会庭院':'宽学院',{sw,sh,ground:obs.ground,axes:obs.axes,footprint:[1,1]},obs,obs.door,1,'door');}
  const massing=await readJSON(join(design,'massing/observations.json'));
  for(const obs of massing.frames){
    const [sx,sy,sw,sh]=obs.crop;
    add(obs.id,obs.label,{sx,sy,sw,sh,ground:obs.ground,axes:obs.axes,footprint:[1,1]},obs,obs.door,1,'door');
  }
}
for(const i of [0,1,2]){
  const obs=magicLife.life.find(f=>f.id==='life-'+i),ref=obs.people[0].headCrownToSole;
  add(obs.id,['学徒','居民','学者'][i],{...life.frames[i],anchor:ref.bottom,footprint:[i===1?.55:.25,.20]},obs,ref,.8,'adult');
}
const tree=magicLife.life.find(f=>f.id==='life-5');
add('life-5','花树',{...life.frames[5],anchor:tree.reference.bottom},tree,tree.reference,1.6,'tree');
for(const [i,target,label]of [[8,.44,'泉台']]){
  const obs=magicLife.life.find(f=>f.id==='life-'+i);
  add(obs.id,label,life.frames[i],obs,obs.references[0].line,target,'facility');
}
const infrastructure=await readJSON(join(design,'scale-infrastructure-v1.json'));
for(const obs of infrastructure.frames){
  const i=Number(obs.id.split('-')[1]);
  add(obs.id,{'6':'魔力井','7':'魔力路灯','8':'传送门'}[i],magic.frames[i],
    {source:infrastructure.source},{...obs.reference,basis:obs.basis},obs.target,'facility');
}
return {frames,sources};
}
