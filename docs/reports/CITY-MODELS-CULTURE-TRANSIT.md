# 公共文化与站房模型交付报告

## 结果与边界

首批六类均已实际生成、分离、标定并烘焙为透明候选 PNG：公交站房、博物馆、小剧院/音乐厅、社区体育馆、市场大厅、钟楼文化馆。六款不是旧图变色、拉伸或重命名；全部来自内置 imagegen 的同一原始图集，原始来源、精确提示、校准和运行规格均提交。只交付素材包和正式 Canvas 的独立预览，未改正式选型、catalog、布局、CityView、扩展入口、依赖、数据、缓存或 manifest，未合入、未发布。

基线已正常 fetch 指定分支并核对 HEAD=`65a643073601c556013cd96f37d1fb8d23ed274e`。默认 fetch 只有 main，第一次建分支提示无法读取该 tree；显式 `git fetch origin codex/city-organic-layout-prototype` 后成功从该 SHA 建立功能分支，没有回退旧 main。任务所列 `docs/CITY_UNIT_SPEC.md` 不存在，实际规范在 `docs/design/CITY_UNIT_SPEC.md`，已读 AGENTS、云端规范、性能规范及实际单元规范，并检查 source-assets、baked-catalog、building-style 与 CityView。

内置能力已实际调用成功，没有新增、索要或扫描 API key，没有收费 API。备用透明修订图的分块终端写入曾被自动审批判定为证书数据而拒绝，没有重试；首张原始图集通过另一条路径完整保存、核验后用于本包。备用修订与两次单体探索均不作为交付模型。

## 素材与成本

| 模型 | 占地 | PNG像素 | PNG bytes | 基础RGBA bytes | 实际H | 每侧W/D退让 |
| --- | --- | --- | --- | --- | --- | --- |
| `ct-bus-station` · 小型公交站房 | 1×2 | 282×384 | 170,055 | 433,152 | 1.200 | 0.336 / 0.157 |
| `ct-museum` · 博物馆 | 2×2 | 253×384 | 187,859 | 388,608 | 1.400 | 0.659 / 0.281 |
| `ct-music-hall` · 小剧院 / 音乐厅 | 1×2 | 254×384 | 207,463 | 390,144 | 1.211 | 0.100 / 0.549 |
| `ct-community-gym` · 社区体育馆 | 1×2 | 277×384 | 214,414 | 425,472 | 1.400 | 0.151 / 0.464 |
| `ct-market-hall` · 市场大厅 | 2×1 | 242×384 | 174,019 | 371,712 | 0.827 | 0.752 / 0.100 |
| `ct-clock-culture` · 钟楼文化馆 | 1×1 | 152×384 | 87,938 | 233,472 | 2.000 | 0.244 / 0.188 |

运行候选总计1,041,748 bytes；基础RGBA算术量2,242,560 bytes，另有Canvas/解码/预滤波开销，不是实际内存、显存或FPS证据。原始图集1536×1024，独立设计输入四款512×512、剧院512×490、钟楼512×534；运行图全部长边384。每张外侧2像素alpha最大值0；原始PNG的alpha范围0..254，透明背景保留了RGB，不以查看器的透明像素RGB判失败。首次网格均分会将钟楼尖顶混入剧院下方，已改第三列y=490分离，重新烘焙后剧院没有相邻模型污染、钟楼尖顶完整。

原素材盘点：terminal-b/stadium-a/wonder-theater均已有精绘与运行图，都是3×3，不能本轮缩小改名；hall只有1254×1254旧PNG、无正式baked条目。未复制这些共用源图，不将其算新图。实际新增6、旧图复用候选0、待生成目标类型0。周边正式建筑仅按需载入现有runtime。

## 直接验证

Linux云端，Node v24.19.0、npm11.9.0、Chromium154.0.8037.57无登录headless，Pillow12.3.0。九组主检查窗口1440×1100 CSS，城市Canvas1375×640 CSS，DPR1.5，实际2063×960 device像素（取整）。使用正式createCityView的排序、预滤波、剔除和最大倍率；纯色/网格地面便于检查候选，不验证正式道路或organic地面。

合成规则：UTC从2006-01-01起连续1/3/20个公历年，每天count=`[3,12,32][floor(i/84)%3]`。不调用真实数据、缓存或登录。不是此前7301日ISO日期窗口输入，不能比较成日期丢失。只对既有合法地块选择相同占地候选，保留factor=1及原parcel；额外6个审美陈列不绑定日期。

| 年数 | 输入日数 | 输入合计 | 地块合计 | 地块数 | 唯一日期 | 每地块count正确 / 替换前后映射相同 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 365 | 4548 | 4548 | 178 | 365 | 是 / 是 |
| 3 | 1096 | 16092 | 16092 | 524 | 1096 | 是 / 是 |
| 20 | 7305 | 114396 | 114396 | 3458 | 7305 | 是 / 是 |

每个日期索引恰覆盖一次；每个融合地块的count等于其成员输入之和，日期成员、数量和占地签名在替换前后相同。全景/150%/最大倍率只draw，不重新选型或合并，九组均通过。

最大倍率分别为11.251948 / 13.340260 / 26.976623，保留正式公式 `max(5,192/fitScale)`，不是新增统一倍率。

公交站房含透明边的实际显示尺寸：

| 年数 | 倍率 | 实际CSS / device像素 |
| --- | --- | --- |
| 1 | 1 | 18.3×25.0 CSS / 27.5×37.5 device px |
| 1 | 1.5 | 27.5×37.5 CSS / 41.3×56.2 device px |
| 1 | max | 206.4×281.1 CSS / 309.7×421.7 device px |
| 3 | 1 | 15.5×21.1 CSS / 23.2×31.6 device px |
| 3 | 1.5 | 23.2×31.6 CSS / 34.8×47.4 device px |
| 3 | max | 206.4×281.1 CSS / 309.7×421.7 device px |
| 20 | 1 | 7.7×10.4 CSS / 11.5×15.6 device px |
| 20 | 1.5 | 11.5×15.6 CSS / 17.2×23.4 device px |
| 20 | max | 206.4×281.1 CSS / 309.7×421.7 device px |

其他五款在当前最大倍率的真实显示尺寸如下；1/3/20年均收敛至192 CSS像素/逻辑格，DPR1.5：

```text
ct-bus-station: PNG 282×384; 当前显示 206.4×281.1 CSS / 309.7×421.7 device px
ct-museum: PNG 253×384; 当前显示 212.3×322.2 CSS / 318.4×483.3 device px
ct-music-hall: PNG 254×384; 当前显示 171.0×258.5 CSS / 256.5×387.7 device px
ct-community-gym: PNG 277×384; 当前显示 180.1×249.6 CSS / 270.1×374.5 device px
ct-market-hall: PNG 242×384; 当前显示 132.7×210.5 CSS / 199.0×315.8 device px
ct-clock-culture: PNG 152×384; 当前显示 114.3×288.7 CSS / 171.4×433.1 device px
```

全景小窗格只能保留轮廓；最大倍率下博物馆设备高度约483px，超过384原生高，插值不能增加细节。正式逐级预滤波用于缩小，不提高原始图上限、最大倍率或DPR。单纯PNG压缩字节减少不证明性能改善。

通过网格和明暗底的正式Canvas直接检查：主要地面边斜率计算±0.5（浮点误差约1e-16），竖边保持竖直；地面包络居中，退让最小约0.1格；整体屋顶/尖顶未裁切、外侧透明边没有实心白框，暖光来自上左。密集排布仍由正式groundY排序，建筑与花槽在前后关系中呈现。局部花槽和弧形屋顶不全部作为精确主轴；人工包络约±8px，主边端点约±5px，隐藏后角是推断，不声称完整物理矩形已恢复。剧院/市场低于目标H是占地限制的正式结果，不拉高楼体补偿。纯色地面不构成正式道路贴合验收。

## 可复现命令与入口

```sh
npm ci
npm run check
npx tsc --noEmit -p probes/city-models-culture-transit/tsconfig.json
npm run build -- --outDir /tmp/culture-transit-build
npx vite build --config probes/city-models-culture-transit/vite.config.ts --outDir /tmp/culture-transit-probe-build
# 开发预览，浏览器打开 http://127.0.0.1:4187/
npx vite --config probes/city-models-culture-transit/vite.config.ts
# 停止预览后，已安装Chromium时可重烘焙
node probes/city-models-culture-transit/bake.mjs
```

上述命令均实际通过；交付的bake.mjs也已独立实跑并生成相同候选。正式构建landscape95.76kB/gzip29.50kB；未改正式JS路径。构建脚本会复制public，因此候选目录仍会出现在临时正式构建里（约1.04MB），但无正式catalog引用、无正式按需加载请求；设计源图在docs，未进入运行目录。后续决定映射时须评估候选是否保留、进入正式运行包或迁移，不将“未启用”描述为构建零成本。预览build不自动复制整个public，明早使用上述开发命令。

直接检查用临时Node CDP调用 `Emulation.setDeviceMetricsOverride`、`Page.navigate`、`Runtime.evaluate`、`Page.captureScreenshot`：页面暴露 `window.cultureAudit`（守恒）和 `window.cultureView`（实际viewport、倍率、标定结果），切换控件后读取上述对象及页面尺寸表即可复核。九组截图、日志、CDP脚本、生成输入、浏览器profile和构建均在/tmp，报告后清理，不提交，也不补写单元测试。

## 2026-11-07早上待验收

先全景判断六种轮廓是否与旧精绘匹配，再150%看成组关系，最大倍率定位逐栋检查投影、入口落地、透明边和装饰细节；对照新图较狭长的 museum/clock 与低矮market/music-hall判断是否接受。造型、真实Mac GPU、GitHub真实会话、硬件帧耗时/内存/功耗、正式映射比例与正式organic场景尚未验收；云端功能结果不替代这些结论。无交通动画、道路、河流大桥扩展，PR不得自动合入。
