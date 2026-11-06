import catalog from './city-baked-catalog.json';
import type { CitySceneItem } from './city-view';
import type { CityVehicle } from './city-vehicles';
import type { CityBridge } from './city-road-network';
import { CITY_PAINTED_BRIDGE_ELEVATION } from './city-bridges';

export interface CityTrafficSignal {x:number;z:number;heads:('x'|'z')[]}

/** 精绘设施沿用建筑的素材/深度排序/剔除流程，不参与贡献地块和计数。 */
export function planCityTransport(vehicles:readonly CityVehicle[],signals:readonly CityTrafficSignal[],bridges:readonly CityBridge[]):CitySceneItem[] {
  const sprites:Record<string,{nativeWidth:number;nativeDepth:number}>=catalog;
  const item=(id:string,x:number,z:number):CitySceneItem=>{
    const {nativeWidth:w,nativeDepth:d}=sprites[id];
    return {id,x:x-w/2,z:z-d/2,w,d,factor:1,flat:false};
  };
  return [
    ...vehicles.map(vehicle=>{
      const angle=(Math.round(vehicle.angle/(Math.PI/2))%4+4)%4;
      return item(`transport-${vehicle.kind}-${['xp','zp','xm','zm'][angle]}`,vehicle.x,vehicle.z);
    }),
    ...signals.map(signal=>item(`transport-signal-${signal.heads.length>1?'dual':signal.heads[0]}`,signal.x,signal.z)),
    ...bridges.map(bridge=>({...item('transport-bridge-arch',(bridge.from[0]+bridge.to[0])/2,(bridge.from[1]+bridge.to[1])/2),elevation:CITY_PAINTED_BRIDGE_ELEVATION})),
  ];
}
