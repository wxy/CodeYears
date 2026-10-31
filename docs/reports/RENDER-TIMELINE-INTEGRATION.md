# 独立渲染原型复用时间轴报告

日期：2026-10-30（Asia/Shanghai）。结论：在已声明的 7305 天输入范围内，新旧实现的直接浏览器控制结果一致；复用时间轴已实现并通过云端软件渲染路径验证。真实标签、新修订的目标 GPU 与正式扩展集成未验收，不代表 P1-G/P2 完成。

## 起点、范围与方法

首先仅执行 `git fetch origin main`，成功取得 `a626ab47458586a6dba226c587cbfe03c95d4111`，并确认包含任务要求的 PR #6。之后从该实际 main 创建 `codex/render-timeline-integration`。工作区原本干净，没有使用或覆盖其他失败实例的代码，没有继续更新旧 PR #4 分支。

按用户随任务提供的保持行为规范执行：修改源码前先在 [任务文档](../tasks/RENDER-TIMELINE-INTEGRATION.md) 记录可观察行为、非目标、调用边界与四类失败风险；预先编写直接浏览器检查，先确认未改实现的行为，再做最小替换，使用同一检查验证新实现。没有隔离单元测试需求，没有实现后补写单元测试，也未为旧实现人为制造红灯。

源码仅改 `src/renderers/probe/scene.ts`。`probes/rendering/main.ts` 及其按钮/API 不变；`src/timeline/**`、数据、缓存、GitHub 请求、扩展、manifest、依赖/锁文件、主构建及全局文档均未修改。没有新增快照字段或修改几何、高度、材质、主题、相机、DPR 和生成规则。

## 最小替换

以 `createTimeline(days.length)` 替代场景内逐帧累计小数天数的算法。几何与 `visibleDays` 直接读取控制器的整数 `revealedDays`；默认 8000 ms 时长来自既有控制器。首个活动帧调用 play 建立时间基点，后续帧调用 advance；pause/skip/完成通过控制器改变进度状态。

场景保留现有 playing 布尔值作为调用方播放意图：隐藏时控制器 pause、清零帧采样基点，但不把自动冻结误认为手动暂停；返回后只有原先播放的才在下一帧重新 play。手动 pause 会清除播放意图，因此恢复可见时仅补绘一帧。resume 先冻结控制器，再由下一帧建立新基点，排除等待时间。RAF、ResizeObserver、可见性、单次补绘、上下文丢失与资源释放仍由场景管理。

pause 继续允许已经排队的单次绘制完成；skip 立即更新几何并请求一帧；resize 继续请求一帧。没有把所有绘制限制为 playing，否则会漏掉这些静止更新。上下文丢失/关闭均冻结控制器并沿用原先的取消/释放逻辑。

## 环境与实际命令

现有 CodeYears 云环境：Linux、Node 24.19.0、npm 11.9.0、Three.js 0.186.1、TypeScript 7.0.2、Vite 8.3.5；Chromium 154.0.8037.57，1280 × 900、DPR 1。显式以 `--use-angle=swiftshader --enable-unsafe-swiftshader` 启动，读到后端 `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)`。这是软件渲染，不是真实设备 GPU。

本轮独立目录由 `mktemp -d /tmp/codeyears-render-timeline.XXXXXX` 创建，实际为 `/tmp/codeyears-render-timeline.JGIt3E`。仓库根目录执行：

```sh
npm ci --cache /tmp/codeyears-render-timeline.JGIt3E/npm-cache
npm install --prefix /tmp/codeyears-render-timeline.JGIt3E/automation --cache /tmp/codeyears-render-timeline.JGIt3E/npm-cache playwright-core
npx --no-install vite build --config probes/rendering/vite.config.ts --outDir /tmp/codeyears-render-timeline.JGIt3E/baseline
python -m http.server 4175 --bind 127.0.0.1 --directory /tmp/codeyears-render-timeline.JGIt3E/baseline
node /tmp/codeyears-render-timeline.JGIt3E/browser.cjs http://127.0.0.1:4175 baseline
# 旧实现验证通过后才修改 scene.ts。
npm run check
npx --no-install tsc --noEmit -p probes/rendering/tsconfig.json
npm run build -- --outDir /tmp/codeyears-render-timeline.JGIt3E/extension-dist
npx --no-install vite build --config probes/rendering/vite.config.ts --outDir /tmp/codeyears-render-timeline.JGIt3E/candidate
python -m http.server 4176 --bind 127.0.0.1 --directory /tmp/codeyears-render-timeline.JGIt3E/candidate
node /tmp/codeyears-render-timeline.JGIt3E/browser.cjs http://127.0.0.1:4176 candidate
git diff --check
```

依赖安装、类型检查与两条构建路径通过；新场景块约 531.92 kB（gzip 132.77 kB），入口仍约 3.58 kB；Vite 保留大于 500 kB 警告，没有隐藏。测试依赖仅在临时目录，没有修改共享依赖。

## 浏览器验证与结果

使用真实 RAF 时间戳，不替换播放时钟。输入沿用既有运行时生成规则，2006–2025 共 7305 天；选取 City/regular/Signature、Terrain/dense/Natural，各一次完整生长与控制路径。未激活时 canvas=0、未请求动态场景块；激活后初始和首个活动帧都为 0 天。

脚本在同一浏览器任务中触发动作并捕获随后首帧，避免跨自动化调用错过目标帧；固定测试页溢出布局，避免滚动条造成额外尺寸通知。旧实现的前两次采样分别因取到后续帧、布局尺寸通知干扰而中断；在修改源码前修正采样方式后，旧实现两种视图均通过。这些属于检查方法修正，不是源码缺陷。

新实现首轮在总时长范围断言（7.9–13 秒）处未通过，当时脚本没有输出实际数值，无法据此归因。没有修改源码或放宽断言，仅增加具体时长输出后复跑，以下两种视图均通过，退出码 0、pageerror 为空。软件渲染时长样本不证明稳定性能预算；该首轮失败不能省略或当作已解释。

| 完整生长样本 | 旧实现 | 新实现 |
| --- | --- | --- |
| City 完成观测时长 | 8465.5 ms | 8273.1 ms |
| City 绘制帧数、P50/P95 间隔 | 80；83.2/266.6 ms | 75；66.7/316.7 ms |
| Terrain 完成观测时长 | 8001.0 ms | 7977.9 ms |
| Terrain 绘制帧数、P50/P95 间隔 | 209；33.4/66.7 ms | 179；33.4/100.0 ms |

时长从场景初始化返回后采样到发现完成，含浏览器/自动化观察延迟；采样时点与 RAF 时间戳也有相位差，不能当作精确动画计时或 GPU 耗时。没有用这些波动判定性能提升/回退。

两版、两种视图的以下断言全部一致：

- 全量从 0 生长到 7305，playing=false、pendingFrame=false；随后 300 ms 绘制计数与天数不变。完整 City 为 1 draw call / 87660 三角形，Terrain 为 1 draw call / 14418 三角形；各只构建一次几何。
- 手动暂停后先允许已有单次绘制落帧，再观察 300 ms，帧数/天数不变。继续首帧增量为 0，之后继续生长。
- 自然完成后改变一次固定场景高度，恰好新增 1 帧后停止。手动暂停后跳过并再次暂停，也恰好新增 1 帧，呈现全部 7305 天后停止。
- 人工设置 document.hidden 并派发 visibilitychange：播放中隐藏 300 ms 无帧、无进度、无 pending RAF，恢复首帧增量为 0，之后继续。手动暂停后隐藏/恢复仍保持暂停，仅补绘 1 帧。
- 强制 WEBGL_lose_context 后，resize/resume/skip 都未重新调度；关闭后 canvas、几何、程序计数均为 0。另一次打开后在播放中关闭，后续 200 ms 快照不变、无 pending RAF。

再对两版输出做静态结果比较：既有快照键完全一致；容量、顶点数、DPR/内部像素比、画布尺寸、几何/纹理/程序计数、最终三角形和控制结果一致。两个模式的样本参数分别为 City 24 顶点 / 1232×495，Terrain 7380 顶点 / 1232×515（第二模式沿用了前一模式的测试尺寸调整），内部像素比均为 1。资源计数不是精确显存，也不证明驱动内存已全部回收。

## 等价范围与未验收

本轮证据支持：在既有 7305 天原型输入、两种视图与上述直接路径下，进度和生命周期结果保持一致；源码调用边界、诊断字段和视觉参数保持不变。没有做逐像素比较，也不把不同运行的逐帧时序或帧率视为完全相同。

可见性检查明确是人工条件下的事件处理验证，未验证原生标签切换、浏览器后台节流或导航。用户此前在 60 Hz 内建屏幕对旧源码六组取得的约 60 FPS 证据只属于旧版本，不能自动迁移给本修订；本修订仍需在目标设备用实际后端复验。功耗、精确显存、真实 GitHub 交互与正式 Chrome/Edge 扩展集成均未验收，P1-G/P2 状态不由本报告改变。

目标路径通过后停止扩展检查，没有再跑六组性能矩阵。仅提交场景源码、任务说明和本报告；本轮服务、自动化驱动、日志、生成摘要、缓存、构建产物和浏览器资料在报告后清理，不删除其他任务目录。不发布额外 GitHub 评论，不合入。
