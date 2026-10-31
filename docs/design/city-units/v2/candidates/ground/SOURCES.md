# 平地、水体与广场候选来源

日期：2026-10-31。状态：**独立设计候选，未接入渲染器、未完成投影/落地点/占地标定、未通过运行验收。**

仅使用内置 `image_gen.imagegen`，每款独立调用；四款首稿并行生成，`transparent_background: true`。没有使用 CLI/API fallback，没有用程序生成、裁剪、抠图、改色或修改透明度。项目 PNG 是工具原图的逐字节复制，原始生成文件保留在工具目录。

风格参考：`../../08-ground-and-water.png`，已先通过 `view_image` 查看；精确投影约束来自 `../../projection-guide.svg`。参考图是造型与材料参考，模板是地面方向基准。四款提示均要求 2×2 逻辑占地、W(+48,+24)、D(-48,+24)、竖直 H(0,-48)、左上照明，无文字/展示背景/厚底座。提示中的这些要求不等于输出已满足。

## 只读检查与限制

- Pillow 只用于读取 PNG 规格及 alpha 统计；未改写图像。四款均 RGBA，有 alpha=0 的透明区。池塘 A/B、广场 B 的 alpha 极值为 0–255；广场 A 为 0–254。主体 alpha 主要约 251–253，半透明边缘及极低 alpha 零星像素均原样保留。
- 下表外框按 Pillow `getbbox()`，右/下坐标为开区间；`alpha>=128` 外框帮助区分极低 alpha 的外缘。外框包括草叶、花池与阴影，不能充当地面占地。
- 地面角点和角度是**目视手工取点的粗估**，不是自动标定、精确几何证明或容差验收。草岸不规则，池塘不强行拟合四条直线。
- 广场两款的铺地/外边方向都已实际检查，但存在角度偏差。若以后选用，仍须依据统一地图模板校正、确定地面四角、落地点和像素比例，并在地图上检查接缝。当前未导入产品，不宣称对齐通过。
- 这次仅交付正式设计候选及来源记录，无应用行为变更，未运行编译或端到端验证。

| 候选 | 尺寸 | 完全透明像素比例 | alpha>0 外框 | alpha>=128 外框 |
|---|---:|---:|---|---|
| `pond-a.png` | 1774×887 | 58.96% | (0,19)–(1758,863) | (140,28)–(1634,825) |
| `pond-b.png` | 1774×887 | 60.30% | (0,8)–(1760,887) | (127,73)–(1653,821) |
| `plaza-a.png` | 1536×1024 | 64.10% | (73,9)–(1535,1024) | (100,157)–(1440,897) |
| `plaza-b.png` | 1774×887 | 73.63% | (0,19)–(1730,887) | (304,115)–(1472,775) |

## pond-a.png

源文件：`/Users/xingyuwang/.codex/generated_images/01a19208-5b5f-7671-9838-be906b2133ef/exec-531a5bfd-b1ac-424a-9402-d09dcdd7d609.png`

SHA-256：`26eeb43f560e0eb563255d9f68b44f903df6b9d73b5a7113d0169dddca48a704`

实际观察：自然蓝绿水面，低草岸、少量芦苇与睡莲；无厚底座。岸线有机起伏，整体为低宽菱形逻辑占地；芦苇高出地面，alpha 外框不能用作地面四角。整体方向与模板相近，未给有机边界拟合直线、未作四角或尺度标定。

完整提示：

```text
Use case: stylized-concept.
Asset type: one transparent 2×2 ground unit candidate for CodeYears isometric city game, single standalone PNG sprite, not a sheet.
Reference style only: refined natural miniature city-building game asset with fine readable material detail; close to flat ground. Style reference is the supplied 08-ground-and-water image: use only its ground/water/plaza material quality, never copy its labels, board, grid, or presentation.
CRITICAL PROJECTION: fixed orthographic 2:1 dimetric / isometric game projection with W screen direction (+48,+24), D direction (-48,+24), vertical H=(0,-48). All straight ground-plane edges and all paving seams run in exactly two parallel families at +26.565° and -26.565° from horizontal (slopes +0.5 and -0.5). A square 2×2 plot projects to a low wide diamond exactly twice as wide as its ground-plane depth. Never use 30° axes, never tilt camera sideways, never add perspective vanishing points. Vertical edges remain vertically upright. Upper-left sunlight and restrained short shadow.
COMPOSITION: exactly one asset centered, full ground asset visible with comfortable transparent margin. Logical overall footprint is 2×2 square plot, aligned to the 2:1 diamond projection. Transparent alpha all around the asset and beneath no surrounding scene. Ground is flush with neighboring grass, no raised slab, no thick foundation, no exposed block of soil, no pedestal. Fine softly irregular contact edge suitable for blending into a city map.
AVOID: white or colored background, checkerboard painted into image, grid overlay, guide lines, labels, numbers, text, watermarks, frames, diagram, broad cast-shadow backdrop, large trees, buildings, extra asset variants. Do not include a display platform.
PRIMARY REQUEST: one natural blue-green pond with a soft living grass shore, occupying a logical 2×2 plot. An organically curved pond surface fills most of the diamond, fringed by low mossy grass and fine green blades. A few very small rounded pebbles and restrained reeds cluster along the far edge; a few tiny lily pads near one bank. Blue-green clear water with gentle ripples and soft plant reflections, no glowing effects. The perimeter remains a thin organic shoreline, not a square tray; the far and near shore spread agree with the shallow 2:1 ground projection. The scale is a city landscaping tile, never a diorama chunk. Detailed natural game art, muted rich colors.
```

## pond-b.png

源文件：`/Users/xingyuwang/.codex/generated_images/01a19208-5b5f-7671-9838-be906b2133ef/exec-c9dabe88-95ee-4be8-906e-54a780b0ee0e.png`

SHA-256：`220dc4e77fc275a677cde91209e44cbf2a92951aebf99034da038cb41c8d5f29`

实际观察：浅青水面与可见浅水石子，石岸零散、草岸为主；无环形墙和厚底座。整体低宽菱形，水线及岸边为自然曲线，不能从 alpha 外框证明精确 2×2。未作四角或尺度标定。

完整提示：

```text
Use case: stylized-concept.
Asset type: one transparent 2×2 ground unit candidate for CodeYears isometric city game, single standalone PNG sprite, not a sheet.
Reference style only: refined natural miniature city-building game asset with fine readable material detail; close to flat ground. Style reference is the supplied 08-ground-and-water image: use only its ground/water/plaza material quality, never copy its labels, board, grid, or presentation.
CRITICAL PROJECTION: fixed orthographic 2:1 dimetric / isometric game projection with W screen direction (+48,+24), D direction (-48,+24), vertical H=(0,-48). All straight ground-plane edges and all paving seams run in exactly two parallel families at +26.565° and -26.565° from horizontal (slopes +0.5 and -0.5). A square 2×2 plot projects to a low wide diamond exactly twice as wide as its ground-plane depth. Never use 30° axes, never tilt camera sideways, never add perspective vanishing points. Vertical edges remain vertically upright. Upper-left sunlight and restrained short shadow.
COMPOSITION: exactly one asset centered, full ground asset visible with comfortable transparent margin. Logical overall footprint is 2×2 square plot, aligned to the 2:1 diamond projection. Transparent alpha all around the asset and beneath no surrounding scene. Ground is flush with neighboring grass, no raised slab, no thick foundation, no exposed block of soil, no pedestal. Fine softly irregular contact edge suitable for blending into a city map.
AVOID: white or colored background, checkerboard painted into image, grid overlay, guide lines, labels, numbers, text, watermarks, frames, diagram, broad cast-shadow backdrop, large trees, buildings, extra asset variants. Do not include a display platform.
PRIMARY REQUEST: one pale cyan clear-water pond with a small amount of low pale gray stone shore, occupying a logical 2×2 plot. An organically curved quiet pool fills most of the diamond, pale aqua water reveals a few submerged pebbles near its clear shallow margins. Only occasional flat smooth stones punctuate a low soft grass shoreline, with tiny wildflowers and short reeds used sparingly. Keep most of the shore grassy and low, no ring wall or full stone border. Gentle water highlights and restrained reflections. The far and near shore spread agree with the shallow 2:1 ground projection; transparent outside the bank. Detailed natural game art, calm restrained palette.
```

## plaza-a.png

源文件：`/Users/xingyuwang/.codex/generated_images/01a19208-5b5f-7671-9838-be906b2133ef/exec-0d91a905-0402-4ef2-8d1f-51103c15e5dc.png`

SHA-256：`d239da2fb7d362d3417205fca6dc94cbd36856718687d6eefea710b6e676f7b3`

实际观察：暖砂石铺地、低木凳与花池，铺地大部可见，边缘接近地面、无方块土层。以目视手动读取的近似地面角点 T(779,191)、R(1410,534)、B(780,881)、L(119,533) 估算：四边绝对斜率约 0.518–0.551，锐角约 27.39°–28.85°；比目标 ±26.565° 略陡。铺地缝与相应外边基本同向，但不是精确模板输出。图中可见宽的低 alpha 彩色外圈；保留工具原图，不以程序清理。一次修正没有改善几何，仍保留首稿作为设计候选。

完整提示：

```text
Use case: stylized-concept.
Asset type: one transparent 2×2 ground unit candidate for CodeYears isometric city game, single standalone PNG sprite, not a sheet.
Reference style only: refined natural miniature city-building game asset with fine readable material detail; close to flat ground. Style reference is the supplied 08-ground-and-water image: use only its ground/water/plaza material quality, never copy its labels, board, grid, or presentation.
CRITICAL PROJECTION: fixed orthographic 2:1 dimetric / isometric game projection with W screen direction (+48,+24), D direction (-48,+24), vertical H=(0,-48). All straight ground-plane edges and all paving seams run in exactly two parallel families at +26.565° and -26.565° from horizontal (slopes +0.5 and -0.5). A square 2×2 plot projects to a low wide diamond exactly twice as wide as its ground-plane depth. Never use 30° axes, never tilt camera sideways, never add perspective vanishing points. Vertical edges remain vertically upright. Upper-left sunlight and restrained short shadow.
COMPOSITION: exactly one asset centered, full ground asset visible with comfortable transparent margin. Logical overall footprint is 2×2 square plot, aligned to the 2:1 diamond projection. Transparent alpha all around the asset and beneath no surrounding scene. Ground is flush with neighboring grass, no raised slab, no thick foundation, no exposed block of soil, no pedestal. Fine softly irregular contact edge suitable for blending into a city map.
AVOID: white or colored background, checkerboard painted into image, grid overlay, guide lines, labels, numbers, text, watermarks, frames, diagram, broad cast-shadow backdrop, large trees, buildings, extra asset variants. Do not include a display platform.
PRIMARY REQUEST: one small warm sandstone-paved plaza on a perfectly flat 2×2 square footprint projected as an exact low 2:1 diamond. Its full diamond perimeter and clear main paving axes must read exactly +26.565° and -26.565°, with opposite sides parallel. Warm pale sand, honey beige and light ochre rectangular stone pavers, elegant fine seams aligned precisely to the two map axes. A very small low wooden bench and one modest low flower planter near the far perimeter may decorate the plaza, leaving at least eighty percent of the paving unobscured and all four footprint corners clearly readable. Crisp flush-cut paving edge with only a few tiny grass tufts, no curb slab thickness. Natural detailed city game style with subtle stone texture, no theatrical decorations.
```

## plaza-b.png

源文件：`/Users/xingyuwang/.codex/generated_images/01a19208-5b5f-7671-9838-be906b2133ef/exec-039b2b6c-0a4f-410a-935a-058dafcd154e.png`

SHA-256：`aae49230a773b0d1021fd73381ee008f4f39bc463d5bea8f32b37e083965e2ff`

实际观察：冷灰方石几何铺地与单个低花池；没有厚土层。以手工读取的近似角点 T(889,160)、R(1468,454)、B(891,765)、L(307,455) 估算：远侧绝对斜率约 0.507–0.508（26.88°–26.92°），近侧约 0.531–0.539（27.96°–28.32°）。铺地缝和外边维持两组方向，存在轻微不平行/倾角偏差，不等同于目标 ±26.565° 的确定性标定。

完整提示：

```text
Use case: stylized-concept.
Asset type: one transparent 2×2 ground unit candidate for CodeYears isometric city game, single standalone PNG sprite, not a sheet.
Reference style only: refined natural miniature city-building game asset with fine readable material detail; close to flat ground. Style reference is the supplied 08-ground-and-water image: use only its ground/water/plaza material quality, never copy its labels, board, grid, or presentation.
CRITICAL PROJECTION: fixed orthographic 2:1 dimetric / isometric game projection with W screen direction (+48,+24), D direction (-48,+24), vertical H=(0,-48). All straight ground-plane edges and all paving seams run in exactly two parallel families at +26.565° and -26.565° from horizontal (slopes +0.5 and -0.5). A square 2×2 plot projects to a low wide diamond exactly twice as wide as its ground-plane depth. Never use 30° axes, never tilt camera sideways, never add perspective vanishing points. Vertical edges remain vertically upright. Upper-left sunlight and restrained short shadow.
COMPOSITION: exactly one asset centered, full ground asset visible with comfortable transparent margin. Logical overall footprint is 2×2 square plot, aligned to the 2:1 diamond projection. Transparent alpha all around the asset and beneath no surrounding scene. Ground is flush with neighboring grass, no raised slab, no thick foundation, no exposed block of soil, no pedestal. Fine softly irregular contact edge suitable for blending into a city map.
AVOID: white or colored background, checkerboard painted into image, grid overlay, guide lines, labels, numbers, text, watermarks, frames, diagram, broad cast-shadow backdrop, large trees, buildings, extra asset variants. Do not include a display platform.
PRIMARY REQUEST: one small cool-gray geometrically paved plaza on a perfectly flat 2×2 square footprint projected as an exact low 2:1 diamond. Its full diamond perimeter and clear main paving axes must read exactly +26.565° and -26.565°, with opposite sides parallel. Cool pale gray and medium gray square stone pavers make a quiet restrained geometric nested-diamond pattern on the ground; ALL pattern edges and seams follow the same two exact map axes, never screen-horizontal strips or perspective. A single modest low planter or tiny stone bench may sit along the far edge, leaving at least eighty-five percent of paving unobscured and all four corners readable. Flush ground, feather-light grass contact at a few edge points only. Fine natural city game material style, no thick platform or raised dark plinth.
```

## 广场 A 的单次定向修正（未选用）

针对首稿偏陡的地面投影尝试一次修正，同时要求去除外缘光晕。输出：`/Users/xingyuwang/.codex/generated_images/01a19208-5b5f-7671-9838-be906b2133ef/exec-e92407c3-568c-475e-90e2-a642b938f70f.png`。SHA-256：`dfee35b617a3f60de99da6b2932f99589fa9b7a1f0c8321df42af7b906cc5982`。目视新版菱形仍更陡、仍有外缘光晕，未替换项目首稿；不再穷举。源文件按工具默认保留，没有把弃用版本复制进项目。

完整修正提示：

```text
Use case: precise-object-edit.
Asset type: transparent 2×2 city game ground sprite.
Edit target: supplied plaza-a image.
Make one precise geometry correction: flatten and align ALL four sides of the sandstone plaza and ALL paving seams to the exact 2:1 map projection. Every straight ground line belongs to directions (+48,+24) or (-48,+24), i.e. slopes +0.5 or -0.5, angles +26.565 degrees or -26.565 degrees, with opposite sides parallel. The plot is a square in world space and its projected diamond is EXACTLY twice as wide as its ground-plane depth. Current plaza is slightly too tall/steep; correct the camera/ground projection, no 30-degree isometric view and no perspective vanishing points. Vertical bench/planter edges remain vertical.
Keep the same warm sandstone materials, detailed natural city-building game style, same small wooden bench and low flower planter, same upper-left sunlight, same logical 2×2 flat-ground plaza. Most paving unobscured. Flush ground contact, no thick platform or dark base.
The entire area OUTSIDE the crisp paving/grass contact outline must be fully transparent alpha: remove the broad diffuse colored glow/halo around the old plaza, do not replace it with a shadow or backdrop. Only short natural contact shadows within the asset footprint. Center full single asset with transparent margin; no labels, grid, guide lines, text, frame or background. Do not add any objects.
```
