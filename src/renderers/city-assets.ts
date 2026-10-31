export type BuildingType = "house" | "apartment" | "office" | "tower" | "hall" | "stadium";
export interface SpriteSpec { file: string; crop: readonly [number, number, number, number]; anchor: readonly [number, number]; }
/** 原图保留不变；裁切框/落地点在绘制时使用，同一地面单位且保持宽高比。 */
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
  }
};

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
