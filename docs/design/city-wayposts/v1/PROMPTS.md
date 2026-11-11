# 精绘公路与小镇路牌提示词

2026-11-11，使用内置 `image_gen.imagegen`，全部启用 `transparent_background=true`。正式选用下列四张源图；前期厚框现代款已弃用，不纳入运行素材。

后续规则已调整：绿色/木色用于东西方向，蓝色用于南北方向，不再表示双向连接；未知牌面完全留空。以下提示词保留实际生成时的原文及文件名，mutual 是历史制作名称，不是当前产品状态；当前用途见 [README](README.md)。本轮复用原图，没有重新生成或改变像素。

## 现代公路款

以真实公路指路牌为构造参考，参考照片来自 [WSJ 的 I-19 指路牌报道](https://www.wsj.com/politics/policy/america-first-trump-metric-highway-tucker-carlson-827758e6)；另查看 [FHWA 指路标志示例](https://mutcd.fhwa.dot.gov/htm/2003/part2/fig2e-15_longdesc.htm) 的牌面形式。照片只在系统临时目录参与输入，不进入项目。这里只参考外观，不声称执行或认证交通标志标准。

绿色单向：`modern-highway-source.png`。

```text
Use case: stylized-concept. One transparent isometric architectural game prop for a MODERN CITY, based on a REAL public-highway DIRECTION SIGN. Image 1 is a real roadside highway-sign photograph used as construction/proportion reference only. Draw a new clean miniature highway sign, no scenery from photo.
The key appearance is an ordinary thin flat GREEN reflective aluminium traffic panel, with a fine WHITE rounded rectangular border PRINTED directly onto its face, rounded corners and just a hairline grey aluminium plate edge (only a few millimetres thick). There is NO raised picture frame, NO bevelled chrome frame and NO sculpted trim. A wide horizontal 3:1 sign panel, supported by TWO SLENDER ordinary galvanized round steel posts placed at the quarter points, about 8cm diameter relative to a 5 metre panel width. The posts remain slender from top to bottom, visible below panel for about 1.5 times the panel height, secured into modest flush ground sockets, not big display pedestals. Small rear mounting clamps are barely visible. Smooth utilitarian contemporary infrastructure proportions, subtly detailed reflective sheeting and galvanized zinc texture, crisp architectural game sprite finish. Thin white border and uniform green face should dominate the read. NO heavy triangular braces, cross truss, bulky screw caps, thick corner blocks, rust, carved ornament, bronze, lamps or decorative feet.
BLANK empty panel: absolutely NO TEXT, numbers, arrows, logos or symbols inside. Dynamic GitHub ID is added by the app.
Fixed parallel orthographic 2:1 isometric camera, long panel edges slope DOWN-RIGHT 1 pixel per 2 horizontally; posts truly vertical. Full complete single object on genuinely transparent background, generous transparent margin. No road, scenery, grass patch, tile, external shadow or opacity backdrop.
```

蓝色双向：`modern-highway-mutual-source.png`。

```text
Use case: stylized-concept. One transparent isometric architectural game prop: a BLUE two-way-connection variant of an ordinary modern public-highway roadside DIRECTION SIGN. Image 1 is real construction reference only, not to copy scenery or text.
Use the credible real-world road-sign language: thin flat BLUE reflective aluminium traffic plate with rounded corners and TWO fine WHITE rounded rectangular keylines PRINTED on the face. The twin white keylines and slightly rounded panel ends are the entire design distinction from a green single-line ordinary sign, no ornamental added objects. Only a hairline gray sheet metal edge. TWO SLENDER ordinary galvanized gray round steel posts at the quarter points, visible below panel 1.5 times panel height, modest flush ground sockets, tiny unobtrusive rear mounting clamps. Wide horizontal 3:1 panel. Utilitarian traffic infrastructure, contemporary materials, fine painted miniature city sprite quality. NO thick embossed silver or chrome frame, gold lines, chevron sculptures, triangular brackets, X cross-bracing, oversized bolts, huge foundation blocks, wood, lanterns or antique details.
Central blue panel must be totally BLANK: no text, no arrows, no symbols, logos or numbers. The app will draw the GitHub ID and bidirectional arrow.
Fixed parallel orthographic 2:1 isometric camera, long panel edges DOWN-RIGHT at 1:2 slope, poles vertical. One full object centered, true transparent alpha and margin. No highway background, road, grass, environment, ground tile or external cast shadow.
```

## 小镇款

单向参考 `public/assets/town-runtime/magic-0.png`，输出 `town-source.png`。

```text
Use case: stylized-concept. Asset type: one premium transparent isometric game prop for the CodeYears magical town. Image 1 is STYLE REFERENCE ONLY: match its richly painted cozy fantasy sprite craftsmanship, tiny material details, warm stone, dark timber and muted gold hardware; do not copy the observatory.
Primary request: ONE large beautiful medieval roadside direction sign with its complete supports. A wide horizontal deep walnut wooden EMPTY notice board, subtly visible horizontal plank grain and a recessed nearly flat dark wood writing field, solid carved oak perimeter frame with gently bevelled corners, small bronze corner brackets and rivets. Two sturdy square oak posts, tasteful carved capitals, wrought-iron straps and diagonal timber braces, each on a small warm stone plinth with a little moss. A slim protective timber cap above the panel, not a big house roof. One modest warm golden lantern attached to the outer post, a tiny trailing vine confined to the outside of the frame. Finely hand-painted miniature construction with crisp detail like the reference building, not a flat icon. Keep the entire central writing field clean, dark and completely EMPTY for dynamic GitHub ID; NO lettering, no arrows, no heraldry, no symbols or logos.
Composition/calibration: fixed parallel orthographic 2:1 isometric camera. The long top and bottom edge of the sign face slope DOWN-RIGHT exactly 1 pixel for 2 pixels horizontally; all posts remain truly vertical. Board plane is parallel to the ground X axis. A thin right/top physical edge is visible. Broad rectangular board roughly 3:1 width to face height, with visible post height below about the panel height. Whole complete object centered with 8% transparent margin, both bases on same ground plane visible. No road, grass patch, scenery, ground tile, opaque background or external cast shadow. True transparent alpha cutout. Produce just ONE sign assembly.
```

双向参考上述 `town-source.png`，输出 `town-mutual-source.png`。

```text
Use case: stylized-concept. Asset type: a special two-way connection roadside sign for the same magical town. Image 1 is style/proportion reference only. Keep a broad blank rectangular writing board on two beautifully carved oak pillars with separate small warm-stone plinths. Make this TWO-WAY variant distinct: inset panel is deep midnight BLUE painted wood, double delicately carved walnut perimeter frame with slim muted brass/gold inlay, small symmetrical gold finials and paired decorative brackets, brass hardware, warm miniature lantern on the outer pillar, a few tiny vines kept outside the writing field. Fine crisp hand-painted fantasy game sprite detail, believable timber braces, grain and masonry, same scale as reference. Central BLUE panel completely EMPTY and unobstructed for dynamic GitHub ID and bidirectional arrow; NO lettering, arrows, numbers, heraldry or symbols baked into image. Parallel 2:1 isometric orthographic view, long board edge down-right 1:2, vertical posts upright, both bases visible, true transparent alpha cutout, complete object with margin. No road, grass patch, environment, opaque ground or external cast shadow. One prop only.
```

## 校准边界

原始图的牌面斜率没有直接满足 2:1；运行图按 `calibration.json` 的实际牌面控制点和落脚原点离线校准，不能把提示词当作测量结果。输出牌面轴斜率为 +0.5，另一朝向通过同一世界变换镜像造型，文字保持正向。文字、问号和箭头由地图根据配置绘制，没有烘焙在图片里。完整隐藏几何、材质的物理相机恢复和真实工程标准不作保证。
