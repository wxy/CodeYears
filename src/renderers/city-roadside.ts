import { cityRoadWidth, planRoadGeometry, type CityRoadRoute } from './city-roads';
import { CITY_RIVER_BANK_DEPTH } from './city-layout';
import type { CityScene, CitySceneItem } from './city-view';

export const CITY_ROADSIDE_ASSETS = ['broadleaf-a', 'conifer-b', 'cottage-gable', 'villa-hip', 'res-mono-limestone'] as const;

const ornament = (id: string, x: number, z: number, factor: number): CitySceneItem =>
  ({ id, x: x - factor / 2, z: z - factor / 2, w: factor, d: factor, factor, flat: false });

export function planCityRoadside(scene: CityScene, highways: readonly CityRoadRoute[],
  clearsTerrain: (x: number, z: number, margin: number) => boolean) {
  const { roads, junctions, ringOuter } = scene.roadNetwork;
  const edges = [...roads, ...highways].flatMap(route => planRoadGeometry(route).straights.map(({ a, b }) => {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return { route, a, length, dx: (b[0] - a[0]) / length, dz: (b[1] - a[1]) / length, half: cityRoadWidth(route) / 2 };
  })).filter(edge => edge.length > 0);
  const clearsRoad = (x: number, z: number, margin: number, except?: CityRoadRoute) =>
    !edges.some(({ route, a, dx, dz, length, half }) => {
      if (route === except) return false;
      const along = Math.max(0, Math.min(length, (x - a[0]) * dx + (z - a[1]) * dz));
      return (x - a[0] - dx * along) ** 2 + (z - a[1] - dz * along) ** 2 < (half + margin) ** 2;
    });
  const scenery: CitySceneItem[] = [];
  const treePositions = new Set<string>();
  for (const { route, a, length, dx, dz, half } of edges) {
    if ((!route.id.startsWith('organic-') && route.id !== 'ring') || route.id.startsWith('organic-courtyard-')) continue;
    const spacing = route.lanes === 2 ? 2.6 : 2.3;
    for (let distance = 1.25; distance <= length - 1.25; distance += spacing) {
      for (const side of [-1, 1]) {
        const verge = side * (half + .18);
        const x = a[0] + dx * distance - dz * verge, z = a[1] + dz * distance + dx * verge;
        if (junctions.some(junction => Math.hypot(x - junction.x, z - junction.z) < junction.radius + .48) ||
            scene.rivers?.some(river => x > river.left && x < river.right &&
              z > river.top + CITY_RIVER_BANK_DEPTH && z < river.bottom - CITY_RIVER_BANK_DEPTH) ||
            !clearsRoad(x, z, .22, route)) continue;
        const key = `${Math.round(x * 2)},${Math.round(z * 2)}`;
        if (treePositions.has(key)) continue;
        treePositions.add(key);
        scenery.push(ornament(route.lanes === 2 ? 'conifer-b' : 'broadleaf-a', x, z, route.lanes === 2 ? .68 : .87));
      }
    }
  }

  const sites = new Map<number, { firstYear: number; lastYear: number; z: number; end: number }>();
  for (const district of scene.layout.districts) {
    const site = sites.get(district.band);
    if (site) { site.lastYear = district.year; site.end = district.z + 7; }
    else sites.set(district.band, { firstYear: district.year, lastYear: district.year, z: district.z, end: district.z + 7 });
  }
  const outside = Math.max(scene.width + ringOuter,
    ...roads.filter(road => road.id.startsWith('organic-ring-')).flatMap(road => road.points.map(([x]) => x)));
  const homes = [
    ['villa-hip', -.85, -.75, 1.18],
    ['cottage-gable', .95, -.6, 1.02],
    ['res-mono-limestone', -.95, 1.04, 1.06],
    ['villa-hip', .82, 1.22, 1.12],
    ['cottage-gable', 2.35, .43, .98],
  ] as const;
  const repositorySites = [...sites].flatMap(([band, site]) => {
    const middle = (site.z + site.end) / 2;
    for (const margin of [3.6, 6.5, 9.4, 12.3]) for (const dz of [0, -3, 3, -6, 6]) {
      const x = outside + margin, z = middle + dz;
      if (z < site.z + 1.5 || z > site.end - 1.5) continue;
      if (homes.every(([, ox, oz, size]) => clearsTerrain(x + ox, z + oz, size / 2) && clearsRoad(x + ox, z + oz, size / 2))) {
        return [{ band, firstYear: site.firstYear, lastYear: site.lastYear,
          items: homes.map(([id, ox, oz, size]) => ornament(id, x + ox, z + oz, size)) }];
      }
    }
    return [];
  });

  const cottages = [[0, 0], [1.8, .4], [.5, 1.65], [-1.3, 1.4]] as const;
  for (const [x, center] of [[-ringOuter - 12, scene.depth * .64], [outside + 14, scene.depth * .23]]) {
    for (const dz of [0, -7, 7, -14, 14]) {
      const z = center + dz;
      if (!clearsTerrain(x, z, 2.6) || !clearsRoad(x, z, 2.6)) continue;
      cottages.forEach(([ox, oz], index) =>
        scenery.push(ornament(index === 1 ? 'villa-hip' : 'cottage-gable', x + ox, z + oz, index === 1 ? 1 : .88)));
      break;
    }
  }
  return { scenery, repositorySites };
}
