import type { CityParcel, WeeklyCity } from './city-parcels';

/** 地面类型取决于同年度邻域，只在创建城市时选择，不改原始贡献或地块。 */
export function createGroundSelector(weekly: WeeklyCity): (parcel: CityParcel, seed: number) => { id: string; factor: number; flat: boolean } {
  const cells = new Map(weekly.cells.map(cell => [`${cell.block},${cell.x},${cell.z}`, cell]));
  return (parcel, seed) => {
    let total = 0, low = 0, buildings = 0;
    for (let z = parcel.z - 2; z < parcel.z + parcel.d + 2; z++) {
      for (let x = parcel.x - 2; x < parcel.x + parcel.w + 2; x++) {
        const cell = cells.get(`${parcel.block},${x},${z}`);
        if (!cell) continue;
        total++;
        if (cell.kind === 'building') buildings++; else low++;
      }
    }
    const value = seed >>> 0, variant = value % 2 ? 'b' : 'a';
    const square = parcel.w === 2 && parcel.d === 2;
    if (low / total >= .8 && buildings <= 2) {
      if (square && total >= 12 && value % 24 < 2) return { id: value % 24 === 0 ? 'pond-a' : 'pond-b', factor: 1, flat: true };
      if (value % 5 === 0) return { id: square ? `forest-2x2-${variant}` : variant === 'a' ? 'broadleaf-a' : 'conifer-b', factor: square ? 1 : .65, flat: false };
      return { id: `grass-${square ? '2x2' : '1x1'}-${variant}`, factor: 1, flat: true };
    }
    if (square && buildings >= 4 && buildings / total >= 1 / 3 && value % 6 === 0) {
      return { id: Math.floor(value / 6) % 2 ? 'plaza-b' : 'plaza-a', factor: 1, flat: true };
    }
    return { id: 'urban-paving', factor: square ? 2 : 1, flat: true };
  };
}
