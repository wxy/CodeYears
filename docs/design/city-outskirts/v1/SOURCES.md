# 外围自然地貌 · 图片素材 v1

2026-11-01 用户明确要求使用图片生成，不使用程序/SVG树木与山体。本组使用内置`imagegen`，`transparent_background=true`，每种素材独立生成。原始RGBA PNG为1536×1024；原图与`public/assets/city/`运行副本逐字节相同，不覆盖旧建筑或植被原图。图片是装饰性自然地貌，不代表贡献数量；视角是生成约束下的视觉近似，不能宣称隐藏地面已恢复成精确3D。

| 资源 | 原始输出文件名 | 字节 | SHA-256 |
| --- | --- | --- | --- |
| outskirts-forest.png | exec-12279f3c-741c-4472-962b-9306e55fdbaa.png | 3235806 | 6ac934f48045b60e23b1c1f34a325a89b20febb58ece974aae23364180a3555d |
| outskirts-meadow.png | exec-619080b5-61f0-4bcc-9a65-43ce4512b3ff.png | 2918248 | 3ca8e89cd6b58ad0a87153628fa984102f285aeaf9553e8c4ae5daedb0ca0cef |
| outskirts-hills.png | exec-c91bb0ec-81a0-4844-ab67-1873d7f0ca2e.png | 2732744 | 90c0e82d858644eb2129a9a119d65959a882942e5807dc1da3be771c07546a05 |

原始输出目录：`/Users/xingyuwang/.codex/generated_images/01a187ba-93a6-70e0-bab8-de4cbec15028/`。项目正式副本保存在本文同目录及运行资源目录，不依赖该外部路径。生成时未上传参考图片，既有林地仅作本地观感参考。

三次生成都使用以下共享提示，再追加对应Subject全文：

```text
Use case: stylized-concept. Asset type: production transparent PNG environment sprite for CodeYears, a polished miniature city contribution map. Create ONE isolated natural landscape cluster, viewed in exact orthographic 2:1 isometric projection, ground axes slope +0.5 and -0.5, vertical trunks stay vertical. Elevated camera about 30 degrees, no horizon. Highly detailed realistic miniature game art with tactile grass, foliage and stone, refined restrained natural colors, sun from upper-left, soft small contact shadows. All content fully inside the image with 10% transparent padding. Irregular feathered organic ground outline disappearing into true alpha transparency, no rectangular/square/diamond slab, no visible soil cross-section, no hard tile border. No buildings, no human-made paths or roads, no people, no text, no labels, no grid, no flat vector/SVG style, no low-poly pyramids, no background/checkerboard, no poster. Cohesive realistic art, not a photograph. The cluster will be reused around the edges of an existing isometric city, and must match sophisticated pre-rendered city-building sprites. Landscape aspect ratio, composition wider than tall.
```

森林：

```text
Subject: a medium-density woodland grove of 8 to 12 varied broadleaf trees and several dark conifers on natural grassy understory, visibly varied heights, young and mature trees, low bushes, leaf litter and sparse small gray rocks. Rich but muted moss/olive/forest green foliage with fine natural detail. Loose asymmetrical grouping with small clearings and naturally tapering edges. Trees are modest scale, not giant canopy wall. Ground approximately 8 by 6 logical meters, tallest trees about 3.5 relative units. Keep broad visible understory around tree bases.
```

荒地草甸：

```text
Subject: an open gently rolling fallow meadow and sandy wasteland cluster, mostly low olive-green and straw-colored grass with patches of warm sandy earth, moss, low shrubs and a few weathered boulders, at most two tiny saplings. Fine tactile grass textures, irregular subtle foot-worn erosion but NO artificial path. Low height, sparse quiet appearance with ample open grass. Organic ground approximately 8 by 6 relative units. Natural silhouette, no raised platform.
```

岩石丘陵：

```text
Subject: a compact natural rocky foothill outcrop with three uneven connected ridges, warm gray stratified weathered stone, moss and soft olive-green grass on lower slopes, a handful of tiny sparse conifers at the base. Detailed believable eroded geology, rounded broken rock faces, no perfect pyramids or polygonal triangles, no snow. Ground approximately 8 by 6 relative units, highest ridge about 2.8 relative units. A coherent asymmetrical terrain feature with low sloping fringes, not a collection of separate rocks.
```

内置工具返回带alpha图像，已检查通道范围与内容。边缘低alpha会沿用已有素材清理流程，不修改源PNG。整体投影、大小、透明边缘与道路避让须以最终城市实际画面验收；提示中的比例和光照要求不自动等于量测结果。
