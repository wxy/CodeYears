import { CITY_UNIT_CATALOG } from './city-unit-catalog';
import { calibrate, drawUnit, loadUnit, project, type Point, type UnitImage, type UnitSample } from './unit-calibration';

export interface CitySprite {
  canvas: HTMLCanvasElement;
  left: number; top: number; width: number; height: number;
  nativeWidth: number; nativeDepth: number;
  baselineHeight: number;
  sampleId: string;
}
export type CityImages = Record<string, CitySprite>;

/** 三角地表映射与方向校正在加载时只画一次；逐帧仅复用透明画布。 */
function bakeUnit(sample: UnitSample, image: UnitImage): CitySprite {
  const calibration = calibrate(sample), [w, d] = sample.footprint, [x0, y0, x1, y1] = sample.crop;
  const points: Point[] = sample.kind === 'ground'
    ? [-.25, 1.25].flatMap(u => [-.25, 1.25].map(v => project(u * w, v * d)))
    : ([[x0, y0], [x1, y0], [x1, y1], [x0, y1]] as Point[]).map(calibration.point);
  const minX = Math.min(...points.map(p => p[0])), maxX = Math.max(...points.map(p => p[0]));
  const minY = Math.min(...points.map(p => p[1])), maxY = Math.max(...points.map(p => p[1]));
  const padding = 2, ratio = Math.min(4, (384 - padding * 2) / Math.max(maxX - minX, maxY - minY));
  const canvas = document.createElement('canvas');
  canvas.width = Math.min(384, Math.ceil((maxX - minX) * ratio) + padding * 2);
  canvas.height = Math.min(384, Math.ceil((maxY - minY) * ratio) + padding * 2);
  try {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('无法创建城市素材画布。');
    context.setTransform(ratio, 0, 0, ratio, padding - minX * ratio, padding - minY * ratio);
    context.imageSmoothingQuality = 'high';
    drawUnit(context, sample, image, true, true);
    // 标定投影 W=(48,24)、D=(-48,24)；City 的同一地块为 (.5,.25)。
    return {
      canvas, left: (minX - padding / ratio) / 96, top: (minY - padding / ratio) / 96,
      width: canvas.width / ratio / 96, height: canvas.height / ratio / 96,
      nativeWidth: w, nativeDepth: d, baselineHeight: calibration.actualHeight, sampleId: sample.id,
    };
  } catch (error) {
    canvas.width = canvas.height = 0;
    throw error;
  }
}

export async function loadCityImages(base: string, ids: readonly string[], signal?: AbortSignal): Promise<CityImages> {
  const files = new Map<string, { id: string; sample: UnitSample }[]>();
  for (const id of new Set(ids)) {
    const entry = CITY_UNIT_CATALOG[id];
    if (!entry) throw new Error(`未找到城市素材：${id}`);
    const variants = files.get(entry.file) ?? [];
    variants.push({ id, sample: entry.sample }); files.set(entry.file, variants);
  }
  const results = await Promise.allSettled([...files].map(async ([file, variants]) => {
    const image = await loadUnit(new URL(file, base).href, signal), sprites: CityImages = {};
    try {
      signal?.throwIfAborted();
      for (const { id, sample } of variants) sprites[id] = bakeUnit(sample, image);
      return sprites;
    } catch (error) {
      closeCityImages(sprites);
      throw error;
    } finally {
      image.close();
    }
  }));
  const images: CityImages = {};
  for (const result of results) if (result.status === 'fulfilled') Object.assign(images, result.value);
  const failed = results.find(result => result.status === 'rejected');
  if (failed) {
    closeCityImages(images);
    throw new Error('城市素材加载失败，请重新生成风景。', { cause: failed.reason });
  }
  return images;
}

export const closeCityImages = (images: CityImages) => Object.values(images).forEach(sprite => {
  sprite.canvas.width = sprite.canvas.height = 0;
});
