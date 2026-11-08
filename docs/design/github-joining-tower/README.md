# 加入 GitHub 纪念高塔

2026-11-08 用户确认：注册不是代码贡献，用一座占地1×1、明显高于普通低层的专属高塔代表加入GitHub。当前图范围包含该注册塔，才允许在后续设计中将第一个建库事件称为首个仓库；首库与注册同日时由塔承载，不额外占格。这些首库/组织规则属于已确认后续设计，尚未实装。

## 素材与规格

- `source.png`：内置imagegen生成及一次透明背景清理的正式设计源图，1024×1536 RGBA，保留在仓库，不进入发行包。
- `calibration.json`：1×1占地、源像素地面锚点、裁剪范围及2:1投影空间参数。
- 正式运行图：`public/assets/city-runtime/github-joining-tower.png`，123×384 RGBA；注册在`src/renderers/city-baked-catalog.json`，按需解码，沿用普通楼体的预滤波、遮挡、命中、高光及销毁。

塔为石灰岩与砖石、铜绿尖顶及暖色长窗，立面有Octocat轮廓徽章。生成图片并不构成GitHub品牌的独立授权；本项目位图不因代码MIT许可自动获得独立复用许可。

源图SHA256：`a0f0aaedef2b8527a46004c04cdde05b6dd45ae5cf43602d9704f29b69e19c49`；运行图SHA256：`86008ede86d0927150c9d952cfd734ccfb5e2f3bcf5a670eb1c2e0804d9cca66`。

## 标定复现

只做机械烘焙：读取源图，裁剪`[320,10,705,1525]`，X方向单位比为`.9/(698-326)`、Y方向单位比为`.225/(1518-1404)`；源地面前点`[512,1518]`映射到世界`[0,.475]`。将裁剪框映射到此世界空间，用`380/max(worldWidth,worldHeight)`绘制到长边384像素内的Canvas，加2像素透明边距，输出无损PNG及元数据。不逐帧处理源图，不运行生成模型或加载远程素材。

## 生成记录

使用内置imagegen。先生成高塔，再清除建筑之外的光晕/雾气；既有模型保留。

高塔提示：

> Use case: stylized-concept. Asset type: ONE transparent isometric building sprite for a detailed GitHub contribution city. Primary request: an iconic TALL GitHub Joining Memorial Tower, celebrating the day the user joined GitHub. It occupies only ONE small square city tile but rises dramatically, 4 to 5 times the base width. A striking slender ivory limestone civic tower with terracotta inset panels, vertically fluted stone piers and a few tall narrow warm-lit arched openings, a projecting octagonal observation lantern near its top, elegant teal patinated copper crown and a graceful steep spire. A dark Octocat silhouette inside a pale circular stone medallion is prominently mounted high on the tower, clearly part of the architecture. This must be recognizably a monumental tower, with a completely different silhouette from houses or office blocks, NOT a broad hall, cathedral, castle, apartment building or generic skyscraper. Tiny formal arched doorway and a couple of discreet planters at its compact stone base. Premium meticulously painted 2.5D city-builder sprite: crisp stone mouldings, copper seams and railings, painterly realistic stylized materials, excellent detail that reads when downsampled to a runtime height of 384px. Strict orthographic 2:1 isometric ground projection: parallel ground edges at +26.565/-26.565 degrees, view roof/crown and two tower faces; NO front-elevation view, NO perspective vanishing points. Entire spire and small diamond base fully visible with transparent breathing room, vertically composed with tower centered. The base width should be about one quarter of the tower's total visible height. Soft daylight upper-left, baked shading on the building, no large cast shadow. TRUE alpha transparent background, isolated tower only. No roads, landscape, people, cars, surrounding buildings, floating symbols, text, letters, years, captions, UI or watermark. No crop.

透明清理提示：

> Edit target: this tall GitHub Joining Memorial Tower sprite. Keep the tower, its very tall slender form, Octocat medallion, colours, window details, spire, compact diamond stone base, perspective and full uncropped framing. Remove ALL surrounding glow, haze, ambient fog, soft halo, vignette and cast shadow outside the solid architecture/base. Every pixel outside the actual physical building and its stone base must be fully transparent alpha, including beside the shaft, around the spire and under the base. Clean sprite cutout with natural antialiased edges, no fringe or semitransparent fog, NO opaque black/white/grey background. No redesign, no extra objects. Return a true transparent-background PNG.
