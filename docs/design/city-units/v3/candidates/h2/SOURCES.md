# H2 中层住宅透明素材

日期：2026-11-01。状态：两款独立透明素材与初次标定已完成，供本地组合 PR 接入；未以此替代城市整体画面、真实 MV3 或性能验收。

## 文件和来源

使用内置 `image_gen`，每款独立请求，`transparent_background=true`，未使用 CLI/API fallback。源 PNG 与运行副本逐字节相同，未程序去底、改色、拉伸或重画。工具原图保留，项目使用正式副本。

| id | 文件规格 | SHA-256 | 工具输出 |
| --- | --- | --- | --- |
| apartment-h2-a | RGBA 1024×1536；2,701,848 bytes | `19336072ecc984c49e357e7ae52844235f23628ca6b9a05e3ed8599eb459ae69` | `/Users/xingyuwang/.codex/generated_images/01a19476-77c1-77a1-8f47-e633841e75a0/exec-0dc6e8d0-6cd0-4a5c-b584-16b60d669610.png` |
| apartment-h2-b | RGBA 1040×1513；2,109,479 bytes | `c15d41b46782d07b03d6b9c14ca8ad18cad6f9b7515a8dc09581ad77b04a7c2c` | `/Users/xingyuwang/.codex/generated_images/01a19476-77c1-77a1-8f47-e633841e75a0/exec-c07b3bb4-1acd-4adf-a0bb-bb7d03cc5941.png` |

运行副本：`public/assets/city/unit-apartment-h2-a.png`、`unit-apartment-h2-b.png`。标定：`../../calibration/h2.json`。首张 B 偏宽，按占地限制只能达到约1.657H，因此未选入项目；仅做一次增加楼层的定向生成，采用上表最终图。首张 B 工具路径为 `/Users/xingyuwang/.codex/generated_images/01a19476-77c1-77a1-8f47-e633841e75a0/exec-e1c08d32-c6f1-46fd-bbd9-e3d6709973dc.png`。

## 标定与实际观察

- A 暖砖与深绿色细部，包含小型顶层露台；B 浅石材、凹入的深色顶层与不同阳台节奏。并非同图改色。
- 两图的屋顶源主方向并未严格等于标准轴：A W=25/79、D=−27/79；B W=22/79、D=−35/79。以实际记录主边作统一仿射校正，W/D 映射到+0.5/−0.5，保持竖线竖直。未将提示要求当成源图已通过。
- 以可见主墙竖角为楼身标尺，排除屋顶机房、退台突出部分；A/B 均可达到实际2.000H。每侧地面退让：A W约0.172、D约0.192格；B W约0.166、D约0.200格。
- 地面L/F/R包络是人工选定的可见墙脚、附属花箱/阳台投影逻辑包络；后角隐藏，以平行闭合推断定位，不宣称物理四角实测。楼身高参考约±12px，包络约±8px。
- A 外围暖色软晕的显著范围均为alpha≤8；既有显示缓存会抑制这一范围，源图原样保留。alpha>8裁框为(169,64)–(875,1441)。B最终图alpha>8裁框为(152,25)–(918,1483)。两图四个角alpha均为0。
- 原图已目视检查完整轮廓、材质与A/B差异；实际标定后浅深背景、相邻遮挡和2倍复用由组合验收继续检查。图像校正不能恢复隐藏几何，未宣称全部细部来自同一物理相机。

## 提示与参考角色

每次生成均先查看参考图。`v2/01-small-buildings.png`是已选的造型/材质参考，`public/assets/city/apartment.png`是纹理清晰度参考；不将整板或旧素材裁切接入。

### A 原始请求

```text
Use case: stylized-concept. Asset type: CodeYears prepainted transparent isometric city building sprite, one single building only.
Create a refined terracotta brick corner apartment for a fixed-camera city map. Seven slim residential levels above a modest ground floor, with a restrained stepped top-floor terrace, fine dark bronze windows, warm terracotta masonry and sandstone trim, charcoal flat roof, a few built-in terrace planters. Make a recognizably beautiful urban building rather than a plain box. No separate trees, street props or ground slab.
Reference image roles: the supplied 01-small-buildings sheet is an approved aesthetic and building-material reference only, specifically the H2 A terracotta apartment. The supplied existing apartment is an edge/detail-quality reference only. Do not copy its wide footprint, paving or trees.
Geometry is critical: single square ground footprint, orthographic 2:1 dimetric projection. Every W-parallel edge runs right-and-down at +0.5 image slope, every D-parallel edge runs right-and-up at -0.5 image slope; verticals remain vertical, no vanishing point. The two visible facades have approximately equal footprint width. Height is 2 logical units on a 1x1 footprint, with the actual support envelope occupying no more than 0.8x0.8 logical units. Thus a building's vertical wall edge should be about 2.5 times the projected horizontal width of either ground-edge run, so the building is notably slender, about eight storeys. Full building, all roof details and ground contact visible, generous transparent margin. Subject centered by ground footprint.
Soft upper-left neutral daylight, realistic game-style hand-crafted architecture with crisp legible detail at small scales, no heavy outlines, no depth-of-field. Actual transparent RGBA background and clean alpha edges; no backdrop, no cast shadow outside ground contact, no floating ambient halo.
No road, no sidewalk tile, no separate pedestal, no baseplate, no labels, no numbers, no grid, no text, no watermark, no white roof cap. One building, not a sheet.
```

### B 原始请求

```text
Use case: stylized-concept. Asset type: CodeYears prepainted transparent isometric city building sprite, one single building only.
Create a refined pale limestone mid-rise residential building with seven slim residential floors above a modest glazed entrance level. Distinct from a terracotta apartment: light warm-gray stone frame, vertically paired recessed blue-gray windows, inset narrow charcoal metal balconies on alternate bays, a single subtly recessed top level with a charcoal roof and two discreet rooftop units. Quiet metropolitan elegance, realistic craftsmanship at small city-map scale. No detached trees, street props or ground slab.
Reference roles: supplied approved 01-small-buildings sheet is aesthetic and material reference only, particularly H2 B. Existing apartment is detail/alpha quality reference only; do not copy its wide footprint, paving or trees.
Geometry: one square ground footprint. Orthographic 2:1 dimetric projection. All W-parallel edges right-down at +0.5 image slope; all D-parallel edges right-up at -0.5 image slope. No perspective convergence; vertical wall edges remain vertical. Both visible facades have approximately equal width. Building H2 on logical1x1 ground with wall support contained within0.8x0.8. The main vertical wall edge is approximately2.5 times the projected horizontal run of either one ground side, so make a slender eight-storey body. Whole roof, base and all balconies visible with generous transparent margin. Center the building by its ground footprint.
Soft upper-left daylight, clean realistic game-style architectural sprite, fine stone joints and crisp details, neutral restrained warmth. True transparent RGBA background, clean alpha, only tiny self/contact shadow.
Avoid: no podium, no baseplate, no sidewalk or road, no large plinth, no independent planting, no white cap on roof, no labels, no text, no grid, no numbers, no cast shadow outside contact, no halo, no dark background. One building only.
```

### B 一次比例修订

输入仅为首张B透明素材，角色为编辑目标，保留材质/地面占地/两立面，增加楼层使楼身满足统一高度与留距。

```text
Edit target: the supplied single pale limestone residential building. Keep this building's materials, square ground footprint, two facade designs, charcoal roof, exact fixed camera directions, full transparent background and crisp isolated edges. Change only its vertical architectural proportion: add THREE matching residential floors between the lower floors and the recessed top storey so the main wall body becomes about 40% taller while the ground footprint stays the same. This is a slender mid-rise architecture sprite with a visibly taller body; do not enlarge or widen the building. Keep windows/floors natural size rather than stretching existing floors, and maintain all verticals vertical and existing ground/roof axis angles. Entire roof and base must fit within frame with transparent margin. Do not add a baseplate, sidewalk, road, trees, backdrop, halo or outer cast shadow. Preserve clean genuine transparent alpha.
```

## 可复核检查

用项目现有 `calibrate` 函数读取 `h2.json`，核对两轴、实际楼身高度、四边留距与中心。只读测量源PNG的尺寸、alpha裁框、哈希和副本一致性；未生成或保留测试截图/中间素材。未运行与本素材无关的数据、身份、Edge或硬件矩阵。
