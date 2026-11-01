# H4 双变体：来源与首轮标定

日期：2026-11-01。状态：两款透明正式候选及运行副本已写入；首轮坐标标定完成，尚待主代理组合到城市后进行浅深背景、近景和邻接验收。未修改已有源图或运行选择逻辑。

## 文件与检查

| id | 造型 | 源文件 / 运行副本 | 实际规格 | SHA-256 |
| --- | --- | --- | --- | --- |
| tower-h4-a | 蓝玻璃细直塔、紧凑深色冠部 | [tower-h4-a.png](tower-h4-a.png) / `public/assets/city/unit-tower-h4-a.png` | RGBA 1024×1536，1,385,455 字节 | `08927f95687d1611db3b1328e3909531f287454f386a319acc8dadebc6841925` |
| tower-h4-b | 青绿玻璃多级退台塔、细窄植物露台 | [tower-h4-b.png](tower-h4-b.png) / `public/assets/city/unit-tower-h4-b.png` | RGBA 1086×1448，764,032 字节 | `3f125eb8932e4530c5e9b7bbd90290aa1a022f3955836f438512c18d469fc34c` |

使用内置 `image_gen`，每个变体独立生成，再各进行一次针对性比例编辑，始终请求 `transparent_background=true`。未使用 API/CLI fallback，未用程序绘图、去底、重采样或改写像素。源文件和运行副本为同一生成文件的完整复制。首版过宽导致 H4 与占地约束冲突，未纳入项目；最终两款以更窄的地面比例取代首版，未为标签 H4 拉伸楼身。

只读 Pillow 检查：A 的 alpha=0 像素 1,233,613，alpha1–8 像素 6,953，alpha255 像素 0（主体主要为接近不透明的 alpha253）；B 分别为 1,222,874、15,181、138。两款外部角点透明，alpha>8 裁框分别为 `[384,70,641,1460]` 和 `[372,56,721,1408]`。工具展示中较软的外围不意味着已通过深浅背景验收；运行显示沿用现有低 alpha 缓存抑制，较高 alpha 边缘仍需组合画面目视检查。

## 比例与投影

坐标记录见 [h4.json](../../calibration/h4.json)。按现有 `src/renderers/unit-calibration.ts` 的公式计算，不新造第二套运行标定逻辑：

| id | 源主轴 W / D 斜率 | 校正主轴 | 参考高度 | 每侧 W / D 退让 |
| --- | --- | --- | --- | --- |
| tower-h4-a | 0.429825 / −0.512821 | +0.5 / −0.5 | 约4.000H | 约0.249865 / 0.302765格 |
| tower-h4-b | 0.586207 / −0.597561 | +0.5 / −0.5 | 约4.000H | 约0.117305 / 0.211477格 |

两者均为 `footprint=[1,1]`、`targetHeight=4`，在本轮所选参考点下可达到 H4，未被占地上限缩低。A 地面占用更窄，按支撑包络中心放置，非按透明 PNG 中心对齐。B 的最高主体竖边在入口基座处被遮挡，地面参考点由邻接脚线推断，已在 JSON 单独说明；不是伪装成全可见量测。包络的后角只为摆放作平行闭合，不能当隐藏真实物理四角。主边端点约±3px，脚点约±5px，B 高度基点约±10px，不宣称生成模型恢复了统一物理相机。

已目视检查两款完整主体/顶部/底部、A/B 轮廓差异和源 alpha。主代理仍需检查实际烘焙后的浅深背景、H1–H4 并排、标准尺寸、邻接遮挡和城市远近景；本任务未抢占浏览器做真实 MV3 或硬件验收。

## 工具来源

共同生成目录：`/Users/xingyuwang/.codex/generated_images/01a19476-db10-7d31-b2a9-f1ebf9914cfc/`。

- A 初稿：`exec-bc6f0738-ed46-4d38-9683-bd253ef16567.png`，未选入。
- A 最终：`exec-fc88ed56-4bfc-4569-bbd6-b477557d00a2.png`。
- B 初稿：`exec-0e911cec-6b45-480b-b819-5ac71efa36f5.png`，未选入。
- B 最终：`exec-81309587-b660-4b02-a3ad-08591b7298e2.png`。

初稿输入图1：`docs/design/city-units/v2/01-small-buildings.png`，只作已选风格/材质和设计方向参考；输入图2：`public/assets/city/tower.png`，只作光照、精致度、玻璃材质参考。两图已用 view_image 查看。最终编辑各以自身初稿为唯一编辑对象；不是从设计板裁剪、复制旧楼或只做换色。

## 完整提示集

### A 初稿
```text
Use case: stylized-concept
Asset type: one transparent isometric raster building sprite for CodeYears city.
Primary request: Create a single exquisitely detailed slender BLUE GLASS STRAIGHT SKYSCRAPER, the A variant for a 1x1 H4 city tile. Reference image 1 is a style/design reference only (its bottom left tower); reference image 2 is a style/material reference only. Create a new building, not a design sheet, and do not copy the pedestal or existing proportions.
Scene/backdrop: genuinely transparent alpha background, no environment, no floor tile, no base plate, no roads.
Subject: a slim New York-like modern commercial glass tower, deep blue low-reflection glass and restrained dark bronze mullions, a clear rectilinear straight tower body, a compact dark flat crown with small realistic rooftop equipment; subtle warm windows near ground level. Slim entry entirely inside building footprint, no sprawling podium, no side trees.
Style/medium: refined simulation-city architectural illustration, crisp realistic prepainted game art, polished materials, physically plausible clean details, not voxel, not pixel art, not toy cartoon.
Geometric requirements: TRUE FIXED 2:1 ISOMETRIC ORTHOGRAPHIC CAMERA. The two horizontal axes must run exactly down-right with slope +0.5 and down-left with slope -0.5. All corresponding parallel roof and base edges have these same slopes. Vertical edges perfectly vertical, no perspective convergence. Show front and right/left facade consistently with the reference light direction.
PROPORTIONS ARE CRITICAL: Logical ground cell uses W=(48,24), D=(-48,24), H=(0,-48). The building's visible ground envelope is a small square inset .10 cell on all four sides. The main vertical building-body reference must be FOUR height units =192 units while the occupied square has two ground edge vectors each only (38.4,19.2). Thus the tower body is very slender: vertical body height about 5 times the HORIZONTAL LENGTH OF ONE GROUND EDGE (or about 2.5 times the full projected overall ground-envelope width). Do not widen the base to fill a square canvas. No large podium.
Composition/framing: one complete centered tower, full top and full ground contact visible, generous fully transparent margin. Portrait layout, object height around 80 percent of image, visually narrow at base. Clean sharp silhouette and no disconnected bits.
Lighting/mood: soft daylight from upper-left; tiny contact shadow under building only, no cast shadow haze or glow around it.
Text: none.
Avoid: white cap roofs, giant white pedestal, scene floor, opaque background, grid, measurement marks, labels, letters, logos, vehicles, people, trees, excessive vegetation, cut off top or base, fog, bloom.
```

### A 最终比例编辑
```text
Use case: precise-object-edit. Edit this transparent architectural sprite into its final H4 variant A.
Keep the detailed blue glass, bronze mullions, upper-left soft daylight and tiny compact ground contact, full intact top/base, no text, transparent background.
Make ONE targeted proportion correction: make the complete ground footprint, all tower widths and their depth substantially narrower relative to the same vertical height. The new complete ground contact width must be no more than 340 pixels for a roughly 1300-pixel main tower-body height. Both square footprint axes must have equal projected length, with two base edges slope +0.5 and -0.5. Keep vertical edges perfectly vertical and the orthographic isometric camera consistent from ground to roof.
Also simplify it to a tall straight shaft with only a very small upper crown setback, so it is visually distinguishable from the terraced B tower. No lateral stepped annexes, no sprawling podium, no outlying trees/planters. Tiny entrance contained under the shaft.
This is a narrow needle-like modern commercial skyscraper, with realistic glass details and a dark flat roof. Keep complete silhouette surrounded by fully transparent margin. No exterior glow, haze, opaque backdrop, ground tile, road or shadow beyond a tiny contact line. Do not expand it to fill the canvas width. Portrait image.
```

### B 初稿
```text
Use case: stylized-concept
Asset type: one transparent isometric raster building sprite for CodeYears city.
Primary request: Create one finely detailed slender TEAL GREEN GLASS TERRACED SKYSCRAPER, B variant for 1x1 H4. Reference image 1 is ONLY for refined city-game material/style. Reference image 2 is ONLY for polished architectural illustration lighting. This must have a DIFFERENT SILHOUETTE: three asymmetrically ascending slender rectangular volumes with angular upper setbacks, sparse planted setback ledges, slim green-tinted glazing, copper-grey vertical ribs, a compact dark roof with subtle mechanical equipment. Not a recoloring of the reference tower.
Background: genuine transparent RGBA. The transparency must be perfectly empty around the building; no opaque color and NO HALO, fog, soft outer glow or spreading shadow. No floor tile, no ground rectangle, no pedestal, no road.
Style: realistic polished simulation-city architectural sprite, crisp readable fine facade, not pixel art, not cartoon, no text or logos. Daylight from upper-left, brighter left facade and darker right facade, subtle warm entrance glazing.
Camera: fixed true 2:1 isometric orthographic projection. Horizontal edges parallel to W=(48,24) and D=(-48,24), corresponding image slopes +0.5/-0.5 everywhere, all verticals strictly upright, no perspective convergence.
Critical proportions: square 1x1 tile with the building inset .1 cell at each side, very small square ground footprint. Main structural height H4=192 units, while each occupied ground-edge vector is only (38.4,19.2). Visible body height must be about FIVE times the horizontal component of a single ground edge, about 2.5 times the overall projected base width. Build a slender tall tower, NOT a broad tower on an enormous podium. Keep entry steps and slim planters within this small footprint. The top main volume defines body height; no spire that inflates height.
Composition: centered single complete object in portrait canvas with generous transparent margin, complete rooftop and complete ground contact, no cropped parts. Total height about 85 percent of canvas, slender base. Keep foreground and base unobscured.
Avoid: white cap roof, vast white plinth, ground scene, parking, trees beside the building, people, cars, labels, grid, measuring lines, multiple separate buildings, bloom, mist, contact glow.
```

### B 最终比例编辑
```text
Use case: precise-object-edit. Edit this transparent teal-green terraced skyscraper sprite to fix one critical proportion problem, keeping its green glass, thin bronze-grey ribs, polished city-game detail, asymmetric upper setbacks, compact dark roof and upper-left daylight.
Make the COMPLETE BUILDING including podium, all annexes, planters and entry footprint MUCH NARROWER at the same vertical height. The final ground contact projected width should be NO MORE THAN 300 pixels for a roughly 1300-pixel main body height. Its square ground footprint has equal projected axis lengths, corners a symmetrical diamond with edge slopes exactly +0.5/-0.5; all corresponding roof/base edges have these same slopes, no perspective convergence, all verticals upright. The current wide base must become a compact needle-tower base; no broad podium or extensive planting.
Retain visually readable upper terraces/setbacks in the upper third, so B differs from a straight-shaft blue tower. Use three narrow ascending body volumes; limit terrace plants to tiny planter strips. Straight lower body with slim entrance. H4=4 vertical logical units on a 1x1 square cell with every edge inset .1. This requires a needle-like slender tower approximately FOUR times as tall as its entire projected ground width.
Full rooftop, base and silhouette visible, centered portrait canvas with fully transparent space around every edge. NO exterior soft glow/haze/bloom/shadows; alpha background truly empty. No ground tile, road, trees outside, grid, text, labels or logos. Do not widen it to fill canvas width.
```
