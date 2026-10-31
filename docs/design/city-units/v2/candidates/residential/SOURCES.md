# 低层住宅 / 商住楼候选来源与实际检查

日期：2026-10-31。状态：**设计候选，未接入运行库，投影与地图尺度未验收。**

## 交付范围

- `townhouse-a.png`：暖红砖联排住宅，深色一体平屋顶、台阶、凸窗，3 层低层造型。
- `mixed-use-b.png`：米灰石材小商住楼，墨绿店面、深色一体平屋顶，同为 3 层低层造型。
- 两款目标均为 1×1 H1；固定左上光、自然精细城市游戏风、无文字、无网格、无展示底座、无白色屋顶盖。
- 内置 `image_gen` 一款一调用，两款调用可并行；均 `transparent_background=true`。未使用 CLI 或 API fallback，未重试。
- PNG 从工具源文件逐字节复制，未裁切、缩放、补边、去底、重编码或几何变形；工具原文件保留。
- 仅增加本目录文件，未改 services、`public/`、运行代码或运行素材清单；本代理未操作 Git 提交或推送，由根会话统一处理。本批后停止生成。

## 参考与公共模板

先通过 `view_image` 查看 `docs/design/city-units/v2/01-small-buildings.png` 第一排：

- 造型板 SHA-256：`9065c1f6a350bf90c48629252941ac025b0e3da685044bf27cff8e7b25d73147`。
- 首排左款的暖砖、入户台阶和凸窗作为 townhouse 造型参考；首排右款的浅石、墨绿店面作为 mixed-use 造型参考。
- 调用未传图片输入，完整提示词描述了已查看的风格参考；未把整张板合成到输出。

几何依据为 `docs/design/city-units/v2/projection-guide.svg`，SHA-256：`b176eee4d9a25c7f3646160236061ca95eeebee33827880e7986095ca6a396e1`。

`P(W,D,H)=(48(W-D),24(W+D)-48H)`；W 向右下 `(+48,+24)`，D 向左下 `(-48,+24)`，H 竖直。地面及平行屋顶边要求对称斜率 `+0.5/-0.5`，即 `±26.565°`，1×1 的 W / D 物理长度应一致；无透视消失点。

两款提示词使用完全相同的 1024 方形画幅构图、1×1 屋顶四角与 384 px 主体高度描述，要求共同实际低层尺度，禁止各自放大填框。**工具实际输出为 1254×1254，未按提示中的 1024 尺寸输出，且投影不一致；因此这些意图不能当作最终已满足的尺寸事实。**

## 文件与来源

| 文件 | 工具原文件 | SHA-256 |
| --- | --- | --- |
| `townhouse-a.png` | `/Users/xingyuwang/.codex/generated_images/01a19207-eb92-7472-ab29-ec432850c74e/exec-2b0031be-9e32-427c-96e8-1fe3f38b50ab.png` | `a093c4b5a6c9b336c8f790ddff6fdfeb5f5b84c7d6315cc7346d5c3b1532c16a` |
| `mixed-use-b.png` | `/Users/xingyuwang/.codex/generated_images/01a19207-eb92-7472-ab29-ec432850c74e/exec-8b2c02b0-3eaa-4567-a79e-894d481fcff2.png` | `750736a8bdf1739719df9506b9e54e837e2ab0070994f49df2546db68518e17e` |

复制后已重新计算哈希并与工具原文件相等。

## 实际检查

用 Pillow 只读检查，未写回图片。bbox 均为原图像素坐标，采用半开区间。

### 尺寸与透明边缘

| 文件 | 尺寸 / 模式 | alpha 极值 | alpha=0 像素 | alpha>0 bbox | alpha>128 bbox |
| --- | --- | --- | --- | --- | --- |
| `townhouse-a.png` | 1254×1254 / RGBA | 0–255 | 830937 | (41,37,1168,1230) | (225,91,1061,1170) |
| `mixed-use-b.png` | 1254×1254 / RGBA | 0–255 | 861744 | (0,88,1250,1254) | (216,105,1037,1159) |

| 文件 | alpha 1–8 像素 | alpha 9–128 像素 | alpha>128 像素 | 画布边缘非零 alpha 样本 / 最大值 | alpha>8 bbox |
| --- | --- | --- | --- | --- | --- |
| townhouse | 18326 | 12459 | 710794 | 0 / 0 | (216,90,1064,1174) |
| mixed-use | 10410 | 4566 | 695796 | 34 / 1 | (215,104,1038,1160) |

结论：

- 存在真实透明 alpha，未绘入白色或棋盘背景，主要建筑轮廓完整可见。
- townhouse 的画布边缘完全透明；mixed-use 在左 / 下画框存在极浅残留，画框最大 alpha 仅为 1，主要主体未被截断。未擅自清理或去底。
- alpha>128 的主边界分别为 836×1079 与 821×1054，住宅相对商住楼宽约多 1.83%、高约多 2.37%。两者在画布中的体量接近，但由于屋顶角度、轴向长度和落点不一致，**此观察不能证明同一地图尺度或同一 1×1 占地**。
- 无白色屋顶盖；浅色仅是住宅烟囱和石材构件。阴影相较公共服务批次紧凑，但极浅边缘残留仍需在正式素材验收时处理。

### 实际投影量测

先目视选取未被烟囱等设备遮挡的后侧屋顶轮廓；每个 x 读取最上方 `alpha>=220` 的 y，最小二乘拟合 `y=m*x+b`，以 `atan(m)` 转成图像角度。W 对应右下向直边，D 对应左下向直边（表中按 x 递增报告，所以 D 为负斜率）。未修改图像。

| 文件 / 轴 | 采样 x 范围 | 首末轮廓点（alpha≥220） | 拟合斜率 | 角度 | 拟合 RMSE |
| --- | --- | --- | --- | --- | --- |
| townhouse W | 880–970 | (880,222) → (970,265) | +0.47331 | +25.329° | 0.303 px |
| townhouse D | 450–630 | (450,236) → (630,186) | −0.28052 | −15.670° | 0.299 px |
| mixed-use W | 720–960 | (720,146) → (960,255) | +0.45294 | +24.368° | 0.338 px |
| mixed-use D | 300–380 | (300,250) → (380,215) | −0.43950 | −23.725° | 0.315 px |

以 alpha 阈值 200 / 240 复核，townhouse W 范围 +25.284° 至 +25.340°，D 范围 −15.698° 至 −15.670°；mixed-use W 范围 +24.350° 至 +24.368°，D 范围 −23.911° 至 −23.725°。阈值差异不会改变未通过结论。

**投影未通过**：两款均未同时符合斜率 ±0.5。townhouse 一轴明显偏平，且轴向体量不符合目标 1×1 的对称关系。mixed-use 较接近对称，但两轴仍都偏平。主要竖边目视接近竖直，未因此认定整体几何合格。

需要四角 / 高度 / 落点标定、几何修正、统一地图缩放，以及在同尺寸地图中比较后才能进入运行素材库。当前保持设计候选，未接入、未验收，本轮不继续重试。

### 可重复的只读检查方法

```python
from PIL import Image
import math
im = Image.open("townhouse-a.png")  # 或 mixed-use-b.png
a = im.getchannel("A")
print(im.size, im.mode, a.getextrema(), a.getbbox())
print(a.point(lambda v: 255 if v > 128 else 0).getbbox())
# x0、x1 按上表；threshold 分别取 200、220、240。
pts = [(x, next(y for y in range(im.height)
                 if a.getpixel((x,y)) >= threshold))
       for x in range(x0,x1+1)]
xm = sum(x for x,y in pts) / len(pts)
ym = sum(y for x,y in pts) / len(pts)
m = sum((x-xm)*(y-ym) for x,y in pts) / sum((x-xm)**2 for x,y in pts)
print(m, math.degrees(math.atan(m)))
```

## 完整提示词

### townhouse-a

```text
Use case: stylized-concept
Asset type: isolated transparent PNG city building sprite, townhouse-a, 1x1 H1.
Primary request: a warm red-brick paired townhouse / tiny rowhouse building, three compact storeys, two closely joined narrow facade bays, dark charcoal integrated flat roof with restrained cornice, slim masonry chimneys, bay window and two small entrance stoops with steps. Pale stone lintels and steps, dark warm-metal railings, cozy amber entry. Architectural identity follows the upper-left townhouse in the viewed small-buildings reference, preserving its warm brick and front stoops, simplified enough to remain readable as a small sprite. No additional buildings.
CRITICAL SHARED GEOMETRY AND SCALE: a 1x1 footprint in strict orthographic 2:1 dimetric city-game projection. W goes down-right (+48,+24); D goes down-left (-48,+24). Ground and roof lines have exactly symmetric slopes +0.5 / -0.5 (angles +/-26.565 degrees). All verticals are perfectly vertical, no vanishing point, no lens perspective. Equal-length W and D sides for this square footprint. Same absolute scale as the matching companion residential sprite: on a square 1024px canvas suggested roof outline O=(512,160), W=(768,288), W+D=(512,416), D=(256,288); ground outline is this diamond shifted down by 384px. These coordinates are invisible construction constraints; DO NOT draw any guides or labels. Both sprites must share this outer massing scale and 3-storey low-rise height class H1; do not zoom each building to fill the frame. Keep full subject comfortably inside transparent margins. Building volume must follow those two angles, including eaves, sills and foundations.
STYLE / LIGHT: refined naturally detailed miniature city-game architecture, crisp material edges and restrained believable fine texture, like the viewed top row of 01-small-buildings; not cartoon plastic, not exaggerated outline, not photographic perspective. Fixed upper-left soft daylight, subtle warm windows. BACKGROUND: true transparent RGBA, all empty space alpha=0, solid building surfaces opaque, no diffuse colored glow or broad haze. Only very compact subdued contact shadow immediately underneath. Full structure visible. NO base tile, no plinth, no sidewalk slab, no road, no ground grid, no text, no readable letters, no labels, no people, no vehicles, no watermark. Dark roof belongs structurally to the building, absolutely no white cap or white floating lid. Minimal planting attached to wall only; no independent tree.
```

调用：内置 `image_gen`，`transparent_background=true`，未传 `referenced_image_paths` 或 `num_last_images_to_include`。

### mixed-use-b

```text
Use case: stylized-concept
Asset type: isolated transparent PNG city building sprite, mixed-use-b, 1x1 H1.
Primary request: a warm beige-gray stone small mixed-use building, three compact storeys matching the townhouse's low-rise height and footprint, ground floor with deep forest-green storefront frames and restrained dark-green awnings, upper floors with elegant simple residential windows, charcoal integrated flat roof and dark green cornice. Clear pedestrian shop entrance, warm amber shop glazing, no signs and no lettering. Architectural identity follows the upper-right mixed-use building in the viewed small-buildings reference: pale stone, forest-green ground floor, fine natural masonry. No additional buildings.
CRITICAL SHARED GEOMETRY AND SCALE: a 1x1 footprint in strict orthographic 2:1 dimetric city-game projection. W goes down-right (+48,+24); D goes down-left (-48,+24). Ground and roof lines have exactly symmetric slopes +0.5 / -0.5 (angles +/-26.565 degrees). All verticals are perfectly vertical, no vanishing point, no lens perspective. Equal-length W and D sides for this square footprint. Same absolute scale as the matching companion residential sprite: on a square 1024px canvas suggested roof outline O=(512,160), W=(768,288), W+D=(512,416), D=(256,288); ground outline is this diamond shifted down by 384px. These coordinates are invisible construction constraints; DO NOT draw any guides or labels. Both sprites must share this outer massing scale and 3-storey low-rise height class H1; do not zoom each building to fill the frame. Keep full subject comfortably inside transparent margins. Building volume must follow those two angles, including eaves, sills and foundations.
STYLE / LIGHT: refined naturally detailed miniature city-game architecture, crisp material edges and restrained believable fine texture, like the viewed top row of 01-small-buildings; not cartoon plastic, not exaggerated outline, not photographic perspective. Fixed upper-left soft daylight, subtle warm windows. BACKGROUND: true transparent RGBA, all empty space alpha=0, solid building surfaces opaque, no diffuse colored glow or broad haze. Only very compact subdued contact shadow immediately underneath. Full structure visible. NO base tile, no plinth, no sidewalk slab, no road, no ground grid, no text, no readable letters, no labels, no people, no vehicles, no watermark. Dark roof belongs structurally to the building, absolutely no white cap or white floating lid. Minimal planting attached to wall only; no independent tree.
```

调用：内置 `image_gen`，`transparent_background=true`，未传 `referenced_image_paths` 或 `num_last_images_to_include`。
