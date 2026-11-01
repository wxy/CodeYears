import type { CityParcel } from './city-parcels';

/** 仅用于已规划的合法建筑地块；seed 由调用方按年份和成员日期稳定生成。 */
export function selectCityBuilding(parcel: CityParcel, seed: number): { id: string; factor: number } {
  const variant = (seed >>> 0) % 2 === 0 ? 'a' : 'b';
  const { band, w } = parcel;
  if (band === 1) {
    const id = w === 3 ? (variant === 'a' ? 'stadium-a' : 'terminal-b')
      : w === 2 ? (variant === 'a' ? 'police-a' : 'fire-b')
      : variant === 'a' ? 'townhouse-a' : 'mixed-use-b';
    return { id, factor: 1 };
  }
  if (band === 2) {
    return w === 2
      ? { id: variant === 'a' ? 'townhouse-a' : 'mixed-use-b', factor: 2 }
      : { id: `apartment-h2-${variant}`, factor: 1 };
  }
  if (band === 3) return { id: `office-h3-${variant}`, factor: 1 };
  return w === 2
    ? { id: `apartment-h2-${variant}`, factor: 2 }
    : { id: `tower-h4-${variant}`, factor: 1 };
}
