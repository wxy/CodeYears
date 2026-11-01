# 城市外围自然地景模块

> 当前状态（2026-11-01）：已用正式 imagegen PNG 加载/绘制方案替换程序地貌。下面首轮程序实现与暂停记录仅留作历史，不作为最终内容；当前交付以文末“最终 PNG 版本”为准。PR #31 更新，暂不合入。

2026-11-01。用户授权；从main `510e5237c07707c4c608b96e5f3739925ebbc20b`建立`codex/city-outskirts`，独立PR、不合入。仅新增city-outskirts.ts与本报告；未改city-view、日期映射、季度轴、出口规划、年份雕塑或全局文档。实现前已阅读当前PERFORMANCE，遵守静态按需和预算证据边界。

## 接口与实际取舍

严格导出CITY_OUTSKIRT_MARGIN=12及createCityOutskirtsPainter(width,depth,ringOuter,exits)，CityRoadRoute仅type导入。世界XZ输入在创建期投影为W=(.5,.25)、D=(-.5,.25)的Path2D，调用方传入现有地面投影坐标上下文；不要再次应用XZ投影。paint只save/clip/fill/restore，不创建Canvas、Path2D、图片请求、定时器或动画。所有几何与颜色只依赖包络和固定空间序号，不使用贡献日期、贡献数量或逐帧随机。

每边十个固定地景组，空间位置作稳定扰动；三层低透明度不规则草沙地块相叠，形成不规则渐淡边缘和留白；间隔布置低多面丘陵、四株一组的阔叶/针叶混交小林簇。地面先画，丘陵与树木按地面深度排序；外侧树木按到边缘距离衰减。树木/山丘数量有界，不沿二十年坐标逐格增长。它是克制的程序外围地貌，不宣称达到PNG建筑素材的写实美术精度。

所有装饰裁在[-ringOuter-12,width+ringOuter+12]×[-ringOuter-12,depth+ringOuter+12]的投影外包络内，含抬升后的树冠/山尖；同时排除整个贡献地块/环路内区。出口每段按实际lanes×.4宽度再各侧加.55格廊道，并延伸端点；对每条廊道独立预编译clip，确保重叠排除区不被even-odd抵消。裁剪包含草地/树冠/山体全部投影像素，出口后画道路时不会被装饰压住。路口连接、道路伸出及地面缓存释放由调用方集成，本模块不规划出口。

## 实际检查

云端Linux6.18.57、Node v24.19.0，Chromium154.0.8037.57 headless / Playwright，1600×1000、DPR1。通过现有preview:city的Vite导入新模块，pagehide停止原城市时间轴，临时Canvas样板检查：

- 单年代表width56/depth7、二十年代表width56/depth182.4，ringOuter=3；这是几何代表输入，未把模拟地貌当真实贡献数据。浅色#fff、深色#0d1117各绘一次，按包络适配后再同一painter放大2倍检查。
- 四条出口为北(14,0)→(14,-15)、南(38,depth)→(38,depth+15)、西(0,.4depth)→(-15,.4depth)、东(56,.7depth)→(71,.7depth)，车道数分别4/2/8/4。四个方向各21个中心线位置采样，浅深两组均无装饰alpha（corridorFailures=0）。查看实际图像确认出口呈连续空白廊道，地貌在环路外，山体/林簇和不规则草沙边缘可见；未叠画出口路面，真实道路由本地集成最后绘制。
- 两种代表尺寸各构造467条Path2D（含外包络/裁剪），每paint提交456次fill，浅深各一次为912次；同一尺寸paint前后Path2D计数不变。数量不随20年深度增长。2倍缩放复用同一painter。该计数不是CPU/GPU耗时、内存或FPS预算。
- `npm run check`、`npm run build -- --outDir /tmp/outskirts-build`、`git diff --check`通过。模块尚未接入city-view，主构建不包含不可达模块；TypeScript检查及实际Vite浏览器已加载模块。

没有事后新增单元测试、依赖或资源。仅保留本报告；样板代码、图像、输出、构建清理。

## 未验收

真实出口路线与统一季度轴的组合、年份雕塑和建筑遮挡、用户整体美术接受、真实MV3/本机Chrome与性能预算仍由主代理验收。当前几何剪裁保证画布包络内，不代表本地camera已扩大视图；调用方须计入CITY_OUTSKIRT_MARGIN。仅验证1/20年代表尺寸，不穷举路网输入；出口处地景被裁成清晰廊道，草坡与实际路肩的最终衔接需集成复核。独立PR暂不合入。


## 最终 PNG 版本

2026-11-01，本地正式资源来自origin/codex/city-connected-landscape的8f451da，运行文件outskirts-{forest,meadow,hills}.png，均1536×1024；提示/哈希由本地docs/design/city-outskirts/v1/SOURCES.md维护。本分支仅fetch并git show提取原图到/tmp，不合并该分支、不复制资源入本提交。所有程序树木、山体、草沙blob均已移除，最终自然内容仅来自这三PNG。

接口保持CITY_OUTSKIRT_MARGIN=12，新增CITY_OUTSKIRT_IDS三id常量及loadCityOutskirtsImages(base,signal?)，CityImages仅type导入；createCityOutskirtsPainter新增images第五参数。loader复用loadUnit的768上限及低alpha清理，将clean等比画入512×341独立canvas；每个源UnitImage在finally关闭。失败/取消时已创建canvas清零，返回画布由root既有closeCityImages释放。没有新像素算法。CitySprite暂按8×6占地、显示宽7/高4.6667，地面中心偏移与65%图高锚点作视觉近似，不宣称精确物理标定。建议root将loader纳入现有Promise.allSettled和统一释放；本模块不自行调度逐帧加载。

每边最多9个稳定PNG簇，森林/草甸/丘陵交替，倍率.65–.75、轻微位置扰动；短边有叠接，长边有留白，不随年份增加数量。出口附近按到路线段距离主动跳过小簇，避免仅靠clip切开树冠。原外包络/环路内区及逐出口廊道clip保留；paint只提交drawImage，没有程序自然几何或新路径分配。首轮样板发现树冠裁平，已收小倍率、调整锚点及距环路位置后复核。极端出口/尺寸的最终构图仍需本地确认。

最终实际Canvas：同云端Chromium154.0.8037.57、1600×1000、DPR1，以Playwright请求拦截从/tmp提供提取的真实三PNG；loader完整走fetch/loadUnit/clean/bake链路。使用width56，depth7/182.4，ringOuter3及历史四向出口（4/2/8/4车道），浅深两背景及同painter2倍放大。三图缓存均512×341；每尺寸11条预编译clip路径，重复paint不新增路径。单年最终16簇/paint、20年31簇/paint（浅深两次drawImage计数32/62）。四向出口各20个中心线位置（不含包络边界终点）的alpha采样均0；早期样板终点落于外包络抗锯齿边缘，后续明确排除该边界像素，不把抗锯齿当廊道内容。查看浅深PNG样板与放大结果，森林/草甸/岩丘均来自真实图片，未用程序造型替代。closeCityImages后三缓存尺寸均0×0。

npm run check、临时目录build、diff --check通过。失败/取消清理由源码检查，未展开取消矩阵；未加事后单测。实际城市整合/出口路肩/远近缓存、主机MV3/性能预算和用户最终美术接受仍待本地，云端样板不能代替。本次只修改模块和自身报告，图像/样板/日志/构建清理。原程序方案被本版本替代，原PR31保持打开、暂不合入。

## 最后布局修正：草甸衔接环路与长边连续覆盖

2026-11-01，本地集成反馈上一版靠外且呈独立小岛。本次仅调整painter布局，不更改PNG、loader和接口。内层仅重复outskirts-meadow：环外偏移1.8–2.2格、倍率1.05–1.2，约每4.2世界格采样，单边最多40张。低草甸相叠形成贴环路的自然地面，环路/出口由原clip留白。外层仅森林/丘陵：环外5.2–5.5格、倍率.7–.78，约每8.5格采样，单边最多10张，仍主动避开出口以保护完整树冠。两层均沿边长布点、轻微稳定扰动；草甸先绘，林丘再按深度绘制。总提交上限4×(40+10)=200张/paint，不随历史无限增加，无程序自然底色/blob。

用同三张真实PNG（从8f451da提取/tmp），Chromium154.0.8037.57实际Canvas复核width56/depth7及182.4、ringOuter3，原四向出口、浅深背景。单年实际51张/paint，20年143张/paint；每尺寸11条裁剪路径，重复paint前后计数不增。四向出口各20个中心位置alpha采样均0。查看整体图，草甸与环路排除区边界衔接，二十年长边已连续覆盖，外围保留图片不规则透明边缘，不再是固定九簇隔开的浮岛。本样板未画真实环路/建筑，最终路肩衔接与整体视觉仍以本地集成为准。

本次npm run check、临时目录build、diff --check通过；没有新增单测或矩阵。只改painter布局与本报告，loader文本保持不变。临时PNG/样板/日志/构建清理；PR31继续更新、不合入。前节16/31簇为上一版历史，本节51/143为最新布局结果。
