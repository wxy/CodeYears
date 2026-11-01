# 剧院奇观透明素材

日期：2026-11-01。状态：单款正式透明源图及初次标定，等待组合后的城市视觉/真实 MV3 验收。没有以单元生成代替最终画面或性能通过。

使用内置 `image_gen`，一次生成，`transparent_background=true`；未使用 CLI/API fallback。工具原图：`/Users/xingyuwang/.codex/generated_images/01a194e5-bea4-75a0-af2a-cf241438f51a/exec-d3aee736-c0d9-4f00-8cc3-916e9fd1b841.png`。正式源：`wonder-theater.png`；运行副本：`public/assets/city/unit-wonder-theater.png`；标定：`../../calibration/wonder-theater.json`。两份文件逐字节一致，未程序去底、裁切、重画、改色或拉伸。

文件为 RGBA 1536×1024，2,594,160 bytes；SHA-256 `0ae08342abe2421ffea6bcc21ae37b09d973d989ea153a81d7f8b22175585193`。alpha>8 的半开裁框为 `(38,58)–(1502,963)`，alpha>220 为 `(39,59)–(1501,961)`，四角 alpha 均0。原图中外围低 alpha 柔晕沿用显示缓存既有抑制，不修改源像素。

## 视觉与标定

宽体赤陶/石灰岩市立剧院，以青铜弧拱屋顶、通高玻璃前厅、石材竖肋和紧凑入口阶梯区别于楼群；未复制某一著名建筑。建筑旁花坛属于本身占地，不加入独立地面底板。

以现有 `calibrate` 读取 JSON：主墙石柱实际参考高度 **2.000H**，占地包络 **2.389835×2.265405 格**，放在原生3×3地块中央；W/D 每侧退让 **0.305082/0.367297 格**，中心 `(1.500000,1.500000)`，两主轴映射 `+0.5/−0.5`。最初建议约1.5H会缩成约1.79×1.70格，故采用2H保持大型文化设施的视觉分量，没有将楼体非等比拉宽。

地面包络 L/F/R 人工选择的是可见石阶/花坛外缘，下方轮廓含入口前场，后角以平行闭合推断，不声称为实测正方形四角。两轴源点约±8px；主石柱参考 `(716,788)→(716,277)` 约±15px。**弧拱和饰冠高于该主柱标尺，因此整栋最高点不宣称严格2H。** 这是固定视角图像校正，不是恢复精确相机或全部隐藏几何。

原图已目视确认完整轮廓、透明边缘及主材质。源码 `calibrate` 数值与副本一致性已静态核对；尚待父任务在正式城市、浅深背景、邻接遮挡、缩放与生长中验收。未启动浏览器、未运行无关模块、未生成截图或遗留临时过程文件。

## 完整提示

参考角色：生成前查看现有 `public/assets/city/unit-apartment-h2-a.png` 作为暖材质、细部和透明游戏建筑画风参考；未将其作为编辑目标，也未裁切该图。实际生成无输入图片。

```text
Use case: stylized-concept. Asset type: one transparent prepainted isometric city sprite for CodeYears. Create a beautifully crafted large municipal theater and concert hall landmark, native square 3x3 logical-cell footprint. Original architecture: a broad terracotta and warm pale-limestone theater with a graceful dark oxidized-bronze barrel-vault auditorium roof, lower side galleries, a tall glazed entrance foyer, subtle stone fins and warm interior glimpses. An elegant low-rise cultural landmark, clearly wider than tall; no towers. Include a compact integrated front entrance stair and tiny attached planting beds, all within its ground envelope. Fine refined simulation-game architectural detail, natural realistic materials, sharp readable small-scale silhouette, soft upper-left neutral daylight, restrained terracotta/limestone/bronze/blue-green palette. Geometry: fixed orthographic 2:1 dimetric view, W axis right-down slope +0.5, D axis left-down (or right-up slope -0.5), verticals strictly vertical, no vanishing point. Square support footprint; main building visual height about 1.5 logical units on 3x3 ground. Keep straight measurable limestone base edges and a front vertical corner, show both visible facades equally. Entire object and all roof/ground features fit comfortably in frame, centered on its ground footprint with generous transparent margin. Genuine transparent RGBA background, clean alpha, only tiny contact/self shading. No backdrop, no external ground plane, no rectangular baseplate, no roads, no independent trees, no cars, no people, no signage, no text, no numbers, no logo, no watermark, no grid. Do not copy any recognizable famous theater or opera house. One single building sprite only.
```
