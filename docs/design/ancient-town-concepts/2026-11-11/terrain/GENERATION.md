# 小镇地貌与道路材料

2026-11-11，用户要求替换纯色底、使用有实景质感的道路。通过内置 `image_gen` 生成通用四格材料图集，未提供任何账号、逐日贡献或活动数据。源文件为 `material-atlas-v1.png`，没有修改原建筑或人物源图。

图集四等分：左上草甸、右上磨损石路、左下灰褐泥土碎石、右下庭院石板。最终选用这一次生成。使用 `scripts/bake-town-ground.mjs` 机械裁出四格并镜像接续为各512×512 PNG，保留源图；镜像减少接缝，但不宣称原图天然无缝。草地按16世界单位、石材按2.4、泥土按3单位重复，均沿同一地面投影；地面不随屏幕平移滑动。

同时直接复用已在现代城市标定的 `outskirts-forest`、`outskirts-hills`，复制其正式运行PNG及元数据到小镇资源目录，没有重新拉伸或生成它们。来源/原始提示见既有城市地貌记录与根目录ASSETS.md。

完整生成提示词（内置工具，非CLI/API）：

```text
Use case: stylized-concept. Asset type: production terrain MATERIAL ATLAS for a Western European medieval magical town builder. Create ONE square image divided precisely into FOUR equal square texture tiles in a 2 by 2 grid, WITHOUT ANY gutters, borders, words, lettering, buildings or objects standing above the ground. Flat orthographic straight-down surface views, NOT isometric screenshots. TOP LEFT: cool emerald and sage meadow turf, rich hand-painted short grass blades, patches of moss, tiny white wildflowers and subtle organic earth variation, lush and gentle, no ponds. TOP RIGHT: real-looking worn pale grey irregular medieval cobblestones with small green moss growing naturally in joints, slightly uneven hand-laid stones and believable chipped texture, full tile covered in stones, NO modern asphalt/markings. BOTTOM LEFT: natural compact grey-brown earth and fine gravel, worn country footpath material with scattered tiny stones and grass speckles, NOT orange or sand-colored. BOTTOM RIGHT: medieval courtyard paving of small pale limestone flagstones, subtle warm grey variations and moss in cracks, no regular black outlines. All four material squares must be filled edge-to-edge and each must feel seamless, evenly lit under soft daylight without long cast shadows, no horizon or perspective. Detailed hand-painted game illustration, charming grounded fantasy, suitable beneath honey timber cottages, slate-purple and blue-roofed mage workshops. Keep medium low contrast so tiny characters and architecture stay readable. No decorative frames or icon layout. This is ONLY anonymous generic art material, never any contribution data.
```

生成图集只提供表面像素，不提供日期布局或固定道路截图。实际道路、院门、路肩和交叉口由真实聚落规划决定，路面使用上述材质填入世界坐标路径，随远近缓存复用；不是以一张生成的小镇示意画替代真实数据。
