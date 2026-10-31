import type { DailyContribution } from "../data/types";
import { CITY_SPRITES, type BuildingType, type CityImages } from "./city-assets";
import { planWeeklyCity, type CityParcel } from "./city-parcels";
import type { LandscapeView, LandscapeViewport } from "./types";

const project = (x: number, z: number): [number, number] => [(x - z) * 0.5, (x + z) * 0.25];

/** 固定视角图片城市：真实日期按工作周布置，图片保持比例，按落地点远近绘制。 */
export function createCityView(days: readonly DailyContribution[], images: CityImages): LandscapeView {
  const canvas = document.createElement("canvas"), context = canvas.getContext("2d")!;
  const fine = planWeeklyCity(days), gap = 1.6, parkWidth = 4, parkRow = Math.ceil(fine.rows / 2);
  const width = fine.columns, depth = fine.rows * (7 + gap) - gap + parkWidth;
  const parkStart = parkRow * (7 + gap) - gap / 2;
  const origin = (block: number): [number, number] => [0, block * (7 + gap) + (block >= parkRow ? parkWidth : 0)];
  type Item = { x: number; y: number; width: number; height: number; top: number; parcel: CityParcel; model?: BuildingType };
  const makeItems = (parcels: CityParcel[]): Item[] => parcels.map(parcel => {
    const [bx, bz] = origin(parcel.block), [x, y] = project(bx + parcel.x + parcel.w / 2, bz + parcel.z + parcel.d / 2);
    let model: BuildingType | undefined;
    if (parcel.kind === "building") {
      const signature = parcel.block * 13 + parcel.x * 3 + parcel.z;
      model = parcel.w >= 2 && parcel.d >= 2 && parcel.band <= 3 && signature % 5 === 0 ? "stadium"
        : parcel.w >= 3 && parcel.band <= 3 ? "hall"
        : parcel.w >= 3 && parcel.d === 1 ? "office"
        : parcel.band === 4 ? "tower"
        : parcel.indices.length >= 2 && parcel.band <= 2 ? "apartment"
        : parcel.indices.length > 1 ? "office" : "house";
    }
    const spriteWidth = Math.min((parcel.w + parcel.d) * 0.5 * 0.88, 4.4);
    const spec = model ? CITY_SPRITES[model] : undefined;
    const height = spec ? spriteWidth * spec.crop[3] / spec.crop[2] : parcel.kind === "tree" ? 0.95 : 0.35;
    const top = spec ? spriteWidth * spec.anchor[1] / spec.crop[2] : height;
    return { x, y, width: spriteWidth, height, top, parcel, model };
  }).sort((a, b) => a.y - b.y || a.x - b.x);
  const fineItems = makeItems(fine.parcels);
  const minX = -depth / 2 - 2, maxX = width / 2 + 2;
  const minY = Math.min(-5.5, ...fineItems.map(item => item.y - item.top)) - .5, maxY = (width + depth) / 4 + 2;
  const centerX = (minX + maxX) / 2, centerY = (minY + maxY) / 2;
  let tallest = Math.max(...fineItems.map(item => item.top), 1);
  const ground = document.createElement("canvas"), unit = Math.min(28, 1800 / (maxX - minX));
  ground.width = Math.ceil((maxX - minX) * unit); ground.height = Math.ceil((maxY - minY) * unit);
  const g = ground.getContext("2d")!; g.setTransform(unit, 0, 0, unit, -minX * unit, -minY * unit);
  const polygon = (x: number, z: number, w: number, d: number, color: string) => {
    g.fillStyle = color; g.beginPath();
    for (const [i, [px, py]] of [project(x,z),project(x+w,z),project(x+w,z+d),project(x,z+d)].entries()) i ? g.lineTo(px,py) : g.moveTo(px,py);
    g.closePath(); g.fill();
  };
  g.filter = "blur(13px)"; g.globalAlpha = 0.75; polygon(-1,-1,width+2,depth+2,"#a0b78d"); g.filter = "none"; g.globalAlpha = 1;
  for (let block = 0; block < fine.blocks; block++) {
    const [x,z] = origin(block);
    const span=fine.districts[block].weeks;
    polygon(x-gap/2,z-gap/2,span+gap,7+gap,"#505b60"); polygon(x-.12,z-.12,span+.24,7.24,"#c6c9bb");
    g.strokeStyle = "#d6d0ad"; g.lineWidth = 0.025; g.setLineDash([.19,.22]);
    for (const [from,to] of [[[x-.4,z-.4],[x+span+.4,z-.4]],[[x+span+.4,z-.4],[x+span+.4,z+7.4]],[[x+span+.4,z+7.4],[x-.4,z+7.4]],[[x-.4,z+7.4],[x-.4,z-.4]]]) {
      g.beginPath(); g.moveTo(...project(from[0],from[1])); g.lineTo(...project(to[0],to[1])); g.stroke();
    }
    g.setLineDash([]);
    for (let stripe=0;stripe<5;stripe++) {
      polygon(x+span-.1+stripe*.14,z-.68,.07,.52,"#e2e5d8"); polygon(x-.68,z+6.9+stripe*.14,.52,.07,"#e2e5d8");
    }
  }
  for (const cell of fine.cells) {
    const [bx,bz] = origin(cell.block);
    if (cell.kind !== "building") polygon(bx+cell.x,bz+cell.z,cell.w,1,cell.kind === "grass" ? "#7b9e67" : "#6b915a");
  }
  polygon(0,parkStart,width,parkWidth,"#759765");
  g.strokeStyle = "#d5c9a6"; g.lineWidth = .13; g.beginPath();
  g.moveTo(...project(0,parkStart+parkWidth*.36));
  g.bezierCurveTo(...project(width*.3,parkStart+parkWidth*.85),...project(width*.65,parkStart+parkWidth*.12),...project(width,parkStart+parkWidth*.65));g.stroke();
  g.fillStyle = "#76a7b1";g.beginPath();
  for(let i=0;i<=40;i++){const a=i/40*Math.PI*2;const p=project(width*.61+Math.cos(a)*Math.min(3,width*.09),parkStart+parkWidth*.5+Math.sin(a)*1.35);i?g.lineTo(...p):g.moveTo(...p)}g.closePath();g.fill();
  const parkTrees: { x: number; y: number; seed: number }[] = [];
  for (let x=1;x<width;x+=2.6) for (const z of [parkStart+.4,parkStart+parkWidth-.4]) { const p=project(x,z);parkTrees.push({x:p[0],y:p[1],seed:Math.round(x)}) }
  parkTrees.sort((a,b)=>a.y-b.y);
  let step: 1 | 2 | 4 = 1, items = fineItems;
  const resize = (viewport: LandscapeViewport) => {
    const w=Math.round(viewport.width*viewport.dpr),h=Math.round(viewport.height*viewport.dpr);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
    context.setTransform(viewport.dpr,0,0,viewport.dpr,0,0);context.imageSmoothingEnabled=true;context.imageSmoothingQuality="high";
  };
  function plant(x:number,y:number,size:number,growth:number,shrub:boolean,seed:number){
    if(growth<=0)return;
    const h=size*(shrub?.4:1)*growth;
    context.fillStyle="rgba(35,60,37,.14)";context.beginPath();context.ellipse(x,y+size*.1,size*.34,size*.13,0,0,Math.PI*2);context.fill();
    if(!shrub){context.strokeStyle="#7b6a4d";context.lineWidth=Math.max(1,size*.055);context.beginPath();context.moveTo(x,y);context.lineTo(x,y-h*.58);context.stroke()}
    for(let j=0;j<5;j++){
      const cx=x+Math.sin(j*2.4+seed)*size*.19,cy=y-h*(shrub?.45:.68)+Math.cos(j*2.1)*h*.13;
      const r=size*(shrub?.22:.26)*growth,gradient=context.createRadialGradient(cx-r*.2,cy-r*.3,0,cx,cy,r);
      gradient.addColorStop(0,["#8ba66b","#779b60","#93ad74"][j%3]);gradient.addColorStop(1,"#426c48");context.fillStyle=gradient;context.beginPath();context.arc(cx,cy,r,0,Math.PI*2);context.fill();
    }
  }
  return {
    canvas,
    description:()=>`固定视角 · 每年一条横向街区，周次为列/周一至周日为行 · ${step===1?"逐日草木与跨周建筑":"按同星期几的组内日均量呈现"} · 拖动平移`,
    draw(progress,viewport){
      resize(viewport);context.clearRect(0,0,viewport.width,viewport.height);
      const fit=Math.min((viewport.width-32)/(maxX-minX),(viewport.height-24)/(maxY-minY)),scale=fit*viewport.zoom;
      const next:1|2|4=scale>=17?1:scale>=8?2:4;
      if(next!==step){step=next;items=step===1?fineItems:makeItems(planWeeklyCity(days,step).parcels);tallest=Math.max(...items.map(item=>item.top),1)}
      const sx=(x:number)=>viewport.width/2+viewport.panX+(x-centerX)*scale,sy=(y:number)=>viewport.height/2+viewport.panY+(y-centerY)*scale;
      context.drawImage(ground,sx(minX),sy(minY),(maxX-minX)*scale,(maxY-minY)*scale);
      const level=(1-Math.pow(1-progress,1.4))*tallest;
      let parkIndex=0;
      const paintPark=(before:number)=>{while(parkIndex<parkTrees.length&&parkTrees[parkIndex].y<=before){const p=parkTrees[parkIndex++];plant(sx(p.x),sy(p.y),scale*.75,Math.min(1,progress*3),false,p.seed)}};
      for(const item of items){
        paintPark(item.y);
        if(item.parcel.kind==="grass")continue;
        const x=sx(item.x),y=sy(item.y),growth=Math.min(1,level/Math.max(item.top,.15));
        if(!item.model){plant(x,y,scale*.8,growth,item.parcel.kind==="shrub",item.parcel.block+item.parcel.x);continue}
        if(growth<=0)continue;
        const spec=CITY_SPRITES[item.model],bitmap=images[item.model],factor=bitmap.width/1254;
        const w=item.width*scale,h=item.height*scale,dx=x-spec.anchor[0]/spec.crop[2]*w,dy=y-spec.anchor[1]/spec.crop[2]*w;
        if(dx+w<0||dx>viewport.width||dy+h<0||dy>viewport.height)continue;
        context.save();context.beginPath();context.rect(dx-1,y-item.top*scale*growth,w+2,h+2);context.clip();context.globalAlpha=Math.min(1,growth*4);
        context.drawImage(bitmap,spec.crop[0]*factor,spec.crop[1]*factor,spec.crop[2]*factor,spec.crop[3]*factor,dx,dy,w,h);context.restore();
      }
      paintPark(Infinity);
      context.font="11px -apple-system,BlinkMacSystemFont,sans-serif";context.textAlign="right";context.fillStyle=viewport.dark?"#aab7ac":"#536451";
      fine.districts.forEach((district,block)=>{const p=project(-1.2,origin(block)[1]+3.5);context.fillText(String(district.year),sx(p[0]),sy(p[1]))});
    },
    dispose(){canvas.remove();canvas.width=canvas.height=0;ground.width=ground.height=0},
  };
}
