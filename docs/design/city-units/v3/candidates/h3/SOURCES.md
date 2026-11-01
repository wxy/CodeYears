# H3 办公楼双变体 · 生成与初标定

日期：2026-11-01。用途：CodeYears 固定视角透明建筑素材。状态：两款正式 PNG 与运行副本已落地，初标定完成；尚未代表城市组合画面或真实扩展验收通过。

使用内置 `image_gen`，每个候选单独生成；每款首稿后各进行一次针对性的收窄修正。没有 CLI/API fallback，没有程序去底、重绘、改色或改变源图像素。原始 alpha 原样复制。首稿因宽底座/外侧花箱使地面包络约束后的高度不足 H3 而不采用，正式目录仅保留修正版。

## 正式文件与实际规格

| ID | 源 PNG | 运行副本 | 大小 | SHA-256 |
| --- | --- | --- | ---: | --- |
| office-h3-a | [office-h3-a.png](office-h3-a.png) | `public/assets/city/unit-office-h3-a.png` | 2,040,875 字节 | `561e933adccd36b8e85cfaa2cc2ab13920381345f0e11187cb6ec839ac1d9193` |
| office-h3-b | [office-h3-b.png](office-h3-b.png) | `public/assets/city/unit-office-h3-b.png` | 1,891,603 字节 | `77480770221d82a885a1d8378cba59b3c82c3a635ec4df96b7bc380a9451843f` |

两款均为 RGBA、1024×1536，alpha 范围 0–254。A 的 alpha>8 半开包络为 `[274,52,781,1465]`；B 为 `[308,70,811,1463]`。低值 alpha 的显示处理沿用共享运行缓存规则，未改变 PNG。工具预览背景的 RGB 色不代表 alpha 有底色；源图存在真实透明像素。

A 为铜色多级退台、细密金属竖梃；B 为冷蓝灰玻璃、银色竖向构件和单侧肩部。二者不是同图改色。地面外扩铺装和独立花箱在修正图中已减少；完整屋顶、边缘、局部遮挡仍由本地城市实际画面复核。

## 参考角色与工具输出

首轮共同参考：
- `docs/design/city-units/v2/01-small-buildings.png`：仅造型/材质风格参考，尤其第三行 A/B；不复制板面、标签或宽地块。
- `public/assets/city/office.png`：仅已有材质与渲染质量参考，不继承其宽占地。

每款修正只引用对应首稿作为 edit target，保持材质与轮廓方向，缩窄地面比例并移除外扩底座附属物。

工具原目录：`/Users/xingyuwang/.codex/generated_images/01a19476-b149-7b91-a476-efd3cf5d6b87/`。

| 阶段 | A | B |
| --- | --- | --- |
| 首稿（未采用） | `exec-e2d26397-c357-4833-888d-aec5b4ba568f.png` | `exec-66fba2d7-18dc-43bd-a9d8-f827b566004f.png` |
| 修正版（正式源） | `exec-fa557407-d503-4712-9a88-5682442c4b65.png` | `exec-e4a72b52-f96a-4b42-ab3c-15897b1ad084.png` |

所有调用均显式 `transparent_background=true`；候选不从设计板裁图。首稿只保留工具原目录，不混入正式运行目录。

## 标定与限制

数据在 [h3.json](../../calibration/h3.json)，结构为共享 `UnitSample` 的 `assets` 数组。坐标是原 PNG 绝对像素；原生占地 1×1，目标上限 3H。两款使用同一 `calibrate` 公式，绘制时校正记录的 W/D 直边，不做源图像素修改。

| 项目 | A | B |
| --- | ---: | ---: |
| 原图 W 主边斜率 | 0.488889 | 0.500000 |
| 原图 D 主边斜率 | -0.492063 | -0.528302 |
| 校正后主边 | +0.5 / -0.5 | +0.5 / -0.5 |
| 实际参考高度 | 3.000000H | **2.800307H** |
| 每侧 W 退让 | 0.103187 格 | 0.100000 格 |
| 每侧 D 退让 | 0.177052 格 | 0.166541 格 |
| 是否受占地限制 | 否 | **是** |

B 不能写成严格 3H 达标。它保留约 7% 的同档造型高度差，未拉高图像、未缩小支撑包络来伪装达标。主代理要求先留给本地城市画面检查，不再无限生成或追求次要隐藏几何。A 也只是以所记录的视觉参考尺达到 3H，不代表物理楼层比例准确。

支撑 L/F/R 取可见外侧砖石落点与最前接触点；隐藏后角仅用于平行四边形闭合推断。参考尺顶为主建筑檐口，排除独立屋顶机组；退台遮挡下的地面垂直投影含人工近似。端点估计误差、可见与推断区别在 JSON 的 basis 中保留。未测屋顶、背面和玻璃内部细节不宣称来自同一精确三维相机。

本轮已目视检查完整轮廓、体量与颜色差异，并核对 alpha、尺寸、哈希及标定计算。明暗宿主页的实际融合、与其他高度档并排、邻接遮挡、二倍复用及真实 MV3 路径由本地主代理组合验收；此处不冒充这些检查已经通过。未创建测试截图/录屏/日志或模拟输入文件。

## 完整提示

### A 首稿

```text
Use case: stylized-concept.
Asset type: one production transparent building sprite for the CodeYears fixed-camera isometric city.
Input images: first supplied board is a STYLE reference only, especially its third row copper setback office; second supplied existing office is a MATERIAL/RENDER QUALITY reference only. Do not copy the whole board, layout, text, or wide footprint.
Primary request: one elegant slender copper-bronze setback office building, warm brown metal mullions and restrained blue-gray windows, 12-16 believable floors with a small two-stage upper setback and dark integrated roof machinery. Clear readable entrance, small inset terraces on upper setbacks. Distinct professionally designed architecture, detailed but coherent at small game sprite scale. Refined realistic city-builder illustration, orthographic pre-rendered 3D quality, not low-poly, not pixel art, no cartoon outlines.
Scene/backdrop: genuinely transparent RGBA background, isolated entire building, absolutely no ground tile, no platform, no surrounding paving sheet, no roads, no labels, no text, no watermark. Only a very tight contact shadow under the building.
Critical common projection: fixed isometric orthographic camera; every right-down ground/roof edge has slope +0.5 and every left-down edge slope -0.5 (2:1 diamond); all vertical wall edges perfectly vertical. Both horizontal ground axes have equal unit length. Frontmost ground corner centered below the building. No perspective vanishing points.
Critical proportions: this is ONE 1x1 logical parcel and must fit INSIDE its central 0.8x0.8 ground area. Slender square main ground footprint, no broad attached wings or garden. The visible vertical main-wall height from ground to highest roof cornice must be approximately TWO TIMES the entire horizontal left-to-right width of the building's ground footprint. It should therefore be noticeably taller and slimmer than the reference office, not a squat block. Complete roof and complete base in frame with comfortable transparent margins; portrait-oriented composition if useful.
Lighting: soft upper-left daylight, warm restrained window variation, rich but subtle architectural texture, crisp clean opaque architecture and clean transparent alpha edges. Avoid white cap roofs, floating objects, overly broad podiums, large external trees, volumetric glow or fuzzy halos. One building only.
```

### B 首稿

```text
Use case: stylized-concept.
Asset type: one production transparent building sprite for the CodeYears fixed-camera isometric city.
Input images: first supplied board is a STYLE reference only, especially the third row blue-gray office; second supplied existing office is a MATERIAL/RENDER QUALITY reference only. Do not copy its wide footprint.
Primary request: one slender modern blue-gray glass office tower with finely spaced SILVER vertical fins and a single strongly defined upper setback on its right side, a darker recessed top mechanical pavilion and a restrained flat dark roof. A distinct architectural silhouette from the copper multi-step building: cleaner straight left edge, one asymmetric shoulder, tall gridded curtain-wall rhythm, cool silver-blue finish, warm interior light in a few windows. 12-16 believable floors. Clear compact glazed entrance. Refined realistic city-builder illustration, orthographic pre-rendered 3D quality, richly detailed but readable at small sprite scale; not low-poly, not pixel art.
Scene/backdrop: genuinely transparent RGBA background. Entire isolated building, no large background shadow, NO ground tile or raised base, NO surrounding paving sheet, NO road, NO text or logos. No external trees; a tiny contained roof planter is fine.
Critical common projection: fixed orthographic isometric camera, right-down edges slope +0.5 and left-down edges slope -0.5, equal-unit ground axes in a 2:1 diamond; all wall verticals exactly vertical; no perspective vanishing point. This is a square 1x1 logical parcel, building foot must stay inside central 0.8x0.8 area with no broad wing or pedestal.
Critical proportions: main-wall height from ground to highest main roof cornice approximately TWO TIMES the full horizontal left-to-right width of the ground footprint, so it looks tall and slender, not squat. Keep entrance steps very small and within footprint. Complete outline and base in frame with comfortable transparent margins, portrait composition. No antenna/spire needed. The height is architectural body, not a tall rooftop antenna.
Lighting: soft upper-left daylight, restrained realistic architectural material, crisp clean alpha edges. Avoid white cap roof, over-broad podium, halos, glow, floating elements, dramatic shadows, or ground geometry. Exactly one building, no labels.
```

### A 修正

```text
Use case: precise-object-edit. This is the single corrective proportion pass for a production isometric city sprite.
Edit target: supplied copper-bronze office building. Preserve its elegant copper facade, blue-gray glazing, dark roof and multi-step upper silhouette, its realistic city-builder render quality, upper-left light and existing orthographic camera.
Change only the overall slenderness and ground footprint details: make the entire building about 30 percent NARROWER in both ground directions while retaining its full vertical architectural height. It must read as a tall, slender office. Remove all ground-level exterior trees, planters, paving extensions and broad podium overhangs; the bottom must be a single compact square footprint with two straight visible base edges meeting at the frontmost corner. All upper mass must fit inside that same square ground footprint. Tiny roof terrace plants may remain.
Mandatory geometry: two equal-unit ground axes, all right-down horizontal edges slope +0.5 and left-down edges slope -0.5; vertical edges stay vertical. Main wall height from floor to highest main cornice must be at least THREE TIMES the full horizontal left-to-right ground footprint width, excluding any roof equipment from the height ruler. This proportion is essential for fitting H3 within one logical cell with margin.
Genuinely TRANSPARENT background, crisp alpha edge, entire building and base visible with margin, no ground tile, no cast shadow extending outside the base, no text or logo, no glowing outline, no new objects, no broad attached wings. A single building only.
```

### B 修正

```text
Use case: precise-object-edit. Single corrective proportion pass for a production isometric city sprite.
Edit target: supplied blue-gray office building. Preserve its cool blue-gray glass, silver vertical fins, one-sided upper shoulder and dark mechanical pavilion, realistic city-builder material, upper-left soft daylight, and orthographic projection.
Change only slenderness and ground footprint: make the WHOLE ground plan about 35 percent narrower in both ground directions while preserving the full vertical wall height. Remove all external ground-level trees and planters, paving extensions and thick podium. Bottom is a single compact SQUARE footprint with exactly two straight visible base edges meeting at the frontmost corner. The lower right wing must NOT project beyond that square; upper setback stays contained above. All main-body verticals remain vertical.
Critical: main-wall height ground-to-highest structural roof cornice at least THREE TIMES the entire horizontal leftmost-to-rightmost ground footprint width. Do not count rooftop machinery in the body height. Slender height is essential. Maintain equal-unit isometric ground axes and slopes +0.5 and -0.5 for all ground/roof edges, not shallow perspective angles.
Genuinely transparent RGBA background; entire one building visible with generous transparent margins. No ground tile, no wide shadow, no roads, no text, no branding, no halo or glow, no outside props, no new objects. Architecture only with crisp alpha.
```
