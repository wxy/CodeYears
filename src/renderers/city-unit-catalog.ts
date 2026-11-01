import buildings from '../../docs/design/city-units/v2/calibration/buildings.json';
import ground from '../../docs/design/city-units/v2/calibration/ground.json';
import vegetation from '../../docs/design/city-units/v2/calibration/vegetation.json';
import legacy from '../../docs/design/city-units/v2/calibration/legacy-buildings.json';
import h2 from '../../docs/design/city-units/v3/calibration/h2.json';
import h3 from '../../docs/design/city-units/v3/calibration/h3.json';
import h4 from '../../docs/design/city-units/v3/calibration/h4.json';
import type { UnitSample } from './unit-calibration';

/** 标定数据与预览共用；运行包只替换素材路径，不改写源图或坐标。 */
export const CITY_UNIT_CATALOG: Record<string, { sample: UnitSample; file: string }> = Object.fromEntries(
  ([...buildings.assets, ...ground.assets, ...vegetation.assets, ...h2.assets, ...h3.assets, ...h4.assets] as UnitSample[]).map(sample =>
    [sample.id, { sample, file: `unit-${sample.id}.png` }]),
);

for (const sample of legacy.assets as UnitSample[]) {
  CITY_UNIT_CATALOG[sample.id] = { sample, file: sample.file };
}

for (const [id, source] of [['sapling-a', 'broadleaf-a'], ['sapling-b', 'conifer-b']]) {
  const entry = CITY_UNIT_CATALOG[source];
  CITY_UNIT_CATALOG[id] = { file: entry.file, sample: { ...entry.sample, id, targetHeight: .35 } };
}
