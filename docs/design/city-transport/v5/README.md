# 外环和出城公路梁桥

2026-11-21 使用内置 ImageGen 根据文字制作。原画提供金属栏杆、浅色石缘、钢梁、混凝土桥墩和沥青质感。

| 文件 | 规格 | 字节 | SHA-256 |
| --- | --- | ---: | --- |
| `arterial-bridge-source.png` | 1774 × 887，原画 RGBA PNG | 1,742,198 | `c1c3457258ba6ba05f4f43355b9c92049568a1ca8b3e1a0eed433455e2544f8e` |
| `public/assets/city-runtime/transport-bridge-arterial.png` | 1440 × 1155，标定图集 PNG | 856,761 | `fd99ad00830d41ddd006c75e2477f42134b550ceec50ee3935755fcb8684afe8` |

沿两侧真实台缘校正原画。由近端到远端，远侧取 `(43,682) → (1502,68)`，近侧取 `(267,784) → (1682,184)`。按纵向位置取样，并沿每列以台缘为纵坐标零点分别抽出栏杆和梁侧。两格各高 464 像素，台缘在格内第 112 像素。裁去近侧台缘以上的沥青色，保留栏杆间的空隙。独立桥墩取近侧校正后第 528 列起的 390 列，从台缘向下 125 像素起取 227 行。沥青灰度从原画 `(980,313)` 起取 96 × 96 像素，以 128 为中性。沥青和桥墩依次放在图集底行。运行标定见 `src/renderers/city-bridge-levels.json`。

四车道及八车道沿道路两侧和中心实测岸线定跨，分别把两个栏杆位图定位到车行面边缘。另一条地图轴使用水平镜像，岸线改变跨长时栏柱仍保持竖直。沥青纹理沿用公路的车道线，窄溪用单跨，足够宽的水段独立放中墩。

```text
Use case: stylized-concept. Asset type: production transparent isometric modern road bridge artwork for an original miniature contribution city. One isolated, straight concrete and steel highway girder bridge with precise orthographic 2:1 isometric projection. The straight road axis climbs on the screen from the close lower left end to the far upper right end at slope -0.5 in screen pixels, and the transverse end edges have slope +0.5. Only the bridge, tightly but fully framed, landscape aspect ratio, with comfortable transparent padding. A moderately broad roadway suited for a two-way multi-lane city arterial, bridge deck length about twice its driveable width. Keep the gray asphalt plane completely unmarked: the engine will put all lanes and road markings in. Both square road ends are clean and open to continue into real road segments. On both sides use finely painted warm light gray concrete wheel curbs and continuous low guardrails with distinct narrow posts and two softly weathered metal rails, well separated from the asphalt. A muted gray-green continuous girder on the visible front side and a short broad concrete center pier below, crisp vertical pier sides, small surface texture and rich but restrained highlights. Refined realistic architectural miniatures, matte finish, diffuse upper-left daylight, subdued coordinated warm concrete and desaturated gray-green steel. Single uninterrupted straight span, flat deck, straight parallel rail lines, bilateral geometry, no lamps, cars, signs, road stripes, land, ground slab, water, environment, frame, skyline, labels, or shadows detached from the bridge. Crisp model surfaces, no visible perspective convergence or cinematic view. Genuine transparent background.
```
