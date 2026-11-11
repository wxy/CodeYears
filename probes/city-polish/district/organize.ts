import type { CityScene } from '../../../src/renderers/city-view';
import type { OrganicCity } from '../../../src/renderers/city-organic-layout';
import { createOrganicGround } from '../../../src/renderers/city-organic-layout';

// 只接收已经完成日期/合并/路网规划的场景；返回绘制前的独立副本。
// family按ISO年与13周片区固定，既不读屏幕坐标，也不使用随机数。
export function organize(scene: CityScene): CityScene {
  const items=scene.items.map(item=>{
    const p=item.parcel;
    if(!p||p.kind!=='building'||p.wonder||p.milestone)return {...item};
    const year=scene.weekly.districts[p.block].year;
    const family=(year+Math.floor(p.x/13))%2;
    const center=Math.abs(p.x%13+p.w/2-6.5)<2&&Math.abs(p.z+p.d/2-3.5)<2;
    // 中心保留原有公共设施等稀有外观；外围同档、同占地使用同材质家族。
    if(center)return {...item};
    let id=item.id;
    const variant=family?'b':'a';
    if(p.band===0)id=family?'res-mono-limestone':'cottage-gable';
    if(p.band===1)id=p.w===2?(family?'shop-wide':'row-wide'):p.d===2?(family?'shop-deep':'row-deep'):(family?'low-terrace':'low-gable');
    if(p.band===2)id=p.w===2?(family?'mixed-use-b':'townhouse-a'):(family?'res-limestone-bay':'res-terracotta-apartment');
    if(p.band===3)id=p.w===2?`office-wide-h3-${variant}`:p.d===2?`office-deep-h3-${variant}`:`office-h3-${variant}`;
    if(p.band===4)id=p.w===2&&p.d===2?`apartment-h2-${variant}`:p.w===2?`tower-wide-h4-${variant}`:p.d===2?`tower-deep-h4-${variant}`:`tower-h4-${variant}`;
    return {...item,id}; // factor、日期、退距包络、世界位置和高度档保持。
  });
  return {...scene,items,keys:[...new Set([...scene.keys,...items.map(i=>i.id)])]};
}

// 在原地面链内、建筑铺装及PNG绘制之前铺庭院，不覆盖道路或事后修补楼体。
export function districtGround(plan: OrganicCity, candidate: boolean) {
  const base=createOrganicGround(plan);
  return (ctx:CanvasRenderingContext2D)=>{
    base(ctx);
    if(!candidate)return;
    for(const item of plan.scene.items){
      const p=item.parcel;if(!p||p.kind!=='building')continue;
      const family=(plan.scene.weekly.districts[p.block].year+Math.floor(p.x/13))%2;
      const edge=p.z===0||p.z+p.d===7;
      ctx.fillStyle=edge?(family?'#a8b69b':'#b4b69a'):(family?'#b9bca6':'#bdb69f');
      const x=item.x+.035,z=item.z+.035,w=item.w-.07,d=item.d-.07;
      ctx.beginPath();for(const [i,[a,b]]of [[x,z],[x+w,z],[x+w,z+d],[x,z+d]].entries()){
        const px=(a-b)*.5,py=(a+b)*.25;if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);
      }ctx.closePath();ctx.fill();
    }
  };
}
