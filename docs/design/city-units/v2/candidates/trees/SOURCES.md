# 树木独立候选：来源与检查

两张图是 premium realistic city-game style 的独立 1×1 树木造型候选，**尚未接入渲染器，也未完成地面锚点、公共比例或运行时验收**。这里的 1×1 是生成意图，不是已测得的精确地面四角；自然树冠不要求平行于地面轴。

## 来源

- 生成日期：2026-10-31。
- 工具：内置 imagegen；每款独立调用，开启 `transparent_background: true`；未使用 CLI。
- 风格参考：[07-vegetation.png](../../07-vegetation.png)，先作视觉检查，仅借鉴自然枝叶与精细城市游戏质感；未裁取设计板。
- 投影依据：[projection-guide.svg](../../projection-guide.svg)：W 轴右下，D 轴左下，地面斜率 +0.5 / −0.5，竖直方向不倾斜，左上光源。提示词要求统一相机与相近实际树高；生成结果未经过几何标定。
- 项目文件是原生成 PNG 的逐字节副本；未缩放、裁剪、去底、重新编码或做 Python 图像编辑。原生成文件保留。

| 候选 | 项目文件 | 原生成文件（位于 $CODEX_HOME） | SHA-256 |
| --- | --- | --- | --- |
| 宽冠落叶树 A | [broadleaf-a.png](broadleaf-a.png) | generated_images/01a19202-0cdf-7280-9fa0-280bd4704482/exec-91967c73-e32f-435e-bdaf-1b20eec9aa42.png | 2102fe38213b6e9f7b9067a61314cfe8f45abe86dcf81eec377120a242133e40 |
| 自然针叶树 B | [conifer-b.png](conifer-b.png) | generated_images/01a19202-0cdf-7280-9fa0-280bd4704482/exec-6a376e04-2444-4c36-ab56-ea0b3b61bba0.png | e4c5f72b6be1be1762959b0975da6acf5ea240b1101bac0075459414af917b86 |

## 只读检查结果

用 Pillow 读取格式、尺寸与 alpha 直方图，并目视检查生成原图；没有写出处理后的图像。

| 检查项 | 落叶树 A | 针叶树 B |
| --- | --- | --- |
| 格式 / 色彩模式 | PNG / RGBA | PNG / RGBA |
| 实际尺寸 | 1254×1254 | 1254×1254 |
| 文件字节数 | 2,524,750 | 1,401,940 |
| alpha 范围 | 0–255 | 0–255 |
| 完全透明像素 | 682,195（43.3824%） | 1,077,936（68.5485%） |
| 半透明像素 | 890,283 | 494,575 |
| 完全不透明像素 | 38 | 5 |
| alpha > 8 包围框 | (33, 82, 1233, 1166) | (297, 25, 985, 1217) |
| alpha > 0 包围框 | (0, 0, 1246, 1254) | (0, 11, 1236, 1254) |

包围框采用 Pillow 的左、上、右、下坐标，右下不包含。生成提示请求了 1024×1024；工具实际输出为表中尺寸，保留原始输出。

目视可见完整树冠、树干与根部接地，少量低草和紧凑接触阴影；没有方块底座、网格、文字或编号。A 为自然宽冠与可见木质分枝，B 为较窄的分层针叶枝条。左上高光与右侧阴影可见。

**已知限制**：两图存在 alpha≤8 的极低透明度残留，延伸至画布边缘；alpha>8 的主体均有留白。高亮枝叶边缘存在明显黄绿色，仍需在实际场景背景上检查边缘合成。原生 alpha 大多为半透明值，不能仅凭 RGBA 模式和透明背景判定最终合成质量。

## 待标定范围

- 两图根部树干与低草的交界可作为落地点的目视定位依据；本次没有精确测量锚点，因此不提供虚构的四角或精确落地点坐标。
- 没有绘制可测量的地面四边形，不能从自然轮廓证明 +0.5 / −0.5 投影已经精确满足。接入前需在公共地面模板上标定根部锚点、每格像素比例、树高与树冠越界范围。
- 两图像素主体高度不同，不能把同尺寸画布直接等同于相同实际树高。需要按根部到树顶的实际主体高度统一比例。
- 需检查浅色／深色地面上的枝叶边缘、低值 alpha 残留、接触阴影及缩小后的可读性。
- 本次仅交付独立候选与静态规格检查；没有修改代码、加载资源或运行浏览器流程。

## 完整生成提示

### broadleaf-a.png

```text
Use case: stylized-concept
Asset type: one isolated transparent PNG city-game vegetation sprite, independent 1×1 tree candidate for CodeYears.
Primary request: a premium realistic city-building game asset with natural botanical detail and the rich, finely textured vegetation quality of a high-end miniature city diorama; polished realistic 3D render, not flat vector and not low-poly.
Scene/backdrop: genuinely transparent background with real alpha. Only the tree, a tiny amount of low grass at the roots, and a compact soft contact shadow. No ground tile, no raised slab or block base, no dirt mound, no paving.
Camera/projection: fixed orthographic dimetric city-game camera. Imaginary horizontal W ground axis runs down-right at slope +0.5; imaginary D ground axis runs down-left at slope -0.5. Vertical world axis is exactly vertical in the image. This is the common 2:1 diamond ground projection, not 30-degree isometric. Do not draw the imaginary guide or plot. Natural tree branches need not align with the ground axes.
Lighting: soft sunlight from upper left, warm leaf highlights, cooler right-side and underside shade, realistic ambient occlusion and compact ground contact shadow.
Composition/framing: one complete tree centered on a square 1024×1024 transparent canvas. Include every branch tip, crown, trunk and root contact, with generous transparent padding. Ground contact approximately at (512, 860), crown top approximately y=105. No cropping. Both tree variants represent the same approximate 7-meter actual tree height and must use the same camera and image scale; the broadleaf canopy is wider than the conifer. The nominal 1×1 plot concerns the root/planting area, not a requirement to force the canopy into a diamond. Keep low grass and contact shadow very compact.
Constraints: a single tree only; naturally irregular realistic foliage and readable trunk; fully isolated cutout; preserve transparent alpha including fine leaf-edge transparency. The entire image must be usable as a sprite, no sheet or comparison layout.
Avoid: text, letters, numbers, labels, borders, watermark, grid, guide lines, visible checkerboard, white background, backdrop, sky, extra trees, flowers, decorative rocks, smooth spherical crowns, plastic toy foliage, inflated blobs, cartoon outline, cuboid pedestal.
Subject: broadleaf tree A, one healthy mature but small deciduous tree with a broad rounded yet irregular crown, intricate lobed green leaf clusters with airy gaps and individual small leaf detail, a softly asymmetric branching silhouette, warm brown textured bark and clearly visible substantial trunk splitting naturally into several woody branches. Crown about 5.5 meters wide at the specified 7-meter height, rich olive and fresh natural green variation. Root contact visible below the canopy. Not topiary, not a perfect ball, not a forest clump.
```

### conifer-b.png

```text
Use case: stylized-concept
Asset type: one isolated transparent PNG city-game vegetation sprite, independent 1×1 tree candidate for CodeYears.
Primary request: a premium realistic city-building game asset with natural botanical detail and the rich, finely textured vegetation quality of a high-end miniature city diorama; polished realistic 3D render, not flat vector and not low-poly.
Scene/backdrop: genuinely transparent background with real alpha. Only the tree, a tiny amount of low grass at the roots, and a compact soft contact shadow. No ground tile, no raised slab or block base, no dirt mound, no paving.
Camera/projection: fixed orthographic dimetric city-game camera. Imaginary horizontal W ground axis runs down-right at slope +0.5; imaginary D ground axis runs down-left at slope -0.5. Vertical world axis is exactly vertical in the image. This is the common 2:1 diamond ground projection, not 30-degree isometric. Do not draw the imaginary guide or plot. Natural tree branches need not align with the ground axes.
Lighting: soft sunlight from upper left, warm leaf highlights, cooler right-side and underside shade, realistic ambient occlusion and compact ground contact shadow.
Composition/framing: one complete tree centered on a square 1024×1024 transparent canvas. Include every branch tip, crown, trunk and root contact, with generous transparent padding. Ground contact approximately at (512, 860), crown top approximately y=105. No cropping. Both tree variants represent the same approximate 7-meter actual tree height and must use the same camera and image scale; the broadleaf canopy is wider than the conifer. The nominal 1×1 plot concerns the root/planting area, not a requirement to force the canopy into a diamond. Keep low grass and contact shadow very compact.
Constraints: a single tree only; naturally irregular realistic foliage and readable trunk; fully isolated cutout; preserve transparent alpha including fine leaf-edge transparency. The entire image must be usable as a sprite, no sheet or comparison layout.
Avoid: text, letters, numbers, labels, borders, watermark, grid, guide lines, visible checkerboard, white background, backdrop, sky, extra trees, flowers, decorative rocks, smooth spherical crowns, plastic toy foliage, inflated blobs, cartoon outline, cuboid pedestal.
Subject: conifer tree B, one healthy natural spruce-like evergreen, same approximate 7-meter actual height and same fixed camera/image scale as tree A. It has a noticeably narrower, irregular tapering crown about 3.5 meters wide, layered natural needle-bearing boughs and many detailed fine needle clusters, small gaps between branches, a visible warm brown trunk near the roots, subtle asymmetry and slightly uneven branch lengths. Rich deep forest green with olive sunlit tips, a pointed but organic crown; not a geometric cone, not a clipped hedge, not a Christmas decoration.
```
