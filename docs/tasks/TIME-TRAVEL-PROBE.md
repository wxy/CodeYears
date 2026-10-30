# Time Travel · 时间轴基础原型

状态：[PR #4 已合入](https://github.com/wxy/CodeYears/pull/4)，合并提交 `f9ea64f`；独立原型主线路径验证通过，计数播报与构建目录两项小修已完成。日期：2026-10-30。

本任务是 P2-B 的独立前置工作，不代表 P2-B、P1-G 或正式 3D MVP 通过。分支 `codex/time-travel-probe` 从 `origin/main` 的 `12b00e2c4ae74bb25156a96268bbed6a22f23159` 创建；已合并的 PR #2 渲染分支保持原样。

## 范围与接口

仅修改 `src/timeline/`、`probes/timeline/` 和本任务/报告文档。复用现有 `TimelineState`，不修改其类型。身份、缓存、GitHub 请求、扩展入口、依赖和主构建均未修改。

`createTimeline(totalDays, durationMs = 8000)` 只接收固定播放范围长度，初始为 `idle / revealedDays=0`。它不读取数据获取状态，也不持有真实数据、WebGL、时钟、事件监听或 RAF。

| 调用 | 行为 |
| --- | --- |
| `getState()` | 返回新的 `TimelineState` 值快照 |
| `play(nowMs)` | 从 idle 开始或从 paused 继续；继续时重设时钟基点 |
| `advance(nowMs)` | 仅 playing 时累计播放时间，按比例呈现整数天，结束为 completed |
| `pause()` | 冻结进度，保留已播放时长 |
| `skip()` | 呈现全部天数，进入 completed |
| `replay(nowMs)` | 清零播放进度后立即开始；不影响调用者已加载的数据 |

时间戳单位为毫秒，使用同一单调时钟，如 `performance.now()` 与 RAF 时间戳。完成后的 `play()` 不自动重播，需显式调用 `replay()`。调用者在 playing 时推进，暂停/完成/关闭时停止调度；关闭只需停止推进并丢弃控制器。分批数据到达与播放范围变化不在本原型范围内。

## 独立运行

仓库根目录执行，使用本轮新建临时目录；不复用其他任务的输出目录：

```sh
timeline_tmp=$(mktemp -d /tmp/codeyears-time-travel.XXXXXX)
npm ci --cache "$timeline_tmp/npm-cache"
npm run check
npx tsc --noEmit -p probes/timeline/tsconfig.json
npm run build -- --outDir "$timeline_tmp/extension-dist"
npx vite build --config probes/timeline/vite.config.ts --outDir "$timeline_tmp/timeline-dist"
python -m http.server 4174 --bind 127.0.0.1 --directory "$timeline_tmp/timeline-dist"
```

打开 `http://127.0.0.1:4174`，先确认已加载为 7305、已呈现为 0，然后依次操作播放、暂停、继续、跳过、重播、关闭、重新打开。自然播放约 8 秒。下方指标显示 `frameCallbacks`、`displayUpdates`、`pendingFrame`；控制台 `window.timelineProbe.snapshot()` 读取相同快照，不启动轮询。

演示运行时生成 2006-01-01 至 2025-12-31 的模拟日期；数据栏始终反映已有日期数组，播放控制只改变呈现栏。演示层持有 RAF，仅播放时续帧；暂停、完成和关闭后只在操作引起状态变化时更新。标签隐藏时演示调用 pause，返回后需点“继续”；真实后台事件尚未在本轮验收。pagehide 关闭演示。

结束后停止本次服务，删除本次 `timeline_tmp`。不要提交依赖目录、临时自动化脚本、原始日志或构建输出。

## 验证与后续边界

类型检查、原工程构建、独立构建及 Chromium 的主线路径通过，实际数字见 [报告](../reports/TIME-TRAVEL-PROBE.md)。本轮采用真实浏览器时钟，没有隔离/伪造时间，没有实现后补写单元测试。

后续正式集成仍需处理真实数据可用范围、缓存反馈、3D 渲染、真实后台恢复、减少动态效果偏好和 Chrome/Edge 扩展生命周期；这些不阻断本前置原型的独立交付。
