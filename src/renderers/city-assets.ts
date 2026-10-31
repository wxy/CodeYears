export type BuildingType = "house" | "apartment" | "office" | "tower" | "hall" | "stadium";
export interface SpriteSpec { file: string; crop: readonly [number, number, number, number]; anchor: readonly [number, number]; floorAngles: readonly [number, number]; }
/** 原图保留不变；绘制时应用裁切框、落地点与底边投影标定。 */
export const CITY_SPRITES: Record<BuildingType, SpriteSpec> = {
  "house": {
    "file": "house.png",
    "crop": [
      53,
      58,
      1164,
      1180
    ],
    "anchor": [
      582.0,
      889.0
    ],
    "floorAngles": [17.75, 36.25]
  },
  "apartment": {
    "file": "apartment.png",
    "crop": [
      75,
      110,
      1124,
      1099
    ],
    "anchor": [
      562.0,
      818.0
    ],
    "floorAngles": [23, 26]
  },
  "office": {
    "file": "office.png",
    "crop": [
      67,
      135,
      1156,
      1027
    ],
    "anchor": [
      578.0,
      738.0
    ],
    "floorAngles": [27.5, 30]
  },
  "tower": {
    "file": "tower.png",
    "crop": [
      188,
      32,
      892,
      1205
    ],
    "anchor": [
      446.0,
      982.0
    ],
    "floorAngles": [22, 32.5]
  },
  "hall": {
    "file": "hall.png",
    "crop": [
      10,
      340,
      1237,
      687
    ],
    "anchor": [
      618.5,
      377.75
    ],
    "floorAngles": [20.75, 28.75]
  },
  "stadium": {
    "file": "stadium.png",
    "crop": [
      11,
      213,
      1235,
      904
    ],
    "anchor": [
      617.5,
      595.25
    ],
    "floorAngles": [27.75, 29]
  }
};

/** 量测主底边；在绘制时统一为地图 ±atan(1/2)，竖直边保持竖直。 */
export const CITY_PROJECTIONS = Object.fromEntries(Object.entries(CITY_SPRITES).map(([id, spec]) => {
  const left = Math.tan(spec.floorAngles[0] * Math.PI / 180), right = Math.tan(spec.floorAngles[1] * Math.PI / 180);
  return [id, { shear: (right - left) / (2 * (left + right)), scaleY: 1 / (left + right) }];
})) as Record<BuildingType, { shear: number; scaleY: number }>;

export type CityImages = Record<BuildingType, ImageBitmap>;
export async function loadCityImages(base: string): Promise<CityImages> {
  const ids = Object.keys(CITY_SPRITES) as BuildingType[];
  const results = await Promise.allSettled(ids.map(async id => {
    const response = await fetch(new URL(CITY_SPRITES[id].file, base));
    if (!response.ok) throw new Error(`建筑素材读取失败（${response.status}），请重新生成。`);
    return createImageBitmap(await response.blob(), { resizeWidth: 640, resizeHeight: 640, resizeQuality: "high" });
  }));
  if (results.some(result => result.status === "rejected")) {
    for (const result of results) if (result.status === "fulfilled") result.value.close();
    throw new Error("建筑素材加载失败，请重新生成风景。");
  }
  return Object.fromEntries(results.map((result, index) => [ids[index], (result as PromiseFulfilledResult<ImageBitmap>).value])) as CityImages;
}
export const closeCityImages = (images: CityImages) => Object.values(images).forEach(bitmap => bitmap.close());
