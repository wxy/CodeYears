# 完整农场透视重画试验

2026-11-11，使用内置 `image_gen`，透明背景。唯一参考图为 `../2026-11-10/fantasy-building-forms-v1.png`，没有使用贡献数据。

结果未准入：候选中不同建筑的水平构件仍不能直接确认为同一地图轴，也未取得足够的成对正交方向证据。生成结果仅作本机审图候选，未覆盖原图、未加入运行包。首版采用分别校准的连体畜舍和农舍，在同一个矩形庭院组成完整农场。

完整提示词：

```text
Edit target: the supplied transparent 3 by 3 fantasy building sprite atlas. Extract and REDRAW ONLY the complete farmstead in the BOTTOM LEFT cell as one isolated standalone transparent sprite. Do not redraw the other eight cells.
Use case: production game sprite perspective correction, western European medieval magical town in the established warm hand-painted Agent Control Plane visual language.
Preserve the target's identity: compact cream-plaster oak-timber farmhouse with golden thatch on the left, red tile barn behind/right, small red tile animal stable at the front/right, stone-paved working yard, hay, trough, barrels, horse, a small farm worker. Same warm gold lanterns, tiny restrained magical charm, flower detail, no modern objects. Buildings together occupy a rectangular 3 by 2 plot. Modest single-storey buildings, human doors and person kept proportional.
CRITICAL CAMERA GEOMETRY: orthographic dimetric/isometric 2:1 map camera. Every ground-plane width-direction edge slopes down-right exactly one unit for two units right (+0.5 screen dy/dx); every ground-plane depth-direction edge slopes up-right exactly one unit for two units right (-0.5). All three buildings are parallel on these SAME axes, no individual yaw. All vertical corners and door jambs are strictly vertical. Visible lower horizontal foundation edges, door lintels, horizontal wall beams and roof eaves parallel to a given axis must share that axis, across all three buildings. Pitched roof slopes are distinct from horizontal eaves. No perspective vanishing point. Courtyard paver grid on these same axes. Farmhouse, barn and stable have one shared flat ground plane and sensible occlusion.
Composition: show two facades per building with enough visible straight stone foundation edges to measure each axis. Courtyard open toward bottom of image. Occupy center 85 percent of square image, all roofs and feet fully inside generous transparent margin. Transparent alpha background, no solid backdrop, no checkerboard, no rectangular painted floor tile, no guide lines, no text, no cast shadow extending beyond the local footprint. Match the original sprite rendering, avoid photorealism or a different illustration style.
Output ONLY the one corrected complete farmstead sprite.
```
