# H4 长条建筑 · 来源与标定

日期：2026-11-01。四款透明正式源图及运行副本已落盘，初标定完成；主代理负责目录接入和本地组合验收。本任务不改规划/选择/共享源码，不执行 Git 操作。

## 最终素材

| id | 原生占地 | 实际楼身参考H | 实际W×D占用 | 长短比 | 源图SHA-256 |
| --- | --- | ---: | --- | ---: | --- |
| tower-wide-h4-a | 2×1 | 4.000 | 1.372×0.781 | 1.757 | `a43fed34e4f9c3dfc9d170cce41e5e4f040b8d626b25e071af5fb035a7005511` |
| tower-wide-h4-b | 2×1 | **3.820** | 1.447×0.800 | 1.808 | `daba927fe8f6e7b9ac7b0988d108f93bffdbf241e08d396b25bc53ce947e51e0` |
| tower-deep-h4-a | 1×2 | 4.000 | 0.552×1.347 | 2.439 | `78d6f9b312b14c9be423d6739c1954705397f95a76649a296cb4cfe62bb442ff` |
| tower-deep-h4-b | 1×2 | 4.000 | 0.485×1.146 | 2.364 | `6f6b27763817543bf44310b0c81df43dd4cd2012fc20bab6e4bd36294759ff62` |

源文件为本目录 `<id>.png`，运行副本为 `public/assets/city/unit-<id>.png`，均逐字节一致。四图均为 RGBA 1024×1536，四角 alpha=0；不改像素、不去底、不镜像、不裁设计板、不作非等比拉伸。源和运行各共 7,101,535 bytes。低 alpha 残留沿用现有显示缓存抑制；源图不清除或重绘。

## 标定与限制

共享格式见 [h4-rect.json](../../calibration/h4-rect.json)。W/D 主轴端点来自最高屋顶背缘可见直线及 alpha≥180 首像素轮廓，按现有 `calibrate` 映射为±0.5；竖边仍竖直。裁框为 alpha>8 的半开包围框。L/F/R 取完整可见地面支撑外沿，后角仅为逻辑包络平行闭合，不能称隐藏物理四角已恢复。楼身高度排除设备，入口/退台遮挡的同x地面基点明确标为推断，约±10px；屋顶主边约±2px，脚点约±5px。

实际W/D跨度按 `footprint - 2×clearance` 计算，不把登记的2格直接当实占2格。四款长轴均>1.1格，长短比均>1.5；与单格细塔占据长条地块不同。最小每侧留距分别约0.1097、0.1000、0.2240、0.2577格，均满足当前至少0.1规则。包络中心摆放，不用透明PNG或冠部中心。

wide B 受短轴上限限制，实际约3.820H，保留约4.5%的同档较低造型，不能写成严格4H达标。其余三款达到4H楼身参考。AI源图局部窗线、阶梯和基脚不完全来自严格单一物理相机，所记录两条主边校正不证明所有未测边线完全一致；组合中的屋顶/道路、邻接遮挡和浅深边缘仍需目视验收。

wide B 初稿偏方，一次方向修订后仍只约2.84H；deep B 初稿/首次收窄仍过厚。主代理确认这是核心比例缺口，允许各最后一次以已达标A为几何参考的短轴收窄。最终wide B接近4H，deep B移除地面花箱/铺地并收窄短轴后达到4H，达到目标后停止，没有修改量测凑数或无限处理隐藏几何。

只读核对使用 Pillow 读取规格、alpha裁框和轮廓，再直接导入现有 `src/renderers/unit-calibration.ts` 的 `calibrate` 计算高度/双轴/留距/跨度。没有补写单元测试，没有生成或保留测试截图/合成图。未抢占浏览器，不冒称真实MV3、整体美术或硬件性能验收。

## 工具与源路径

全部使用内置 imagegen，每款独立调用，`transparent_background=true`；没有 CLI/API fallback。生成目录为 `/Users/xingyuwang/.codex/generated_images/01a1949e-e424-7b21-9928-2424873444b5/`，最终文件原样复制入项目：

- wide A 最终：`exec-da9dae4a-9ffe-4769-97bc-f84c3a639e2d.png`。
- wide B 首稿：`exec-645d3f72-3d9b-401b-842e-bda8ed1da18e.png`；方向修订：`exec-498d3aa0-ad11-4ad2-90d5-f42c79d0ac5f.png`；最终比例修订：`exec-c4fbbb41-711f-4d25-8815-6ed5ff282d2c.png`。
- deep A 最终：`exec-acc612f1-6b8a-4483-b571-71bca61d5b3a.png`。
- deep B 首稿：`exec-d0566517-804d-4137-82dd-da9856eb2487.png`；第一次收窄：`exec-6df8cfad-ecf3-41e6-959e-5c3dc3966d76.png`；最终比例修订：`exec-3189fb43-ff34-4ee1-aca4-697a6105c91f.png`。

四款初次生成输入图1/2分别是已有 `v3/candidates/h4/tower-h4-a.png`、`tower-h4-b.png`，只作风格和光照参考，均已用 view_image 查看。wide B 第一次以自身首稿编辑；后续两B的比例修订以自身当时稿为编辑对象、对应方向已达标A为几何参考。工具引用本目录B路径时，该路径当时对应上述中间稿；中间稿原文件仍保留在生成目录，未选入运行包。

## 完整提示

### wide A · 初次生成（最终采用）

```text
Use case: stylized-concept. Create ONE original transparent prepainted isometric architectural sprite for CodeYears, matching the refined simulation-city realism, bronze framing, glass detail and upper-left daylight of the reference images. References are STYLE AND LIGHTING ONLY; do not copy their narrow 1x1 footprints.
Camera: true orthographic 2:1 isometric. The W axis goes right-down at slope +0.5, D goes left-down at slope -0.5; all parallel base, cornice and roof edges share these axes. All verticals exactly upright, no vanishing point.
Logical calibration scale: W=(48,24), D=(-48,24), H=(0,-48). This is H4: 192 units of main structural height, excluding equipment/spires. Ground is a RECTANGLE with footprint specified below, every edge inset .1 cell, not a square. The entire support envelope must stay within 1.8 by .8 ground units (or .8 by 1.8 in the other orientation). Its projected total width about 125 units, so main body height should be at least 1.55 times the complete base's projected width; build tall and slim enough. Keep the long ground edge around 2.25 times the short one. No spreading base annexes.
Composition: single complete connected building mass in generous transparent margin, full roof and ground contacts visible. Portrait canvas, about 85 percent image height. Genuinely transparent RGBA around it, no scene, no base plate, no floor, no roads, no people, no cars, no trees outside, no labels/text/grid. Tiny contact shade only, no exterior halo, bloom, fog or shadow haze. No bizarre white cap. Crisp realistic original city-game art, not toy/cartoon/voxel, subtle warm entry glazing.
Asset id tower-wide-h4-a. Ground footprint is 2x1: LONG direction W right-down (+.5), SHORT direction D left-down (-.5). Clearly show the longer frontage running right-down; it is not a square tower. Variant A: a single elongated DEEP BLUE GLASS STRAIGHT HIGH-RISE, continuous wide rectangular shaft with restrained bronze vertical mullions, slightly chamfered corners, a shallow dark stepped crown and compact realistic roof machinery. A unified tall office slab on a rectangular base, no twin disconnected towers, no broad podium. Ground entrance and main structural footings remain easy to identify.
```

### wide B · 首稿

```text
Use case: stylized-concept. Create ONE original transparent prepainted isometric architectural sprite for CodeYears, matching the refined simulation-city realism, bronze framing, glass detail and upper-left daylight of the reference images. References are STYLE AND LIGHTING ONLY; do not copy their narrow 1x1 footprints.
Camera: true orthographic 2:1 isometric. The W axis goes right-down at slope +0.5, D goes left-down at slope -0.5; all parallel base, cornice and roof edges share these axes. All verticals exactly upright, no vanishing point.
Logical calibration scale: W=(48,24), D=(-48,24), H=(0,-48). This is H4: 192 units of main structural height, excluding equipment/spires. Ground is a RECTANGLE with footprint specified below, every edge inset .1 cell, not a square. The entire support envelope must stay within 1.8 by .8 ground units (or .8 by 1.8 in the other orientation). Its projected total width about 125 units, so main body height should be at least 1.55 times the complete base's projected width; build tall and slim enough. Keep the long ground edge around 2.25 times the short one. No spreading base annexes.
Composition: single complete connected building mass in generous transparent margin, full roof and ground contacts visible. Portrait canvas, about 85 percent image height. Genuinely transparent RGBA around it, no scene, no base plate, no floor, no roads, no people, no cars, no trees outside, no labels/text/grid. Tiny contact shade only, no exterior halo, bloom, fog or shadow haze. No bizarre white cap. Crisp realistic original city-game art, not toy/cartoon/voxel, subtle warm entry glazing.
Asset id tower-wide-h4-b. Ground footprint is 2x1: LONG W axis right-down (+.5), SHORT D axis left-down (-.5). This must be visibly an elongated rectangle, not a square. Variant B: one original TEAL GLASS and WARM GOLD METAL TERRACED COMMERCIAL HIGH-RISE, a connected elongated lower shaft with two large upper setbacks stepping upward toward its short rear end; fine vertical fins, inset glass corner, dark roofs with tiny contained planted terraces. One coherent rectangular building, not twin separate towers. Lower body remains high and elongated, with no low sprawling pedestal. Different silhouette and facade rhythm from straight blue A. No broad external planters or ground props.
```

### wide B · 方向修订

```text
Precise object edit, tower-wide-h4-b. Preserve the warm gold fins, teal glass, tall terraced upper mass, daylight direction, complete roof/base, original refined architectural sprite quality and genuinely transparent alpha. Correct ONLY the footprint direction/proportion that is still too square: this must be a LONG 2x1 rectangular building, with its W edge going right-down slope +0.5 and its D edge going left-down slope -0.5. In the final IMAGE, the visible facade on the left must have ground edge MORE THAN TWICE the projected length of the facade on the right. Extend the coherent long continuous building volume along the left facade/right-down axis; do not add a low lateral platform. Full ground envelope must be an elongated parallelogram, not equal-sided. Keep its main structural height H4 tall enough: full projected ground width at most about 700px for main body height 1250px. Make a continuous rectangular commercial tower, no two detached towers, no floor/base plate or outlying vegetation. Keep generous fully transparent margins and avoid external halo/shadow fog. All corresponding roof/base parallels ±.5, verticals upright.
```

### wide B · 最终短轴比例修订

```text
Use case: precise-object-edit. IMAGE 1 is the teal tower-wide-h4-b EDIT TARGET. IMAGE 2 is the accepted blue 2x1 H4 tower, a GEOMETRY/PROPORTION reference only.
Preserve the teal glass and warm gold vertical fins, distinctive upper terraces/stepped volumes, realistic detail and transparency. Make the target's underlying full-height RECTANGULAR SHAFT have the same narrow short-axis depth and tall-body proportion as image 2. The current short facade/base depth is too thick; reduce that SHORT D direction by about 35 percent while keeping the LONG W facade and total tower height. Main long body is continuous across two W cells and not two isolated towers.
Final footprint 2x1: image-left facade LONG, image-right facade SHORT; left visible ground edge at least 2.3 times the right one. Long W edges right-down +0.5; short D edges left-down -0.5 (or front-to-back upper-right -.5); all matching roof/base parallels, upright verticals, true orthographic. Base ratio must be elongated, no square pedestal. Keep long logical ground occupancy at least 1.3 units out of 2, short occupancy .6-.75 out of 1; height exactly FOUR logical units. In pixels aim for main tower structural height at least 2.6 times complete projected base width, with the short facade horizontal width about 100px, long facade width about 300px, main body height about1300px. Upper terraces occupy the top quarter, no broad low annex/podium or external planters.
Complete roof/base, generous fully transparent margin, original crisp city-game realism, no opaque background, labels, road, ground tile, halo or spreading shadow.
```

### deep A · 初次生成（最终采用）

```text
Use case: stylized-concept. Create ONE original transparent prepainted isometric architectural sprite for CodeYears, matching the refined simulation-city realism, bronze framing, glass detail and upper-left daylight of the reference images. References are STYLE AND LIGHTING ONLY; do not copy their narrow 1x1 footprints.
Camera: true orthographic 2:1 isometric. The W axis goes right-down at slope +0.5, D goes left-down at slope -0.5; all parallel base, cornice and roof edges share these axes. All verticals exactly upright, no vanishing point.
Logical calibration scale: W=(48,24), D=(-48,24), H=(0,-48). This is H4: 192 units of main structural height, excluding equipment/spires. Ground is a RECTANGLE with footprint specified below, every edge inset .1 cell, not a square. The entire support envelope must stay within 1.8 by .8 ground units (or .8 by 1.8 in the other orientation). Its projected total width about 125 units, so main body height should be at least 1.55 times the complete base's projected width; build tall and slim enough. Keep the long ground edge around 2.25 times the short one. No spreading base annexes.
Composition: single complete connected building mass in generous transparent margin, full roof and ground contacts visible. Portrait canvas, about 85 percent image height. Genuinely transparent RGBA around it, no scene, no base plate, no floor, no roads, no people, no cars, no trees outside, no labels/text/grid. Tiny contact shade only, no exterior halo, bloom, fog or shadow haze. No bizarre white cap. Crisp realistic original city-game art, not toy/cartoon/voxel, subtle warm entry glazing.
Asset id tower-deep-h4-a. CRITICAL FOOTPRINT ORIENTATION: 1x2, SHORT W axis right-down (+.5), LONG D axis left-down (-.5). The right-facing visible facade (on the IMAGE RIGHT) must span MORE THAN TWICE the width of the left-facing facade. The front bottom corner is toward image-left, and from it the long bottom edge goes toward image upper-right. Roof and base are an elongated parallelogram with the long edges slope -0.5, short edges slope +0.5. This is the other orientation from a 2x1 slab, NOT a square tower and NOT a mirrored sprite.
Variant A: one coherent DEEP BLUE GLASS LONG HIGH-RISE office slab with silver-bronze vertical fins, continuous full-height body along the long D footprint, one precise upper setback and dark long mechanical roof. Readable long facade, very compact ground entrance within shaft. Distinct slightly chamfered long roof profile, no disconnected towers.
```

### deep B · 首稿

```text
Use case: stylized-concept. Create ONE original transparent prepainted isometric architectural sprite for CodeYears, matching the refined simulation-city realism, bronze framing, glass detail and upper-left daylight of the reference images. References are STYLE AND LIGHTING ONLY; do not copy their narrow 1x1 footprints.
Camera: true orthographic 2:1 isometric. The W axis goes right-down at slope +0.5, D goes left-down at slope -0.5; all parallel base, cornice and roof edges share these axes. All verticals exactly upright, no vanishing point.
Logical calibration scale: W=(48,24), D=(-48,24), H=(0,-48). This is H4: 192 units of main structural height, excluding equipment/spires. Ground is a RECTANGLE with footprint specified below, every edge inset .1 cell, not a square. The entire support envelope must stay within 1.8 by .8 ground units (or .8 by 1.8 in the other orientation). Its projected total width about 125 units, so main body height should be at least 1.55 times the complete base's projected width; build tall and slim enough. Keep the long ground edge around 2.25 times the short one. No spreading base annexes.
Composition: single complete connected building mass in generous transparent margin, full roof and ground contacts visible. Portrait canvas, about 85 percent image height. Genuinely transparent RGBA around it, no scene, no base plate, no floor, no roads, no people, no cars, no trees outside, no labels/text/grid. Tiny contact shade only, no exterior halo, bloom, fog or shadow haze. No bizarre white cap. Crisp realistic original city-game art, not toy/cartoon/voxel, subtle warm entry glazing.
Asset id tower-deep-h4-b. CRITICAL FOOTPRINT ORIENTATION: 1x2, SHORT W right-down (+.5), LONG D left-down (-.5). Right-facing IMAGE-RIGHT facade ground edge must be at least TWICE as wide as left-facing facade ground edge. From front bottom corner toward upper-right, show the long D base edge; from leftmost base corner toward front bottom corner, show only the short W edge. Long roof edges slope -0.5, short roof edges slope +0.5. Make the base obviously long/deep rather than square; this is a truly separately drawn 1x2 sprite, NOT a mirrored 2x1.
Variant B: one coherent TEAL-AND-GREEN GLASS TERRACED HIGH-RISE commercial slab with warm gold/bronze vertical screens. Tall connected main volumes step down along the LONG D direction, making a very distinctive zig-zag upper silhouette; shallow planted roof ledges contained in footprint, dark realistic mechanical roofs. One continuous full-height lower building connected across the long parcel, no disconnected towers, no low spread podium. Fine facade rhythm different from A's straight blue slab. H4 body reference retains 192 logical units while long visible ground edge retains at least 1.4 logical cells, short edge .65-.8 cells.
```

### deep B · 第一次收窄

```text
Use case: precise-object-edit. Edit target is IMAGE 1 (teal terraced tower-deep-h4-b). IMAGE 2 (blue deep slab) is a supporting GEOMETRY/PROPORTION reference only.
Keep teal glass, warm gold fins, tall connected terraced silhouette with contained roof greenery, realistic city-game rendering and transparent alpha.
Fix its too-thick SHORT AXIS. Preserve its LONG D facade and height, but narrow the short W facade by approximately one third. Target the slender DEEP 1x2 ground footprint proportions of image 2: visible IMAGE-RIGHT facade is 2.4 to 2.8 times as wide as IMAGE-LEFT facade, not a square. Long edges slope -0.5, short edges slope +0.5 throughout every roof/base/floor, verticals exactly vertical. The complete ground envelope including entry steps/planters should project around 450px across with a short facade horizontally at most 110px and long facade around 320px, while main body reference remains around 1250px. No added sprawling podium.
One coherent connected terraced skyscraper, not separate towers; maintain distinct stepped silhouette rather than turning into a straight blue slab. Complete roof/base, transparent margin on all sides, genuine alpha background, no labels, no base tile, no roads, no fog or halo. This is a real H4-height long building occupying two deep cells, not a square tower filling a long image slot.
```

### deep B · 最终短轴/底部修订

```text
Final precise architectural sprite edit. IMAGE 1 is the teal terraced 1x2 tower to correct. IMAGE 2 is the blue 1x2 tower with accepted narrow footprint; use image2's entire ground proportions as the strict geometry reference.
Rebuild image1 as a substantially thinner DEEP RECTANGULAR tower: the image-LEFT short facade must be less than ONE THIRD the width of the image-RIGHT long facade. Short ground edge's horizontal span only 70–100 pixels, long edge horizontal span 320–360 pixels, main structural body height about1250pixels. Keep the long facade dimension and height; greatly reduce the short W depth, including ALL lower base parts. No square pedestal, no broad entry apron. Remove ALL ground-level planter boxes, entrance paving slabs, broad steps and lateral annexes; the glass shaft ends at one compact continuous wall footing with a slim doorway inside. The complete support envelope must remain narrow; no extra props sticking out.
Keep B's teal glazing, gold vertical ribs, distinctive three upper setbacks and tiny contained rooftop terrace plants. One connected full-height office building, not detached towers. Keep the long D edges slope -0.5 and short W edges slope +0.5, with verticals perfectly upright and a shared orthographic camera from ground to roof.
Do not simply squash the PNG. Redesign the 3D architectural volume with the narrow footprint seen in image2. The silhouette and facade should stay visually different from image2 through the upper terraces and teal/gold materials. Full intact top/base with ample truly transparent margins, no floor tile, no text, no roads, no outer fog/glow/shadow haze.
```
