# 奇观体育馆 · 生成与初标定

日期：2026-11-01。只交付透明正式素材及初标定，不宣称已完成城市组合、真实扩展或用户美术验收。

使用内置 `image_gen`，`transparent_background=true`，两次独立生成，采用第二稿。没有 CLI/API fallback；没有程序去底、改色、裁图、镜像、拉伸或修改 alpha。原图完整保留，运行副本逐字节复制。

## 正式文件与量测

- 正式源：`wonder-stadium.png`；运行副本：`public/assets/city/unit-wonder-stadium.png`。
- 工具正式源：`/Users/xingyuwang/.codex/generated_images/01a194e5-927b-7d61-bf98-eeb201ece937/exec-ee10325d-20f7-4231-a2a5-8ef503bbaf71.png`。
- SHA-256：`54e6845d20894d174180e64cbdebc12bfb927fe1475ffb99e61e55f6f5489142`；2,517,446 bytes。
- 1536×1024 RGBA，alpha范围0–254，四角alpha0；alpha>8半开裁框[70,136,1486,912]。
- 原生4×3，targetHeight1.1H；共享标定受占地约束后实际参考高度 **0.808921H**，不称严格1.1H。
- 支撑跨度W/D约3.571734/2.8格，每侧留距约0.214133/0.1格；轴校正后W/D斜率为+0.5/−0.5。
- 体育馆采用长条低矮整体体量、暖石拱廊、青铜肋、蓝灰环形顶棚、青绿场地，区别于已有小型砖体育场。材质参考先查看已有`unit-stadium-a.png`，生成时没有作为编辑目标传入。

## 标定依据与限制

标定见[JSON](../../calibration/wonder-stadium.json)。W/D按可见直线基座边选取，约±8px。体育馆前角圆滑，L/F/R作为保守逻辑落地包络，F是围住入口台阶的虚拟前角，后角[669,207]由平行闭合推断，约±12px；不是四角均实测。高度参考为同x的主入口落地至前顶棚外唇，约±12px，不把后部肋骨高度冒充楼身。

图片查看器可能显示透明区域中的棕灰RGB；量测代表点（400,150）、（200,200）、（500,900）、（900,960）alpha均为0，RGBA原图未修改。现有低值alpha显示缓存处理仍可沿用。源图中局部屋顶、椭圆与隐藏几何存在AI近似，不声称恢复精确物理相机；以共同地面轴校正及城市实际显示为准。

首稿工具路径：`/Users/xingyuwang/.codex/generated_images/01a194e5-927b-7d61-bf98-eeb201ece937/exec-763b8a6a-c2b5-4711-9c99-bf30b0a5ff23.png`。首稿长方向与4×3要求相反，未采用，未进入正式项目。第二稿重申长W左立面与透明外部后采用。没有继续扩展变体或无限生成。

## 完整提示

### 首稿（未采用）

```text
Use case: stylized-concept. Asset type: one production transparent city-builder landmark sprite for CodeYears. Create ONE original large world-class civic STADIUM wonder, a coherent broad rectangular arena with chamfered corners and a softly oval open bowl inside. Distinct from a small brick football ground: elegant warm limestone exterior arcade, slender aged-bronze ribs, charcoal-blue canopy ring and a rich teal-green playing field, finely modeled seating tiers, warm recessed entrances. Refined miniature realistic pre-rendered city-building game illustration, exceptionally polished crisp materials, readable architectural masses, no cartoon outlines, no pixel art. Native ground footprint FOUR units W by THREE units D, very broad and LOW: support envelope approximately 3.8W x2.8D, centered with clear margins, no surrounding lot. Highest principal roof approximately 1.1 vertical units H. Ground projection is exactly orthographic 2:1 isometric: W travels RIGHT-DOWN slope +0.5; D travels LEFT-DOWN slope -0.5; all verticals exactly vertical, all roof/base parallel edges use the same directions. Thus right-down long facade is roughly 1.36 times left-down short facade. The arena may have gently rounded corners but show enough straight base/roof edges to measure both axes. Main building only, with tiny integral entry steps within the footprint, no surrounding square platform, no thick exposed slab, no towers. Complete roof and complete base in frame with generous transparent margins, landscape 1536x1024 composition if possible. Soft daylight from upper left, clean shadowing within architecture only. GENUINELY TRANSPARENT RGBA background, no horizon, no environment, no floor rectangle, no ground shadow beyond base, no text, words, logos, banners, flags, watermark, people or vehicles.
```

### 正式第二稿

```text
Use case: stylized-concept. Asset type: one production transparent city-builder landmark sprite for CodeYears. Create ONE original large world-class civic STADIUM wonder, a coherent broad rectangular arena with chamfered corners and a softly oval open bowl inside. Distinct from a small brick football ground: elegant warm limestone exterior arcade, slender aged-bronze ribs, charcoal-blue canopy ring and a rich teal-green playing field, finely modeled seating tiers, warm recessed entrances. Refined miniature realistic pre-rendered city-building game illustration, exceptionally polished crisp materials, readable architectural masses, no cartoon outlines, no pixel art. Native ground footprint FOUR units W by THREE units D, very broad and LOW: support envelope approximately 3.8W x2.8D, centered with clear margins, no surrounding lot. Highest principal roof approximately 1.1 vertical units H. Ground projection is exactly orthographic 2:1 isometric: W travels RIGHT-DOWN slope +0.5; D travels LEFT-DOWN slope -0.5; all verticals exactly vertical, all roof/base parallel edges use the same directions. Thus right-down long facade is roughly 1.36 times left-down short facade. The arena may have gently rounded corners but show enough straight base/roof edges to measure both axes. Main building only, with tiny integral entry steps within the footprint, no surrounding square platform, no thick exposed slab, no towers. Complete roof and complete base in frame with generous transparent margins, landscape 1536x1024 composition if possible. Soft daylight from upper left, clean shadowing within architecture only. GENUINELY TRANSPARENT RGBA background, no horizon, no environment, no floor rectangle, no ground shadow beyond base, no text, words, logos, banners, flags, watermark, people or vehicles.
CRITICAL CORRECTION: From the frontmost bottom ground corner, the edge leading UPPER-LEFT must be the LONGER edge (about1.36x); the edge leading UPPER-RIGHT must be SHORTER. In the picture, the LEFT visible exterior facade is the LONG facade, the RIGHT visible exterior facade is SHORT. Reverse the usual wide right facade. Put the frontmost bottom corner slightly to the RIGHT of center (about57% imagewidth), not left of center. Absolutely no ambient outer glow, fog, gray backdrop or shadow halo. Clean isolated cutout with zero-alpha outside the architecture and compact entry steps. Do not include any gray floor haze. No huge steps extending beyond perimeter. Keep entire main building clearly below upper roof center.
```
