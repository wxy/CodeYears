import catalog from './city-baked-catalog.json';
import { createCityDecoration } from './city-decorations';
import { CITY_GROUND_ATLAS, prepareCityGroundAtlas } from './city-ground-tiles';

export interface CitySprite {
  canvas: HTMLCanvasElement;
  groundDetail?: HTMLCanvasElement;
  left: number; top: number; width: number; height: number;
  nativeWidth: number; nativeDepth: number;
  baselineHeight: number;
  sampleId: string;
}
export type CityImages = Record<string, CitySprite>;
const sprites: Record<string, Omit<CitySprite, 'canvas'> & { file: string }> = catalog;

/** 直接载入已标定的运行PNG；源图转换由本地素材生成器完成。 */
export async function loadCityImages(base: string, ids: readonly string[], signal?: AbortSignal): Promise<CityImages> {
  const images: CityImages = {};
  try {
    signal?.throwIfAborted();
    const requests = [...new Set(ids)].map(async id => {
      const decoration = createCityDecoration(id);
      if (decoration) return { [id]: decoration };
      const entry = sprites[id];
      if (!entry) throw new Error(`未找到城市素材：${id}`);
      const response = await fetch(new URL(entry.file, base), { signal });
      if (!response.ok) throw new Error(`素材读取失败：${response.status}`);
      const bitmap = await createImageBitmap(await response.blob());
      const canvas = document.createElement('canvas');
      try {
        signal?.throwIfAborted();
        canvas.width = bitmap.width; canvas.height = bitmap.height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('无法创建城市素材画布。');
        const groundAtlas = id === CITY_GROUND_ATLAS;
        // 仅在解码地纹时调色，复用同一张图和已有纹理缓存。
        if (groundAtlas) context.filter = 'brightness(1.11) saturate(1.18) hue-rotate(12deg)';
        context.drawImage(bitmap, 0, 0);
        if (groundAtlas) context.filter = 'none';
        const groundDetail = groundAtlas ? prepareCityGroundAtlas(context) : undefined;
        const { file: _file, ...metadata } = entry;
        return { [id]: { canvas, ...metadata, groundDetail } };
      } catch (error) {
        canvas.width = canvas.height = 0;
        throw error;
      } finally { bitmap.close(); }
    });
    const results = await Promise.allSettled(requests);
    for (const result of results) if (result.status === 'fulfilled') Object.assign(images, result.value);
    const failed = results.find(result => result.status === 'rejected');
    if (failed) throw new Error('城市素材加载失败，请重新生成风景。', { cause: failed.reason });
    signal?.throwIfAborted();
    return images;
  } catch (error) {
    closeCityImages(images);
    throw error;
  }
}

export const closeCityImages = (images: CityImages) => Object.values(images).forEach(sprite => {
  sprite.canvas.width = sprite.canvas.height = 0;
  if(sprite.groundDetail)sprite.groundDetail.width=sprite.groundDetail.height=0;
});
