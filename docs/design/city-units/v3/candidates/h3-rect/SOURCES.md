# H3 两格矩形办公楼 · 生成与初标定

日期：2026-11-01。四款正式 PNG 和运行副本已完成，分别为 2×1 与 1×2 两个方向的 A/B。这里只交付素材/初标定，不宣称城市组合、真实扩展或用户美术验收完成。

使用内置 `image_gen`，每个请求独立执行、显式 `transparent_background=true`。没有 CLI/API fallback，没有程序画图、去底、改色、裁图、镜像、拉伸或修改 alpha。Python 仅只读量测并逐字节复制正式图。旧单格素材保留不动。

## 文件、来源与实际量测

原始工具目录：`/Users/xingyuwang/.codex/generated_images/01a1949e-8df0-7af0-a4fc-6164e2b43f8d/`。正式源文件为本目录同名 PNG，运行副本为 `public/assets/city/unit-<id>.png`，两者逐字节一致。

| id | 原生占地 | 实际楼身H | 实际W/D支撑跨度 | 每侧W/D退让 | bytes |
| --- | --- | ---: | --- | --- | ---: |
| office-wide-h3-a | 2×1 | 3.000 | 1.511 / 0.576 | 0.245 / 0.212 | 2,102,492 |
| office-wide-h3-b | 2×1 | 3.000 | 1.333 / 0.464 | 0.333 / 0.268 | 2,107,423 |
| office-deep-h3-a | 1×2 | 3.000 | 0.389 / 1.163 | 0.305 / 0.419 | 1,932,335 |
| office-deep-h3-b | 1×2 | 3.000 | 0.710 / 1.798 | 0.145 / 0.101 | 2,021,521 |

四款均为 1024×1536 RGBA，alpha 范围 0–254；边角 alpha 为 0–1，其中 wide B 左上角为 1，现有显示缓存的低值 alpha 抑制会清除，不改原 PNG。裁框为 alpha>8 的半开包络，详见 [h3-rect.json](../../calibration/h3-rect.json)。四款实际长轴均超过 1.1 格，长短比约 2.62、2.88、2.98、2.53；不是只给单格楼贴上两格标签。没有假定图片本身占满两格：主体以支撑包络居中，留距优先，实际跨度如实记录。

- `office-wide-h3-a`：工具正式源 `exec-f12498f9-c618-4276-89c0-3ec22ed8877d.png`；SHA-256 `6ede38c4fb71b652c13f5b1b52e001fa2b4457c9043f8e4e9f99b45c1bf990aa`。
- `office-wide-h3-b`：工具正式源 `exec-e0f954b1-aa50-4c78-9e34-f4fa43dba398.png`；SHA-256 `f0d5094ec565096af5a360183f07b3e912c1320b2eeb603211bc97c0225d16e3`。
- `office-deep-h3-a`：工具正式源 `exec-0984e615-a1c8-4cf0-bf59-027cfa008ca6.png`；SHA-256 `161d8a4eb5077a30e1b8136dc8f63c14e245263d86187bbed5379f9ae7d658d3`。
- `office-deep-h3-b`：工具正式源 `exec-666c6c40-32d4-46c1-944d-9c43f0da4189.png`；SHA-256 `2352ff1eb30ca2714bd0e7b3b4363eccd1e9de130e0bf2fb47b2d462cd6a4797`。

## 几何依据与限制

- 使用共享 `calibrate`，W=(48,24)、D=(-48,24)、H=(0,-48)。本组记录可见落地支撑直边的 W/D 方向，校正后测得 ±0.5，地面包络中心误差 0。
- L/F/R 是按可见外侧落地支撑边选取的保守逻辑包络端点，约 ±6 px；部分端点位于抗锯齿或透明边缘之外数像素，用于包住完整脚部，不把它们声称为全部实心像素。后角未暴露，只用于平行闭合推断。不是四个实测物理矩形角。
- 高度参考是同源 x 的主楼身落地→檐口竖尺，排除 HVAC/机房。局部被遮挡的地面垂直投影由邻接可见支撑边近似，约 ±10 px。没有更改参考点来冒充 H3。
- 原图局部屋顶、底层与立面的投影存在 AI 近似差异；本组以地面支撑轴标定，不承诺每条未测屋顶边都来自精确的同一物理相机。完整画面中的遮挡、明暗边缘与比例仍由本地城市验收确认。
- 每个方向的 A 是暖铜金属与玻璃的近全高体量，B 是冷蓝灰玻璃、银色竖梃和不同上部肩部，非同图改色。wide 与 deep 各自独立生成，没有镜像或旋转贴图。

## 迭代与参考角色

先查看旧 `office-h3-a/b` 了解现有材质和细节风格；首轮及最终生成没有把旧图传作 edit target，仅以文字延续风格。四款首稿中，wide A/B 与 deep A 的长条过长，按保守地面约束会把实际 H3 压低；wide A/B 的一次引用 edit 仍未充分修正，均未采用。主代理明确允许上述三款各追加一次无引用生成，改为高挑、近全高的简洁矩形办公楼；最终采用这三款与 deep B 首稿。没有继续无限迭代。

引用 edit 只将对应首稿作为目标，原图不覆盖。未采用的首稿/编辑稿只保留在工具生成目录，不混入正式源码/运行素材。

## 完整提示与工具输出

### wide A 首稿

工具输出：/Users/xingyuwang/.codex/generated_images/01a1949e-8df0-7af0-a4fc-6164e2b43f8d/exec-f919a90b-2194-4e5e-b3b9-d5f31c0a8290.png

```text
Use case: stylized-concept. Asset type: one production transparent building sprite for CodeYears fixed-camera isometric city.
Create ONE continuous elongated copper-bronze setback office building, original architecture, finely spaced warm metal mullions and blue-gray reflective glazing, restrained warm windows, dark charcoal flat roof with integrated small HVAC units, three broad stepped roof terraces forming one connected mass. Refined realistic city-builder pre-rendered 3D illustration, richly detailed but readable as a miniature; no pixel art, low-poly facets, cartoon linework, white roof cap, logos, words or watermarks.
Mandatory geometry: orthographic 2:1 isometric projection. The ground W axis goes right-down slope +0.5; D goes left-down slope -0.5; vertical wall lines perfectly vertical. This is a 2×1 logical footprint: the right-down ground axis is approximately 2.25 times the short left-down ground axis after setbacks. So the right-down facade is the LONG facade, the left-down facade is SHORT. Do not make a square tower. One single solid connected rectangular large office, not two separate neighboring buildings. Main ground envelope is 1.8 W by 0.8 D units, centrally inside its 2×1 parcel.
Proportion: H3 wall/body ruler uses world W=(48,24), D=(-48,24), H=(0,-48). Main architectural vertical body height about 144 units while the full horizontal ground left-to-right width is about125 units: the visible vertical body is about1.2–1.35 times the full ground width. No broad podium, external steps, plants or pavement extending beyond the slim rectangular ground envelope. Small recessed entrance on the LONG facade, subtle roof planters contained inside setbacks.
Composition: entire roof and entire base must be visible, clean silhouette centered with transparent margins. Portrait 1024×1536 composition if possible.
Lighting: soft upper-left daylight, material depth but no volumetric glow. GENUINELY TRANSPARENT RGBA background, no ground tile, no surrounding scene, no broad shadow, no alpha halo. Only one building; never draw a grid or height labels.
```

### wide B 首稿

工具输出：/Users/xingyuwang/.codex/generated_images/01a1949e-8df0-7af0-a4fc-6164e2b43f8d/exec-2d548e26-d905-4454-9189-3534b491ca4f.png

```text
Use case: stylized-concept. One original transparent production city-building sprite, a SINGLE connected modern blue-gray glass office block with a long continuous lower body, silver-gray vertical fins, one asymmetric upper setback, dark recessed roof, restrained warm interior windows. Refined realistic city-builder pre-rendered 3D style, precise detailed materials, no cartoon outlines or pixel art. Distinct from copper multi-step office: mainly straight clean roofline with one tall shoulder.
FIXED GEOMETRY: orthographic isometric 2:1 diamond: W right-down slope +0.5, D left-down slope -0.5, verticals truly vertical. Native 2×1 ground footprint. W-visible long base edge exactly 2.25 times D-visible short base edge, so it is a compact rectangular tower, NOT a huge stretched slab. One connected architecture, no separate towers. Left visible facade along W is long, right visible facade along D is short. All roof/parapet corresponding edges parallel with these same axes.
ESSENTIAL HEIGHT: this is an H3 tall office. Pure vertical main wall/body height from ground to the uppermost architectural roof is 1.6 TIMES the entire horizontal left-to-right width of the visible ground footprint. Preserve that tall proportion; no short squat wing dominating the base. No external paving, broad podium or ground planters that expand the base. Tiny inset entrance within wall line. The entire compact rectangular ground envelope is centered within a 2×1 parcel with space on all sides.
Entire roof and base in frame with transparent margin, portrait composition 1024×1536 if possible. Upper-left daylight, crisp clean alpha, no outer glow, no drop shadow extending outside. GENUINELY TRANSPARENT RGBA BACKGROUND. No ground tile, no platform, no roads, no labels, text, logos or watermark. One building only.
```

### deep A 首稿

工具输出：/Users/xingyuwang/.codex/generated_images/01a1949e-8df0-7af0-a4fc-6164e2b43f8d/exec-ab02820c-a4a4-4a5f-aea7-b4bc2c7f527e.png

```text
Use case: stylized-concept. Produce ONE original transparent tall office building sprite for a fixed-view realistic isometric city.
A warm copper-bronze and dark blue-gray glass office with several restrained setbacks running along its LONG depth, solid continuous connected base, detailed metal fins, small inset roof terraces and a dark integrated flat roof. Rich but restrained materials, coherent miniature city-builder pre-rendered 3D quality, no pixel art or cartoon contours, no white roof cap. Distinct architecture, not a duplicate of a neighboring single-cell tower.
CRITICAL DIRECTION: native footprint is 1×2, with W SHORT and D LONG. Fixed orthographic 2:1 isometric W points RIGHT-DOWN with slope +0.5; D points LEFT-DOWN with slope -0.5; all verticals straight. From the frontmost base corner, the edge toward upper-LEFT is the SHORT W edge, and the edge toward upper-RIGHT is the LONG D edge, about 2.25 times longer. Therefore the RIGHT-HAND visible facade is the broad long facade and LEFT-HAND visible facade is short. Do NOT draw the opposite orientation or a square base. All roof/parapet edges follow exactly the same pair of parallel directions. No perspective convergence.
H3 proportion: visible vertical main-wall height from ground to uppermost architectural cornice is approximately 1.6 TIMES the full horizontal ground footprint width. Tall compact rectangular office, not low campus or enormous horizontal slab. The ground envelope represents central 0.8 W ×1.8 D inside the logical1×2 parcel; no base, garden, pavement, steps or side wing expands outside that rectangle. Long facade can have two continuous connected stepped masses but never separate buildings; one office only.
Upper-left daylight with restrained warm window variation, clean detailed glazing and metal. GENUINE TRANSPARENT RGBA background, crisp silhouette with no volumetric glow/halo. Entire roof and entire base visible with margin, portrait1024×1536 if possible. No labels, words, logos, watermark, ground tile, road or surrounding scene.
```

### deep B 正式首稿

工具输出：/Users/xingyuwang/.codex/generated_images/01a1949e-8df0-7af0-a4fc-6164e2b43f8d/exec-666c6c40-32d4-46c1-944d-9c43f0da4189.png

```text
Use case: stylized-concept. One original TRANSPARENT production sprite of a SINGLE continuous modern blue-gray glass office, elongated compact rectangular ground plan, silver vertical fins and a dark graphite flat roof. One strong asymmetric stepped shoulder near the back, a compact recessed glazed entrance at the front and elegant curtain-wall rhythm, few restrained warm windows. Different body/roof from copper multi-step model, not just recoloring. Realistic refined city-builder pre-rendered 3D quality; detailed coherent miniature architecture, no cartoon contours or pixel art.
The building is 1×2 in CodeYears grid: W is SHORT and D is LONG. Orthographic2:1 isometric ground axes, W right-down slope +0.5, D left-down slope -0.5, all vertical wall edges straight vertical. From the frontmost bottom corner, upper-LEFT base edge is SHORT and upper-RIGHT base edge LONG, length ratio roughly1:2.25. Thus RIGHT visible facade is the broad long facade, LEFT visible facade short. Do not swap orientation, do not mirror a 2×1 picture, do not draw a square base. Same axes on roof and all parallel architectural edges.
H3 tall proportion: pure vertical main wall height ground-to-highest main cornice is about1.6 times the complete horizontal ground left-to-right width. The entire office is one connected narrow rectangular mass, not two separate towers, not low campus, not over-wide podium. Native usable envelope0.8W×1.8D inside logical1×2 with clear margins. Tiny entrance threshold remains within wall footprint; no trees or planters at ground.
Soft upper-left daylight, subtle glass reflections, no dramatic bloom. Genuinely transparent RGBA background, clean crisp silhouette. Complete roof and base in frame with margins, portrait1024×1536 if possible. No paving, tile, foundation platform, ground shadow outside base, surrounding scene, words, labels, logos or watermark.
```

### wide A 单次 edit（未采用）

工具输出：/Users/xingyuwang/.codex/generated_images/01a1949e-8df0-7af0-a4fc-6164e2b43f8d/exec-7715d269-4d9f-4919-91dd-9917d06f06eb.png

```text
Use case: precise-object-edit. One corrective geometry pass for the supplied copper office sprite.
Preserve its copper-bronze and blue-gray glazing materials, joined multi-step architecture, dark roofs, soft upper-left light, transparent background and original fixed orthographic camera. It must remain one connected building, not multiple towers.
The supplied ground rectangle is much too long and thin. Redesign ONLY its ground-plan proportions and corresponding facade geometry: shorten the long right-down W direction by ABOUT 55 PERCENT while preserving the short D direction and keeping the full vertical wall/body height. Aim for the visible long W ground edge to be 2.25 TIMES the short D ground edge, not five times. This should look like a tall compact 2×1 office, not a very long curtain-wall slab. Keep a continuous body and at least two clearly visible but compact setbacks, avoid adding any detached wing, ground planter, steps or podium.
The vertical MAIN WALL height must be about1.7 times the entire horizontal left-to-right GROUND footprint width, excluding HVAC from the ruler. Increase architectural body height a little if necessary, but do not add a spire.
All right-down roof/ground edges remain parallel slope+0.5, left-down edges slope-0.5, verticals remain vertical. Full base and roof visible. GENUINELY TRANSPARENT RGBA background, crisp alpha, no halo, no shadow outside base, no ground tile, no lettering, no labels. A single production sprite only.
```

### wide B 单次 edit（未采用）

工具输出：/Users/xingyuwang/.codex/generated_images/01a1949e-8df0-7af0-a4fc-6164e2b43f8d/exec-58434bcd-a7c3-4651-8f0c-54b3aab0397e.png

```text
Use case: precise-object-edit. This is the one corrective proportion pass.
Keep the supplied blue-gray glass and silver-fin office, one asymmetrical shoulder, dark roof, realistic miniature isometric render, transparency and lighting. Redesign it as a COMPACT RECTANGULAR TALL TOWER rather than a long slab: the long right-down W facade must be shortened to FOUR broad window bays only (currently about eight). The short left-down D facade must have TWO matching window bays. Keep pure vertical body height at least as tall as now, with twenty-four storeys if necessary. Long base edge 2.25×short base edge; 2×1 plot, long W direction right-down, short D left-down. This correction is about architectural proportions; do not squash vertically or add an antenna.
Pure vertical main-wall ground-to-cornice height must be 1.8 TIMES the complete horizontal left-to-right ground footprint width. Make all ground and rooftop corresponding edges parallel: W slope+.5,D slope-.5, verticals stay vertical. One continuous connected rectangular building, not two separate towers; compact recessed entry fits inside the footprint. No base platform, paving, planters or external steps.
Entire base/roof visible with clean transparent margins. Genuine transparent RGBA background, no glow/halo, no outer shadow, no words or logos. Preserve blue-gray glazing, silver fins, restrained warm windows and dark flat roof.
```

### wide A 无引用最终生成

工具输出：/Users/xingyuwang/.codex/generated_images/01a1949e-8df0-7af0-a4fc-6164e2b43f8d/exec-f12498f9-c618-4276-89c0-3ec22ed8877d.png

```text
Use case: stylized-concept. A single elegant TALL RECTANGULAR OFFICE TOWER, realistic miniature city-builder pre-rendered 3D sprite, isolated on GENUINELY TRANSPARENT RGBA.
Warm copper-bronze metal frame and blue-gray glass, long clean full-height rectangular body with 26–28 storeys, about SIX broad vertical window bays on its long face and THREE on its short face. Topmost 15 percent has one small recessed roof terrace and dark integrated mechanical pavilion, but the main high-rise body has nearly uniform height across the whole rectangle. No low wings or cascading staircase slab. Original architecture; restrained warm windows, crisp material detail, soft upper-left daylight, no dramatic glow.
GROUND ORIENTATION IS ESSENTIAL: 2×1 logical plot. Long W edge goes right-down slope +0.5, short D edge left-down slope -0.5. The LEFT visible facade is long, RIGHT visible facade short. Ground-plan edge length ratio between2:1 and2.25:1, not square and not extremely thin. All roof/ground parallel edges follow same fixed orthographic 2:1 isometric axes; verticals stay vertical. One connected solid tower only.
HEIGHT IS ESSENTIAL: pure vertical main WALL height from visible frontmost ground corner to its top roof cornice must be approximately1.6 TIMES the ENTIRE horizontal left-to-right ground footprint width. It must be a tall compact high-rise, not a midrise wide slab. Keep the whole base rectangular, with a tiny recessed door; no podium, paving, steps, ground planters or external decorations. No antenna used as height.
Entire roof and base in frame with generous transparent margins, portrait1024×1536 if possible. NO background, ground tile, platform, road, text, labels, grid, watermark, external shadow or halo.
```

### wide B 无引用最终生成

工具输出：/Users/xingyuwang/.codex/generated_images/01a1949e-8df0-7af0-a4fc-6164e2b43f8d/exec-e0f954b1-aa50-4c78-9e34-f4fa43dba398.png

```text
Use case: stylized-concept. One original tall compact rectangular blue-gray GLASS OFFICE TOWER for a refined realistic isometric city-builder sprite. Silver-gray vertical fins, dark graphite recessed flat roof, one modest asymmetric shoulder confined to the TOP15 percent, crisp structural rhythm with26–30 storeys. Main body is a single tall connected rectangular prism, nearly full height across the whole ground plan. Around6 wide vertical glazing bays on long face,3 on short face. Materials and silhouette distinct from plain warm copper office, not a recolor. Soft upper-left daylight, restrained warm occupied windows, high-quality miniature pre-rendered3D, no cartoon linework.
Native2×1 ground plan with LONG W axis RIGHT-DOWN slope+.5, SHORT D axis LEFT-DOWN slope-.5. LEFT visible facade is the long face, RIGHT visible facade short. Long/short ground edges about2:1–2.25:1, not square and not very long thin slab. Parallel rooftop and ground edges must share these same directions; vertical wall edges stay vertical; fixed orthographic2:1 isometric view with no perspective vanishing.
ESSENTIAL PROPORTION: pure vertical main WALL ground-to-cornice height approximately1.6 times the entire horizontal left-to-right GROUND footprint width. Architectural body height only, no spire or machine used to inflate it. Tiny glazed entrance inset within the wall footprint. No low wing, no broad podium, no ground planters, steps or paving extension.
Genuinely TRANSPARENT RGBA background, entire roof and base visible with margin, portrait1024×1536 if possible. Clean alpha edges; no external shadow, volumetric glow, ground tile, foundation platform, roads, scene, text, labels, grid, logo or watermark. One continuous office only.
```

### deep A 无引用最终生成

工具输出：/Users/xingyuwang/.codex/generated_images/01a1949e-8df0-7af0-a4fc-6164e2b43f8d/exec-0984e615-a1c8-4cf0-bf59-027cfa008ca6.png

```text
Use case: stylized-concept. One original TALL compact rectangular copper-bronze OFFICE TOWER sprite on a genuinely transparent RGBA background, for a refined realistic fixed-view isometric city-builder.
Single full-height rectangular body, 26–30 storeys, warm bronze metal fins and subdued blue-gray glazing, one small topmost recessed roof terrace and dark flat roof with integrated equipment. The small upper setback is confined to top15 percent; main walls almost uniform full height across the whole rectangle. Rich architectural material and restrained warm windows, no cartoon outlines or pixel art. One connected building, not separate towers or cascading low wings.
ESSENTIAL ORIENTATION: native1×2 plot. W is SHORT pointing right-down slope+.5; D is LONG pointing left-down slope-.5. From FRONTMOST ground corner, edge toward upper-left is short; edge toward upper-right is LONG,2–2.25 times as long. RIGHT visible facade is long (about6 glazing bays), LEFT visible facade short (about3 bays). Do not accidentally make left facade long. All corresponding roof/ground edges parallel, orthographic2:1 isometric with vertical walls perfectly vertical, no perspective convergence.
ESSENTIAL HEIGHT: pure vertical MAIN WALL from visible ground to its roof cornice must be about1.6 times entire horizontal left-to-right GROUND footprint width. It must read as high-rise, not low broad slab. No spire as height. Single compact rectangle with tiny recessed entry inside wall line, no broad podium, paving, steps, garden or ground planters.
Soft upper-left daylight, no glow or external shadow, crisp transparent silhouette. Entire roof and base visible with comfortable margin; portrait1024×1536 if possible. No ground tile, platform, surrounding scene, road, words, numbers, logos, labels, grid or watermark.
```
