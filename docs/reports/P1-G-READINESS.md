# P1-G · 可行性进度与剩余门槛

日期：2026-10-30。结论：数据与缓存原型、时间轴前置原型已合入；本机两种视图的完整播放、暂停、静止与可观察释放取得补充证据。**P1-G 尚未通过，不能据此宣布正式 City MVP 开始或完整产品达标。**

后续：本报告通过 PR #6 合入 `a626ab4`；同源码在 60 Hz 内建屏幕的六组补充结果见 [60 Hz 报告](P1-G-60HZ.md)。下文 25 Hz 数字与当时未验收结论保留为历史证据，不覆盖或改写为新一轮结果。

## 版本与已合入状态

- PR #5：合并提交 `e502e32c09dc69968bdca47bfbf1b8946399b3b0`；身份检查修复 `adb5eab`，跨年缓存修复 `2220030`，9 项过期规则检查通过。真实 Chrome 单账户缓存证据与受控身份检查的范围见 [P1-B 报告](P1-B-VIEWER-CACHE.md)。
- PR #4：合并提交 `f9ea64f5ed77a5f887a4cbbf41128c02d26cff4b`，为本轮 main 起点。云端 `796d7c0` 将计数改为 span，且 build/preview 必须显式传 outDir；静态、类型、拒绝路径与临时构建通过。完整播放旧证据与本次检查分别见 [时间轴报告](TIME-TRAVEL-PROBE.md)。
- 本轮分支 `codex/p1-readiness`，真实渲染检查绑定 `3266af3`：仅给渲染诊断快照增加实际后端、设备/内部像素比与画布像素尺寸，不改场景映射、播放或释放逻辑，不接入主扩展。

## 本机环境

macOS 26.6.2 / 25G83，Apple M1、8 核、16 GiB；接交流电，电量 80%，未记录低电量模式、精确 GPU 时间、显存或功耗。Chrome 156.0.8078.76（本机应用版本已核对），沿用既有会话与锁定依赖；Three.js 0.186.1、Vite 8.3.5、TypeScript 7.0.2。

诊断实际报告后端为 `ANGLE (Apple, ANGLE Metal Renderer: Apple M1, Unspecified Version)`，非云端 SwiftShader。设备 DPR 2，内部像素比 1.5。六组场景宿主 1872 × 498 CSS 像素，画布 2808 × 747，Signature。后续原生前台操作时宿主高度变化，画布为 2808 × 700；不混入六组性能表。

系统显示信息：主屏 LG HDR 4K，1920 × 1080 @ 25.00 Hz；内建 Color LCD 为 1680 × 1050 @ 60.00 Hz。本轮未改显示设置，未把测试窗口移到 60 Hz 屏幕复验。

## 输入与实际方法

复用 [P1-C 的确定性输入规则](P1-C-RENDER-PROBE.md)：UTC 2006-01-01 至 2025-12-31，共 7305 天、5 个闰日；每种密度重置 LCG 种子 20060101，稀疏/常规/高密度分别合计 3471/93171/913530。仍为模拟渲染负载，不是真实贡献或真实缓存证据。

实际命令，从仓库根目录执行：

```sh
./node_modules/.bin/tsc --noEmit -p probes/rendering/tsconfig.json
./node_modules/.bin/vite build --config probes/rendering/vite.config.ts --outDir "$CY_RUN_TMP/render-dist"
npm run check
python3 -m http.server 4173 --bind 127.0.0.1 --directory "$CY_RUN_TMP/render-dist"
```

`CY_RUN_TMP` 通过 `mktemp -d "${TMPDIR%/}/codeyears-next.XXXXXX"` 创建；本轮实际目录后缀为 `yv774p`。构建与服务仅用于本轮诊断，未覆盖正式扩展 `dist/`。用已连接 Chrome 的浏览器工具操作页面按钮和下拉框，只读取页面显示的 `#metrics`，不调用隐藏诊断 API、替换 RAF 或伪造可见性。

步骤：首次点击“读取指标”，确认 opens/closes/canvas 均为 0、active=null；六组分别激活，完整播放超过 8 秒后读取指标，确认 7305 天、无待提交帧，再关闭；City sparse 与 Terrain sparse 完成后另观察至少 5 秒再读取，检查帧数不变。关闭结果逐次检查 canvas=0、disposed=true、pendingFrame=false、几何/纹理/程序=0。

## 六组完整播放

下表是本机同一轮诊断的累计值；setup 不含动态块下载，CPU render 调用耗时不等于 GPU 时间，帧间隔也包含显示/浏览器调度。

| 视图 / 密度 | setup ms | 绘制帧数 | 帧间隔 P50 / P95 ms | 累计几何更新 ms | 累计 CPU render ms |
| --- | --- | --- | --- | --- | --- |
| City sparse | 64.4 | 200 | 40.0 / 40.9 | 0.6 | 138.9 |
| City regular | 40.5 | 201 | 40.0 / 40.8 | 0.6 | 84.4 |
| City dense | 28.5 | 202 | 40.0 / 40.7 | 0.4 | 48.5 |
| Terrain sparse | 65.4 | 202 | 40.0 / 40.6 | 976.8 | 67.8 |
| Terrain regular | 52.9 | 202 | 40.0 / 40.7 | 926.2 | 65.3 |
| Terrain dense | 46.6 | 202 | 40.0 / 41.6 | 960.3 | 53.5 |

六组均完整呈现、playing=false、pendingFrame=false，geometryBuilds=1、1 draw call。City 最终 87660 三角形，Terrain 14418。City sparse 的 200 帧、Terrain sparse 的 202 帧在额外 5 秒窗口均不增加。每次关闭上述资源计数归零；它们不代表已测精确显存、驱动回收或长期泄漏。

独立构建入口约 3.58 kB，动态场景块约 531.17 kB；超过 500 kB 的 Vite 警告保留。未激活 canvas=0，有效后端仅在主动创建 renderer 时读取，没有后台轮询。浏览器本轮捕获的 error 日志为空，但这不等于完整错误/性能审计。

## 帧调度基线与交互

为判断约 40 ms 是否来自 3D 更新，创建本轮临时空白 HTML：没有 canvas/WebGL，用按钮启动一条真实 RAF 链，记录连续时间戳差，超过 2000 ms 后停止，排序后在 DOM 显示 P50/P95。实际为 50 个间隔、elapsed=2000 ms、P50=40.0 ms、P95=40.2 ms，canvas=0、可见态显示 visible。该结果与主显示器 25 Hz 一致，不能据此将约 25 FPS 归因于渲染器，也不能宣称 60 FPS 达标。下一步在 60 Hz 屏幕的普通前台环境复验即可，不先加入自动降画质框架。

补充 City regular 实际按钮路径：同一操作中重开后暂停，停在 365 天、12 帧、pendingFrame=false；额外等待 5 秒后日期/帧数不变。继续后观察到 767 天、24 帧，未补算暂停的等待时间。最终全轮 opens=closes=8，canvas=0、active=null、disposed=true、pendingFrame=false，几何/程序计数为 0。

原生 Chrome 标签栏确认切换到临时基线标签，但受控观察仍报告 hidden=false，随后也未取得可证明后台冻结的快照。浏览器操作期间前台标签有用户活动，工具观察会影响测试环境；无法判定本轮是否产生了所需隐藏条件。**真实后台隐藏/恢复仍未验收**，不将上述动作视为后台 PASS，也不通过覆盖 document.hidden 补造结论。六组帧表属于工具控制会话，仍需普通前台环境复验目标帧率。

## 剩余主线门槛与下一步

| 门槛 | 当前证据 | 最小下一步 |
| --- | --- | --- |
| 无 Token 数据与数量 | Chrome 指定样本、单账户真实请求/缓存通过；网页请求不是稳定 API | 补真实未登录/另一账户在同一主页的可见数据与隔离；不复制凭证 |
| 身份隔离 | 受控 A/B/未登录/未知/切换检查通过，真实 wxy 缓存主流程通过 | 在可用的真实会话中做最小 A→B/退出检查；原用户主页不得复用旧记录 |
| Chrome / Edge | Chrome 当前主动注入、storage 主线通过 | Edge 同一路径的加载、读取/命中/刷新/清除验收 |
| 20 年负载与停止/释放 | 本机 Metal 六组完整播放，静止/暂停 5 秒和 8 次关闭计数有证据 | 60 Hz 屏幕复验帧间隔，实际标签隐藏 5 秒后确认恢复无跳跃 |
| GitHub 交互影响与完整生命周期 | 独立诊断不覆盖真实主页 3D | 在 P1-G 得出可行性结论后，P2-A 集成时对照滚动/点击/页内导航；发布前补长期资源趋势 |

当前不把尚无真实会话或合适显示条件的项目误写为代码失败，也不靠模拟输入替代。没有引入 Token、后端、独立网站或收费。主线先补上表直接证据；P1-G 通过后再正式集成 City 和已合入的时间轴。

结束状态：两个临时浏览器标签已关闭，最后诊断确认资源计数归零；服务与临时目录在报告后清理。只保留此报告和正式诊断指标改动，不提交截图、日志、生成数据、缓存、临时基线页面或构建。
