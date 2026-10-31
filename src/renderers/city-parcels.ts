import type { DailyContribution } from "../data/types";

/** 已由景观层按空间聚合的可信数据，不在内部重复校验。 */
export interface ContributionCell {
  x: number; z: number; w: number; d: number;
  end: number; count: number; mean: number;
}
export interface CityParcel extends ContributionCell {
  year: number;
  kind: "grass" | "shrub" | "tree" | "building";
  floors: number;
  cells: number;
  form: "garden" | "house" | "office" | "tower" | "hall" | "stadium";
}

/** 草木按日均量分层；建筑只在同年、同楼层且同一个 4×4 街区内合并。 */
export function planCityParcels(cells: readonly ContributionCell[], days: readonly DailyContribution[], columns: number, rows: number, strongest: number): CityParcel[] {
  const candidates = cells.map(cell => {
    const year = Number(days[cell.end - 1].date.slice(0, 4));
    const kind: CityParcel["kind"] = cell.mean === 0 ? "grass" : cell.mean <= 2 ? "shrub" : cell.mean <= 5 ? "tree" : "building";
    const nx = (cell.x + cell.w / 2) / columns, nz = (cell.z + cell.d / 2) / rows;
    const downtown = Math.exp(-((nx - 0.68) ** 2 + (nz - 0.43) ** 2) / 0.07);
    const floors = kind === "building" ? 2 + Math.round(Math.pow(Math.log1p(cell.mean) / strongest, 1.3) * (2.5 + downtown * 11)) : 0;
    return { ...cell, year, kind, floors, cells: 1, form: "garden" as CityParcel["form"] };
  }).sort((a, b) => a.z - b.z || a.x - b.x);
  const at = new Map(candidates.map(cell => [`${cell.x},${cell.z}`, cell]));
  const used = new Set<CityParcel>(), parcels: CityParcel[] = [];
  for (const cell of candidates) {
    if (used.has(cell)) continue;
    const members = [cell]; let w = cell.w, d = cell.d;
    // 跨年的宏观组可显示，但不能继续吞并别的年份地块。
    const singleYear = (candidate: CityParcel) => Number(days[candidate.z * columns + candidate.x].date.slice(0, 4)) === candidate.year;
    const compatible = (other: CityParcel | undefined): other is CityParcel => !!other && !used.has(other) && other.kind === "building" && other.year === cell.year && other.floors === cell.floors && singleYear(other);
    if (cell.kind === "building" && singleYear(cell)) {
      const right = (Math.floor(cell.x / 4) + 1) * 4, bottom = (Math.floor(cell.z / 4) + 1) * 4;
      while (cell.x + w < right) {
        const next = at.get(`${cell.x + w},${cell.z}`);
        if (!compatible(next) || next.d !== cell.d || cell.x + w + next.w > right) break;
        members.push(next); w += next.w;
      }
      while (cell.z + d < bottom) {
        const row: CityParcel[] = []; let x = cell.x, rowDepth = 0;
        while (x < cell.x + w) {
          const next = at.get(`${x},${cell.z + d}`);
          if (!compatible(next) || next.x + next.w > cell.x + w || (rowDepth && next.d !== rowDepth)) break;
          row.push(next); rowDepth = next.d; x += next.w;
        }
        if (x !== cell.x + w || cell.z + d + rowDepth > bottom) break;
        members.push(...row); d += rowDepth;
      }
    }
    members.forEach(member => used.add(member));
    const count = members.reduce((sum, member) => sum + member.count, 0), end = Math.max(...members.map(member => member.end));
    const signature = cell.x * 13 + cell.z * 7 + cell.year;
    let form: CityParcel["form"] = "garden";
    if (cell.kind === "building") {
      if (members.length > 1 && w >= 2 && d >= 2 && cell.floors <= 9 && signature % 3 === 0) form = "stadium";
      else if (members.length > 1 && cell.floors <= 8) form = "hall";
      else form = cell.floors <= 5 ? "house" : cell.floors <= 10 ? "office" : "tower";
    }
    parcels.push({ ...cell, w, d, count, end, mean: count / (w * d), cells: members.length, form });
  }
  return parcels;
}
