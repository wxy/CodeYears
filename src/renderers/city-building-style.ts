import type { CityParcel } from './city-parcels';

// 公共设施只是外观变体；仅使用兼容占地的低/中层地块，不改变贡献档或合并。
const PUBLIC_VARIANTS:Record<string,readonly string[]>={
  '1:1x1':['civic-clinic','civic-post'],
  '1:2x1':['civic-school','ct-market-hall','fire-b','police-a'],
  '1:1x2':['civic-library','ct-bus-station','ct-music-hall','ct-community-gym'],
  '2:1x1':['ct-clock-culture'],
  '2:2x2':['civic-center','ct-museum'],
};

/** 仅用于已规划的合法建筑地块；由调用方提供稳定 seed，不随缩放或播放变化。 */
export function selectCityBuilding(parcel: CityParcel, seed: number): { id: string; factor: number } {
  const variant = (seed >>> 0) % 2 === 0 ? 'a' : 'b';
  const { band, w, d } = parcel;
  const mixed=Math.imul(seed^(seed>>>16),0x45d9f3b),appearanceSeed=(mixed^(mixed>>>16))>>>0;
  const publicPool=PUBLIC_VARIANTS[`${band}:${w}x${d}`];
  if(publicPool&&appearanceSeed%8===0)return {id:publicPool[(appearanceSeed>>>3)%publicPool.length],factor:1};
  if (band === 0) return { id: ['cottage-gable', 'villa-hip', 'courtyard-flat', 'garden-butterfly','res-mono-limestone','res-vault-brick'][appearanceSeed%6], factor: 1 };
  if (band === 1) {
    const pool = w === 2 ? ['row-wide','shop-wide','res-grocer-wide']
      : d === 2 ? ['row-deep','shop-deep','res-bakery-deep']
      : ['low-gable','low-terrace','res-mansard-stucco','res-sawtooth-duplex'];
    return { id:pool[(appearanceSeed>>>3)%pool.length], factor: 1 };
  }
  if (band === 2) {
    return w === 2
      ? { id: variant === 'a' ? 'townhouse-a' : 'mixed-use-b', factor: 2 }
      : { id: ['apartment-h2-a','apartment-h2-b','res-terracotta-apartment','res-limestone-bay'][(appearanceSeed>>>3)%4], factor: 1 };
  }
  if (band === 3) {
    return { id: w === 2 ? `office-wide-h3-${variant}`
      : d === 2 ? `office-deep-h3-${variant}` : `office-h3-${variant}`, factor: 1 };
  }
  if (w === 2 && d === 2) return { id: `apartment-h2-${variant}`, factor: 2 };
  return { id: w === 2 ? `tower-wide-h4-${variant}`
    : d === 2 ? `tower-deep-h4-${variant}` : `tower-h4-${variant}`, factor: 1 };
}
