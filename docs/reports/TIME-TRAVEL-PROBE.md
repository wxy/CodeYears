# Time Travel · 时间轴原型报告

日期：2026-10-30（Asia/Shanghai）。结论：独立时间轴的主线路径验证通过；尚未集成扩展或 3D，不代表 P2-B、P1-G 或正式 MVP 通过。

## 基线、环境与范围

- 分支 `codex/time-travel-probe`，从实际 `origin/main` 的 `12b00e2c4ae74bb25156a96268bbed6a22f23159` 创建，已核实 PR #2/#3 均 MERGED。没有继续更新旧渲染分支。
- 使用现有 CodeYears 云环境，Linux / Node 24.19.0 / npm 11.9.0 / TypeScript 7.0.2 / Vite 8.3.5。命令网络权限开启后 git、gh、npm 和本地服务可用；没有新增凭证或依赖。
- Chromium 154.0.8037.57，无头模式，1280 × 900、DPR 1，Playwright 驱动本地构建页面。仅 DOM 时间轴演示，不创建 WebGL，不对 GPU、功耗或显存作结论。
- 仅新增控制器、独立演示及任务/报告；`TimelineState` 保持不变。身份、缓存、请求、扩展、manifest、共享依赖/锁文件、主构建和全局计划均未修改。

## 实现与输入

控制器接收固定 `totalDays` 和默认 8000 ms 时长，只由调用者传入时间戳推进。内部累计播放时长，按 `floor(totalDays × elapsedMs / durationMs)` 计算 `revealedDays`。暂停不推进；继续重新记录基点；跳过直接完成；重播清零后开始。构造器与重播都不因全量数据已存在而呈现终点。控制器不读取时钟、不拥有 RAF，也不依赖浏览器、缓存或渲染器。

演示在内存中从 UTC 2006-01-01（含）以 86400000 ms 递增到 2026-01-01（不含），生成 7305 个模拟日期。数组在开始播放前已完整存在，控制器只接收其长度；已加载天数从数组读取，已呈现天数从 `TimelineState` 读取。这不是 GitHub 数据或真实缓存命中证据，不写入缓存或文件。

调度由演示负责：播放时使用 RAF 时间戳推进；暂停/完成/关闭时取消帧，没有轮询计时器。状态操作立即更新 DOM，播放帧更新呈现进度；指标读取不启动渲染。关闭保留已有模拟日期，但丢弃当前控制器，重新打开回到 idle/0。

## 实际命令

本轮临时目录由 `mktemp -d /tmp/codeyears-time-travel.XXXXXX` 创建，实际为 `/tmp/codeyears-time-travel.j2Gs3N`。下列命令均在仓库根目录执行，构建目录显式指定，未清空或复用其他轮目录：

```sh
npm ci --cache /tmp/codeyears-time-travel.j2Gs3N/npm-cache
npm run check
npx tsc --noEmit -p probes/timeline/tsconfig.json
npm run build -- --outDir /tmp/codeyears-time-travel.j2Gs3N/extension-dist
npx vite build --config probes/timeline/vite.config.ts --outDir /tmp/codeyears-time-travel.j2Gs3N/timeline-dist
python -m http.server 4174 --bind 127.0.0.1 --directory /tmp/codeyears-time-travel.j2Gs3N/timeline-dist
npm install --prefix /tmp/codeyears-time-travel.j2Gs3N/automation --cache /tmp/codeyears-time-travel.j2Gs3N/npm-cache playwright-core
node /tmp/codeyears-time-travel.j2Gs3N/browser.cjs
```

Playwright 仅安装到临时目录，没有改共享 package.json 或锁文件。临时浏览器脚本直接点击演示按钮、读取 DOM 与诊断快照，使用真实 `performance.now()` 和 RAF；未替换时钟，未新增隔离检查或在实现后补单元测试。脚本、运行日志、浏览器资料、缓存和构建产物完成报告后删除。可复现的人工步骤保存在 [任务说明](../tasks/TIME-TRAVEL-PROBE.md)。

## 实际观察

`npm ci`、主类型检查、演示类型检查、原工程构建和独立构建均通过。独立产物 HTML 约 1.75 kB（gzip 0.96 kB），脚本约 3.20 kB（gzip 1.55 kB）。浏览器应用请求只有本地 HTML 和演示脚本，没有 GitHub 请求或 Three.js 加载。自动化退出码为 0，pageerror 列表为空。

浏览器脚本对以下结果做了断言；计数为同一轮累计值：

| 主线路径 | 实际观察 | 结果 |
| --- | --- | --- |
| 全量数据初始态 | loadedDays=7305、idle、revealedDays=0、frameCallbacks=0、pendingFrame=false；等待 300 ms 快照不变 | 通过 |
| 首次播放起点 | 同步触发播放按钮后 playing、revealedDays=0、pendingFrame=true | 通过 |
| 正常生长 | 约 650 ms 后已呈现 587 天、已加载仍为 7305 | 通过 |
| 暂停冻结 | 暂停时已呈现 694 天、47 次帧回调；等待 800 ms 后完整快照不变，pendingFrame=false | 通过 |
| 继续无停留跳跃 | 继续按钮同步返回时仍为 694 天；随后观察帧为 709 天，仅增加 15 天，未加入暂停的 800 ms | 通过 |
| 跳过完成 | completed、revealedDays=7305、日期为 2025-12-31；累计 70 次帧回调，等待 500 ms 不变，无待调度帧 | 通过 |
| 完成后重播 | 从 completed 变 playing、revealedDays=0，loadedDays 保持 7305 | 通过 |
| 自然完成与停帧 | 重播后约 8026.7 ms 完成 7305 天；累计 551 次帧回调，等待 500 ms 快照不变，pendingFrame=false | 通过 |
| 播放中关闭 | 自然完成后再次重播，播放约 150 ms 后关闭；state=null、closed=true、loadedDays=7305；累计 563 次帧回调，等待 500 ms 不变 | 通过 |
| 关闭后重新打开 | idle、revealedDays=0、totalDays=7305、pendingFrame=false；帧回调仍为 563 | 通过 |

帧回调计数是诊断调度证据，不是设备性能基准。8000 ms 是演示目标时长，8026.7 ms 包含自动化观察与采样延迟。主线路径通过后未扩展极端时序矩阵或重复性能跑分。

## 已实现但本轮未验收的辅助行为

演示监听 visibilitychange，在隐藏时调用 pause；返回后需手动继续。pagehide 走关闭路径。控制器本身不管理这些事件。本轮没有额外模拟可见性条件或反复尝试无头浏览器后台切换，因此真实标签隐藏/恢复和导航生命周期仍待集成验收，不把实现等同于通过。

## 边界与下一步

本轮没有正式 City/Terrain 集成、真实贡献数据、缓存读写、身份隔离、部分数据到达、动态播放范围或扩展加载验收。减少动态效果偏好及正式交互样式也未实现。固定播放范围变化时应由后续集成明确产品行为，本控制器不自行推断获取完成或缓存状态。

后续主线可由正式调用方持有已校验数据，以数组长度创建控制器；仅在 playing 时推进时间，以 revealedDays 驱动已有渲染器，并在暂停/关闭/导航时停止调用。仍须在 P1-G/P2-A 条件满足后完成真实 Chrome/Edge、后台恢复、数据状态和 3D 集成验证。本报告只交付其时间轴基础前置能力，不宣布这些阶段通过。

## PR #4 小范围审核修订（2026-10-30）

本轮在原 `codex/time-travel-probe` 分支、`7e8ac46` 基础上仅处理两条审核意见：将 `loaded-count`、`revealed-count` 从隐含 status 角色的 output 改为普通 span，保留独立 `#status`；参照现有渲染原型配置，在 build/preview 缺少显式 `--outDir` 时直接报错，继续保持 `emptyOutDir: false`。未改时间轴控制器、调度逻辑或共享文件，也未合入 PR。

修改前确定的最小验证及实际结果如下：

| 检查 | 实际执行与结果 |
| --- | --- |
| 元素引用静态核对 | 用 Python HTMLParser 确认两个计数 id 唯一且为 span，无 role/aria-live，main.ts 的元素引用保持有效；独立 p#status 的 role=status 保留，页面无 output。通过 |
| 独立类型检查 | `npx --no-install tsc --noEmit -p probes/timeline/tsconfig.json`，退出码 0 |
| build 缺少 outDir | `npx --no-install vite build --config probes/timeline/vite.config.ts`，退出码 1，提示先用 mktemp 创建临时目录并通过 --outDir 指定输出 |
| preview 缺少 outDir | `npx --no-install vite preview --config probes/timeline/vite.config.ts`，退出码 1，出现同一明确提示 |
| 显式目录构建 | `npx --no-install vite build --config probes/timeline/vite.config.ts --outDir /tmp/codeyears-time-travel-review.AuqPYn/timeline-dist`，退出码 0，HTML 约 1.74 kB，脚本约 3.20 kB |
| 输出与 diff | 未生成 `probes/timeline/dist`；`git diff --check` 通过 |

本轮目录单独由 `mktemp -d /tmp/codeyears-time-travel-review.XXXXXX` 创建，未复用或清空其他轮目录；错误日志与构建输出在报告后清理。不补写单元测试、不扩大时序矩阵，也未重跑此前已通过的完整动画。上述静态检查不代表真实读屏软件已验收；显式目录 preview 服务未另行启动，真实后台/导航、扩展及 3D 集成仍维持待验收状态。前文浏览器完整路径结果属于原实现轮次，不能当成本轮新跑的结果。
