# 林地独立候选：来源与实际检查

本目录包含六款 premium realistic city-game style 的独立林地候选。**它们尚未接入渲染器，也未完成公共地面四角、锚点和统一尺度标定，不属于已验收的运行库素材。** 文件名的 2×1、1×2、2×2 表示生成意图，不能作为精确几何已通过的证据。

## 来源与交付

- 生成日期：2026-10-31。
- 工具：内置 imagegen；每款独立调用并设置 `transparent_background: true`，未使用 CLI。
- 视觉参考：[07-vegetation.png](../../07-vegetation.png)，已目视检查；仅借鉴自然枝叶与精细城市游戏质感，没有裁取设计板。
- 几何要求来自 [projection-guide.svg](../../projection-guide.svg)：W 右下、D 左下、地面斜率 +0.5 / −0.5、竖直方向不倾斜。左上光照与相近实际树木尺度写入每款完整提示，但未冒充实际标定结果。
- 六张项目 PNG 均由原生成文件逐字节复制。没有裁剪、缩放、重新编码、去底、拼接或 Python 图像编辑，原生成文件保留。

原生成目录位于 `$CODEX_HOME/generated_images/01a19202-0cdf-7280-9fa0-280bd4704482/`。

| 项目候选 | 原生成文件 | SHA-256 |
| --- | --- | --- |
| [small-grove-2x1-a.png](small-grove-2x1-a.png) | exec-ad8f5617-a7bf-445b-bfb6-e701f805ea0c.png | 97c5ebec52eca07a829b560b69a8c6201b1642c0a8126eb802398251a840b730 |
| [small-grove-2x1-b.png](small-grove-2x1-b.png) | exec-8ede7171-8348-4ff7-b11a-ab7da171717c.png | a36c9d3eb7e67263580e2aa7f6276d9b73c0037218350c9722171b70a6432fc7 |
| [small-grove-1x2-a.png](small-grove-1x2-a.png) | exec-ea45aaae-02fa-48c5-a9ed-d8cec3c0408b.png | 120927d181faa4fcc39a4f908ca71d9fbe59618ec59c0c2bd534c3dc2d8b8428 |
| [small-grove-1x2-b.png](small-grove-1x2-b.png) | exec-954640f7-c4f6-4eed-adb8-94df8f494885.png | b0d7c3109876689748a851331ad65029c1f18e2814d81801210927da0f9aa919 |
| [forest-2x2-a.png](forest-2x2-a.png) | exec-3799c7d8-1806-4fe2-83de-56c40071c48e.png | fe2f312af4df537c461c31a607078f580cbf712299eaf3425f97b914397bb876 |
| [forest-2x2-b.png](forest-2x2-b.png) | exec-8a7ed5a7-08cd-46dc-8f3a-37b71fdbb3c1.png | 054582158a126ee668ca6a91444bd3731a6b27ffc116cd127ffaafce47d10b6f |

## 实际规格与透明检查

采用 Pillow 只读打开 PNG，读取模式、尺寸、alpha 直方图及包围框；没有写出处理后的图像。六款实际均为 **1254×1254 PNG / RGBA，alpha 范围 0–255**。

| 候选 | 字节数 | 完全透明像素 / 比例 | 半透明像素 | alpha=255 像素 | alpha>8 包围框 |
| --- | ---: | --- | ---: | ---: | --- |
| small-grove-2x1-a.png | 2,566,847 | 724,168 / 46.0516% | 848,297 | 51 | (69, 36, 1220, 1146) |
| small-grove-2x1-b.png | 2,420,814 | 781,991 / 49.7287% | 790,463 | 62 | (30, 132, 1236, 1130) |
| small-grove-1x2-a.png | 2,343,233 | 821,723 / 52.2553% | 750,590 | 203 | (170, 30, 1135, 1211) |
| small-grove-1x2-b.png | 2,259,439 | 872,723 / 55.4985% | 699,701 | 92 | (126, 53, 1229, 1199) |
| forest-2x2-a.png | 3,051,160 | 531,073 / 33.7722% | 1,041,420 | 23 | (45, 32, 1212, 1210) |
| forest-2x2-b.png | 2,549,486 | 720,390 / 45.8113% | 852,085 | 41 | (49, 38, 1213, 1203) |

包围框为 Pillow 左、上、右、下坐标，右下不包含。六款 alpha>8 的主体均有画布留白。全部图像都存在 alpha≤8 的极低值残留触及至少一条画布边缘，不能把 alpha>0 的包围框直接用于裁剪或标定：

| 候选 | alpha>0 包围框 | 画布边缘非零 alpha 像素（上 / 下 / 左 / 右） |
| --- | --- | --- |
| small-grove-2x1-a.png | (0, 0, 1254, 1254) | 6 / 371 / 145 / 1 |
| small-grove-2x1-b.png | (0, 0, 1254, 1254) | 8 / 660 / 218 / 2 |
| small-grove-1x2-a.png | (0, 4, 1248, 1254) | 0 / 102 / 127 / 0 |
| small-grove-1x2-b.png | (0, 17, 1254, 1254) | 0 / 148 / 27 / 1 |
| forest-2x2-a.png | (0, 0, 1254, 1254) | 7 / 616 / 348 / 28 |
| forest-2x2-b.png | (0, 0, 1253, 1254) | 3 / 325 / 250 / 0 |

可复查方法：`Image.open(path)` 后读取 `getchannel("A").histogram()`、`getextrema()` 和 `getbbox()`；alpha>8 包围框先以 `alpha.point(lambda v: 255 if v > 8 else 0)` 建立仅在内存中的阈值图。SHA-256 对原 PNG 字节计算。

## 目视结果与未通过项

目视可辨：

- 2×1 两款沿 W 的右下方向形成长条植被，1×2 两款沿 D 的左下方向形成长条植被；没有把同一张图旋转充当另一个候选。
- A 款以混合高低树冠形成自然节奏，B 款形成较整齐林带；2×2 B 的两株针叶树与阔叶树混合，地面和树冠间隙比 2×2 A 更明显。
- 六款均为独立单元，有自然枝叶、树干、薄草地衔接和左上高光；没有文字、编号、网格或厚土块底座。

尚未通过的范围：

- 地面形状为生成的自然薄草边缘，四角并非可直接确认的精确几何点。尚未按公共模板测量地面两组边斜率、四角与根部锚点，不能宣称已满足精确 2:1 投影。
- 同尺寸画布不等于同一世界尺度。六款仍须按公共地面每格像素比例统一标定树高与占地；提示中的每格约四米、树高约五至七米只是生成约束。
- alpha 几乎全部为半透明值，且枝叶有黄绿色高亮边缘、低值残留触边；真实 alpha 存在，但浅色和深色地面的边缘合成、光晕、接触阴影及缩小可读性尚未验收。
- 本次未提供推测的精确四角或落地点坐标，没有修改代码、运行库、资源装载或浏览器流程；没有通过反复生成追逐理论极端边界。

## 完整生成提示

### small-grove-2x1-a.png

```text
Use case: stylized-concept
Asset type: one standalone transparent PNG woodland unit candidate for a premium realistic city-building game, CodeYears.
Primary request: create exactly ONE isolated vegetation unit, never a sheet, lineup or overview. High-end realistic miniature city-game 3D render with finely textured natural leaves, needles, visible branching and bark; botanical variety and intricate but readable small-scale detail. Use the previously inspected vegetation reference sheet only as style inspiration, not as a layout to reproduce.
Scene/backdrop: true transparent background with real alpha. Trees and low planting rise from a very thin continuous soft grass cover lying directly on an imaginary horizontal ground plane. Ground edge is subtle and feathered with natural short grass; absolutely no thick soil, raised tile, pedestal, cutaway block, paved border, rocks or drawn outline. Keep a compact soft contact shadow attached to the roots and planting, not a large detached cast shadow.
Camera/projection: fixed orthographic 2:1 dimetric city-game projection; imaginary ground W axis (+x,+y) slopes +0.5 down-right, D axis (-x,+y) slopes -0.5 down-left; world vertical is exactly vertical on the image. This is not 30-degree isometric. Show both ground directions consistently. No vanishing point or lens distortion. Do not draw any guide or grid. Natural branches need not align with the axes.
Scale: same world scale and camera for all six grove/forest candidates. One nominal ground cell represents approximately four meters. Mature trees are approximately five to seven meters tall, smaller trees and low shrubs substantially shorter. Do not enlarge smaller footprint units merely to fill the frame. The unit's ground patch communicates its specified footprint; crowns may organically overhang it.
Lighting: gentle sunlight from upper left; olive and fresh green highlights on left/upper foliage, cooler dark green undersides and right-facing shade, warm brown bark, realistic ambient occlusion at roots.
Composition: square transparent canvas, complete crowns and grass edge visible with transparent padding on all four sides. The unit is centered horizontally with planting ground in the lower half, enough space above for every tree tip. No clipping. Keep roots and ground contacts readable.
Constraints: rich natural foliage, irregular airy silhouette and some canopy gaps; low vegetation connects the root areas without a heavy foundation. No smooth spherical trees, no plastic toy foliage, no geometric cone trees. Root shadows and leaf alpha edges must be clean and natural, without bright halos or an artificial backdrop.
Avoid: text, letters, numbers, symbols, labels, borders, watermark, guide lines, visible checkerboard, background color, white backdrop, sky, extra detached objects, road, buildings, people, flower display, decorative boulders.
Subject: a small natural grove A on a 2×1 ground footprint: two cells along W, one cell along D. The long planting direction runs diagonally from upper-left toward lower-right, along W at slope +0.5. Three deciduous trees of visibly varied height and broad natural crowns, loosely grouped with low irregular shrubs between roots; the tallest near the back, a medium tree farther down-right, and a lower young tree add an organic unequal rhythm. Do not create a straight formal hedge. Ground cover follows a thin long diamond/parallelogram with the 2×1 W:D ground lengths, no visible tile border.
```

### small-grove-2x1-b.png

```text
Use case: stylized-concept
Asset type: one standalone transparent PNG woodland unit candidate for a premium realistic city-building game, CodeYears.
Primary request: create exactly ONE isolated vegetation unit, never a sheet, lineup or overview. High-end realistic miniature city-game 3D render with finely textured natural leaves, needles, visible branching and bark; botanical variety and intricate but readable small-scale detail. Use the previously inspected vegetation reference sheet only as style inspiration, not as a layout to reproduce.
Scene/backdrop: true transparent background with real alpha. Trees and low planting rise from a very thin continuous soft grass cover lying directly on an imaginary horizontal ground plane. Ground edge is subtle and feathered with natural short grass; absolutely no thick soil, raised tile, pedestal, cutaway block, paved border, rocks or drawn outline. Keep a compact soft contact shadow attached to the roots and planting, not a large detached cast shadow.
Camera/projection: fixed orthographic 2:1 dimetric city-game projection; imaginary ground W axis (+x,+y) slopes +0.5 down-right, D axis (-x,+y) slopes -0.5 down-left; world vertical is exactly vertical on the image. This is not 30-degree isometric. Show both ground directions consistently. No vanishing point or lens distortion. Do not draw any guide or grid. Natural branches need not align with the axes.
Scale: same world scale and camera for all six grove/forest candidates. One nominal ground cell represents approximately four meters. Mature trees are approximately five to seven meters tall, smaller trees and low shrubs substantially shorter. Do not enlarge smaller footprint units merely to fill the frame. The unit's ground patch communicates its specified footprint; crowns may organically overhang it.
Lighting: gentle sunlight from upper left; olive and fresh green highlights on left/upper foliage, cooler dark green undersides and right-facing shade, warm brown bark, realistic ambient occlusion at roots.
Composition: square transparent canvas, complete crowns and grass edge visible with transparent padding on all four sides. The unit is centered horizontally with planting ground in the lower half, enough space above for every tree tip. No clipping. Keep roots and ground contacts readable.
Constraints: rich natural foliage, irregular airy silhouette and some canopy gaps; low vegetation connects the root areas without a heavy foundation. No smooth spherical trees, no plastic toy foliage, no geometric cone trees. Root shadows and leaf alpha edges must be clean and natural, without bright halos or an artificial backdrop.
Avoid: text, letters, numbers, symbols, labels, borders, watermark, guide lines, visible checkerboard, background color, white backdrop, sky, extra detached objects, road, buildings, people, flower display, decorative boulders.
Subject: a small orderly grove B on a 2×1 ground footprint: two cells along W, one cell along D. Exactly three similar deciduous trees in a spaced, gently regular line along W, running diagonally from upper-left toward lower-right at slope +0.5. Natural branching and slightly different crown contours, not topiary. Compact low grasses and modest shrubs connect their root areas in a narrow orderly planting strip. Ground cover follows a thin long diamond/parallelogram with 2×1 W:D ground lengths, no visible tile border.
```

### small-grove-1x2-a.png

```text
Use case: stylized-concept
Asset type: one standalone transparent PNG woodland unit candidate for a premium realistic city-building game, CodeYears.
Primary request: create exactly ONE isolated vegetation unit, never a sheet, lineup or overview. High-end realistic miniature city-game 3D render with finely textured natural leaves, needles, visible branching and bark; botanical variety and intricate but readable small-scale detail. Use the previously inspected vegetation reference sheet only as style inspiration, not as a layout to reproduce.
Scene/backdrop: true transparent background with real alpha. Trees and low planting rise from a very thin continuous soft grass cover lying directly on an imaginary horizontal ground plane. Ground edge is subtle and feathered with natural short grass; absolutely no thick soil, raised tile, pedestal, cutaway block, paved border, rocks or drawn outline. Keep a compact soft contact shadow attached to the roots and planting, not a large detached cast shadow.
Camera/projection: fixed orthographic 2:1 dimetric city-game projection; imaginary ground W axis (+x,+y) slopes +0.5 down-right, D axis (-x,+y) slopes -0.5 down-left; world vertical is exactly vertical on the image. This is not 30-degree isometric. Show both ground directions consistently. No vanishing point or lens distortion. Do not draw any guide or grid. Natural branches need not align with the axes.
Scale: same world scale and camera for all six grove/forest candidates. One nominal ground cell represents approximately four meters. Mature trees are approximately five to seven meters tall, smaller trees and low shrubs substantially shorter. Do not enlarge smaller footprint units merely to fill the frame. The unit's ground patch communicates its specified footprint; crowns may organically overhang it.
Lighting: gentle sunlight from upper left; olive and fresh green highlights on left/upper foliage, cooler dark green undersides and right-facing shade, warm brown bark, realistic ambient occlusion at roots.
Composition: square transparent canvas, complete crowns and grass edge visible with transparent padding on all four sides. The unit is centered horizontally with planting ground in the lower half, enough space above for every tree tip. No clipping. Keep roots and ground contacts readable.
Constraints: rich natural foliage, irregular airy silhouette and some canopy gaps; low vegetation connects the root areas without a heavy foundation. No smooth spherical trees, no plastic toy foliage, no geometric cone trees. Root shadows and leaf alpha edges must be clean and natural, without bright halos or an artificial backdrop.
Avoid: text, letters, numbers, symbols, labels, borders, watermark, guide lines, visible checkerboard, background color, white backdrop, sky, extra detached objects, road, buildings, people, flower display, decorative boulders.
Subject: a small natural grove A on a 1×2 ground footprint: one cell along W, two cells along D. The long planting direction runs diagonally from upper-right toward lower-left, along D at slope -0.5. Three mixed broadleaf trees of visibly varied height and organic crowns, loosely grouped with low irregular shrubs between roots; include a tall airy tree, a medium denser tree and a low young tree, making a varied natural silhouette. Ground cover follows a thin long diamond/parallelogram with 1×2 W:D ground lengths, no visible tile border.
```

### small-grove-1x2-b.png

```text
Use case: stylized-concept
Asset type: one standalone transparent PNG woodland unit candidate for a premium realistic city-building game, CodeYears.
Primary request: create exactly ONE isolated vegetation unit, never a sheet, lineup or overview. High-end realistic miniature city-game 3D render with finely textured natural leaves, needles, visible branching and bark; botanical variety and intricate but readable small-scale detail. Use the previously inspected vegetation reference sheet only as style inspiration, not as a layout to reproduce.
Scene/backdrop: true transparent background with real alpha. Trees and low planting rise from a very thin continuous soft grass cover lying directly on an imaginary horizontal ground plane. Ground edge is subtle and feathered with natural short grass; absolutely no thick soil, raised tile, pedestal, cutaway block, paved border, rocks or drawn outline. Keep a compact soft contact shadow attached to the roots and planting, not a large detached cast shadow.
Camera/projection: fixed orthographic 2:1 dimetric city-game projection; imaginary ground W axis (+x,+y) slopes +0.5 down-right, D axis (-x,+y) slopes -0.5 down-left; world vertical is exactly vertical on the image. This is not 30-degree isometric. Show both ground directions consistently. No vanishing point or lens distortion. Do not draw any guide or grid. Natural branches need not align with the axes.
Scale: same world scale and camera for all six grove/forest candidates. One nominal ground cell represents approximately four meters. Mature trees are approximately five to seven meters tall, smaller trees and low shrubs substantially shorter. Do not enlarge smaller footprint units merely to fill the frame. The unit's ground patch communicates its specified footprint; crowns may organically overhang it.
Lighting: gentle sunlight from upper left; olive and fresh green highlights on left/upper foliage, cooler dark green undersides and right-facing shade, warm brown bark, realistic ambient occlusion at roots.
Composition: square transparent canvas, complete crowns and grass edge visible with transparent padding on all four sides. The unit is centered horizontally with planting ground in the lower half, enough space above for every tree tip. No clipping. Keep roots and ground contacts readable.
Constraints: rich natural foliage, irregular airy silhouette and some canopy gaps; low vegetation connects the root areas without a heavy foundation. No smooth spherical trees, no plastic toy foliage, no geometric cone trees. Root shadows and leaf alpha edges must be clean and natural, without bright halos or an artificial backdrop.
Avoid: text, letters, numbers, symbols, labels, borders, watermark, guide lines, visible checkerboard, background color, white backdrop, sky, extra detached objects, road, buildings, people, flower display, decorative boulders.
Subject: a small orderly grove B on a 1×2 ground footprint: one cell along W, two cells along D. Exactly four relatively narrow upright deciduous trees in a spaced regular line along D, running diagonally from upper-right toward lower-left at slope -0.5. Natural individual branching and slightly different leafy silhouettes, not clipped topiary; their vertical trunks remain exactly upright. Compact low grasses connect the root areas in a narrow orderly planting strip, with some ground visible between trees. Ground cover follows a thin long diamond/parallelogram with 1×2 W:D ground lengths, no visible tile border.
```

### forest-2x2-a.png

```text
Use case: stylized-concept
Asset type: one standalone transparent PNG woodland unit candidate for a premium realistic city-building game, CodeYears.
Primary request: create exactly ONE isolated vegetation unit, never a sheet, lineup or overview. High-end realistic miniature city-game 3D render with finely textured natural leaves, needles, visible branching and bark; botanical variety and intricate but readable small-scale detail. Use the previously inspected vegetation reference sheet only as style inspiration, not as a layout to reproduce.
Scene/backdrop: true transparent background with real alpha. Trees and low planting rise from a very thin continuous soft grass cover lying directly on an imaginary horizontal ground plane. Ground edge is subtle and feathered with natural short grass; absolutely no thick soil, raised tile, pedestal, cutaway block, paved border, rocks or drawn outline. Keep a compact soft contact shadow attached to the roots and planting, not a large detached cast shadow.
Camera/projection: fixed orthographic 2:1 dimetric city-game projection; imaginary ground W axis (+x,+y) slopes +0.5 down-right, D axis (-x,+y) slopes -0.5 down-left; world vertical is exactly vertical on the image. This is not 30-degree isometric. Show both ground directions consistently. No vanishing point or lens distortion. Do not draw any guide or grid. Natural branches need not align with the axes.
Scale: same world scale and camera for all six grove/forest candidates. One nominal ground cell represents approximately four meters. Mature trees are approximately five to seven meters tall, smaller trees and low shrubs substantially shorter. Do not enlarge smaller footprint units merely to fill the frame. The unit's ground patch communicates its specified footprint; crowns may organically overhang it.
Lighting: gentle sunlight from upper left; olive and fresh green highlights on left/upper foliage, cooler dark green undersides and right-facing shade, warm brown bark, realistic ambient occlusion at roots.
Composition: square transparent canvas, complete crowns and grass edge visible with transparent padding on all four sides. The unit is centered horizontally with planting ground in the lower half, enough space above for every tree tip. No clipping. Keep roots and ground contacts readable.
Constraints: rich natural foliage, irregular airy silhouette and some canopy gaps; low vegetation connects the root areas without a heavy foundation. No smooth spherical trees, no plastic toy foliage, no geometric cone trees. Root shadows and leaf alpha edges must be clean and natural, without bright halos or an artificial backdrop.
Avoid: text, letters, numbers, symbols, labels, borders, watermark, guide lines, visible checkerboard, background color, white backdrop, sky, extra detached objects, road, buildings, people, flower display, decorative boulders.
Subject: a compact natural woodland A on a 2×2 ground footprint, two cells along W and two along D. Approximately six to eight mixed-height broadleaf trees, with varied small and medium crowns forming a lush irregular woodland canopy, a few low shrubs and saplings, some visible trunks and small gaps, and subtle color variation within natural green. Tall trees toward the back, shorter trees and low vegetation toward the front let the composition remain readable; organic placement rather than a formal grid. Thin grass cover follows the 2×2 diamond ground shape, whose sides use the same two ground directions, with no visible tile border.
```

### forest-2x2-b.png

```text
Use case: stylized-concept
Asset type: one standalone transparent PNG woodland unit candidate for a premium realistic city-building game, CodeYears.
Primary request: create exactly ONE isolated vegetation unit, never a sheet, lineup or overview. High-end realistic miniature city-game 3D render with finely textured natural leaves, needles, visible branching and bark; botanical variety and intricate but readable small-scale detail. Use the previously inspected vegetation reference sheet only as style inspiration, not as a layout to reproduce.
Scene/backdrop: true transparent background with real alpha. Trees and low planting rise from a very thin continuous soft grass cover lying directly on an imaginary horizontal ground plane. Ground edge is subtle and feathered with natural short grass; absolutely no thick soil, raised tile, pedestal, cutaway block, paved border, rocks or drawn outline. Keep a compact soft contact shadow attached to the roots and planting, not a large detached cast shadow.
Camera/projection: fixed orthographic 2:1 dimetric city-game projection; imaginary ground W axis (+x,+y) slopes +0.5 down-right, D axis (-x,+y) slopes -0.5 down-left; world vertical is exactly vertical on the image. This is not 30-degree isometric. Show both ground directions consistently. No vanishing point or lens distortion. Do not draw any guide or grid. Natural branches need not align with the axes.
Scale: same world scale and camera for all six grove/forest candidates. One nominal ground cell represents approximately four meters. Mature trees are approximately five to seven meters tall, smaller trees and low shrubs substantially shorter. Do not enlarge smaller footprint units merely to fill the frame. The unit's ground patch communicates its specified footprint; crowns may organically overhang it.
Lighting: gentle sunlight from upper left; olive and fresh green highlights on left/upper foliage, cooler dark green undersides and right-facing shade, warm brown bark, realistic ambient occlusion at roots.
Composition: square transparent canvas, complete crowns and grass edge visible with transparent padding on all four sides. The unit is centered horizontally with planting ground in the lower half, enough space above for every tree tip. No clipping. Keep roots and ground contacts readable.
Constraints: rich natural foliage, irregular airy silhouette and some canopy gaps; low vegetation connects the root areas without a heavy foundation. No smooth spherical trees, no plastic toy foliage, no geometric cone trees. Root shadows and leaf alpha edges must be clean and natural, without bright halos or an artificial backdrop.
Avoid: text, letters, numbers, symbols, labels, borders, watermark, guide lines, visible checkerboard, background color, white backdrop, sky, extra detached objects, road, buildings, people, flower display, decorative boulders.
Subject: a more open woodland B on a 2×2 ground footprint, two cells along W and two along D. Exactly five trees in a deliberate loosely orderly arrangement: two tall narrow natural conifers, two medium broadleaf trees and one smaller broadleaf sapling. Keep distinct gaps between crowns, visible ground and visible root contacts; appreciably more sparse than a dense closed-canopy forest. A faint meandering opening through low grass may pass between the trees, with no constructed path or pavement. Natural layered evergreen boughs and irregular deciduous branching, not topiary. Thin grass cover follows the 2×2 diamond ground shape, whose sides use the same two ground directions, with no visible tile border.
```
