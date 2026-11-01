import type { CityParcel, WeeklyCity } from './city-parcels';

/** 初版试排参数；只在普通合并前为完整矩形预留日期，不改变每日分类。 */
export function planCityWonders(cells: readonly CityParcel[], districts: WeeklyCity['districts']): CityParcel[] {
  const grid = new Map(cells.map(cell => [`${cell.block},${cell.x},${cell.z}`, cell]));
  const candidates: { parcel: CityParcel; density: number }[] = [];
  for (const cell of cells) {
    const district = districts[cell.block];
    for (const w of [4, 3]) {
      const d = 3;
      if (cell.x + w > district.weeks || cell.z + d > 7
        || district.breaks.some(week => cell.x < week && week < cell.x + w)) continue;
      const members: CityParcel[] = [];
      for (let z = cell.z; z < cell.z + d; z++) {
        for (let x = cell.x; x < cell.x + w; x++) {
          const member = grid.get(`${cell.block},${x},${z}`);
          if (member) members.push(member);
        }
      }
      const area = w * d;
      if (members.length !== area || members.filter(member => member.count > 0).length < Math.ceil(area * .9)
        || members.filter(member => member.count > 5).length < Math.ceil(area * .8)
        || members.filter(member => member.band >= 2).length < Math.ceil(area * .75)) continue;
      const indices = members.flatMap(member => member.indices);
      const count = members.reduce((sum, member) => sum + member.count, 0);
      const seed = (Math.imul(district.year, 73856093) ^ Math.imul(cell.x + 1, 19349663)
        ^ Math.imul(cell.z + 1, 83492791)) >>> 0;
      candidates.push({
        density: members.filter(member => member.count > 5).length / area,
        parcel: { ...cell, w, d, kind: 'building', band: Math.max(...members.map(member => member.band)),
          wonder: w === 3 ? 'wonder-theater' : seed % 2 === 0 ? 'wonder-stadium' : 'wonder-park',
          indices, count, mean: count / indices.length },
      });
    }
  }
  // 先建筑密度、再日均贡献；并列时按固定坐标与较宽占地确定顺序。
  candidates.sort((a, b) => b.density - a.density || b.parcel.mean - a.parcel.mean
    || a.parcel.block - b.parcel.block || a.parcel.z - b.parcel.z || a.parcel.x - b.parcel.x
    || b.parcel.w - a.parcel.w);
  const reserved = new Set<number>(), perYear = new Map<number, number>(), wonders: CityParcel[] = [];
  for (const { parcel } of candidates) {
    if ((perYear.get(parcel.block) ?? 0) >= 2 || parcel.indices.some(index => reserved.has(index))) continue;
    parcel.indices.forEach(index => reserved.add(index));
    perYear.set(parcel.block, (perYear.get(parcel.block) ?? 0) + 1);
    wonders.push(parcel);
  }
  return wonders;
}
