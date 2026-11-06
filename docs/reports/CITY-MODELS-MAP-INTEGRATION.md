# 城市模型云端审查与地图接入

日期：2026-11-07。用户授权检查三项云端成果、合入并加入地图生成。三项素材PR均已审查并合入`codex/city-organic-layout-prototype`，不是main；正式选型通过独立集成PR交付。本机组合继续保留PR #65的680b14e，不自动合入数据/缓存PR，也不发布商店。

## 实际云端成果与审查

| 任务 | PR及审查head | 新图 | 新运行PNG字节 |
| --- | --- | --- | --- |
| 公共服务 | [#66](https://github.com/wxy/CodeYears/pull/66)，7804eada47690b5d968917abc1c1195e1ce63563 | 5 | 819,728 |
| 交通文体 | [#67](https://github.com/wxy/CodeYears/pull/67)，fd89590f2d6439089861dee88cb25cf790279629 | 6 | 1,041,748 |
| 住宅商铺 | [#68](https://github.com/wxy/CodeYears/pull/68)，d0966c6f5a50910538609a9999d15d58dd4bb3a6 | 8 | 845,436 |

住宅任务先前被中断，经用户明确授权续作后完成。三项最终head的City package check均成功；各PR仅新增独占素材/标定/预览/报告，未改正式选型或数据代码。合并使用精确expected head；merge提交依次71723df、1dc5c28、4be2dc0。没有把任务启动、提示词或未完成稿算作模型交付。

共19款实际新图，均为透明RGBA，运行长边≤384像素，合计2,706,912 bytes（约2.58MiB）；基础RGBA像素规格6,473,820 bytes，非实测内存。另启用既有fire-b消防站与police-a警务小站，不重复复制、不计新图。实际查看统一世界比例的落地对照、透明边缘、完整轮廓和后续混排街景；图书馆、诊所、学校、邮局、社区中心、站房、博物馆、剧院、体育馆、市场、钟楼及8款住宅/商铺造型可辨。

## 正式地图行为

- 1–2贡献档增加两款小住宅；3–5档按1×1/2×1/1×2加入两款低层住宅和两款商铺；6–19档单格增加两款公寓。仍使用既定高度和合法占地，不把新H2公寓放大到2×2来额外加高。高层、奇观及既有2×2等比复用规则保留。
- 公共建筑在兼容的低/中层地块中按稳定位置seed稀疏选择，门槛约为符合槽位的1/8；类型只代表外观，不推断真实GitHub项目类别。2×1使用学校/市场/警消，1×2使用图书馆/站房/剧院/体育馆，1×1使用诊所/邮局或钟楼，2×2使用中心/博物馆。实际数量随贡献分布与可合并占地变化，不保证每个用户都出现全部19款。
- 只改变规划时的外观id；日期、count、mean、band、成员、坐标、合并和路网不变。缩放/平移复用同一计划，无随机重抽、动画或持续帧。
- 19张候选PNG逐字节原样复制至正式运行目录，catalog只保留运行元数据；源图与标定接入CITY_UNIT_CATALOG，并在public/assets/city/unit-{id}.png保留生成器输入。源图、候选预览目录不进入发行包。ASSETS.md同步实际来源与96张运行图总数。
- 三套独立预览原本都占4187，本轮改为公共服务4191、交通文体4192、住宅商铺4193，并同步烘焙/诊断入口与README。公共服务预览构建改为显式传入任务临时outDir，且不复制完整public目录；没有增加项目依赖。

## 本机直接验证

执行`npm run check`，三套预览独立tsc，组合生产构建`npm run build -- --outDir <task_tmp>/dist`，公共服务与交通文体预览构建，`git diff --check`，均通过。住宅仅改变服务端口，独立类型检查覆盖；其原云端预览构建结果绑定原head，不冒充本机重跑。

直接渲染检查调用正式planOrganicCity/createOrganicGround/createCityView/loadCityImages，以本机Skia Canvas提供Path2D/DOMMatrix/PNG解码和文件读取适配。1400×900 CSS、DPR1.5，五组输入均绘制全景、150%及正式maxZoom，共15组。使用真实正式PNG、按需id加载；19款最终均在二十年实际地块中选中。前后完整贡献地块签名及roadNetwork JSON逐字节一致，没有为了展示模型另加日期或陈列建筑。

| 输入 | 日期 | 合计=映射 | 新模型实例 | 实际新类型 | 公共建筑（含2款旧图） |
| --- | --- | --- | --- | --- | --- |
| 一年混合 | 364 | 4490 | 70 | 10 | 8 |
| 三年混合 | 1092 | 14456 | 221 | 17 | 30 |
| 二十年混合 | 7301 | 96240 | 1591 | 19 | 277 |
| 三年Q3空档 | 1092 | 13120 | 202 | 17 | 27 |
| 三年未完成 | 942 | 12109 | 197 | 17 | 28 |

生成方法：末年2025，起点isoYearStart(2026-n)，结束isoYearStart(2026)，UTC逐日加86400000；i从0开始，phase=floor(i/7)%12，day=i%7。phase<3取1，phase<6取3，phase=6取[12,3,3,12,3,3,12][day]，phase<10取12，phase=10取32，其余取72。Q3样本将2025 ISO周年第182至272天置零；未完成样本跳过2025-03-01至04-01前及2025-09-01之后。命名起点2006、阈值90天、保留年份参数和奇观开启保持相同。非零成员唯一覆盖与总量均通过；已提供零值可按轮廓规则省略，未知/未来不补日期。

临时命令为`node <task_tmp>/verify.mjs complete`，Vite以Node22目标打包上述正式入口；Canvas来自本机已有@napi-rs/canvas运行库，不增加项目依赖。五组实际图片请求恰好覆盖场景keys，没有预取全部19款。单独调用正式loadSourceCityImages重做19款源图加载与标定，全部空间元数据与运行catalog最大差异0；不声明不同Canvas缩放器逐像素相同。统一规格检查确认19款真实alpha、≤384、正式/候选PNG一致，源图未泄露到生产dist。

本机浏览器控制工具仍在启动阶段因可写根路径含符号链接退出，未修改Codex设置或绕过浏览器工具。因此本轮原生Canvas检查不是Chrome/MV3/GitHub真实登录、浏览器字体/视图往返或性能预算通过。较小平房/公共模型的紧凑留白、少量最大倍率上采样和最终审美仍由用户在实际页面验收；本轮没有擅自拉大贴图或提高最大倍率。

## 包与本机dist

本机生产组合保留PR #65的并行加载/有效内存复用。113份当前构建文件与本机dist对应文件逐一SHA256相同，只更新landscape.js并新增19张PNG；content.js/entry.js/manifest/权限、依赖与版本0.1.1不变。预存未引用旧Terrain分包保留，不放入本次新打包验证。

landscape101.66kB/gzip31.10kB，SHA256为3fcced5c3e4ec4fb6105a8181a515f69958605f6e4fb5deeb1a8b328b5db6df8；content仍为fd6bc9581de5ee92c0cf2286cec7868d790e5edb5a7f13605f70a48fd4a5cc48，entry仍为5603f4137646f5dc117bcde9064fc1e31f3798114678f8ed7ced0e5359ff29cd。未改变数据请求、权限或登录行为。

在任务临时staging复制正式package-city.py、package.json和4份notice，dist指向本轮新构建，运行原打包器；再执行`python3 scripts/verify-city-package.py <task_tmp>/package-stage/release/codeyears-0.1.1-city.zip --build-dir <task_tmp>/dist`。116文件、22,613,924 bytes，CRC/目录/资源引用/权限/notice核对PASS；ZIP仅作验证，不发布并在记录后删除。

重载已有CodeYears扩展，刷新GitHub主页再选城市即可看到新选型；无需清贡献缓存。不同用户/时间范围出现哪些模型由真实档位和合并占地决定。需要逐款看时，在本分支运行`npx vite --config probes/city-models-{civic|culture-transit|residential}/vite.config.ts`，使用上述三个独立端口。所有本轮截图、渲染脚本、输入、日志、缓存、临时构建/ZIP在报告完成后清除；只保留正式素材、标定、源码、报告与在用dist。
