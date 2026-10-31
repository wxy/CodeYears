import type { DailyContribution } from "../data/types";

export type CityKind = "grass" | "shrub" | "tree" | "building";
export interface CityParcel {
  x: number; z: number; w: number; d: number;
  block: number; band: number; kind: CityKind;
  indices: number[]; count: number; mean: number;
}
export interface WeeklyCity {
  columns: number; rows: number; blocks: number;
  districts: { year: number; weeks: number; monday: number }[];
  cells: CityParcel[]; parcels: CityParcel[];
}

/** 每年一条横向街区：周为列，周一至周日为行。年首尾不足周不丢日期。 */
export function planWeeklyCity(days: readonly DailyContribution[], step: 1 | 2 | 4 = 1): WeeklyCity {
  const years = [...new Set(days.map(day => Number(day.date.slice(0, 4))))];
  const districts = years.map(year => {
    const first = Date.UTC(year, 0, 1), weekday = (new Date(first).getUTCDay() + 6) % 7, monday = first - weekday * 86400000;
    return { year, monday, weeks: Math.ceil((Date.UTC(year + 1, 0, 1) - monday) / 604800000) };
  });
  const byYear = new Map(districts.map((district, index) => [district.year, index]));
  const columns = Math.max(...districts.map(district => district.weeks)), rows = years.length, blocks = rows;
  const strongest = Math.max(...days.map(day => Math.log1p(Math.max(0, day.count - 5))), 1);
  const groups = new Map<string, CityParcel>();
  days.forEach((day, index) => {
    const block = byYear.get(Number(day.date.slice(0, 4)))!, district = districts[block];
    const offset = Math.round((Date.parse(`${day.date}T00:00:00Z`) - district.monday) / 86400000);
    const week = Math.floor(offset / 7), x = Math.floor(week / step) * step, z = offset % 7;
    const key = `${block},${x},${z}`;
    let cell = groups.get(key);
    if (!cell) { cell = { x, z, w: Math.min(step, district.weeks - x), d: 1, block, band: 0, kind: "grass", indices: [], count: 0, mean: 0 }; groups.set(key, cell); }
    cell.indices.push(index); cell.count += day.count;
  });
  const cells = [...groups.values()].sort((a, b) => a.block - b.block || a.z - b.z || a.x - b.x);
  for (const cell of cells) {
    cell.mean = cell.count / cell.indices.length;
    cell.kind = cell.mean === 0 ? "grass" : cell.mean <= 2 ? "shrub" : cell.mean <= 5 ? "tree" : "building";
    cell.band = cell.kind === "building" ? Math.max(1, Math.ceil(Math.log1p(cell.mean - 5) / strongest * 4)) : 0;
  }
  const used = new Set<CityParcel>(), parcels: CityParcel[] = [];
  for (const cell of cells) {
    if (used.has(cell)) continue;
    let w = cell.w, d = 1;
    const members = [cell];
    const matches = (other: CityParcel | undefined): other is CityParcel => !!other && !used.has(other) && other.kind === "building" && other.band === cell.band;
    if (cell.kind === "building") {
      while (cell.x + w < districts[cell.block].weeks && w < 8) {
        const next = groups.get(`${cell.block},${cell.x + w},${cell.z}`);
        if (!matches(next)) break;
        members.push(next); w += next.w;
      }
      while (cell.z + d < 7 && d < 4) {
        const row: CityParcel[] = [];
        for (let x = cell.x; x < cell.x + w; x += step) {
          const next = groups.get(`${cell.block},${x},${cell.z + d}`);
          if (!matches(next)) break;
          row.push(next);
        }
        if (row.length !== Math.ceil(w / step)) break;
        members.push(...row); d++;
      }
    }
    members.forEach(member => used.add(member));
    const indices = members.flatMap(member => member.indices), count = members.reduce((sum, member) => sum + member.count, 0);
    parcels.push({ ...cell, w, d, indices, count, mean: count / indices.length });
  }
  return { columns, rows, blocks, districts, cells, parcels };
}
