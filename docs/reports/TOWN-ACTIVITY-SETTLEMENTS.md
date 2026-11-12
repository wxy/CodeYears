# 时间活动聚落接入报告

2026-11-12。本轮基线main `f2181e2`，工作分支`codex/town-activity-settlements`。用户在查看独立试算后确认继续，现接入小镇；经新PR交付，未获本轮合入/发布授权。完整目标见[任务约定](../tasks/TOWN-ACTIVITY-SETTLEMENTS.md)。

## 实现

`town-activity.ts`用正/零记录计算Bernoulli NLL，固定λ=6，跨周/月/年不重置，缺日拆连续run。数量不进入频率边界，但保留在所有输出统计和院落强度中。采用binary同值串端点与精确PELT支配剪枝；不是近似分段，不添加固定最短阶段、R/B或周期模式特例。端点依据为同值串内两侧NLL对切点凹；剪枝依据为分开拟合代价不大于合并拟合。

为处理实测的二十年长计算，异步入口在内层扫描和外层累计约8ms后使用特性检测的`scheduler.yield()`，不支持时用Promise包裹setTimeout0；让出前后和返回前核对AbortSignal。`planTownScene`及landscape既有prepare/setView/updateDays路径相应await，重建后再核对generation/disposed。没有加入worker、轮询或额外缓存层。

`town-layout.ts`先取得阶段，再安排院落。密集/间歇段（活跃日比例≥.2）均衡分配，每院≤24个正贡献日期；注册日单独分组。冷淡段中仅当相邻记录之间最多两个已知零日时共用小院，同样最多24个正日。所有零日仍在真实cells/parcels与阶段中，院落indices只包含其真实正日，所以mean=count/成员数与悬停同口径。未知日期不变成绿地零值。

院落地面单元仅决定物理占地，不是一日一格。主体、可容纳的附属设施和自身庭院沿用原生素材，倍率1、普通门1/居民.8；没有围绕整阶段的大墙。阶段用规则矩形沿时间主路折返，冷淡范围适度压缩且保留日期/天数标签，距离不作线性时间轴。场景沿用CityScene的源cells作成员/生长记账，Town专用ground使用settlements/avenues，公共layout.districts为空，不再据ISO年度画小镇街区。

地面日期下方为活跃日/已知总日数、Σ贡献；省略号后的天数是未取得日期的间隔。公共设施与花树是装饰，不表示贡献或真实人数。四个出城road ID及现有道路/返程/编辑协议保留。共享CityView只修改Town描述文字，City的布局/素材/数据路径不改。

## 输入与目前实际证据

浏览器验证代理匿名各取一次2024/2025/2026年度片段，使用正式片段请求头，无Cookie/Token、重定向或项目明细请求。首个沙箱DNS失败未发出HTTP，获得网络执行后完成3次有效年度GET。正式parseContributionYear与真实Chrome DOMParser核对完整覆盖及页面总量：366日/440、365日/1319、316日/6035，合计1047日/7794次，445个正日/602个零日。

数组SHA-256 `ef23abd53aea9bdee808a9073db834051e2a94db9133012d0c7b90a375a9193c`，恰与独立探索快照相同；仍以本轮独立获取校验为依据，不混用旧7770。原始HTML、数组与profile仅留在TMP，不入Git。

分段模块先写TMP失败方式与参考probe再实现，async变更也先修改await/取消probe。最终生产源码bundle的2263项对照通过，包括全枚举短串、固定种子随机、空/全零/全正、规律短休/不固定频率、缺日、跨月跨年、数量倍增不改频率边界，以及取消。真实12阶段的边界、日数、活跃数与数量均与全候选探索参考一致，未出现被隐去的同代价边界差异。模块SHA-256 `c390f170cb11a3bb508c0c50c57c76f5c1c04bc417fdeb5ad3dde50c28a5aabb`。

Node二十年7305日单次结果：flat0/flat+最大同步片段2.52/1.60ms，分块2.13ms；随机最大8.12ms、wall41.07ms，严格交替最大8.17ms、wall261.98ms。wall包含让出/定时器等待，不是纯算法CPU；进程CPU含V8后台工作也不能当主线程片段。fallback处理中取消定时器约8.43ms获执行、9.91ms拒绝。不是JS浏览器/全硬件预算结论，实际浏览器另记。

初版实际生产PNG/CityView路径：12阶段覆盖1047日恰好一次；34院落覆盖445正日恰好一次，合计7794，最大24成员；39栋主体/附属建筑、34院面。body/pad在院内，院落互不重叠、body/body-pad不交；90条公共路按几何交点相连，未穿院内。跨年段仍为2025-10-06—2026-02-09的127日/103活跃/1386次；04-04/05两个零日在03-09—04-13同阶段。这是初版源码渲染与几何证据，最终构建/UI/审查结果待下节记录。

## 最终检查与交付

最终冻结：activity `c390f170cb11a3bb508c0c50c57c76f5c1c04bc417fdeb5ad3dde50c28a5aabb`，layout `19f8c38cefee218fa0f9a43362a88a88cf4dd41446d4c5e479b3e783aa771e08`，ground `5f7ce72ca107c0febd010bb68b148e3e8fc7aafd37b97a74ec2f287a521624c9`。依赖/manifest、数据/身份模块、City布局和全部52张Town/100张City PNG与基线不变。

### 编译与构建

- 从原package/lock复制到任务TMP的独立工作目录执行`npm ci --cache "$TASK_TMP/npm-cache" --no-audit --no-fund`通过，30包；未改项目依赖。首次从项目cwd使用`--prefix`的安装命令因目录依赖解析报锁不匹配，改成直接进入复制目录后同一原锁成功；没有通过npm install修改锁。可选fsevents安装脚本有提示，未修改执行策略，正式构建不依赖该watch脚本。
- `npm run check`通过；`npm run build -- --outDir "$TASK_TMP/final-dist-labels"`通过（内含类型检查）。发行目录169文件，Town52/City100 PNG。content.js SHA-256 `a6d7298ca7b9ccb074810f7ad2258c4fb4e8a1e878ac1b6ad6a2cbfec238df3f`；landscape.js `b45084332d0b4d0d680f4ee8d08a1428c03ff3aac08704beec6da7c9708c5c0b`，170.02kB/gzip50.43kB。文件字节不是显存或FPS结论。

### 本机实际Chrome直接组件路径

Google Chrome157.0.0.0、Asia/Shanghai，隔离profile及TMP服务器；没有使用用户登录浏览器。生产CityView/Town loader/ground/hover直接组件，生命周期和失败路径载入实际构建landscape.js。受控活动HTML仅在测试页拦截，真实项目网络请求0。

- 同输入City/Town各1047日期、unique1047、合计7794；12阶段、34院、39建筑/34院面及90路几何证据如上。
- 实际PNG透明度77像素命中estate-villa-x，生产buildingAt恰好24个自身成员、539次贡献（2026-06-07—07-02的实际有记录日期），所属宏阶段215日。没有将整个阶段作为建筑成员。
- 生产hover对上述命中成员仅请求24个自身日期，最大2并发；移出时2个在途请求中止、active归0、卡隐藏，销毁移除卡。成功受控HTML表示日期可确认但无项目活动，不把它写成真实项目明细验收。
- 静止200ms draw/RAF增量0；隐藏200ms为0，恢复同canvas且无新解码，settle后200ms为0；dispose后DOM0、主canvas0×0，后续200ms不提交帧。
- 初始Town PNG404明确失败且无残canvas。City→Town PNG404保留同一已完成1047日的City canvas（1→1，2160×1260）；原实际Alpha命中的9成员仍完全相同。
- Chrome受控二十年7305日严格交替序列完整得到1阶段/7305日/3652次，单次约200ms；timer heartbeat/取消未及时执行，不能据此判断yield失败或将timer取消写成通过。改用可见Cancel按钮和外部CDP真实鼠标点击：完成前handler触发并捕获AbortError，yield4次、RAF2次，约54.4ms。此为实际输入响应样本，不是完整交互延迟预算。
- 同一受控7305日输入的Node完整规划单次wall254.90ms（含让出等待），1阶段、153院/153建筑，3652正日成员和总量，场景164.2×121.5；不是用户真实数据或浏览器绘制预算。

临时验证服务器曾因旧allowlist及/var、/private/var路径差异产生PNG403，修正并重启后受影响路径通过，未因此改产品。

### 标签修正与增量范围

首轮实际近景发现阶段日期被前景温室遮挡。只将ground固定锚点从阶段左前移动到最前角，并改为居中，未改布局/数据/通路。root和浏览器代理均实际查看定点新图，跨年`2025-10-06—2026-02-09`及`103/127 d · Σ1386`均完整可读。

首轮完整组件检查绑定landscape SHA `e7b69be7606392dae9aa97abafdd81426b5918852dabc01c3bbbc868585adf9e`，最后仅地面标签坐标/对齐改变后重建为上述b4508433。按实际影响没有重跑未变算法、几何、hover、404和生命周期矩阵；对最终构建只补实际Town PNG渲染/新标签/资源释放：1047日、1canvas2160×1260，dispose后DOM0/主0×0；源导出主canvas0×0，31/31图片画布清零，无活动请求。三张正式图已覆盖为标签修正版并逐张实际打开。

默认镜头沿用City初始放大视野，会裁到外侧院落；本轮没有改镜头交互。正式总观只为导出调整取景以覆盖完整场景，局部图按实际源渲染，不移除数据美化。独立goal-driven-review首审与最终增量均无实证阻断；未重复旧矩阵，也不以审查替代用户视觉验收。

### 可重复路径与边界

原始输入生成方法为正式`fetchContributionYear`的匿名年度请求及`parseContributionYear`，来源范围/参数/数组SHA见上；实际网页未来可能变化，重取先核对合计与SHA，不保证重取仍是同一快照。受控20年输入为从2006-01-01起7305日、奇数index为1/偶数0，没有混入真实快照。TMP验证入口为`node probe-activity.mjs`、浏览器`parse.mjs`/`run.mjs`（render/alpha/hover/lifecycle/fallback）及`cancel-external.mjs`；源码bundle均从本轮工作树/构建导入。

只长期保留本报告、正式用户效果图和可加载dist；原HTML/数组、probe/profile、缓存、依赖目录、完整日志、诊断图和测试构建在记录后清理，不提交Git。PR、CI与本地dist的最终头/状态以交付PR及忽略目录下BUILD-INFO记录为准；本轮不自动合入main或发布。

未覆盖真实登录MV3、Edge、完整账户/可见性矩阵和硬件功耗/FPS预算；不继承PR80或其他版本的性能验收。
