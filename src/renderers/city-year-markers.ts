import type { CityLayout } from './city-layout';

/** 绿篱年份雕塑随两侧绿化带方向落地，一次进入地面缓存。 */
export function createCityYearMarkers(layout: CityLayout): (context: CanvasRenderingContext2D) => void {
  const gardens = new Path2D();
  // 连续不透明绿带连接街区侧缘与环路内缘，移除独立浅石托盘和透底空隙。
  for (const district of layout.districts) for (const x of [-1.94, layout.width + .18]) {
    gardens.rect(x, district.z, 1.76, 7);
  }
  return context => {
    context.save(); context.transform(.5, .25, -.5, .25, 0, 0);
    context.fillStyle = '#94a67e'; context.fill(gardens); context.restore();
    for (const district of layout.districts) for (const side of [-1, 1]) {
      const x = side === -1 ? -1.05 : layout.width + 1.05, z = district.z + 3.5;
      const px = (x - z) * .5, py = (x + z) * .25;
      // 数字沿短边绿带排列，两岸各自朝向外侧；竖向厚度在投影后抬升。
      for (let layer = 0; layer <= 4; layer++) {
        context.save(); context.translate(px, py - layer * .025);
        context.transform(side * .5, -side * .25, side * .5, side * .25, 0, 0);
        context.font = '900 1.8px -apple-system, BlinkMacSystemFont, sans-serif';
        context.textAlign = 'center'; context.textBaseline = 'middle';
        context.lineJoin = 'round'; context.lineWidth = .06;
        context.strokeStyle = layer === 4 ? '#506a3f' : '#3e5736';
        context.fillStyle = layer === 4 ? '#7f9b58' : '#48643a';
        context.strokeText(String(district.year), 0, 0); context.fillText(String(district.year), 0, 0);
        context.restore();
      }
    }
  };
}

/** 街区、大道及季度路的路面标识；不另设路牌。 */
export interface CityRoadLabel {
  year:number;text:string;kind:'block'|'avenue'|'road';
  x:number;z:number;lanes:2|4|8;span:number;horizontal:boolean;side:-1|1;
}
export const CITY_ROAD_LABEL_SIZE={block:.56,avenue:.4,road:.28} as const;
/** 等宽字形加固定横向压缩；规划预留相同的固定字幅，不按路段缩字。 */
export const cityRoadLabelLength=(text:string,kind:CityRoadLabel['kind'])=>text.length*CITY_ROAD_LABEL_SIZE[kind]*.64*.8+.2;

export function createCityRoadLabels(labels:readonly CityRoadLabel[]):(context:CanvasRenderingContext2D)=>void {
  return context=>{
    for(const {text,kind,x,z,lanes,horizontal,side} of labels){
      const half=lanes*.4/2,weight=kind==='block'?800:kind==='avenue'?700:600;
      const font=CITY_ROAD_LABEL_SIZE[kind],offset=font+.06>half?0:side*half*.5;
      // 文字顺路面排列；占一侧路幅，避开中央分隔线和路缘线。
      context.save();context.transform(.5,.25,-.5,.25,0,0);
      context.translate(x+(horizontal?0:offset),z+(horizontal?offset:0));
      if(!horizontal)context.rotate(-Math.PI/2);
      context.scale(.8,1);
      context.font=`${weight} ${font}px monospace`;context.textAlign='center';context.textBaseline='middle';
      const width=context.measureText(text).width;
      context.fillStyle='#626d68';context.fillRect(-width/2-.08,-font/2-.03,width+.16,font+.06);
      context.fillStyle='#e0e5d9';context.fillText(text,0,0);context.restore();
    }
  };
}
