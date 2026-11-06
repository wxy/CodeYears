# 城市精绘交通设施 v1

正式 City 的交通设施沿用建筑的透明 PNG 加载、近远预滤波、视口剔除与深度排序。本目录中的 PNG 是正式美术输入，不是测试截图；运行素材在 `public/assets/city-runtime/transport-*.png`，空间元数据在 `src/renderers/city-baked-catalog.json`。素材按需加载，车辆仍为静态布置，没有增加交通动画。

## 素材与模式

2026-11-06 使用 Codex 内置 imagegen 生成/编辑；未使用 API key、独立 API 或外部素材站。风格参照项目既有 `villa-hip.png` 和 `office-h3-a.png` 建筑：固定 2:1 等距视角、左上暖光、写实微缩精绘、透明底。

- `v1/vehicles.png`：1254×1254，4×4，列为蓝色轿车、酒红 SUV、象牙厢车、琥珀巴士；行依次为世界 +X、+Z、−X、−Z。运行图16张。
- `v1/signals.png`：1254×1254，2×2，前三格为 X 向单臂、Z 向单臂和双臂灯。第四格保留源图但不使用。运行图3张。
- `v1/bridge.png`：1774×887，世界 Z 向两车道石拱桥，铁栏杆、石质人行道、四盏桥灯及双黄线。运行图1张。桥面两端按黄线中点标定；仿射转换保留竖直构件方向，使桥轴与正式投影一致。

## 生成与编辑提示词

以下记录本次采用的提示词规格；不承诺再次生成逐像素相同的结果。

**车辆，生成**：Create a transparent 4 by 4 atlas of refined hand-painted realistic miniature city vehicles. Fixed 2:1 isometric camera and warm upper-left light matching the supplied city buildings. Four columns: blue sedan, burgundy SUV, ivory delivery van, amber city bus. Four rows show the same vehicles in world +X facing southeast, +Z facing southwest, -X facing northwest, -Z facing northeast. Clearly painted body panels, window reflections, chrome trim, tires, wheel hubs, headlights and mirrors. Consistent physical scale, isolated cells with generous empty margins. No labels, scenery, bases, outlines, background or halo. True transparent alpha.

**信号灯，生成**：Create a transparent 2 by 2 atlas of elegant realistic miniature urban traffic signals, in the same fixed 2:1 isometric perspective and upper-left light as the city buildings. Refined fluted gunmetal and bronze steel poles, curved brackets, bolted bases, three-lens housings with rain hoods, individual red amber green lenses and pale reflective bands. Top left single arm toward southeast with green light, top right single arm toward southwest with red light, bottom left dual red and green heads, bottom right reverse dual heads. Carefully painted metal and glass. No pavement, scenery, text, background or bloom. True transparency.

**信号灯，编辑**：Preserve the original poles, shapes, lamps, fine metal details and arrangement exactly. Remove the pale aura, bloom, broad shadows and all background around each silhouette. Produce clean true-alpha cutouts, including spaces between arms and poles; no opaque white or gray background.

**桥梁，生成**：Create a refined hand-painted miniature limestone arch automobile bridge, isolated on transparent background, matching the existing city buildings. Fixed 2:1 isometric camera, world-Z northeast to southwest orientation, warm upper-left light. Logical footprint four units long and 1.2 units wide with a 0.8-unit two-way asphalt carriageway, double yellow center line, limestone sidewalks, wrought-iron railings, four small brass lamps, masonry arch and detailed abutments. Both road ends flat and flush for connection to streets. No water, landscape, vehicles, buildings, text, scenery or background.

**桥梁，编辑**：Clean all halo and background into true alpha while retaining fine railings, masonry and lamps. Then correct the overly slender bridge: widen the asphalt carriageway by about sixty percent and the whole bridge by about twenty percent, keeping its length, two-lane design, arch, material, orientation and transparent silhouette.

## 可重复烘焙

标定参数集中在 `v1/calibration.json`。保留源 PNG，不直接覆盖；低于32的 alpha 清零后裁切/缩放，车辆最长内容边最多256像素、信号灯384、桥768，透明边另留2像素。桥体以两个道路端点和横向坡度校正投影。PNG 导出后重新解码，RGBA 必须逐字节一致，否则停止。

在具有 `@napi-rs/canvas` 的本机环境执行，输出写入系统任务临时目录；该库仅用于素材制作，不增加扩展或项目运行依赖：

```sh
node scripts/bake-city-transport.mjs \
  --outDir "$TMPDIR/codeyears-transport/baked" \
  --canvasModule /absolute/path/to/@napi-rs/canvas/index.js
```

检查生成的 `report.json` 和实际 PNG 后，将20张运行图和 `catalog.json` 分别复制到上述正式路径。报告记录环境/命令/结论，临时导出与画面检查文件在完成后删除。源图、标定和正式运行图保留。
