# 住宅与商铺候选包验证报告

日期：2026-11-07（Asia/Shanghai）。固定原始基线 `65a643073601c556013cd96f37d1fb8d23ed274e`，分支 `codex/cloud-city-residential-models`，PR base `codex/city-organic-layout-prototype`。本报告对应本PR候选树；最终精确head随PR交付。未合入、未发布。

## 实际交付与边界

实际新增 **8款**：2款1×1平房、2款1×1低层住宅、2×1和1×2商铺各1款、2款1×1中层公寓。完整名称/来源见设计目录 README、PROMPTS、models/calibration/catalog/specifications JSON。全部由内置 imagegen 实际生成，0款用旧图变色/拉伸/改名凑数，0款仅提示词，未完成的新图槽位为0。现有精绘 low-gable 仅为风格参考；已有正式地面/道路/外围/未替换楼宇在预览按需复用，不作为本任务新增模型计数、不复制共用素材。

仅写本任务独占目录和任务/报告。未修改 production building-style、baked-catalog、CityView、布局、数据、缓存、manifest、依赖或锁文件。正式接入尚未进行；模型是可审查候选，**不是最终美术已接受**。

## 像素与成本

| ID | 占地 | 运行PNG尺寸 | 字节 | RGBA解码字节 |
| --- | --- | --- | ---: | ---: |
| res-mono-limestone | 1×1 | 107×171 | 28,606 | 73,188 |
| res-vault-brick | 1×1 | 120×180 | 34,197 | 86,400 |
| res-mansard-stucco | 1×1 | 175×304 | 97,274 | 212,800 |
| res-sawtooth-duplex | 1×1 | 230×384 | 148,716 | 353,280 |
| res-grocer-wide | 2×1 | 283×362 | 155,775 | 409,784 |
| res-bakery-deep | 1×2 | 214×288 | 109,995 | 246,528 |
| res-terracotta-apartment | 1×1 | 192×384 | 137,727 | 294,912 |
| res-limestone-bay | 1×1 | 187×384 | 133,146 | 287,232 |

运行PNG合计 **845,436 bytes / 491,031 pixels / RGBA8 1,964,124 bytes**，均长边≤384（含透明边）。这是像素存储计数，不含解码器、Canvas、浏览器/GPU开销，不是进程内存实测。沿用正式逐级预滤波，八款完整小级链额外163,606像素（654,424 RGBA字节），基图+级链理论2,618,548 RGBA字节，不按摆放座数重复建级链。运行预览只取小图；设计源图全部共10,162,467字节（含原总板、失败背景原稿和无缩放单款裁切），不进入正式扩展发行复制路径。未用PNG文件变小推导性能通过。

设计输入单款约407–820像素长边；正式 loadUnit 上限768不变，分格后再载入，避免总板先缩小。原总板1774×887，商铺原稿1942×810、透明修订1941×810；来源原尺寸保留。透明运行图 alpha 最低0、最高253/254，保持生成稿近不透明墙面；低alpha处理仍为正式loadUnit算法。

## 标定和视觉观察

复用正式 unit-calibration 的 calibrate / loadUnit / drawUnit，bake.ts采用 city-source-assets 同一烘焙公式、2px透明边及384上限。手选可见支撑包络L/F/R、同一竖墙参考，隐角外推；端点约±4px、墙高约±8px。方向校正后W=+0.5、D=-0.5（浮点误差≤2e-16），竖边竖直。平房主墙高度0.3、低层/商铺0.8、公寓2，全数达到既有高度目标，未用高层替代低层或为了占地拉高。包络居中，四边最小退让约0.201格，大于0.1格。该数值基于人工包络，不宣称隐藏物理角点精测。

已实际查看八款透明单图、深色/白色背景、最大倍率密集摆放以及多年全景/150%。可辨识不同屋顶、门窗、体量；未见整块白底、透明边截断或明显白框。正式CityView按groundY排序，前排楼宇自然遮挡后排，落地点随同一地面投影。生成图局部装饰并非精确几何，暖光与窄高公寓最终观感仍留本机接受；两个平房在原0.3高度下体量较小，未擅自扩大。

## 实际CSS / DPR与采样限制

浏览器视口1440×1000；正式场景画布 **1392×600 CSS**，有效DPR **1.5**，实际 **2088×900 device pixels**。另用浏览器DPR2复核，有效值仍1.5。卡片画布固定300×320 CSS、450×480 device（DPR1.5），单位格横向192 CSS；卡片仅标定参考，主场景才使用正式视图。

| 年数 | 全景单位格CSS px | 150%单位格CSS px | 正式最大zoom | 最大单位格CSS px |
| --- | ---: | ---: | ---: | ---: |
| 1 | 16.966 | 25.449 | 11.316667 | 192 |
| 3 | 15.059 | 22.588 | 12.750000 | 192 |
| 20 | 7.160 | 10.740 | 26.816667 | 192 |

最大倍率的整张贴图实际显示尺寸（含透明边）如下；device=CSS×1.5：

| ID | 源PNG px | 最大CSS px | 最大device px |
| --- | --- | --- | --- |
| res-mono-limestone | 107.00×171.00 | 53.50×85.50 | 80.25×128.25 |
| res-vault-brick | 120.00×180.00 | 60.00×90.00 | 90.00×135.00 |
| res-mansard-stucco | 175.00×304.00 | 87.50×152.00 | 131.25×228.00 |
| res-sawtooth-duplex | 230.00×384.00 | 118.43×197.72 | 177.64×296.58 |
| res-grocer-wide | 283.00×362.00 | 141.50×181.00 | 212.25×271.50 |
| res-bakery-deep | 214.00×288.00 | 107.00×144.00 | 160.50×216.00 |
| res-terracotta-apartment | 192.00×384.00 | 138.87×277.74 | 208.30×416.61 |
| res-limestone-bay | 187.00×384.00 | 128.64×264.16 | 192.96×396.24 |

公寓在最大倍率/DPR1.5时，赤陶实际高416.61 device px、浅石396.24，超过384源图：**存在约1.085× / 1.032×放大采样**，不能承诺每个设备像素都有原生细节。仍保持既定384上限和最大倍率，未为此加大资源。全景则继续正式预滤波，小窗格在7–17 CSS px/格下无法阅读是采样限制。

## 验证结果

环境 Node v24.19.0、npm锁文件安装；Chromium 154.0.8037.57，ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)。未登录GitHub，无真实用户数据。

| ISO年份窗口 | 天数/唯一映射日期 | 输入/映射合计 | 候选摆放座数 |
| --- | ---: | ---: | ---: |
| 2025–2025 | 364 / 364 | 1843 / 1843 | 277 |
| 2023–2025 | 1092 / 1092 | 5571 / 5571 | 842 |
| 2006–2025 | 7301 / 7301 | 37313 / 37313 | 5650 |

以上每组均核对全景/150%/最大倍率，共9组：地块原x/z/w/d、band、成员indices和count签名在替换前后完全相同；日期全覆盖、无重复、数量守恒。每个模型在各年数样本均实际摆放，不以只加载素材代替使用。已验证关闭后DOM canvas=0，重开正常，页面JS错误0。预览按需绘制，不增加持续RAF；未做硬件内存/帧率/功耗预算。

执行通过：npm ci；npm run check；npm run build -- --outDir /tmp/codeyears-residential/dist；独立main/bake显式tsc检查；vite独立预览临时构建；inspect.mjs九组浏览器直接路径。首次诊断发现遗漏正式外围图片，已只在预览中补充按需加载后重跑通过；初次总板缩小细节问题已改为原像素分格后重烘焙。

可复现命令（在仓库根目录，Vite另一个终端保持运行）：

```sh
npm ci
npm run check
task_tmp=$(mktemp -d /tmp/codeyears-residential-review.XXXXXX)
npm run build -- --outDir "$task_tmp/dist"
npx tsc --ignoreConfig --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --resolveJsonModule --strict --skipLibCheck --types vite/client probes/city-models-residential/main.ts probes/city-models-residential/bake.ts
npx vite --config probes/city-models-residential/vite.config.ts
# 第二个终端：
PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright-core node probes/city-models-residential/inspect.mjs --outDir "$task_tmp/audit"
# 上述变量需在第二终端设置同一临时路径；检查截图/JSON后清理
rm -rf "$task_tmp"
```

长期保留报告/源图/运行候选/标定；本轮截图、输入、日志和构建均置系统临时目录，报告形成后清除，不入Git。未在实现后补单元测试。

## 本机审查与未完成项

启动 `npx vite --config probes/city-models-residential/vite.config.ts`，打开 http://127.0.0.1:4187/。先看八款卡片的地面包络与窄高比例，再逐项检查1/3/20年全景、150%、最大倍率；20年初始中心可能落在五年景观带，拖动至住宅密集区检查遮挡。

尚未完成：真实用户GitHub登录/MV3路径、Mac GPU/真实显示器、完整性能预算、用户最终美术接受与正式catalog选型接入。本PR不承接或依赖公共服务/交通文体任务，也未复制其素材。公共建筑含义、数据身份、缓存和原始贡献类型不变。候选商铺只描述外观，不推断真实贡献项目类型。
