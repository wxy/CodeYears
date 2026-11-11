# 西欧魔法乡镇茅草屋与短木栏

2026-11-11。地图使用 `hut-front-v2.png` 和 `hut-back-v2.png` 的标定烘焙图，并各提供一个水平镜像。原画由内置 ImageGen 生成。两张旧版和早期比例图保留在本目录，便于对照已否决的高瘦屋型。

## 当前人尺度与朝向

普通门净高为 1，标准居民头顶至脚底为 0.8。这些相当于约 2.1 米、1.7 米的美术基准。先依据门上沿、窗上沿等可见水平构件将投影方向校正到 2:1，再按门的实际净高标定整个正面。高俯角正面两条结构轴的源斜率约为 +0.568、−0.564，故方向校正的竖向倍率约为 0.883。门顶和门底在源图同一竖线上相距约 271px；等高左右门叶端点沿墙面水平方向投影出的净宽约 0.450。端点约有 ±3px 不确定性，粗石墙脚的接地包络约 ±6px。

背面没有可见入户门。正面近角柱的可见高度约 305px，约为普通门的 1.125 倍，背面对应柱段约 308px。背面以同一屋型的角柱迁移尺度，−z 侧的隐藏主门横坐标按正面门位的相对位置反向推定。后墙的柴架、晾草、窗和远坡烟囱来自另绘视角。可见前门用 `observed-door`，隐门用 `inferred-hidden`。逐项原画坐标见 `observations.json`。

| 运行图 | 世界宽 × 深 | 局部入口 x,z | 朝向 | PNG 像素 | 字节 |
| --- | --- | --- | --- | --- | ---: |
| rustic-hut-front | 2.411 × 2.282 | 1.047, 2.146 | +z | 334 × 288 | 177824 |
| rustic-hut-front-x | 2.282 × 2.411 | 2.146, 1.047 | +x | 334 × 288 | 177911 |
| rustic-hut-back | 2.339 × 2.264 | 1.324, 0 | −z，推定 | 337 × 300 | 194047 |
| rustic-hut-back-x | 2.264 × 2.339 | 0, 1.324 | −x，推定 | 337 × 300 | 194172 |

上述尺寸是从三个墙脚推算的支撑矩形，略大于最初约 1.6–2.0 的构想。正、背源共用居民与门尺度，摆放倍率均为 1。实际烘焙宽高比分别为 1.160 和 1.123。用旧农舍、旧茅草长屋、标准居民与这两张新图在同一倍率下对照后，采用这一版。

## 当前围院与运行资源

地图可用 `yard-fence-x`、`yard-fence-z` 两款低木栏标示院界。它们的真实地面包络分别为 0.95 × 0.07、0.07 × 0.95，图像尺寸均为 242 × 215，每段有三根 0.4 高的柱、两道横木，栏顶约 0.32。院门由短段之间留出的空隙形成。分段使每一处围栏具有自己的接地点，可以与邻近屋身、居民分别参与遮挡排序。两张图的字节数分别为 10,787 和 11,168。

运行目录共 26 张 PNG，5,222,877 字节。对应基线 3fa76fd 的目录有 92 张、17,466,739 字节。保留 20 张原图并逐文件比对字节，增加 4 张茅屋朝向和 2 张短栏。退出运行的建筑、院墙仍可由相应历史设计源复现。图像文件字节不能推算运行时内存或帧率。

本机 Chrome 离线烘焙命令：

```sh
node scripts/bake-town-assets.mjs --outDir "$TASK_TMP/baked" --catalog "$TASK_TMP/catalog.json" --proof "$TASK_TMP/proof.json" --board "$TASK_TMP/board.png"
```

核对了两组镜像的宽深、门坐标交换、入口边与共同尺度，及两种栏段独立的地面包络。校准板、实际同倍率对照图和诊断 JSON 只在任务临时目录生成。

## 已替代的试稿

`front-study.png` 是初步材质研究。第一版 `hut-front.png`、`hut-back.png` 的源构件斜率过浅，在原 2:1 方向校正后分别成为 176 × 328 和 182 × 336 的瘦高形状，正面净门宽约 0.20。经过实际运行 PNG 与标准居民对照后，该版被否决。其测量见 `observations-v1.json`。

早期曾试烘 47 种地块的整院前、后栏，共 94 张。整片前侧栏的统一深度会把偏后的一段画到屋顶前，因此当前目录已移除这些图层。离线绘制器仍保留历史原型的整院绘制分支。

## 生成提示词

### front-study

已有 cottages-1、forms-0 提供农舍风格和茅草参照。

Use case: stylized-concept. Draw one compact, inviting rural Western European fantasy thatcher's cottage as a transparent isometric game sprite. Reference image 1 shows the human scale, painterly warmth and THREE CORNER ground projection to preserve from a small local farmhouse. Reference image 2 shows only the golden thatch, not the length. One tiny freestanding one-storey cottage, approximately square in footprint. Beautiful ultra-thick bundled golden straw, thatch ridge pegged by crossed twigs, short irregular saddle roof and rounded shaggy eaves; a small rough stone hearth flue on the right slope; pale lime plaster with a few weathered crooked oak beams and short rough fieldstone plinth. A SINGLE readable ordinary oak pedestrian door centered on the near-left GABLED facade (wall running down and right toward the front corner). No porch or stairs outside the footprint. A small amber glowing charm hangs next to it, and just one intimate working casement on the near-right side wall under the straw eave, simple undivided leaded glass set into wood. Small box of three rustic flowers beneath the window, little ivy on the stone, nothing protruding far from the walls. Door tall enough for an adult 1.7m, door height 2.1m; aim for each visible wall's horizontal pixel run to be about 1.4–1.6 door-leaf net heights. Keep a vertical segment of oak post unobscured at the closest corner from plinth to eave, to compare with a back view later. 2:1 orthographic isometric, both base axes at exactly 1 up/down for 2 across, straight structural horizontals and vertical walls. Slightly asymmetric, cozy fairy-tale miniature for a hamlet, short low roof, no palace, no long line of windows, no skyline. Entire house within frame including flue; real isolated alpha background. No other building, no horizontal ground plane, no fence, text, garden scene, detached objects, floor tile, people or massive shadow.

### hut-front

front-geometry.png 为第一版比例参照，front-study.png 为材质参照。

Use case: sketch-to-render. Fix the proportions of the cottage in reference 2 by using reference 1 as the exact measured wall, threshold, window and pitched-roof geometry. Match the flat schematic reference 1's rectangular oak door leaf net HEIGHT, plinth corner and both diagonal facade slopes closely. In particular, leave generous plaster above the small front pedestrian door, since it serves a broader, squat peasant cottage. Its net height is about 30 percent of the entire building image width. Build up a delightful compact rustic Western-European home with irregular mossy warm reed-thatched roof, oak pegs, craggy fieldstone, low chimney and woodwork following image 2's craftsmanship. Give the door a simple timber lintel and the narrow gable a little handmade carving and two crossed wooden braces; not a tall monumental dressed-stone portal. Side casement of the schematic is a small timber framed working window with small diamond glazing, a tiny quiet charm and a small cluster of white flowers. Soft warm tan straw, varied earthy highlights, aged stone, muted pale plaster and rough oak. Keep walls low and relatively broad; substantial but not overpowering thatch overhang. Single standalone complete cottage, transparent alpha, daylight from upper-left. Upright verticals, camera 2:1 isometric matching guide. No ground, garden, surroundings, people, captions, lettering or neighbors. The schematic location and size of both door and side window matter; do not make the door almost the full height of the facade.

### hut-back

以第一版 hut-front.png 作反向重绘。

Use case: precise-object-edit. Make the MATCHING BACK VIEW of this exact little thatch-roof Western European cottage, as if someone picked up the whole building on its square base and rotated it exactly 180 degrees (two quarter turns), camera still in identical 2:1 isometric position, same camera height, lighting, scale and image framing. The left visible wall is now its OTHER gable. The one ordinary door, brass lamp and carved flower medallion from the front are on the far wall COMPLETELY HIDDEN behind the cottage. DO NOT put any door or lamp on the back gable. Show lovely white lime plaster and weathered oak timberwork, perhaps two modest drying herb bunches, woodpile tucked FLUSH below a very small rear casement; on the near-right wall show a working glazed rectangular window with the same glazing size height and shape as the front image's side casement, ordinary wooden sill and frame (no front flowerbox here). A patch of aging reed in the thatch and a single little moss patch allow the rear to read differently. Chimney is on the FAR slope now, seen popping up BEHIND the roof ridge toward the left, not on the near right roof slope. Same gable pitch and modest height, same squat depth and overall width; same two crossed wooden end-pins to the short reed ridge. Expose the vertical nearest post from where it meets the top of the stone plinth up to the underside of the overhanging eaves; it should have the same structural height as the prominent nearest corner post in the front image. Keep one coherent tiny cottage with rough fieldstone foundation, plump warm straw and timber braces, real transparent alpha right up to the silhouette; no ground plane, garden, fence, exterior stairs, other objects, people or text. We must recognize that characterful original house viewed from BEHIND, with the forward doorway and amber lamp fully hidden.

### hut-front-v2

只以 high-camera-geometry.png 为高俯角、低四坡顶和门窗的几何参照。

Use case: sketch-to-render. This is an EXACT measured axonometric architectural maquette to texture, NOT an inspiration image. Return one beautifully painted western European thatcher's cottage in the very same high overhead orthographic camera as the supplied image. Trace the geometry of the image closely: preserve all three floor-corner positions, steeply diagonal floor courses and eaves in both directions, wall height, the broad shallow hipped roof with its entire rear facet visible, tiny chimney, and rectangular door/window size on the specified wall. The house must read broad and comfortably squat inside a single transparent square canvas. Maintain the precise ratio of doorway to facade of the supplied drawing: door net width ~half its net height, front exterior wall is almost twice one pedestrian door height in its horizontal projection. Camera looking steeply DOWN at the roof, not a ground-level or low three-quarter front view. Both visible foundations project diagonally at about 0.6 vertical units per 1 horizontal unit, creating a strong diamond. Those steep diagonals MUST hold also above the ground: timber band, wall-head, window sill and roof eaves physically parallel their corresponding foundation. A humble plump reed-thatched croft with mossy straw surface, round gently unravelled eaves, hazel ridge pegs, muted earthen pigments, lime plaster, a rough grey stone footing, irregular oak structure, warm oak door on the near-left facade, a little glowing amber lamp by that door and a small leaded casement with a few marigolds on the near-right wall. Tuck the flowers below the window without obscuring its frame. Low-pitched hipped roof as drawn, NO pointed gable, NO tower, NO extra second storey. Exposure upper-left daylight, tiny painterly material variation, appealing rustic storybook village asset. Keep the measured geometry even while adding irregularity to the thatch and small details. Show the full cottage, transparent background, no ground tile, garden, yard, fence, text, people, shadows or props extending into the surroundings.

### hut-back-v2

以定稿正面 hut-front-v2.png 作 180° 反向重绘。

Use case: precise-object-edit. Make a matching REAR 180-degree turnaround of exactly the pictured low square thatched crofter cottage, retaining the same high overhead orthographic camera, scale and broad silhouette. Both wall foundations AND eave sill lines must retain their exact steep +/-0.6 corner angles from the image. Change ONLY which faces we see. The door and brass entrance lamp are now on the unseen far wall, NO door anywhere on either visible wall. On the left-facing rear plaster wall, show a tiny shuttered hatch above a low stack of split firewood tucked against the wall, a small hand-tied hanging bunch of healing herbs, and modest asymmetrical rough timber braces. The right face has the alternate simple window and a single earthenware jar tucked by its jamb; keep an exposed clear vertical oak post at the nearest corner from eaves down to the stone plinth, same post length as in front. The small stone chimney is on the rear/left slope BEHIND the thatched ridge, no chimney on the near-right roof facet. Keep this exact squat low-pitch hipped straw roof and broad top plane, no pointed gables, no second floor; preserve short ridge pegs and a bit of moss in a different placement. Same painterly light and raw village charm as supplied. The near-left wall should clearly read as the back of an occupied herbalist's country cottage rather than a blank cube. Keep precise geometric silhouette of original, isolated real transparent background with margin around complete house, no ground tile, landscape, gardens, detached props, people, signs, captions, logos, text or watermark.

## 文件校验

| 原画或比例参考 | SHA-256 |
| --- | --- |
| front-geometry.png | 1326295ba107e6e69b016392067ba1743d3d7dcd2dddf9d4e1150277eb38b1f1 |
| front-study.png | 88e2fde186fb32639e3de49482d600dbd727ac06ff530c0b519ecaeb9f0219a3 |
| high-camera-geometry.png | cd0a4baa67c60f7c7a7506a533de90f79af9c40e5c0b41e5297b2886b15b9cc4 |
| hut-back-v2.png | 2efcbfa7fd838ffa5a7d1d850656f4f45e04c19fe512e79626360f2fdea00f20 |
| hut-back.png | 1ad5348be37f1a11d771e9a230a4374019fd8beb57af1edf77dd9e828adbed04 |
| hut-front-v2.png | 253182c00550a451772620105e45a8e3c8ff5c7cd01efa2b1fc3142dfb5a9cc0 |
| hut-front.png | 670e2adcc9582aa0d53f7421868c0b734721a874f180bab40cd07a2b4370d0f5 |

沿用的地面材料和外围林丘，已与基线逐文件比对：

| 文件 | SHA-256 |
| --- | --- |
| town-earth.png | 8102bac83e75f11ef71230655fb036f90f964e11c9b867c9b73a32dfb0f583b6 |
| town-stone.png | e3e43670a41f0066ca96f6719d299762c238c90e9019d0e501416fc95365466b |
| town-paving.png | f216150a2b84e58a74fb6ba3e021b0d9086ded4c35f0527c8e43f36bcaf32340 |
| natural-ground.png | b9149dfad9cb0d79f949b3b9aacf5ea069f0d31cf93eabf63f071a385f1807c8 |
| outskirts-forest.png | b2018611bf3ec41b0e6bef3acd425e937ec0b3572701387afefaddfce97210a4 |
| outskirts-hills.png | 4038f19d4e47b5349ee1bb31b5c39769f625a4e537edd65ebe26963ec051ecb8 |
