import type { WeeklyCity } from './city-parcels';
import type { CityRoadJunction, CityRoadRoute, RoadPoint } from './city-roads';
import type { CityVehicle, CityVehicleKind } from './city-vehicles';

export interface CityBridge {
  id: string; band: number; quarter: number; from: RoadPoint; to: RoadPoint;
}
export interface CityRoadNetwork {
  roads: CityRoadRoute[]; junctions: CityRoadJunction[]; bridges: CityBridge[];
  vehicles: CityVehicle[]; ringOuter: number;
}
// 最外年度主路到1.6格，环路内缘2格，二者之间保留0.4格隔离带。
export const CITY_RING_CENTER = 3.6;
export const CITY_RING_OUTER = 5.2;

/** 桥面、车辆和岸树避让使用同一条缓和中心线。 */
export function sampleCityBridge(bridge: CityBridge, t: number, offset = 0) {
  const dx = bridge.to[0] - bridge.from[0], dz = bridge.to[1] - bridge.from[1];
  const slopeX = dx * 6 * t * (1 - t), length = Math.hypot(slopeX, dz);
  return { x: bridge.from[0] + dx * t * t * (3 - 2 * t) + dz / length * offset,
    z: bridge.from[1] + dz * t - slopeX / length * offset,
    elevation: .18 * Math.min(1, t / .2, (1 - t) / .2), angle: Math.atan2(dz, slopeX) };
}

/** 日期地块不动；道路、桥和车辆共用这一份世界坐标计划。 */
export function planCityRoadNetwork(weekly: WeeklyCity, width: number, depth: number, parkStarts: readonly number[]): CityRoadNetwork {
  const roads: CityRoadRoute[] = [], junctions: CityRoadJunction[] = [], bridges: CityBridge[] = [];
  const districts = weekly.districts.map((district, block) => {
    const z = block * 8.6 + Math.floor(block / 5) * 4;
    const quarters = [1, 2, 3].flatMap(quarter => {
      const week = Math.round((Date.UTC(district.year, quarter * 3, 1) - district.monday) / 604800000);
      return district.breaks.includes(week)
        ? [{ quarter, x: week + district.breaks.filter(b => b < week).length * .8 + .4 }] : [];
    });
    return { z, quarters };
  });
  roads.push({ id: 'ring', lanes: 8, closed: true, points: [
    [-CITY_RING_CENTER, -CITY_RING_CENTER], [width + CITY_RING_CENTER, -CITY_RING_CENTER],
    [width + CITY_RING_CENTER, depth + CITY_RING_CENTER], [-CITY_RING_CENTER, depth + CITY_RING_CENTER],
  ] });
  const avenues = new Set<number>();
  districts.forEach(({ z, quarters }, block) => {
    for (const avenueZ of [z - .8, z + 7.8]) avenues.add(Math.round(avenueZ * 1000) / 1000);
    for (const { quarter, x } of quarters) {
      const fromZ = block === 0 ? -CITY_RING_CENTER : z - .8;
      const toZ = block === weekly.rows - 1 ? depth + CITY_RING_CENTER : z + 7.8;
      roads.push({ id: `quarter-${block}-${quarter}`, lanes: 2, points: [[x, fromZ], [x, toZ]] });
      for (const junctionZ of [z - .8, z + 7.8]) junctions.push({ x, z: junctionZ, radius: .9 });
      if (block === 0) junctions.push({ x, z: -CITY_RING_CENTER, radius: 1.7 });
      if (block === weekly.rows - 1) junctions.push({ x, z: depth + CITY_RING_CENTER, radius: 1.7 });
    }
  });
  for (const z of avenues) {
    roads.push({ id: `avenue-${z}`, lanes: 4, points: [[-CITY_RING_CENTER, z], [width + CITY_RING_CENTER, z]] });
    junctions.push({ x: -CITY_RING_CENTER, z, radius: 1.7 }, { x: width + CITY_RING_CENTER, z, radius: 1.7 });
  }
  parkStarts.forEach((_, band) => {
    const block = (band + 1) * 5, before = districts[block - 1], after = districts[block];
    for (const from of before.quarters) {
      const to = after.quarters.find(q => q.quarter === from.quarter);
      if (to) bridges.push({ id: `bridge-${band}-${from.quarter}`, band, quarter: from.quarter,
        from: [from.x, before.z + 7.8], to: [to.x, after.z - .8] });
    }
  });

  const vehicles: CityVehicle[] = [], kinds: CityVehicleKind[] = ['sedan', 'suv', 'van', 'bus'];
  const colors = ['#b65f4f', '#52768b', '#dbbd62', '#e1ded1', '#647e70', '#7d6b88'];
  // 车辆只占已有车道，避开路口；固定序列不随缩放/重播随机换位。
  const placeVehicles = (id: string, points: readonly RoadPoint[], lanes: 2 | 4 | 8, closed = false, bridge?: CityBridge) => {
    let seed = 2166136261;
    for (let i = 0; i < id.length; i++) seed = Math.imul(seed ^ id.charCodeAt(i), 16777619) >>> 0;
    const segments = closed ? [...points.slice(1), points[0]] : points.slice(1);
    segments.forEach((to, index) => {
      const from = points[index], dx = to[0] - from[0], dz = to[1] - from[1], length = Math.hypot(dx, dz);
      if (length < 3) return;
      for (const direction of [1, -1]) {
        if (vehicles.length >= 180) return;
        const fraction = direction === 1 ? .32 + (seed % 13) / 100 : .62 + (seed % 11) / 100;
        const offset = (.2 + .4 * (seed % (lanes / 2))) * direction;
        const position = bridge ? sampleCityBridge(bridge, fraction, offset) : {
          x: from[0] + dx * fraction + dz / length * offset, z: from[1] + dz * fraction - dx / length * offset,
          elevation: 0, angle: Math.atan2(dz, dx),
        };
        const { x, z } = position;
        if (!bridge && junctions.some(j => Math.hypot(j.x - x, j.z - z) < j.radius + .7)) continue;
        const kind = kinds[(seed + index + (direction === 1 ? 0 : 1)) % kinds.length];
        vehicles.push({ x, z, angle: position.angle + (direction === -1 ? Math.PI : 0), kind,
          color: colors[(seed + index) % colors.length], elevation: position.elevation });
      }
    });
  };
  // 先保证少量桥上车辆，再布置城区和环路，总数有界。
  for (const bridge of bridges) placeVehicles(bridge.id, [bridge.from, bridge.to], 2, false, bridge);
  for (const road of roads) placeVehicles(road.id, road.points, road.lanes, road.closed);
  return { roads, junctions, bridges, vehicles, ringOuter: CITY_RING_OUTER };
}

/** 岸树是装饰，应让出桥头和桥面走廊；不改变任何贡献地块。 */
export function cityTreeClearsBridges(x: number, z: number, w: number, d: number, bridges: readonly CityBridge[]) {
  const cx = x + w / 2, cz = z + d / 2;
  return bridges.every(bridge => {
    const t = Math.max(0, Math.min(1, (cz - bridge.from[1]) / (bridge.to[1] - bridge.from[1])));
    const bridgeX = sampleCityBridge(bridge, t).x;
    return cz < bridge.from[1] - .7 || cz > bridge.to[1] + .7 || Math.abs(cx - bridgeX) > .65 + w / 2;
  });
}
