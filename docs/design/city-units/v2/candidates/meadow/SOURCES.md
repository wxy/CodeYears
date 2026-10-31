# 草地候选来源

日期：2026-10-31。状态：**四款独立设计候选，未接入产品；占地四角、统一世界尺度、落地点与地图接缝尚未标定或验收。**

生成方式：内置 `image_gen.imagegen`，四款分别调用、并行生成，每款 `transparent_background: true`；本批完成后停止生成。没有使用 CLI/API fallback，没有程序裁剪、抠图、颜色或 alpha 编辑。项目 PNG 为工具原图的逐字节复制；原始生成文件保留于工具目录。

风格参考：先前已通过 `view_image` 查看 `../../08-ground-and-water.png`；地面轴方向参考 `../../projection-guide.svg`。提示要求固定 W(+48,+24)、D(-48,+24)、竖直 H(0,-48)，两组地边斜率 ±0.5（±26.565°）、统一左上光。提示内的要求不代表输出已精确满足。

## 实际检查

四款输出已目视检查：均为低草与地被，不是高灌木丛；无厚土块、底座、边框、文字或网格。轮廓为自然草缘的低宽菱形，草叶略有起伏，不适合把 alpha 外框直接当作地面四角。

Pillow 仅只读 PNG 规格与 alpha。四款都是 1774×887 RGBA，有完全透明区域。草叶主体 alpha 多为 251–253；有极低 alpha 散点，因此 alpha>0 外框可能触及整张画布。部分草缘存在细碎亮绿边，原样保留。以下边界右/下为开区间。

| 文件 | alpha 极值 | 完全透明像素 | alpha>0 外框 | alpha>=128 主体外框 |
|---|---|---:|---|---|
| `grass-1x1-a.png` | 0–255 | 73.07% | (0, 0, 1774, 887) | (299, 151, 1471, 737) |
| `grass-1x1-b.png` | 0–254 | 75.71% | (0, 17, 1760, 887) | (318, 168, 1450, 736) |
| `grass-2x2-a.png` | 0–255 | 56.18% | (0, 0, 1771, 887) | (80, 63, 1692, 842) |
| `grass-2x2-b.png` | 0–255 | 55.72% | (0, 7, 1771, 887) | (67, 65, 1694, 835) |

## 尚未完成的统一尺度与投影检查

- 1×1 和 2×2 是生成时的逻辑占地意图，文件名不构成真实格数或尺度证明。
- 同画幅下，alpha>=128 外框宽度分别为：1×1 A 1172、1×1 B 1132、2×2 A 1612、2×2 B 1627 像素。A 组较大/较小宽度约 1.38，B 组约 1.44，均不是同世界尺度应有的 2 倍。外框包括草叶、并非精确地面边，因此这些数值只是暴露当前尺度不统一，不能用作最终缩放比例。
- 视觉上两组草缘沿近似地图方向展开；有机草缘没有精确直线，本批未确定四个地面角点或拟合 ±26.565°，不声称与地图严格对齐。
- 后续若选用，必须依据公共模板确定地面四角、统一像素/世界格比例和落地点，再在地图上验证接缝与草缘显示。当前未编译、未做端到端验证，也未宣称接入或运行验收通过。

## grass-1x1-a.png

源文件：`/Users/xingyuwang/.codex/generated_images/01a19208-5b5f-7671-9838-be906b2133ef/exec-5992fce3-2bc6-4e37-8763-694db5cbe962.png`

SHA-256：`b73867176b8abbd8330ba05b347e6e0d3af57c4ab89272a1a32305caf8c59294`

实际观察：细密短草和少量低小叶片，连续低矮草坪；无高灌木、厚土层或展示底座。主轮廓为低宽菱形，草缘细碎，部分远侧有亮绿细边。

完整提示：

```text
Use case: stylized-concept.
Asset type: a single transparent ground-grass sprite candidate for CodeYears isometric city game, NOT a sheet or presentation board.
Style: refined natural miniature city-building game asset with delicate readable grass textures, matching the calm natural grass material quality of the inspected 08-ground-and-water reference board. Muted living greens, fine individual blades and tiny low leaves. Nearly flat ground, low plant height, upper-left soft daylight and extremely restrained contact shadow.
CRITICAL PROJECTION: fixed orthographic 2:1 dimetric map projection. W points down-right (+48,+24), D down-left (-48,+24), vertical H=(0,-48). Every logical ground-plane edge follows one of the two directions at exactly +26.565° or -26.565° from horizontal (slope +0.5 or -0.5), opposite sides parallel. A square world plot becomes a low diamond exactly twice as wide as its projected ground depth. No perspective convergence, no 30-degree isometric axes, no camera roll.
COMPOSITION: one complete isolated grass plot centered on a landscape canvas, transparent alpha outside the grass contact outline, comfortable transparent margin on all four sides. Soft natural feathered grass edge suitable for blending against neighboring grass; do not draw a hard border or display foundation. Do not raise the grass into a mound. Ground surface sits flush with the city map. The two plot axes remain readable in the overall low diamond contour despite tiny organic blades.
AVOID: thick soil block, exposed earth sidewalls, raised base, pedestal, plinth, platform, dark chunky edge, hedge, tall bush, large shrubs, trees, rocks, benches, props, flowers large enough to read as decoration, broad cast-shadow backdrop, opaque background, checkerboard pattern painted into the image, labels, text, grid, guides, frames, watermarks, multiple assets.
PRIMARY REQUEST: one logical 1×1 fine dense grass lawn patch, a neat continuous low turf. Tiny short blades, subtle mossy undergrowth and small variations of green make it natural and richly detailed while remaining quiet, smooth and uniform at city-map scale. No bare path. No tuft taller than a few blade lengths, no dense rounded shrub clumps. The patch must read as flat lawn rather than a raised cushion or vegetation block.
SCALE INTENT: this is the small 1×1 unit. Its ground diamond should use roughly half the width and half the projected depth of a corresponding 2×2 ground unit at the same world scale; don't make the grass blades larger to fill the image.
```

## grass-1x1-b.png

源文件：`/Users/xingyuwang/.codex/generated_images/01a19208-5b5f-7671-9838-be906b2133ef/exec-d9e2968c-dcd0-44cf-8128-41874c39c1cf.png`

SHA-256：`fd4ba758066ab314f107adc31f5bb795e2a9045be1432ef96b56953010644681`

实际观察：短草、细小匍匐叶片与浅色裸地，裸地呈不规则小片；无厚土侧墙或高灌木。软边接地，部分外缘有原图色边。

完整提示：

```text
Use case: stylized-concept.
Asset type: a single transparent ground-grass sprite candidate for CodeYears isometric city game, NOT a sheet or presentation board.
Style: refined natural miniature city-building game asset with delicate readable grass textures, matching the calm natural grass material quality of the inspected 08-ground-and-water reference board. Muted living greens, fine individual blades and tiny low leaves. Nearly flat ground, low plant height, upper-left soft daylight and extremely restrained contact shadow.
CRITICAL PROJECTION: fixed orthographic 2:1 dimetric map projection. W points down-right (+48,+24), D down-left (-48,+24), vertical H=(0,-48). Every logical ground-plane edge follows one of the two directions at exactly +26.565° or -26.565° from horizontal (slope +0.5 or -0.5), opposite sides parallel. A square world plot becomes a low diamond exactly twice as wide as its projected ground depth. No perspective convergence, no 30-degree isometric axes, no camera roll.
COMPOSITION: one complete isolated grass plot centered on a landscape canvas, transparent alpha outside the grass contact outline, comfortable transparent margin on all four sides. Soft natural feathered grass edge suitable for blending against neighboring grass; do not draw a hard border or display foundation. Do not raise the grass into a mound. Ground surface sits flush with the city map. The two plot axes remain readable in the overall low diamond contour despite tiny organic blades.
AVOID: thick soil block, exposed earth sidewalls, raised base, pedestal, plinth, platform, dark chunky edge, hedge, tall bush, large shrubs, trees, rocks, benches, props, flowers large enough to read as decoration, broad cast-shadow backdrop, opaque background, checkerboard pattern painted into the image, labels, text, grid, guides, frames, watermarks, multiple assets.
PRIMARY REQUEST: one logical 1×1 sparse short grass and pale exposed-soil patch. Fine low green grass blades and tiny creeping leaves partly cover warm light sandy earth; a few small irregular bare spots remain visible, without turning into a path or road. Delicate soft edge, not a brown soil slab. Grass and tiny groundcover must stay low and blend into adjacent lawn. No large clumps, no shrub shapes, no weeds taller than the ground patch suggests.
SCALE INTENT: this is the small 1×1 unit. Its ground diamond should use roughly half the width and half the projected depth of a corresponding 2×2 ground unit at the same world scale; keep blade detail at the same physical scale.
```

## grass-2x2-a.png

源文件：`/Users/xingyuwang/.codex/generated_images/01a19208-5b5f-7671-9838-be906b2133ef/exec-7ad8eda2-7d9b-4249-9ae4-b876d94a7ed4.png`

SHA-256：`c09b811c6c1fd9e04e2a83feae6b9074c711ee1f11db34b7f773b6d0eaa09e0e`

实际观察：较大连续草坪，草叶保持低矮，少量叶片纹理破除均匀感；无道路、分格或额外道具。近乎平面，轮廓略有自然起伏。

完整提示：

```text
Use case: stylized-concept.
Asset type: a single transparent ground-grass sprite candidate for CodeYears isometric city game, NOT a sheet or presentation board.
Style: refined natural miniature city-building game asset with delicate readable grass textures, matching the calm natural grass material quality of the inspected 08-ground-and-water reference board. Muted living greens, fine individual blades and tiny low leaves. Nearly flat ground, low plant height, upper-left soft daylight and extremely restrained contact shadow.
CRITICAL PROJECTION: fixed orthographic 2:1 dimetric map projection. W points down-right (+48,+24), D down-left (-48,+24), vertical H=(0,-48). Every logical ground-plane edge follows one of the two directions at exactly +26.565° or -26.565° from horizontal (slope +0.5 or -0.5), opposite sides parallel. A square world plot becomes a low diamond exactly twice as wide as its projected ground depth. No perspective convergence, no 30-degree isometric axes, no camera roll.
COMPOSITION: one complete isolated grass plot centered on a landscape canvas, transparent alpha outside the grass contact outline, comfortable transparent margin on all four sides. Soft natural feathered grass edge suitable for blending against neighboring grass; do not draw a hard border or display foundation. Do not raise the grass into a mound. Ground surface sits flush with the city map. The two plot axes remain readable in the overall low diamond contour despite tiny organic blades.
AVOID: thick soil block, exposed earth sidewalls, raised base, pedestal, plinth, platform, dark chunky edge, hedge, tall bush, large shrubs, trees, rocks, benches, props, flowers large enough to read as decoration, broad cast-shadow backdrop, opaque background, checkerboard pattern painted into the image, labels, text, grid, guides, frames, watermarks, multiple assets.
PRIMARY REQUEST: one logical 2×2 continuous grass lawn patch spanning a larger square plot, uninterrupted gentle turf. Dense small short blades and tiny low moss/creeping leaves, lightly varied natural greens, subtly brighter upper-left and quieter lower-right, never a dramatic gradient. A continuous playable ground surface, no path, no props, no central mound, no separate four-square divisions. All sides blend naturally into neighboring grass. Very flat and low.
SCALE INTENT: this is the larger 2×2 unit. It covers four times the ground area and has twice the width and twice the projected ground depth of a 1×1 grass patch at the same world scale. Do not enlarge individual blades or turn the larger plot into taller vegetation.
```

## grass-2x2-b.png

源文件：`/Users/xingyuwang/.codex/generated_images/01a19208-5b5f-7671-9838-be906b2133ef/exec-a088fc7a-7c89-4259-b11b-9c3b690ba769.png`

SHA-256：`de2c91cf1e42ffec8e93010b775e4917ffe9fd5441dbf2a2b12455e765eee4f8`

实际观察：细短野草与低地被的混合，纹理比连续草坪更不规则；没有高灌木丛。草缘柔软但仍有细碎亮色像素。

完整提示：

```text
Use case: stylized-concept.
Asset type: a single transparent ground-grass sprite candidate for CodeYears isometric city game, NOT a sheet or presentation board.
Style: refined natural miniature city-building game asset with delicate readable grass textures, matching the calm natural grass material quality of the inspected 08-ground-and-water reference board. Muted living greens, fine individual blades and tiny low leaves. Nearly flat ground, low plant height, upper-left soft daylight and extremely restrained contact shadow.
CRITICAL PROJECTION: fixed orthographic 2:1 dimetric map projection. W points down-right (+48,+24), D down-left (-48,+24), vertical H=(0,-48). Every logical ground-plane edge follows one of the two directions at exactly +26.565° or -26.565° from horizontal (slope +0.5 or -0.5), opposite sides parallel. A square world plot becomes a low diamond exactly twice as wide as its projected ground depth. No perspective convergence, no 30-degree isometric axes, no camera roll.
COMPOSITION: one complete isolated grass plot centered on a landscape canvas, transparent alpha outside the grass contact outline, comfortable transparent margin on all four sides. Soft natural feathered grass edge suitable for blending against neighboring grass; do not draw a hard border or display foundation. Do not raise the grass into a mound. Ground surface sits flush with the city map. The two plot axes remain readable in the overall low diamond contour despite tiny organic blades.
AVOID: thick soil block, exposed earth sidewalls, raised base, pedestal, plinth, platform, dark chunky edge, hedge, tall bush, large shrubs, trees, rocks, benches, props, flowers large enough to read as decoration, broad cast-shadow backdrop, opaque background, checkerboard pattern painted into the image, labels, text, grid, guides, frames, watermarks, multiple assets.
PRIMARY REQUEST: one logical 2×2 natural wild meadow ground patch with low creeping groundcover and fine irregular short grasses. More varied than a manicured lawn: small patches of clover-like leaves, mossy growth and slightly different fine grass textures, with a few tiny subdued warm-earth glimpses. Keep all plant growth close to ground: a low continuous meadow carpet, no hedge, no tall grass wall, no round bush clumps, no tall stalks. The diamond silhouette is softly ragged with tiny fine blades and creeping leaves, not a thick vegetated slab.
SCALE INTENT: this is the larger 2×2 unit. It covers four times the ground area and has twice the width and twice the projected ground depth of a 1×1 grass patch at the same world scale. Preserve the same small physical blade and leaf size.
```
