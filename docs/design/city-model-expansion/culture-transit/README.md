# 公共文化与小型站房候选包

六款实际新绘 PNG，2026-11-07 早上用于审查，**未接入正式选型或运行 catalog**。候选目录与公共服务任务的学校、图书馆、消防等分开。公共建筑仅表示外观，不能据此推断 GitHub 项目类型。

精确基线：`65a643073601c556013cd96f37d1fb8d23ed274e`；功能分支 `codex/cloud-city-culture-transit-models`；PR base `codex/city-organic-layout-prototype`。正式规范实际位于 `docs/design/CITY_UNIT_SPEC.md`。

## 明早验收入口

```sh
npm ci
npx vite --config probes/city-models-culture-transit/vite.config.ts
# 打开 http://127.0.0.1:4187/
```

选择 1 / 3 / 20 年，分别切换全景、150%、当前最大倍率；再用“定位”逐栋查看六款陈列。拖动平移、“明暗底”和“落地网格”用于检查透明边与包络。六款陈列不属于日期；密集替换仅是素材压力排布，不是正式公共建筑出现比例。页面直接导入正式 `createCityView` / `planCityScene`，保留其深度排序、按需图片加载、逐级预滤波、视口剔除、最大倍率和 DPR 1.5 上限；地面用独立纯色网格，以便检查边缘，不新增交通或道路算法。正式 organic 城市与扩展入口未接入。

## 实际新绘清单

| 模型 | 占地 | 运行 PNG 像素 | PNG bytes | 基础 RGBA bytes | 实际参考 H | 每侧 W / D 退让格 |
| --- | --- | --- | --- | --- | --- | --- |
| `ct-bus-station` · 小型公交站房 | 1×2 | 282×384 | 170,055 | 433,152 | 1.200 | 0.336 / 0.157 |
| `ct-museum` · 博物馆 | 2×2 | 253×384 | 187,859 | 388,608 | 1.400 | 0.659 / 0.281 |
| `ct-music-hall` · 小剧院 / 音乐厅 | 1×2 | 254×384 | 207,463 | 390,144 | 1.211 | 0.100 / 0.549 |
| `ct-community-gym` · 社区体育馆 | 1×2 | 277×384 | 214,414 | 425,472 | 1.400 | 0.151 / 0.464 |
| `ct-market-hall` · 市场大厅 | 2×1 | 242×384 | 174,019 | 371,712 | 0.827 | 0.752 / 0.100 |
| `ct-clock-culture` · 钟楼文化馆 | 1×1 | 152×384 | 87,938 | 233,472 | 2.000 | 0.244 / 0.188 |

六款合计 **1,041,748 bytes PNG / 2,242,560 bytes 基础 RGBA 像素**。RGBA 是宽×高×4的算术量，不是浏览器内存实测；Canvas、解码中间量和逐级预滤波另有开销。每张长边 384（含透明边），外侧两像素 alpha 均为 0；没有提高最大倍率、DPR 或资源上限。全景小图主要表达轮廓，最大倍率的设备采样可能超过原生像素，不能凭插值恢复门窗细节。

## 来源、标定与再烘焙

- `sources/atlas-original.png`：内置 imagegen 实际返回的 1536×1024 RGBA 原始图集。提示和来源链见 `GENERATION.json`，没有外部游戏素材或新增 API key。
- `sources/ct-*.png`：独立设计输入，常规 512×512；剧院 512×490、钟楼 512×534，分离线避开跨行钟楼尖顶。透明像素有保留的 RGB；以 alpha 为准，不能把图片查看器的 RGB 背景当不透明。
- `calibration.json`：人工选择的可见地面包络 L/F/R、主边和竖向参考，标注误差及隐藏后角推断。`calibration-results.json` 是正式 `calibrate` 的实际结果。双轴映射为 ±0.5，竖边保持竖直，每边至少约 0.1 格退让；目标高度是上限，不能通过拉高填满占地。
- `catalog.json` 与 `public/assets/city-candidates-culture-transit/` 一一对应，只由本预览显式使用；不写正式 catalog。`specifications.json` 保留真实像素、字节、alpha 边和 SHA256。

关闭 4187 预览后，可用已安装的 Chromium（Linux 云端已实跑；其他平台用 `CHROMIUM_BIN` 指向本机浏览器）：

```sh
node probes/city-models-culture-transit/bake.mjs
npx tsc --noEmit -p probes/city-models-culture-transit/tsconfig.json
```

烘焙器使用正式 `loadUnit` / `calibrate` / `drawUnit`，尺寸公式与 `city-source-assets.ts` 相同，源输入先限制在768范围，一次烘焙并关闭源位图；运行预览只解码384以内候选。CLI会更新本任务 PNG、catalog 和标定结果，需同步核对 `specifications.json`。

## 原有素材盘点与未完成验收

| 原素材 | 发现 | 本轮处理 |
| --- | --- | --- |
| `terminal-b` | 已有精绘源与384×245运行图，3×3，172,254 bytes | 不缩小冒充新站房；不复制、不修改 |
| `stadium-a` | 已有精绘源与384×220运行图，3×3，159,794 bytes | 不把巨型露天场改名为社区馆 |
| `wonder-theater` | 已有精绘源与384×300运行图，3×3，200,852 bytes | 不缩小冒充新剧院 |
| `hall` | `public/assets/city/hall.png`，1254×1254，1,347,034 bytes；无正式 baked catalog 条目或现用标定 | 只记录旧图，不冒充新增或复制到候选 |

**实际新增6 / 计为新增的旧图0 / 本轮复用候选0 / 尚未生成的目标类型0。** 正式城市里周边普通建筑仍复用现有运行 PNG。两次站房单体探索和一次透明修订未选入本包，不计新模型。

造型仍待用户接受；特别检查标定后博物馆和钟楼的狭长比例、剧院和市场受占地限制后的较低实际参考高度、栏柱与花槽的局部方向、图集源图中的微小装饰细节。可见主边合规不等于证明每条屋顶装饰线和隐藏角点精确。未做正式映射比例、真实登录、Mac GPU、FPS/功耗/显存预算或商店发布验收。完整结果与复现命令见 `docs/reports/CITY-MODELS-CULTURE-TRANSIT.md`。
