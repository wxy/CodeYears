import type { RepositoryCreation } from '../data/repository-creations';
import { cityRoadWidth, isCityOuterRing, planRoadGeometry, type CityRoadRoute } from './city-roads';
import { CITY_RIVER_BANK_DEPTH } from './city-layout';
import { cityTreeClearsBridges } from './city-road-network';
import type { CityScene, CitySceneItem } from './city-view';

export const CITY_ROADSIDE_ASSETS = ['broadleaf-a', 'cottage-gable', 'villa-hip', 'res-mono-limestone'] as const;

const ornament = (id: string, x: number, z: number, factor: number): CitySceneItem =>
  ({ id, x: x - factor / 2, z: z - factor / 2, w: factor, d: factor, factor, flat: false });

export function planCityRoadside(scene: CityScene, highways: readonly CityRoadRoute[],
  clearsTerrain: (x: number, z: number, margin: number) => boolean) {
  const { roads, junctions, ringOuter, bridges } = scene.roadNetwork;
  const edges = [...roads, ...highways].flatMap(route => planRoadGeometry(route).straights.map(({ a, b }) => {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return { route, a, b, length, dx: (b[0] - a[0]) / length, dz: (b[1] - a[1]) / length, half: cityRoadWidth(route) / 2 };
  })).filter(edge => edge.length > 0);
  type RoadEdge = typeof edges[number];
  const vergePoint = (edge: RoadEdge, along: number, offset: number) => ({
    x: edge.a[0] + edge.dx * along - edge.dz * offset,
    z: edge.a[1] + edge.dz * along + edge.dx * offset,
  });
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
    // 宽冠树沿两条斜向道路投影后仍能相接。窄路缩小树和株距。
    const factor = route.lanes === 2 ? .74 : .94;
    const spacing = factor * .78;
    for (let distance = 1.25; distance <= length - 1.25; distance += spacing) {
      for (const side of [-1, 1]) {
        const verge = side * (half + .18);
        const x = a[0] + dx * distance - dz * verge, z = a[1] + dz * distance + dx * verge;
        if (junctions.some(junction => Math.hypot(x - junction.x, z - junction.z) < junction.radius + .48) ||
            (isCityOuterRing(route) && !clearsTerrain(x, z, .22)) ||
            scene.rivers?.some(river => x > river.left && x < river.right &&
              z > river.top + CITY_RIVER_BANK_DEPTH && z < river.bottom - CITY_RIVER_BANK_DEPTH) ||
            !clearsRoad(x, z, .22, route) ||
            !cityTreeClearsBridges(x - factor / 2, z - factor / 2, factor, factor, bridges)) continue;
        const key = `${Math.round(x * 2)},${Math.round(z * 2)}`;
        if (treePositions.has(key)) continue;
        treePositions.add(key);
        scenery.push(ornament('broadleaf-a', x, z, factor));
      }
    }
  }

  const outside = Math.max(scene.width + ringOuter,
    ...roads.filter(road => road.id.startsWith('organic-ring-')).flatMap(road => road.points.map(([x]) => x)));
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
  function repositorySites(entries: readonly RepositoryCreation[]) {
    const districts = scene.layout.districts;
    const selected = new Set(districts.map(district => district.year));
    const active = entries.map(entry => ({
      entry, year: Number(entry.date.slice(0, 4)), side: Number(entry.date.slice(5, 7)) <= 6 ? -1 : 1,
    }))
      .filter(({year}) => selected.has(year));
    const homes = [[-.43, 0, .82], [.43, 0, .76], [0, .72, .64]] as const;
    const models = ['villa-hip', 'cottage-gable', 'res-mono-limestone'];
    const yearAt = (z: number) => districts.reduce((nearest, district) =>
      Math.abs(z - district.z - 3.5) < Math.abs(z - nearest.z - 3.5) ? district : nearest).year;
    return [-1, 1].flatMap(side => {
      const records = active.filter(record => record.side === side);
      if (!records.length) return [];
      // 东西外缘沿 Z 延伸。闭环顺时针，前进方向 dz 的符号就是向外的东西侧。
      const sideEdges = edges.filter(({route, dx, dz}) => isCityOuterRing(route) && dx === 0 && side * dz > 0);
      const frontages = new Map<number, { edge: RoadEdge; bank: number; start: number; end: number }[]>();
      function addFrontages(edge: RoadEdge, bank: number, from: number, to: number, frontageYear: (z: number) => number | undefined) {
        const cells = Math.ceil((to - from) / .5), step = (to - from) / cells;
        for (let i = 0; i < cells; i++) {
          const start = from + i * step;
          const {x, z} = vergePoint(edge, start + step / 2, bank * (edge.half + 1.15));
          const year = frontageYear(z);
          if (year === undefined || !clearsRoad(x, z, .98) || !clearsTerrain(x, z, 1.05)) continue;
          let spans = frontages.get(year);
          if (!spans) { spans = []; frontages.set(year, spans); }
          const last = spans.at(-1), end = start + step;
          if (last?.edge === edge && last.bank === bank && Math.abs(last.end - start) < 1e-6) last.end = end;
          else spans.push({edge, bank, start, end});
        }
      }
      for (const edge of sideEdges) {
        const inset = Math.min(.62, edge.length / 4);
        addFrontages(edge, -1, inset, edge.length - inset, z => {
          // 取整个城区这一横截面最外侧的道路，避开内收街角和两片城区之间的边缘。
          const inside = sideEdges.some(other => side * (other.a[0] - edge.a[0]) > 0 &&
            z >= Math.min(other.a[1], other.b[1]) && z <= Math.max(other.a[1], other.b[1]));
          return inside ? undefined : yearAt(z);
        });
      }
      for (const route of highways) {
        const edge = edges.find(candidate => candidate.route === route);
        if (!edge || edge.dz !== 0 || side * edge.dx <= 0) continue;
        const year = yearAt(edge.a[1]);
        if (frontages.has(year) || !records.some(record => record.year === year)) continue;
        // 同年外环被路口占满时，沿出城路两侧靠城的直段排，留开路口与远端指路牌。
        for (const bank of [-1, 1]) {
          addFrontages(edge, bank, 3, Math.min(10, edge.length), () => year);
        }
      }
      if (!frontages.size) return [];
      const frontageYears = [...frontages.keys()];
      const lots = new Map<number, typeof records>();
      for (const record of records) {
        // 同年路段不足时仍留在原有一侧，卡片保留真实创建年份。
        const year = frontageYears.reduce((nearest, candidate) =>
          Math.abs(record.year - candidate) < Math.abs(record.year - nearest) ? candidate : nearest);
        const group = lots.get(year);
        if (group) group.push(record); else lots.set(year, [record]);
      }
      const occupied: { x: number; z: number; halfX: number; halfZ: number }[] = [];
      return [...lots].flatMap(([year, group]) => {
        const spans = frontages.get(year)!;
        const fronts = spans.flatMap(({edge, bank, start, end}) => {
          const count = Math.max(1, Math.floor((end - start) / 1.9));
          return Array.from({length: count}, (_, i) => ({edge, bank, along: start + (end - start) * (i + .5) / count}));
        });
        const positions: { x: number; z: number; edge: RoadEdge; bank: number }[] = [];
        // 院落用固定尺寸。第一排贴路，空位不足时从同一段路继续向外排。
        for (let row = 0; positions.length < group.length; row++) {
          for (const {edge, bank, along} of fronts) {
            const {x, z} = vergePoint(edge, along, bank * (edge.half + 1.23 + row * 1.65));
            const halfX = edge.dx === 0 ? .8 : .9, halfZ = edge.dx === 0 ? .9 : .8;
            if (occupied.some(lot => Math.abs(x - lot.x) < lot.halfX + halfX && Math.abs(z - lot.z) < lot.halfZ + halfZ) ||
              !clearsRoad(x, z, .94) || !clearsTerrain(x, z, 1.05)) continue;
            positions.push({x, z, edge, bank});
            occupied.push({x, z, halfX, halfZ});
            if (positions.length === group.length) break;
          }
        }
        return group.sort((a, b) => a.entry.date.localeCompare(b.entry.date) || a.entry.name.localeCompare(b.entry.name))
          .map(({entry, year}, index) => {
            const {x, z, edge, bank} = positions[index];
            const items = homes.map(([offset, depth, size], house) => {
              const setback = bank * (depth + size / 2 - .68);
              const homeX = x + edge.dx * offset - edge.dz * setback;
              const homeZ = z + edge.dz * offset + edge.dx * setback;
              return ornament(models[(index + house) % models.length], homeX, homeZ, size);
            });
            return {entry, year, items};
          });
      });
    });
  }
  return { scenery, repositorySites };
}
