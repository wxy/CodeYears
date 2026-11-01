import type { DailyContribution } from "../data/types";

export type CityKind = "grass" | "shrub" | "tree" | "building";
export interface CityParcel {
  x: number; z: number; w: number; d: number;
  block: number; band: number; kind: CityKind;
  indices: number[]; count: number; mean: number;
}
export interface WeeklyCity {
  columns: number; rows: number; blocks: number;
  districts: { year: number; weeks: number; monday: number; breaks: number[] }[];
  cells: CityParcel[]; parcels: CityParcel[];
}

/** 每年一条横向街区：周为列，周一至周日为行。年首尾不足周不丢日期。 */
export function planWeeklyCity(days: readonly DailyContribution[], mergeTallRectangles = false): WeeklyCity {
  const years = [...new Set(days.map(day => Number(day.date.slice(0, 4))))];
  const districts = years.map(year => {
    const first = Date.UTC(year, 0, 1), weekday = (new Date(first).getUTCDay() + 6) % 7, monday = first - weekday * 86400000;
    return { year, monday, weeks: Math.ceil((Date.UTC(year + 1, 0, 1) - monday) / 604800000), breaks: [] as number[] };
  });
  const byYear = new Map(districts.map((district, index) => [district.year, index]));
  const columns = Math.max(...districts.map(district => district.weeks)), rows = years.length, blocks = rows;
  const strongest = Math.max(...days.map(day => Math.log1p(Math.max(0, day.count - 5))), 1);
  const groups = new Map<string, CityParcel>();
  days.forEach((day, index) => {
    const block = byYear.get(Number(day.date.slice(0, 4)))!, district = districts[block];
    const offset = Math.round((Date.parse(`${day.date}T00:00:00Z`) - district.monday) / 86400000);
    const x = Math.floor(offset / 7), z = offset % 7;
    const key = `${block},${x},${z}`;
    groups.set(key, { x, z, w: 1, d: 1, block, band: 0, kind: "grass", indices: [index], count: day.count, mean: day.count });
  });
  const cells = [...groups.values()].sort((a, b) => a.block - b.block || a.z - b.z || a.x - b.x);
  districts.forEach((district, block) => {
    const weeks = cells.filter(cell => cell.block === block).map(cell => cell.x);
    const firstWeek = Math.min(...weeks), lastWeek = Math.max(...weeks);
    district.breaks = [3, 6, 9]
      .map(month => Math.round((Date.UTC(district.year, month, 1) - district.monday) / 604800000))
      .filter(week => firstWeek < week && week <= lastWeek);
  });
  for (const cell of cells) {
    cell.mean = cell.count / cell.indices.length;
    cell.kind = cell.mean === 0 ? "grass" : cell.mean <= 2 ? "shrub" : cell.mean <= 5 ? "tree" : "building";
    cell.band = cell.kind === "building" ? Math.max(1, Math.ceil(Math.log1p(cell.mean - 5) / strongest * 4)) : 0;
  }
  const used = new Set<CityParcel>(), parcels: CityParcel[] = [];
  for (const cell of cells) {
    if (used.has(cell)) continue;
    // 新长条与素材/选择调用一起显式启用；默认保留原有合法占地。
    const sizes: [number, number][] = cell.kind === "building"
      ? cell.band === 1 ? [[3, 3], [2, 1], [1, 1]]
        : cell.band === 2 ? [[2, 2], [1, 1]]
        : cell.band === 3 ? (mergeTallRectangles ? [[2, 1], [1, 2], [1, 1]] : [[1, 1]])
        : mergeTallRectangles ? [[2, 2], [2, 1], [1, 2], [1, 1]] : [[2, 2], [1, 1]]
      : cell.kind === "tree" ? [[2, 2], [2, 1], [1, 2], [1, 1]]
      : cell.kind === "grass" ? [[2, 2], [1, 1]] : [[1, 1]];
    let w = 1, d = 1, members = [cell];
    candidate: for (const [width, depth] of sizes) {
      const district = districts[cell.block];
      if (cell.x + width > district.weeks || cell.z + depth > 7 || district.breaks.some(week => cell.x < week && week < cell.x + width)) continue;
      const rectangle: CityParcel[] = [];
      for (let z = cell.z; z < cell.z + depth; z++) {
        for (let x = cell.x; x < cell.x + width; x++) {
          const next = groups.get(`${cell.block},${x},${z}`);
          if (!next || used.has(next) || next.kind !== cell.kind || next.band !== cell.band) continue candidate;
          rectangle.push(next);
        }
      }
      w = width; d = depth; members = rectangle;
      break;
    }
    members.forEach(member => used.add(member));
    const indices = members.flatMap(member => member.indices), count = members.reduce((sum, member) => sum + member.count, 0);
    parcels.push({ ...cell, w, d, indices, count, mean: count / indices.length });
  }
  return { columns, rows, blocks, districts, cells, parcels };
}
