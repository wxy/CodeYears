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

/** 年份即道路名称；统一RD.格式，不随界面语言切换。 */
export interface CityRoadYearLabel {year:number;x:number;z:number;lanes:2|4|8;span:number}

export function createCityRoadYearLabels(labels:readonly CityRoadYearLabel[]):(context:CanvasRenderingContext2D)=>void {
  return context=>{
    for(const {year,x,z,lanes,span} of labels){
      const name=`RD.${year}`,half=lanes*.4/2;
      let font=Math.min(.88,half*.45);
      // 路面字沿外侧车流方向，留在一个方向的道路范围内，不覆盖中央分隔线。
      context.save();context.transform(.5,.25,-.5,.25,0,0);
      context.translate(x-half*.5,z);context.rotate(-Math.PI/2);
      context.font=`700 ${font}px system-ui`;
      font*=Math.min(1,(span-.2)/context.measureText(name).width);
      context.font=`700 ${font}px system-ui`;context.textAlign='center';context.textBaseline='middle';
      const width=context.measureText(name).width;
      context.fillStyle='#626d68';context.fillRect(-width/2-.08,-font/2-.03,width+.16,font+.06);
      context.fillStyle='#e0e5d9';context.fillText(name,0,0);context.restore();
      // 小型路牌靠路缘落地，不再为年份另铺绿带或雕塑底座。
      const postX=x-half-.35,px=(postX-z)*.5,py=(postX+z)*.25;
      context.save();context.strokeStyle='#bbc5ba';context.lineWidth=.06;
      context.beginPath();context.moveTo(px,py);context.lineTo(px,py-1.1);context.stroke();
      context.translate(px,py-1.1);context.beginPath();context.roundRect(-1.3,-.38,2.6,.76,.1);
      context.fillStyle='#345b4d';context.fill();context.strokeStyle='#c0cfc1';context.lineWidth=.045;context.stroke();
      context.font='600 .46px system-ui';context.textAlign='center';context.textBaseline='middle';
      context.fillStyle='#eef3e9';context.fillText(name,0,0);context.restore();
    }
  };
}
