# 警局与消防局候选来源及检查

日期：2026-10-31。状态：**设计候选，未接入运行库，未完成地图投影验收。**

## 范围与结果

- A 警局：蓝灰 / 浅石、清晰中央入口、无字盾形标识。
- B 消防局：暖深红砖、两扇车库门与左侧办公入口、暗色一体屋顶，无白色屋顶盖。
- 两款意图均为 2×1 H1。未从图片视觉比例直接认定它们已经具有同一逻辑尺寸。
- 使用内置 `image_gen`，每款首次生成一次、投影修正一次；未用 CLI 或 API fallback。
- 最终 PNG 从工具原文件逐字节复制，未裁切、缩放、补边、重着色、去底、重编码或几何变形；工具原文件仍在原位置。
- 素材制作代理未改 `public/`、运行代码或素材清单，也未操作 Git；由主会话统一更新原 PR。

## 参考与几何目标

造型参考：`docs/design/city-units/v2/02-neighborhood-services.png`，已先通过 `view_image` 查看。首轮通过提示词描述该参考的公共服务建筑风格；未将整张设计板合成到输出。

投影依据：`docs/design/city-units/v2/projection-guide.svg`，SHA-256 `b176eee4d9a25c7f3646160236061ca95eeebee33827880e7986095ca6a396e1`。
目标公式：`P(W,D,H)=(48(W-D),24(W+D)-48H)`，W 向右下 `(+48,+24)`，D 向左下 `(-48,+24)`，H 竖直。地面及平行屋顶边要求斜率 `+0.5/-0.5`，即 `±26.565°`；无透视消失点，固定左上光。

修正调用输入第 1 张为对应首轮 PNG，第 2 张为上述 SVG 由 `rsvg-convert` 临时栅格化的几何参考 PNG。临时参考路径为 `/private/tmp/codeyears-service-projection/projection-guide.png`，检查结束删除；SVG 正式源文件保留。图中无标尺文字或网格。

## 最终文件与来源

| 文件 | 工具原文件 | SHA-256 |
| --- | --- | --- |
| `police-a.png` | `/Users/xingyuwang/.codex/generated_images/01a19207-eb92-7472-ab29-ec432850c74e/exec-8fb8a65b-1897-4c9d-b9ba-fd4ea03f1fe3.png` | `fd8035010d4b9b5cf8462e3cb08bfc053d6ca23a82aa7e57de5bb8a95a18c7e1` |
| `fire-b.png` | `/Users/xingyuwang/.codex/generated_images/01a19207-eb92-7472-ab29-ec432850c74e/exec-2c031d77-6e30-4507-aa7b-291546da3832.png` | `19e62058114fe3a1fd1cf44938cee53b2d9fcf2ad472935ad803d78159251db4` |

未采用首轮原文件仍保留于工具目录：

- 警局：`/Users/xingyuwang/.codex/generated_images/01a19207-eb92-7472-ab29-ec432850c74e/exec-22602ca8-9bca-4239-b313-bb376552c720.png`，SHA-256 `59277d7f1c744b70ce2e94baf8fcd954271e172825ec3e467678792347eb5bd3`。
- 消防局：`/Users/xingyuwang/.codex/generated_images/01a19207-eb92-7472-ab29-ec432850c74e/exec-09f3b3c0-dcca-41c4-b9a9-549e3030d99e.png`，SHA-256 `059f5660ff73406119d2706b8adf0213a0aef99b30369a4a5373353d607dcc41`。
- 首轮已目测发现长屋顶边约 +20°、两轴不对称，因此执行了各自唯一一次几何修正；没有反复抽样。

## 只读检查

使用 Pillow 只读打开最终 PNG，检查尺寸、alpha 与主体阈值边界；未写回图像。坐标为原图像素坐标，bbox 采用 Pillow 半开区间，阈值主体边界只是可重复观察值，不等同正式占地四角。

| 文件 | 尺寸 / 模式 | alpha 极值 | alpha=0 像素 | alpha>0 bbox | alpha>128 bbox |
| --- | --- | --- | --- | --- | --- |
| `police-a.png` | 1536×1024 / RGBA | 0–254 | 809514 | (31,23,1522,996) | (88,83,1484,969) |
| `fire-b.png` | 1536×1024 / RGBA | 0–254 | 831691 | (0,25,1504,998) | (123,79,1400,956) |

结论：存在真实透明 alpha，并非画入棋盘或白色背景。建筑主要轮廓完整可见；低 alpha 柔光 / 阴影仍明显宽于要求的紧凑接触阴影，消防局低 alpha 边界触及左画框。此项未达正式素材验收。

### 实际主要直边量测

先目视确认未被设备遮挡的后侧屋顶轮廓，再对每个 x 读取最上方 `alpha>=220` 的 y，通过最小二乘拟合 `y=m*x+b`；取 `atan(m)` 作为图像边线角度。无需改图。对阈值 200 / 240 复核，角度变化小于 0.04°，不足以消除下表的几何偏差。该检查是实际轮廓测量，不是提示词合规声明。

| 文件 / 轴 | 采样 x 范围 | 首末轮廓点（alpha≥220） | 拟合斜率 | 角度 | 拟合 RMSE |
| --- | --- | --- | --- | --- | --- |
| 警局 W | 650–1250 | (650,184) → (1250,438) | +0.42344 | +22.950° | 1.398 px |
| 警局 D | 200–340 | (200,192) → (340,117) | −0.53778 | −28.270° | 0.301 px |
| 消防局 W | 700–1250 | (700,166) → (1250,418) | +0.46098 | +24.749° | 0.696 px |
| 消防局 D | 270–450 | (270,201) → (450,106) | −0.53081 | −27.960° | 0.290 px |

**投影未通过**：警局 W 相对目标约浅 3.615°，D 约陡 1.705°；消防局 W 约浅 1.816°，D 约陡 1.395°。两轴均未同时达到对称斜率 ±0.5。视觉上的主要竖边接近竖直，但未因此认定整体投影合格。

后续门槛：四角 / 高度 / 占地比例标定与必要的透视几何修正；清除宽柔光并保留紧凑接触阴影；同尺寸地图中并排检查。当前不得直接放入 `public/` 或宣称地图吻合。两款各一次的投影修正额度已使用，本轮不继续重试。

可重复的检查核心（只读）：

```python
from PIL import Image
import math
im = Image.open("police-a.png")  # 消防局改为 fire-b.png
a = im.getchannel("A")
print(im.size, im.mode, a.getextrema(), a.getbbox())
print(a.point(lambda v: 255 if v > 128 else 0).getbbox())
# 依上表选择 x0/x1；threshold 分别取 200、220、240
pts = [(x, next(y for y in range(im.height)
                 if a.getpixel((x, y)) >= threshold))
       for x in range(x0, x1 + 1)]
xm = sum(x for x, y in pts) / len(pts)
ym = sum(y for x, y in pts) / len(pts)
m = sum((x-xm)*(y-ym) for x, y in pts) / sum((x-xm)**2 for x, y in pts)
print(m, math.degrees(math.atan(m)))
```

## 完整提示词

### 警局首轮

```text
Use case: stylized-concept
Asset type: one isolated transparent PNG game building sprite for CodeYears, candidate police station A.
Primary request: Create a refined low-rise civic police station, blue-gray and pale limestone, based on the warm detailed miniature-building style of the upper-left police station in the viewed neighborhood-services reference. Full entire building, independent single asset, no other building. Compact broad entrance, small restrained shield emblem above the entry with NO lettering, blue-gray windows and door surrounds, charcoal continuous flat roof, a few fine masonry lines. Building footprint exactly W=2, D=1, height class H1; no tower. Calm polished illustrated architecture, crisp clean forms and believable material detail at small game scale. Minimal clipped planting directly along one wall only if contained inside footprint.
CRITICAL CAMERA / GEOMETRY: strict orthographic 2:1 dimetric game projection, not photographic perspective. Coordinate model P(W,D,H)=(48*(W-D),24*(W+D)-48*H). Both ground axes have exact symmetric image slopes +0.5 and -0.5, angles +26.565 degrees / -26.565 degrees; every vertical is image-vertical. Every corresponding roof, wall lintel, sill and ground-contact straight edge follows those axes. W edge extends down-right and is exactly twice the length of D edge extending down-left. Main footprint suggested image corners on a 1024 square: rear O=(380,490), right W=(828,714), near W+D=(604,826), left D=(156,602); rooftop is these four corners shifted straight upward by 224 pixels. These are construction coordinates, DO NOT DRAW marks. Keep footprint accurately rectangular in that projection. Long front wall from left D to near W+D slopes down-right; short right wall from right W to near W+D slopes down-left. No converging lines, no unequal-axis angle cheat, no shallow-angle reference camera.
Composition: same logical 2x1 size and H1 height as a matching fire station, centered with comfortable transparent margins; complete visible structure and contact shadow. Fixed soft light from upper-left, subtle dark contact shadow close underneath, very little cast shadow.
Background: genuine transparent alpha. No background color, no white matte, no checkerboard painted into image. No road, no base tile, no sidewalk slab, no plinth, no display stand, no ground grid. No people, no vehicles, no labels, no text, no letters, no watermark. Roof must be dark integrated structure, no white lid. Do not add dimensional annotations or construction guides.
```

调用：`transparent_background=true`，未传图片输入。

### 消防局首轮

```text
Use case: stylized-concept
Asset type: one isolated transparent PNG game building sprite for CodeYears, candidate fire station B.
Primary request: Create a refined low-rise municipal fire station, warm deep red brick, based on the warm detailed miniature-building style of the upper-right fire station in the viewed neighborhood-services reference. Full entire building, independent single asset, no other building. Two clearly recognizable broad garage doors plus a compact office wing with pedestrian entry, dark red framing, restrained pale-stone trim only along openings; charcoal continuous integrated flat roof. A small abstract fire-service shield emblem with NO lettering is allowed. Fine restrained masonry detail, crisp readable silhouettes at small game scale. Building footprint exactly W=2, D=1, height class H1; no tall tower. Calm polished illustrated architecture with believable materials. Do not put fire engines outside.
CRITICAL CAMERA / GEOMETRY: strict orthographic 2:1 dimetric game projection, not photographic perspective. Coordinate model P(W,D,H)=(48*(W-D),24*(W+D)-48*H). Both ground axes have exact symmetric image slopes +0.5 and -0.5, angles +26.565 degrees / -26.565 degrees; every vertical is image-vertical. Every corresponding roof, wall lintel, sill and ground-contact straight edge follows those axes. W edge extends down-right and is exactly twice the length of D edge extending down-left. Main footprint suggested image corners on a 1024 square: rear O=(380,490), right W=(828,714), near W+D=(604,826), left D=(156,602); rooftop is these four corners shifted straight upward by 224 pixels. These are construction coordinates, DO NOT DRAW marks. Keep footprint accurately rectangular in that projection. Long front wall from left D to near W+D slopes down-right; short right wall from right W to near W+D slopes down-left. Garage doors on the long front wall, office at its left end. No converging lines, no unequal-axis angle cheat, no shallow-angle reference camera.
Composition: same logical 2x1 size and H1 height as a matching police station, centered with comfortable transparent margins; complete visible structure and contact shadow. Fixed soft light from upper-left, subtle dark contact shadow close underneath, very little cast shadow.
Background: genuine transparent alpha. No background color, no white matte, no checkerboard painted into image. No road, no base tile, no sidewalk slab, no plinth, no display stand, no ground grid. No people, no external vehicles, no labels, no text, no letters, no watermark. Roof must be charcoal, integral with building, NOT a white cap or pale lid. Do not add dimensional annotations or construction guides.
```

调用：`transparent_background=true`，未传图片输入。

### 警局唯一一次投影修正

```text
Use case: precise-object-edit. Edit target Image 1: preserve its exact building identity, materials, civic purpose, small details, dark integrated roof, entrance/door arrangement and restrained shield with no letters. Image 2 is a GEOMETRY reference only, never a backdrop. Correct ONLY the projection/camera and footprint proportions to the 2x1 box in Image 2. Current target is wrong: long roof lines are about +20 degrees, short lines about -25 degrees. Required BOTH sets are symmetric +26.565 degrees and -26.565 degrees, slopes +0.5/-0.5, strict orthographic 2:1 dimetric. Tilt long roof edges noticeably steeper from +20 to +26.565. W down-right length is exactly twice D down-left length. All vertical edges are perfectly vertical; parallel edges cannot converge. Suggested outer roof vertices on 1536x1024: rear(600,100), right(1240,420), near(920,580), left(280,260). Body ground is these four points shifted straight down 320 pixels, H1. Fit entire building comfortably within transparent frame. Physical geometry must follow that box, not merely resemble the old camera. Do not draw the box, guide, labels, arrows or numbers. Single building, no plate, no road, no grid, no people, no external vehicles, no white roof cap. Preserve actual transparent alpha, remove any broad glow; only a tight subdued contact shadow underneath. Fixed upper-left lighting. Output one clean independent sprite.
This target is police A: keep blue-gray and pale limestone, central blue pedestrian entrance, police shield, no lettering.
```

调用：`transparent_background=true`；`referenced_image_paths` 依次为警局首轮原文件、临时 projection-guide.png。

### 消防局唯一一次投影修正

```text
Use case: precise-object-edit. Edit target Image 1: preserve its exact building identity, materials, civic purpose, small details, dark integrated roof, entrance/door arrangement and restrained shield with no letters. Image 2 is a GEOMETRY reference only, never a backdrop. Correct ONLY the projection/camera and footprint proportions to the 2x1 box in Image 2. Current target is wrong: long roof lines are about +20 degrees, short lines about -25 degrees. Required BOTH sets are symmetric +26.565 degrees and -26.565 degrees, slopes +0.5/-0.5, strict orthographic 2:1 dimetric. Tilt long roof edges noticeably steeper from +20 to +26.565. W down-right length is exactly twice D down-left length. All vertical edges are perfectly vertical; parallel edges cannot converge. Suggested outer roof vertices on 1536x1024: rear(600,100), right(1240,420), near(920,580), left(280,260). Body ground is these four points shifted straight down 320 pixels, H1. Fit entire building comfortably within transparent frame. Physical geometry must follow that box, not merely resemble the old camera. Do not draw the box, guide, labels, arrows or numbers. Single building, no plate, no road, no grid, no people, no external vehicles, no white roof cap. Preserve actual transparent alpha, remove any broad glow; only a tight subdued contact shadow underneath. Fixed upper-left lighting. Output one clean independent sprite.
This target is fire B: keep warm deep red brick, two garage doors and office entrance, dark charcoal integrated roof; no lettering, no white lid.
```

调用：`transparent_background=true`；`referenced_image_paths` 依次为消防局首轮原文件、临时 projection-guide.png。
