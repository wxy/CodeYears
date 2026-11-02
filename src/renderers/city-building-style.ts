import type { CityParcel } from './city-parcels';

/** 仅用于已规划的合法建筑地块；由调用方提供稳定 seed，不随缩放或播放变化。 */
export function selectCityBuilding(parcel: CityParcel, seed: number): { id: string; factor: number } {
  const variant = (seed >>> 0) % 2 === 0 ? 'a' : 'b';
  const { band, w, d } = parcel;
  if (band === 0) return { id: ['cottage-gable', 'villa-hip', 'courtyard-flat', 'garden-butterfly'][(seed >>> 0) % 4], factor: 1 };
  if (band === 1) {
    const id = w === 2 ? (variant === 'a' ? 'row-wide' : 'shop-wide')
      : d === 2 ? (variant === 'a' ? 'row-deep' : 'shop-deep')
      : variant === 'a' ? 'low-gable' : 'low-terrace';
    return { id, factor: 1 };
  }
  if (band === 2) {
    return w === 2
      ? { id: variant === 'a' ? 'townhouse-a' : 'mixed-use-b', factor: 2 }
      : { id: `apartment-h2-${variant}`, factor: 1 };
  }
  if (band === 3) {
    return { id: w === 2 ? `office-wide-h3-${variant}`
      : d === 2 ? `office-deep-h3-${variant}` : `office-h3-${variant}`, factor: 1 };
  }
  if (w === 2 && d === 2) return { id: `apartment-h2-${variant}`, factor: 2 };
  return { id: w === 2 ? `tower-wide-h4-${variant}`
    : d === 2 ? `tower-deep-h4-${variant}` : `tower-h4-${variant}`, factor: 1 };
}
