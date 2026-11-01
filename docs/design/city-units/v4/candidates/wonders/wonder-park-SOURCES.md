# 地标公园奇观：来源与标定

日期：2026-11-01。使用内置 imagegen 单次生成，透明背景；未使用 CLI/API fallback。此文件只记录素材与标定，奇观算法、功能及本地集成验收由主任务另行报告。

- 工具原图：`/Users/xingyuwang/.codex/generated_images/01a194e5-ea0d-7e91-8015-b1dbc9377f4d/exec-1e4820a8-6910-4ec1-bbe1-df468ae41ff2.png`
- 正式源图：[wonder-park.png](wonder-park.png)
- 运行副本：`public/assets/city/unit-wonder-park.png`，与源图逐字节相同。
- SHA-256（源图/运行副本）：`2ed1a443ee7535d5857b4a8613e2028e08b2f728d9e184e9dcb3833f7219987c`。
- 文件大小：2,089,887 bytes（每份）；尺寸/alpha通过只读像素检查，比例通过正式`calibrate()`复核。
- 规格：1448×1086，RGBA。alpha>8 半开范围 `[4,90,1446,1017]`；四角 alpha 均为0。四条最外像素边的最大alpha依次为左3、右2、顶0、底1；没有宣称所有背景像素都为绝对零。
- 原图保留，没有程序去底、重绘、改色、拉伸、裁切或alpha修改。既有运行时缓存的低alpha处理不属于源图改写。
- 本次无参考图片传入；此前已目视 v2 树木/住宅素材以保持画风，提示如下。

## 视觉设计

4×3地块，青铜绿玻璃温室、轴线园路、精致喷泉、花坛和修剪树木。将城市高贡献区域的地标园林与普通无贡献草地/池塘区分。实际生成的温室比初始约1H目标更高：若强制主参考尺1H，实际包络仅约2.46×1.50格；最终采用主穹顶1.5H参考，保持等比和更饱满占地。未把素材压扁以伪造低高度。

## 量测与限制

[标定](../../calibration/wonder-park.json) 使用现有 `UnitSample` 格式和 `kind=building`，因为园林有立体温室、树木和亭饰，不走平地四点透视重采样。

| 项目 | 实际记录 |
| --- | --- |
| 支撑包络 | L=(10,540)，F=(900,1014)，R=(1441,668) |
| 主轴原斜率 | W=+0.532584，D=-0.639556 |
| 校正后主轴 | W=+0.5，D=-0.5 |
| 主穹顶参考 | base=(710,580)，top=(710,156)，参考1.500H |
| 实际支撑跨度 | W≈3.690584，D≈2.243378 格 |
| 每侧退让 | W≈0.154708，D≈0.378311 格 |
| 是否被占地限高 | 否，采用主穹顶参考高度 |

园区边界为花坛外缘的人工近似，不是温室精确物理矩形。后方支撑点按平行四边形闭合推断；穹顶对应的落地点被遮挡，垂直参考底点为投影近似，并非一条完整可见立柱。人工园区点约±10px，穹顶参考约±20px。顶上细长饰件超出主穹顶参考，局部屋顶肋线和细部园路存在生成图的透视差异，不宣称精确恢复物理相机。没有保存测试截图或其他过程文件。

## 完整生成提示

```text
Use case: stylized-concept
Asset type: production transparent isometric city-builder sprite, ONE landmark botanical civic park, 4 by 3 logical city-cell footprint.
Primary request: A refined prestigious urban landmark garden with a graceful central glass conservatory under a low aged-copper-green dome, warm pale-stone plinth, formal intersecting axial garden paths, a modest sculptural fountain on a small plaza, and a restrained handful of carefully pruned rounded trees, clipped hedges and rich planted borders. This is a dense city's distinguished civic WONDER, clearly monumental designed space, not an empty grass patch, forest or pond.
Style: finely crafted realistic miniature simulation-city game asset; crisp but painterly small-scale materials, restrained warm natural colors, coherent single composition. Match sophisticated isometric brick-and-stone city sprites.
Camera: fixed orthographic dimetric 2:1 ground projection. One ground axis slopes DOWN RIGHT exactly +0.5 and the other slopes DOWN LEFT at -0.5 when read with increasing screen x; vertical uprights are perfectly vertical; no perspective vanishing. Longer 4-cell axis goes down-right, shorter 3-cell axis goes down-left. Make visible straight garden-boundary/path edges parallel to these axes so sprite can be calibrated.
Geometry: a wide 4:3 rectangular garden footprint seen as a parallelogram. Buildings, trees and details arranged wholly inside it with visible open clearance around all four sides. The main conservatory and trees are low: main feature height approximately ONE city-cell unit against the 4x3 ground rectangle. Spacious unified park rather than crowded mini buildings. Show full asset from top finial to all ground-contact corners.
Ground: tight botanical planted beds and paved garden paths only, with an irregular softly planted outer edge; NO thick raised rectangular display slab, no enclosing square tile, no cast-shadow plane outside the object. Leave genuine transparent gaps around and outside the sprite.
Lighting: soft daylight from upper left; gentle internal contact shadows.
Output: one isolated entire sprite centered, generous transparent margin on all sides, landscape composition; real alpha transparency.
Avoid: text, labels, logos, watermarks, people, cars, flags, giant lake, large empty lawn, dense forest, separate surrounding roads, thick platform, dramatic perspective, black/white background, checkerboard background baked into image.
```
