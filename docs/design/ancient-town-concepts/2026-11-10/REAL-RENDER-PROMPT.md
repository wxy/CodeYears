# 真实贡献渲染原型 · 通用素材提示词

使用内置 `image_gen.imagegen`。只生成通用的西式奇幻建筑和环境素材，不向图像模型提供真实贡献数、日期、地块或用户缓存。真实地图由本机 Canvas 2D 根据经过校验的公开数据与矩形结果绘制。

实际参考图片依次为 Agent Control Plane 的 `compact-cottage.png`、`compact-workshop.png`、`compact-guild.png`。原文件保留，不复制为 CodeYears 的运行素材。

## 十二格透明素材图集

```text
Use case: stylized-concept / production sprite atlas.
Create ONE original sprite atlas on a genuinely TRANSPARENT background, for a deterministic Canvas 2D isometric renderer. Use the three supplied Agent Control Plane building sprites as STYLE references: cozy richly detailed original WESTERN EUROPEAN FANTASY pixel art, warm stone, dark timber frames, moss and vines, blue/terracotta roofs, tiny warm lanterns and flowers. This is an asset atlas, NOT a poster, diagram, scene, screenshot or interface.

CRITICAL EXACT LAYOUT: FOUR equal columns by THREE equal rows, exactly TWELVE separate sprites, row-major order. Request 2048×1536 canvas, thus 512×512 square cells. Even if actual output dimensions differ, keep four equal columns and three equal rows with every sprite fully isolated inside its own cell. No visible cell borders, text, labels or numbers. At least 10 percent transparent padding around each sprite, no item crossing cell boundaries, no overlap or shadows bleeding into another cell.

All ten BUILDING sprites share exactly the SAME isometric camera, ground footprint, human doorway scale and SINGLE-STOREY eave-height baseline. Strict 2:1 diamond ground projection, camera looking toward two visible facades. Front entrance faces screen-bottom. Keep the same ground contact baseline in each cell, about 86 percent down the cell, center x50 percent. The thin diamond-shaped stone foundation has corners approximately (50%,52%), (84%,69%), (50%,86%), (16%,69%). Full building top stays below y10%; no extra storeys, towers, spires or gigantic roof ornaments. Tiny foundation shadow only. Buildings should occupy roughly x16–84%, y12–86% of their cell. Do NOT put each sprite on a lawn, soil tile, floating rock base or large scenery slab.

Use Western steep straight gables, half-timber walls, stone chimneys, iron-hinged doors, leaded glass, artisan details and tasteful heraldry. No East Asian upturned eaves, pagoda roofs, palace courtyards or symmetrical siheyuan. The reference sprites show cutaway rooms; adapt most new sprites to complete small buildings with closed roofs and readable windows/entrances. A small open-front workspace is allowed for workshops, but all buildings retain solid recognizable Western house silhouettes. No characters, people, animals, vehicles, giant signs, lettering or UI. Richer buildings express craftsmanship and equipment, NEVER increased height or larger footprint.

EXACT ROW-MAJOR CONTENT:
Row1 Col1: humble warm timber cottage, thick golden thatched steep gable, stone chimney, tiny door lamp, modest rough joinery.
Row1 Col2: alternate humble cottage with brown shingles, exposed simple timber beams, slightly different gable/door arrangement, same height and footprint.
Row1 Col3: modest half-timber baker cottage, russet terracotta gable roof, little side oven chimney, a flower box and restrained work details.
Row1 Col4: alternate modest half-timber herbalist cottage, muted moss-green/slate gable roof, herb bundles behind a leaded window, small porch lamp.
Row2 Col1: carpenter or smith's workshop, warm terracotta roof, well-built timber and stone, a small open-front workbench, tools, no oversized forge.
Row2 Col2: alternate artisan/potion workshop, muted plum roof, fitted stone base and timber posts, a few bottles visible through a small open front, coherent low house silhouette.
Row2 Col3: refined guild house, slate-blue intersecting steep gables, finished stone and timber, leaded windows, a small blue/gold heraldic cloth with NO lettering.
Row2 Col4: refined merchant/archive lodge, warm red-brown roof, carved timber framing, neatly fitted stone, a small book/work-table view through a window, same footprint and eave height.
Row3 Col1: tiny very refined arcane atelier, deep blue roof with discreet brass trim, jewel-like stained glass, subtle glowing rune ornament on a window, superb joinery, no tower or extra height.
Row3 Col2: alternate refined enchanter/jeweller house, deep violet roof, tasteful carved golden details and one small luminous crystal beside the entry, low eave baseline identical to humble cottages.
Row3 Col3: ONE small environment cluster of two or three blue-green conifers with a bush, same isometric camera and transparent background, no ground slab, no houses. This is scenery, not a building.
Row3 Col4: ONE LOW environment cluster of mossy rounded stones, meadow flowers and a little shrub, same camera, transparent background, no ground slab, no houses.

Make all twelve assets crisp, cohesive and usable at small map scale; building facades, roof shapes and warm lanterns should remain distinct. Transparent empty background including gaps between cells and outside all silhouettes; no black, white or checkerboard background baked into the PNG. No compositional backdrop or horizon. Consistent soft daylight, restrained gold light accents, finely crafted pixel texture. Twelve isolated assets in exactly four columns and three rows.
```
