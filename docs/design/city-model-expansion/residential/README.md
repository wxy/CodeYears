# 住宅候选包 · 2026-11-07 审查入口

八款内置 imagegen 新造型，全部是独立候选，尚未接入正式地图生成。无旧图变色、拉伸或重命名计数，无外部游戏素材。既有 `low-gable.png` 仅作精绘风格参考。正式 `calibrate` 的投影方向校正不等同新造型创作：校正前后源图均可追溯。

在仓库根目录：

```sh
npm ci
npx vite --config probes/city-models-residential/vite.config.ts
```

打开 http://127.0.0.1:4193/ 。选择1、3、20年，依次全景、150%、当前最大倍率；拖动平移、滚轮缩放。下方八张透明单图带固定192 CSS px/格的地面轮廓。正式 `createCityView` 保持原深度排序、预滤波、倍率和DPR上限；只在此入口按相同band/W/D替换地块贴图，factor固定1。

| ID | 造型 | 占地 | band / 主墙参考高度 |
| --- | --- | --- | --- |
| res-mono-limestone | 石材斜顶、凹入门廊平房 | 1×1 | 0 / 0.3 |
| res-vault-brick | 砖砌拱顶、圆形高窗小住宅 | 1×1 | 0 / 0.3 |
| res-mansard-stucco | 抹灰孟莎顶、双老虎窗住宅 | 1×1 | 1 / 0.8 |
| res-sawtooth-duplex | 深砖双户、锯齿采光屋顶 | 1×1 | 1 / 0.8 |
| res-grocer-wide | 横向长墙、拱窗绿篷杂货店 | 2×1 | 1 / 0.8 |
| res-bakery-deep | 纵向长墙、转角入口红篷面包店 | 1×2 | 1 / 0.8 |
| res-terracotta-apartment | 赤陶四层、凹入阳台四坡顶公寓 | 1×1 | 2 / 2 |
| res-limestone-bay | 浅石四层、弧形凸窗露台公寓 | 1×1 | 2 / 2 |

`models.json` 是候选语义/档位清单；`calibration.json` 是原始可见支撑边、墙高参考和源总板裁切追溯；`catalog.json` 是正式 CitySprite 空间元数据。文件名与独立运行PNG一一对应。`sources/units/` 是原像素分离的单款设计输入；总板与不合格背景修订保留作来源，运行预览仅加载小PNG，不加载设计原稿。

人工可见角点误差约±4px、墙高约±8px，隐藏角点外推。地面包络中心定位、四周退让至少0.1格；实际最小约0.201格。主轴校正后±0.5，竖直线保持竖直，左上暖光。局部装饰、弧面和手绘边不能当精确几何量尺；最终造型、落点和风格须本机审查。

重烘焙与浏览器直接路径复核（复用环境现有 Playwright，不新增项目依赖；先运行上述Vite）：

```sh
audit_tmp=$(mktemp -d /tmp/codeyears-residential-review.XXXXXX)
PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright-core node probes/city-models-residential/inspect.mjs --outDir "$audit_tmp" --bake
PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright-core node probes/city-models-residential/inspect.mjs --outDir "$audit_tmp"
# 审查截图/JSON后清除，禁止提交
rm -rf "$audit_tmp"
```

其他机器可将 `PLAYWRIGHT_MODULE` / `CHROMIUM_PATH` 指向已安装的对应工具，或在预览控制台读取 `residentialProbe.snapshot()`。`--bake` 只改本任务候选PNG/catalog，不写正式运行库。生成来源见 PROMPTS.md，实际规格、采样限制与验证见任务报告。
