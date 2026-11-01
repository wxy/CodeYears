import type { DailyContribution } from "../data/types";
import { isoWeekDate, isoYearStart, isoYearWeeks } from "../data/iso-week";
import { planCityWonders } from './city-wonders';

export type CityKind = "grass" | "shrub" | "tree" | "building";
export interface CityParcel {
  x: number; z: number; w: number; d: number;
  block: number; band: number; kind: CityKind;
  indices: number[]; count: number; mean: number;
  wonder?: 'wonder-stadium' | 'wonder-theater' | 'wonder-park';
}
export interface WeeklyCity {
  columns: number; rows: number; blocks: number;
  districts: { year: number; weeks: number; monday: number; breaks: number[] }[];
  cells: CityParcel[]; parcels: CityParcel[];
}

/** ISO周年一条街区，完整周一至周日同属一个block；只使用实际输入日期。 */
export function planWeeklyCity(days: readonly DailyContribution[], mergeTallRectangles = false, wonders = false, reservedYears?: readonly number[]): WeeklyCity {
  const dates = days.map(day => isoWeekDate(day.date));
  // 预留年份仅决定场地坐标；尚未收到的日期不生成零值cell。
  const years = [...(reservedYears ?? new Set(dates.map(date => date.year)))].sort((a,b)=>a-b);
  const districts = years.map(year => ({ year, monday: isoYearStart(year), weeks: isoYearWeeks(year), breaks: [13,26,39] }));
  const byYear = new Map(districts.map((district, index) => [district.year, index]));
  const columns = Math.max(0,...districts.map(district => district.weeks)), rows = years.length, blocks = rows;
  const strongest = Math.max(...days.map(day => Math.log1p(Math.max(0, day.count - 5))), 1);
  const groups = new Map<string, CityParcel>();
  days.forEach((day, index) => {
    const date = dates[index], block = byYear.get(date.year)!;
    const x = date.week - 1, z = date.weekday - 1;
    const key = `${block},${x},${z}`;
    groups.set(key, { x, z, w: 1, d: 1, block, band: 0, kind: "grass", indices: [index], count: day.count, mean: day.count });
  });
  const cells = [...groups.values()].sort((a, b) => a.block - b.block || a.z - b.z || a.x - b.x);
  for (const cell of cells) {
    cell.mean = cell.count / cell.indices.length;
    cell.kind = cell.mean === 0 ? "grass" : cell.mean <= 2 ? "shrub" : cell.mean <= 5 ? "tree" : "building";
    cell.band = cell.kind === "building" ? Math.max(1, Math.ceil(Math.log1p(cell.mean - 5) / strongest * 4)) : 0;
  }
  const parcels: CityParcel[] = wonders ? planCityWonders(cells, districts) : [];
  const reserved = new Set(parcels.flatMap(parcel => parcel.indices));
  const used = new Set(cells.filter(cell => reserved.has(cell.indices[0])));
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
