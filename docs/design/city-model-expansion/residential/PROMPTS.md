# 内置图像生成来源

工具：当前会话内置 `image_gen.imagegen`，全部调用 `transparent_background: true`。未新增、索要或扫描 API key，未调用收费 API 或使用外部游戏素材。风格参考是仓库自己的 `public/assets/city-runtime/low-gable.png`。实际生成及编辑均由内置工具完成，Python 只用于无缩放分格与像素规格盘点，Canvas 采用正式标定/烘焙算法。

## 第一轮：八款设计总板

原始文件 `sources/generated-sheet.png`，1774×887 RGBA。提示词原文：

> Create ONE transparent PNG sprite sheet of EIGHT DISTINCT highly detailed miniature residential buildings for CodeYears, in a precise 4 columns x 2 rows regular grid. Each cell isolated with generous transparent gaps, no labels, no text, no background or ground tile. Match reference image's polished finely painted realistic miniature masonry, windows and warm upper-left lighting, NOT voxel or crude blocks. Strict orthographic 2:1 dimetric: horizontal ground edges slopes exactly +0.5 and -0.5, vertical edges vertical. Single visible front corner toward viewer, two visible walls. Each building fits wholly within its own cell with tiny contact shadow. Row1 left to right: 1 single-storey warm limestone bungalow with asymmetric mono-pitch standing seam roof and recessed porch; 2 single-storey red brick worker home with shallow barrel-vault zinc roof and round clerestory, no gables; 3 two-storey cream stucco townhouse with mansard slate roof and two dormers, inset entrance; 4 two-storey dark brick duplex with sawtooth roof and paired doors, no shop. Row2 left to right: 5 low two-storey elongated 2x1 corner bakery with chamfered corner entrance, red striped awning and flat parapet roof, long axis slopes +0.5; 6 low two-storey elongated 1x2 narrow grocer with arched shop windows, green canopy, two unequal shed roofs, long axis slopes -0.5; 7 four-storey compact 1x1 terracotta apartment with recessed balconies and hipped roof; 8 four-storey compact 1x1 pale limestone apartment with rounded projecting bay and flat roof terrace. All eight must be visually different in silhouette, roof and window rhythm. No towers, cars, roads, public buildings, large landscaping, watermarks or numbers. Entire image alpha transparent, buildings cannot overlap cells.

其中第5/6格长条比例不足，不计入实际交付；改用下述第二轮独立长条。其他六格复用已生成的合格原稿，不重做。实际图并不保证提示词要求全部成立：例如部分门窗/局部边线不完全同轴，需以标定与次日视觉审查为准。

## 第二轮：长条商铺修订

原始文件 `sources/shops-revision.png`，1942×810 RGBA。提示词原文：

> Create a transparent PNG sprite sheet with EXACTLY TWO separate elaborately painted miniature shop buildings. One row, two cells, huge transparent 60px padding around each building, ALL pixels of buildings and tiny contact shadows inside image. Reference detailed warm masonry realistic miniature style, warm upper-left illumination. Strict orthographic dimetric 2:1 projection, ground axes slopes +0.5 and -0.5, all vertical edges perfectly vertical, no perspective vanishing. LEFT: a LONG LOW two-storey redbrick bakery on a rectangular footprint exactly twice as long along the down-right axis as the down-left axis (2x1). Long front wall with four separate broad shop window bays, red/cream striped awning, flat low parapet roof, chamfered front corner entrance. RIGHT: a LONG LOW two-storey cream stucco grocer, rectangular footprint exactly twice as long along down-left axis as down-right axis (1x2). Four arched shop windows along long facade, green canopy, asymmetric pair of shallow shed roofs, narrow end wall. Each visibly rectangular like a long street-front building, not square. No ground tile, no road, no labels or text, no trees, transparent alpha background. Complete silhouettes, never cropped.

该输出背景实际 alpha 146–252，不合格，不用作运行图。实际长轴朝向与提示相反：面包店按量测标为1×2，杂货店2×1，不旋转或镜像图来改变方向。

## 内置透明背景编辑

参考输入为 `sources/shops-revision.png`。上轮已显示编辑结果，但文件落盘中断；续作只重做尚未保存的透明背景编辑，不重生成建筑设计。当前保存 `sources/shops-transparent.png`，1941×810 RGBA，alpha 0–255。提示词：

> Remove the entire white/offwhite background completely. Output a TRUE transparent alpha PNG cutout containing only the TWO existing building models and their tiny contact shadows. Preserve the buildings, geometry, proportions, colors and detail exactly. Background must have alpha=0, not semiopaque gray or a checkerboard. Leave generous transparent margins. Do not add anything.

分格仅裁切，不修改源几何；原总板保留。`calibration.json` 的 `sourceRegion` 记录每款原总板/裁切区域，`file` 指向分格后的设计输入。实际地面主边经既有 `calibrate` 修正至±0.5，竖边保持竖直，再按既有档位等比放置。不是声称AI原图天然满足严格投影。

八款实际新图已齐，无“仅提示词待生成”计数；正式接入、最终造型接受与本机预算尚待审查。其他并行任务的素材没有复制到本包。
