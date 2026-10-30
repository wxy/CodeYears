# P1-G · 60 Hz 屏幕补充验证

日期：2026-10-30。结论：**本机 M1、60 Hz 内建屏幕、所列窗口和原型条件下，City/Terrain 六组 7305 天完整播放均观察到约 60 FPS。** 这补齐本轮原型帧率证据，不等于 P1-G 全部门槛、正式扩展或所有硬件通过。真实 A/B/Edge、后台事件与正式页面集成仍分开验收。

## PR #6 审核与版本

PR #6 最新提交 `acf3c63`：Codex 在 `ca60f1e` 未报告代码发现；后续仅补任务文档的 PR 链接。Copilot 两次因配额不足未完成审查，这不是代码通过或失败。无逐行审核意见、无配置的 CI 状态检查。根任务核对源码与上述文档差异、已有验证范围后，未发现严重阻断，按用户授权保留历史合入。

合并提交/本轮 main 起点为 `a626ab47458586a6dba226c587cbfe03c95d4111`。本地分支 `codex/p1-60hz-validation`。没有修改渲染、缓存、时间轴或扩展源码；六组渲染源码仍对应 `3266af3`，即上一轮已验证的实现。云端下一轮渲染/时间轴对接将另走 PR，不能自动沿用此提交的性能 PASS。

## 环境与屏幕操作

沿用 [上一轮记录](P1-G-READINESS.md) 的 macOS 26.6.2 / Chrome 156.0.8078.76 / Apple M1、8 核、16 GiB。重新读取系统显示信息：LG HDR 4K 主屏的逻辑分辨率 1920 × 1080 @ 25.00 Hz；Color LCD 为 1680 × 1050 @ 60.00 Hz，两者均在线、未镜像。

通过 Chrome 新建本轮独立窗口，打开诊断页，使用“窗口 → 移到内建视网膜显示器”。未更改刷新率、主显示器或用户原窗口布局。诊断实际后端仍为 `ANGLE (Apple, ANGLE Metal Renderer: Apple M1, Unspecified Version)`；设备 DPR 2，内部像素比 1.5。宿主 1632 × 450 CSS 像素，画布 2448 × 675，Signature。

上一轮宿主为 1872 × 498，本轮窗口随屏幕改变，不能把两轮数字换算成代码优化幅度。源码未变；本轮约 16.7 ms、上轮约 40 ms 的间隔与两块屏幕刷新率一致。本轮不是精确 GPU 时间、功耗或显存测试。

## 输入、命令与操作

使用同一 [确定性生成规则](P1-C-RENDER-PROBE.md)：UTC 2006-01-01 至 2025-12-31 共 7305 天，LCG 种子 20060101，三密度的数量与日历不变。不使用真实用户数据。

```sh
CY_60_TMP=$(mktemp -d "${TMPDIR%/}/codeyears-60hz.XXXXXX")
./node_modules/.bin/vite build --config probes/rendering/vite.config.ts --outDir "$CY_60_TMP/render-dist"
python3 -m http.server 4173 --bind 127.0.0.1 --directory "$CY_60_TMP/render-dist"
```

本轮实际临时目录后缀 `uYdaMs`。在 60 Hz 屏幕上的独立窗口先读取指标，确认 opens/closes/canvas=0、active=null。按 City sparse/regular/dense、Terrain sparse/regular/dense 依次激活，每组完整播放超过 8 秒再点击读取指标，记录 DOM 的 `#metrics`，随后关闭并核对资源计数。不替换时钟或 RAF，不调用浏览器隐藏状态伪造函数。沿用已通过的类型检查和停帧实现，不重复运行不受影响的主扩展构建或缓存检查。

## 实际结果

| 视图 / 密度 | setup ms | 绘制帧 | 帧间隔 P50 / P95 ms | 累计几何更新 ms | 累计 CPU render ms |
| --- | --- | --- | --- | --- | --- |
| City sparse | 41.8 | 479 | 16.7 / 17.7 | 0.9 | 119.9 |
| City regular | 17.6 | 481 | 16.7 / 17.6 | 1.2 | 96.5 |
| City dense | 17.3 | 482 | 16.7 / 17.7 | 0.4 | 80.4 |
| Terrain sparse | 32.6 | 481 | 16.7 / 17.7 | 1004.3 | 94.8 |
| Terrain regular | 30.3 | 482 | 16.7 / 17.6 | 911.1 | 93.3 |
| Terrain dense | 19.0 | 482 | 16.7 / 17.3 | 1199.1 | 69.0 |

六组均达到 7305 天、playing=false、pendingFrame=false、geometryBuilds=1、1 draw call；City 87660 三角形，Terrain 14418。每次关闭后 canvas/几何/纹理/程序为 0、disposed=true，无待提交帧，六组窗口最终 opens=closes=6。原型构建通过，动态块约 531.17 kB，500 kB 警告保留。setup 不含下载，CPU render 不是 GPU 时间，累计更新耗时不表示单帧耗时。

## 真实后台观察的停止结果

为避免后台交互重新激活窗口而丢失证据，在临时构建旁创建一次性 `visibility.html`：复用原始 HTML 与相同场景块，只追加 `visibilitychange` 观察器。在真实事件处理后的微任务中调用既有诊断快照，将事件时间、document.visibilityState、帧数/日期、pendingFrame 显示在 DOM。观察器只记录事件，不覆盖 document.hidden、不派发人工事件，也不改变场景调度。

只做一次原生最小化/恢复尝试：独立窗口播放中观察到 759 天、51 帧、playing=true；原生点击本测试窗口的最小化按钮，等待至少 5 秒，再通过窗口菜单恢复。观察器没有记录到任何隐藏/恢复事件，随后播放已完成且 hidden=false。该工具会话仍无法形成所需的真实隐藏条件，**后台冻结/恢复未验收**，不能把上述动作判定为通过或直接归因于产品 bug。按用户要求不继续扩大这一环境边界的尝试；后续普通浏览器手动观察一次即可。

观察页结束时 opens=closes=2、canvas=0、active=null、disposed=true、pendingFrame=false、几何/程序=0。本轮捕获的浏览器 error 日志为空。独立窗口已关闭，用户原有窗口保留。

## 当前结论与留存

本机所列 60 Hz 原型帧率已取得证据，不需要因为上一轮 25 Hz 结果先引入降画质或复杂优化。仍未验证：另一真实登录账户、Edge、真实后台、正式扩展 3D/交互影响、长期驱动内存和所有主题/硬件；P1-G 整体仍在进行。

本轮只增加文档；静态检查差异和 Markdown 引用即可，不因报告修改重跑六组测试。独立服务、临时观察页、构建与所有过程文件在报告后清理，正式安装用项目 dist 保留。下一轮云端三个独立任务见 [云端安排](../CLOUD_DEVELOPMENT.md)，均以独立 PR 交付，不替代本机证据。
