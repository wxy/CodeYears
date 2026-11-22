# 城郊山地、草场与地纹

2026-11-19 使用内置 ImageGen 生成远山、偏暖的开阔草场与雪山。远山和草场以项目已经使用的 `outskirts-hills.png` 作质感与光照参考，雪山以同批远山为参考。图像输入只有项目素材。

| 文件 | 规格 | 字节 | SHA-256 |
| --- | --- | ---: | --- |
| `mountains-source.png` | 1774 × 887，透明 PNG | 1,879,019 | `885db65c6b0913e9ff16ae30722a2bba6a9c327ce2255f4533f17accbda2f67c` |
| `public/assets/city-runtime/outskirts-mountains.png` | 1152 × 576，透明 PNG | 810,960 | `9bf9bdd1dc044ded4ff0d21cc59caf1cfba678d457814a86e5784ad19f9e2979` |
| `meadow-source.png` | 1774 × 887，透明 PNG | 2,640,291 | `070329b249f3e2e0fb09bd5961f8b57be984a405bdac3b8f33b54b5fa200b42b` |
| `public/assets/city-runtime/outskirts-dry-meadow.png` | 1152 × 576，透明 PNG | 1,084,661 | `58123cc33531b797ee227ce32c96fde2c993c0a314bf3fa322aeb4becc0c1647` |
| `snowy-mountains-source.png` | 1774 × 887，透明 PNG | 2,535,101 | `5de33d3c32047c7c9939b6cccbfe81492d1667bd9c717b7f951c4ffbca65f356` |
| `public/assets/city-runtime/outskirts-snowy-mountains.png` | 1152 × 576，透明 PNG | 1,028,598 | `de05538ca8ddd1361ad1bedf32770e3e1014d369d97d161aa63dd975de7ea839` |
| `wooded-ridge-source.png` | 1774 × 887，透明 PNG | 2,979,365 | `2fb3e0b133e1e3d517cc3c3ec37be98d8c1abcd4afd133e40938542ad8d82b79` |
| `public/assets/city-runtime/outskirts-wooded-ridge.png` | 1152 × 576，透明 PNG | 1,242,854 | `4a16b0312c643b6063017a4109419435a817b570ad52afbed0555ca54a14b827` |
| `mountain-massif-source.png` | 1774 × 887，透明 PNG | 2,609,354 | `a4f4af11328165057b41721b0a604be5a44ab589c7d4b022a10536202e59ea97` |
| `public/assets/city-runtime/outskirts-mountain-massif.png` | 1152 × 576，透明 PNG | 1,061,985 | `5243d58e8bc1f24192d9d0d54abcbd0c530cd37f31e142641da097cb749e0849` |
| `ground-tiles-source.png` | 1254 × 1254，四格地纹 PNG | 4,011,041 | `193d57927d4a101e849e2e043df1ec563e0732352121542c4b423cbf6bb7d159` |
| `public/assets/city-runtime/outskirts-ground-tiles.png` | 1152 × 1152，四格地纹 PNG | 2,734,455 | `e71547051cff901fbba9ce61676f9906021b4f0b0d5655a38e190d8d99861ef1` |

使用 `sips -Z 1152 <原画> --out <运行PNG>` 等比缩小。运行图在 `src/renderers/city-baked-catalog.json` 登记，原画留作素材母版。

生成提示如下。

```text
Create ONE new production raster environment sprite for the far outskirts of CodeYears, an original miniature isometric modern contribution city map. Use the reference only as a style and sunlight reference. Wide landscape composition, one long, coherent low mountain range with a calm asymmetrical ridgeline stretching diagonally from upper left to lower right (isometric map X axis, about +0.5 apparent slope), several rounded rocky summits that vary in height, tree-speckled foothills and a feathered grass/moss foot. Orthographic high oblique architectural isometric view, ground axes approximately ±0.5, vertical trees vertical, daytime sun upper left, tactile weathered stone and believable fine grass/woodland textures. Cooler and more subdued than the reference: muted blue-gray and dusty sage rock on the distant peaks, moss and olive-green toward the ground, light atmospheric depth baked into the mountains themselves, no snow. Reasonably broad low foothills and no matching adjacent mountain copies; it will occupy a strip beyond the city and should never look like a poster. All mountains fully inside the image with transparent padding, true alpha around the silhouette and a natural thinning edge at the base that blends into a grassy map. ONLY the mountain range sprite, no foreground, no sky, no frame, no rectangular ground slab, no visible soil cross-section, no buildings, roads, rivers, text, numbers, logo or watermark. Premium realistic miniature art matching the reference. Transparent background.
```

```text
One transparent raster sprite for the terrain of CodeYears, a realistic miniature isometric contribution city. Use the supplied image only to match the texture, palette restraint, and upper-left daylight. Subject is a broad open dry meadow and rocky heath, FLAT land, viewed from the same high orthographic isometric angle. Broad areas of muted straw-gold short grass, dry olive heath, softly blending exposed dusty sandy soil and a few low pale gray weathered stones. Finer mossy sage grass around the outer edge. Very low soft relief, distant low shrubs only, no hills or peaks, no tall trees. One completely organic elongated irregular footprint in landscape format, wider than tall, with softly feathered semi-transparent grass ends fading naturally into real alpha on all sides. The subject should occupy most of the canvas without touching edges. This is a patch of natural land that will be laid across a predominantly green map. Not an island or a raised tile, no rectangular outline, no shadow under the edge, no cross-section, no artificial straight boundaries. No water, no roads or trails, no buildings, no sky, no people, text or logos. Tactile realistic pre-rendered miniature art, not cartoon, no grid. True transparent background.
```

雪山使用同批远山作为视角和日照参考，要求灰蓝裸岩、低饱和积雪和逐渐变低的林地山脚，输出四周带透明留白的宽幅独立位图。

林木山脊以中国南方湿润山地为文字参考，构图为近处高低错落的三条林脊及山鞍。生成要求保留等轴俯视角、左上漫射日光、灰绿岩壁、松树和阔叶混林，山脚以透明度渐隐衔接草地。输入仅为文字描述。

连绵的山体组采用同样的等轴角度和光照，以右侧高峰、左下方低丘、山鞍和相连的林地坡脚改变轮廓。通过 ImageGen 根据文字描述生成。道路用的 `src/renderers/city-relief-outlines.json` 从运行 PNG 的透明度提取。等比缩窄到 144 像素，逐行取透明度至少 200 的最左和最右点，计算凸包并移除近共线顶点，使用 0 至 1 的归一化坐标。

四格地纹由 ImageGen 根据文字描述生成。左上为浅草，右上为湿苔，左下为带碎石的草地，右下为偏干短草。四格使用相同的正俯视角、细节尺度及漫射光。扩展取样时从每格内缩 4%，解码后为各格加上渐隐边，再统一做等轴投影。

## 近景细草

2026-11-21 用内置 ImageGen 根据文字单独生成细草母版。两个方向各保留 1200 像素，并用剩余 54 像素从尾部到头部渐变衔接，重复时接缝两侧取自母版的相邻像素。按 sRGB 通道去掉母版均值，将偏差乘 0.62 后以 `(113, 138, 63)` 为新均值，调成与地图接近的草绿色。运行 PNG 使用 256 色索引，无抖动。与索引前的三通道图比较，平均绝对误差为 0.72／255，无尺寸插值。

| 文件 | 规格 | 字节 | SHA-256 |
| --- | --- | ---: | --- |
| `short-grass-source.png` | 1254 × 1254，原始 PNG | 4,217,827 | `8f4ff1ada6510aa4f93a1cfa43097f662534329e43ac64f4650c62ee814c137c` |
| `short-grass-runtime.png` | 1200 × 1200，旧版运行 PNG，保留作对照 | 1,418,596 | `58232dbe3785837543283349e93bbcf97a9e098a309cc74734d47a27c87922a3` |

生成提示见下。

```text
Use case: stylized-concept. Asset type: one production ground texture for the outskirts of a detailed miniature isometric city. Generate a square, opaque, high-resolution raster at the largest native square resolution supported. View the grass directly overhead, orthographic and entirely flat. Fill every pixel edge to edge with dense, short living meadow grass. The game renderer will supply the isometric projection. Render tiny, crisp individual grass blades and subtle small clover-like foliage with irregular directions and natural spacing. Aim for genuinely fine leaf detail at 100% zoom, with hundreds of small tufts across the frame and no dominant clumps or sharp scratches. Overall color is a fresh medium warm meadow green, approximately #74874c, with modest variations of leaf green and spring olive. Soft even overhead daylight, low contrast at larger scales, no vignette, diagonal bands, mowing stripes, specular shine, black shadows, crosshatching, oversized thatch, exposed soil, rocks, flowers, paths, borders, shapes, text or objects. Make the left and right edges match, and the top and bottom edges match, so the square repeats seamlessly. Single texture with no sample sheet or gutters. Believable hand-rendered natural material for a refined realistic miniature.
```

## 单向短草

2026-11-21 用内置 ImageGen 根据文字生成球场式短草。草叶在母版中大致沿横向排列，经原有等轴投影后顺着地图的斜向铺开。沿用 1200 像素的取样范围与 54 像素叠边，以 `(113, 138, 63)` 为调色中心，通道对比系数取 0.49。运行图为 256 色索引 PNG，无抖动，量化平均绝对误差为 0.31／255。

| 文件 | 规格 | 字节 | SHA-256 |
| --- | --- | ---: | --- |
| `fairway-grass-source.png` | 1254 × 1254，原始 PNG | 3,553,813 | `41b8e023a074e0d4151c770e188f85099e2b5b5fc2413909b943777a84bd9119` |
| `public/assets/city-runtime/outskirts-grass-fairway.png` | 1200 × 1200，索引色 PNG | 1,395,988 | `6b2ad3cea44ebf4e5a01b5b16a80737b2f3925c9545ceb78ec94814006fdb116` |

```text
Use case: stylized-concept. Asset type: a single seamless square raster texture for the ground of a detailed miniature isometric map. Render closely mown golf green turf in an exactly overhead orthographic view, flat and edge to edge. The grass has a single gentle grain running left to right across the entire sheet, like short turf laid in one direction by a roller. Use thousands of very short, fine blades, almost all leaning to the right, with subtle variations in length and random spacing. At a glance it should read as a calm, continuous lawn with a faint directional sheen. At full resolution tiny blades are visible. Soft diffuse daylight and harmonious medium spring greens, near #748950, with restrained local contrast and a quiet matte finish. The single grain must be visible without broad streaks or high-contrast mowing stripes. No alternating light and dark bands, ridges, lines of planting, long curled strands, crosshatching, bunches, clover, exposed dirt, pebbles, flowers, shadows from objects, paths, holes, boundaries, lettering or watermark. No camera tilt, vanishing point, patch silhouette, grid, or gutters. Make the left and right edges match and the top and bottom edges match for repeating use. Produce one full-bleed image at the highest available native square resolution.
```
