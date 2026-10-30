# P1-C · 20 年渲染性能原型报告

日期：2026-10-30（Asia/Shanghai）。结论：原型已实现，云端软件渲染的主要交互与释放路径通过；审核修订另完成本机 Apple M1 的针对性检查及三组 City 重测（见文末）。目标性能预算、真实标签后台行为和扩展集成仍未验收，不能以本报告宣布 P1-G 通过。

## 版本与环境

- 起点 `cde38e6fdb723471743041116df8d2e9f346a78f`，独立分支 `codex/p1-render-probe`。开发中核实 PR #1 已合入 `main` 的 `ae876a45d7cb93fbd30826a5fe0ba350400bc85c`，保留工作后快进到该 main 基线；本 PR base 为 main，不合入。
- Linux 6.18.57 x86_64，云端暴露 5 个 CPU，型号 Intel Xeon Platinum 8573C。Node 24.19.0 / npm 11.9.0；Three.js 0.186.1；Vite 8.3.5；TypeScript 7.0.2，依赖遵循原锁文件。
- Chromium 154.0.8037.57，Playwright 驱动，1280 × 900，DPR 1。初始六组输入使用同一浏览器上下文；原型内部 DPR 上限 1.5。
- 明确以 `--use-angle=swiftshader --enable-unsafe-swiftshader` 启动，读到后端 `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)`。这是云端软件渲染，不是真实设备 GPU。电源状态、真实 GPU、精确显存与功耗不可测。
- 普通执行权限无法联网/监听本地端口；授予命令网络权限后 git、gh、npm 与本地静态服务正常。默认 npm 缓存目录不可写，改用 `/tmp/codeyears-p1-c/npm-cache` 后 `npm ci` 通过。未修改依赖或共享配置。

## 实现与输入规则

入口在 `probes/rendering`，不进入主状态页。激活通过动态 import 加载随本地构建的 Three.js；未激活只加载入口与生成规则。输入仅在运行时生成，没有提交生成数据。复用 `DailyContribution` 的只读类型，不更改真实数据契约；这些记录明确是模拟负载。

日期从 UTC 2006-01-01（含）逐次加 86,400,000 ms，到 2026-01-01（不含）。每种密度重置种子 `s = 20060101`，每天先算 `s = (Math.imul(s, 1664525) + 1013904223) >>> 0`，再计算数量：

| 密度 | 数量规则 | 实际天数 | 零值天数 | 数量合计 |
| --- | --- | --- | --- | --- |
| sparse | s % 20 === 0 时 1 + s % 40，否则 0 | 7305 | 6954 | 3471 |
| regular | s % 5 === 0 时 0，否则 1 + s % 30 | 7305 | 1466 | 93171 |
| dense | 50 + s % 151 | 7305 | 0 | 913530 |

三组实际首末日期均为 2006-01-01、2025-12-31，均含 5 个闰日。LCG 的低位与取模有相关性，sparse 并非均匀随机，规则用于可复现负载，不模拟真实用户行为。

高度使用 `3 * log1p(count)`，原数量保留。City 容量 7305，90 列，单个盒体几何（24 顶点）、单材质、单 InstancedMesh，零值保留 0.05 高度。Terrain 用 90 × 82 = 7380 顶点，末尾 75 个顶点补平面，单个 89 × 81 段网格，逐帧原位改高度并更新法线，不重建网格。日期均按索引行序映射，尚非产品年份布局。

Signature/Natural 仅背景变体，使用同一法线材质；没有最终配色、材质和数量映射决策。没有阴影、纹理、后期处理。时间轴默认约 8 秒，从已有全量输入的起点生长；暂停、隐藏不补算流逝时间。旋转/缩放/尺寸变化请求单帧，播放才续帧。关闭取消 RAF、断开 ResizeObserver、移除监听、dispose 实例/几何/材质/renderer、请求上下文丢失并移除 canvas；pagehide 使用同一路径。

## 实际命令与操作

以下为审核修订后的复现命令，从仓库根目录执行。首轮云端曾使用固定 `/tmp/codeyears-p1-c`，现取消该默认路径，避免清空并行诊断产物：

```sh
CY_PROBE_TMP="$(mktemp -d "${TMPDIR:-/tmp}/codeyears-p1-c.XXXXXX")"
npm ci --cache "$CY_PROBE_TMP/npm-cache"
npm run check
npx tsc --noEmit -p probes/rendering/tsconfig.json
npm run build -- --outDir "$CY_PROBE_TMP/extension-dist"
npx vite build --config probes/rendering/vite.config.ts --outDir "$CY_PROBE_TMP/probe-dist"
python3 -m http.server 4173 --bind 127.0.0.1 --directory "$CY_PROBE_TMP/probe-dist"
npm install --prefix "$CY_PROBE_TMP/automation" --cache "$CY_PROBE_TMP/npm-cache" playwright-core
PROBE_PLAYWRIGHT_MODULE="$CY_PROBE_TMP/automation/node_modules/playwright-core" node probes/rendering/verify-browser.cjs
```

浏览器诊断最初以临时脚本执行，等价的可复现驱动保存在 `verify-browser.cjs`；它是直接浏览器路径诊断，不是实现后补写的单元测试。没有新增隔离测试或修改 package.json。观察流程：记录未激活请求；生成三组输入摘要；依次选择两种视图 × 三种密度，等待出帧，播放约 400 ms 后暂停，观察 400 ms，继续约 400 ms，跳过，等待落帧后再观察 500 ms，关闭；最后检查完整生长、旋转缩放与导航。

补充临时浏览器诊断调用 `WEBGL_lose_context.loseContext()` 检查丢失/重开；在 pagehide 后用 sessionStorage 临时保存数字快照检查释放（随临时浏览器资料一起销毁）。另检查 import 尚未完成时立即关闭，不创建延迟 canvas。这些运行日志与自动化浏览器资料没有提交。

## 观察结果

类型检查、扩展构建与独立原型构建通过。最终入口约 3.58 kB（gzip 1.90 kB），动态场景块约 530.91 kB（gzip 132.35 kB）。Vite 提示场景块超过 500 kB，未隐藏该警告。扩展状态页产物仍只有约 2.22 kB 的 popup 脚本，未加载探针。未激活浏览器请求只有 HTML 和入口脚本，canvas 数为 0；激活后才有 Three.js 场景块与 WebGL。

下表保留审核修订前 `d7127d8` 的六组**短播放、暂停、继续、跳过**数字，不是完整动画 FPS 基准，也不代表 City 优化后的当前性能。`setupMs` 不含模块下载；累计 renderMs 是 CPU 提交时间；帧间隔包括浏览器调度，不是 GPU 时间。

| 视图/密度 | setup ms | 总绘制帧 | 活跃帧间隔 P50/P95 ms | 累计几何更新 ms | 累计 render ms |
| --- | --- | --- | --- | --- | --- |
| City sparse | 221.5 | 39 | 33.3 / 66.6 | 3.3 | 52.4 |
| City regular | 70.0 | 26 | 33.4 / 66.7 | 5.2 | 19.6 |
| City dense | 43.0 | 30 | 33.4 / 83.4 | 1.5 | 20.4 |
| Terrain sparse | 76.2 | 29 | 33.4 / 66.6 | 68.3 | 37.3 |
| Terrain regular | 51.7 | 27 | 33.4 / 66.6 | 55.4 | 14.8 |
| Terrain dense | 43.8 | 31 | 33.3 / 66.6 | 72.4 | 17.7 |

- 六组暂停窗口新增帧均为 0；继续分别前进约 335–365 天；跳过后均为 7305 天、playing=false、pendingFrame=false，后续 500 ms 新增帧为 0。
- 全量 City：1 draw call、87660 三角形；Terrain：1 draw call、14418 三角形。每次 geometryBuilds=1，renderer.info 显示活动时 geometries=1、textures=0、programs=1。
- 六次顺序打开关闭后，每次 canvas=0、几何=0、纹理=0、程序=0、pendingFrame=false；没有出现这些可观察计数累积。它们不证明驱动已回收所有内存，更不是精确显存测量。
- dense / Natural 的完整 City 生长单独观察到 92 帧，P50/P95 间隔 66.6/233.3 ms，累计更新 14.7 ms、render 54.5 ms；结束后无续帧。拖动与缩放新增 2 帧后停止。
- 最终源码补充的 sparse / Signature 完整 Terrain 生长观察到 281 帧，P50/P95 33.3/33.4 ms，累计更新 503.6 ms、render 84.1 ms，网格仍只构建 1 次，结束后无待提交帧。
- 软件渲染存在明显调度波动，完整 City 没有达到 60 FPS；不能据此认定普通桌面 GPU 达标或不达标，也未建立性能预算。
- import 后立即关闭的竞态：opens=0、canvas=0；无延迟重开。上下文强制丢失后 contextLost=true、playing=false、pendingFrame=false，重开正常。pagehide 后 opens=closes=2、canvas=0，资源计数归零。首轮与最终源码复跑的浏览器 pageerror 列表均为空；最终复跑诊断退出码为 0。

## 后台证据与局限

`Emulation.setPageVisibilityState` 在本 Chromium 中不支持；`Browser.setWindowBounds` 最小化后 document.hidden 仍是 false，因此**真实标签隐藏/恢复未验收**。不能拿浏览器节流或不支持的命令作为通过依据。

另在浏览器内显式覆盖 document.hidden 并派发 visibilitychange，只验证处理路径：Terrain 从 frames=4、visibleDays=106 隐藏 300 ms 后数值不变、pendingFrame=false；隐藏期间跳过，恢复后仅多绘制 1 帧、显示 7305 天且不续帧。这是人工可见性条件的诊断，不代表原生后台事件已验证。它促使实现确保恢复时也为静止但已改变的场景补绘一帧。

未验收：真实 Chrome/Edge 扩展加载与页内导航、真实 GitHub 滚动/点击对照、真实用户数据/缓存、真实标签行为、减少动态效果偏好、视觉布局、真实 GPU 性能/内存/功耗、高 DPI 设备、长时间重复周期的驱动内存趋势。上下文丢失仅停帧并通过诊断指标显示，正式 MVP 仍须明确产品反馈。本轮没有身份/获取/缓存能力。

## 本地硬件后续步骤

1. 同一目标设备记录 Chrome/Edge 版本、系统、CPU/GPU、电源模式、窗口尺寸/DPR。按任务文档启动独立入口，禁用软件渲染强制参数，核实实际后端。
2. 未激活时确认没有场景块请求和 canvas。六组输入分别完整播放，记录初始化、帧间隔、更新与 CPU render 时间；使用浏览器性能录制补充长任务与交互证据，真实 GPU 证据与 JS 计数分开。暂停/静止至少各观察 5 秒。
3. 真实切换到其他标签至少 5 秒，检查帧/天数不变且无 pending RAF；恢复从同一天继续。手动暂停后隐藏/恢复仍暂停；后台点击跳过的处理路径可用诊断接口复核。
4. 旋转、缩放、调整窗口、高 DPI 下检查单帧调度。至少 20 次打开/关闭、导航离开，记录 canvas、几何、纹理、程序与浏览器可取得的上下文/内存趋势；不可将这些计数换算成显存。确认上下文丢失后可关闭重开。
5. 后续集成扩展后，在同设备同 GitHub 页面比较未安装/未激活与播放时的滚动、点击和导航；本原型无法完成该项。减少动态效果偏好与产品失败反馈在 MVP 验收，不以本报告替代。

报告写完后停止服务，删除本轮 `$CY_PROBE_TMP` 内的日志、缓存、浏览器资料、生成产物与临时脚本；Git 仅保留正式原型源码、可复现诊断入口及本报告。

## PR 审核修订与复验

针对 `d7127d8` 的四项意见：

1. `schedule()` 和 `tick()` 都在上下文丢失时返回，滚轮、拖动、ResizeObserver 或可见性回调不再重启帧；即使旧回调已被取出也不计绘制帧。
2. 构建/preview 必须通过 `--outDir` 指定本轮隔离目录；开发服务器不创建构建目录。诊断驱动不再从固定 `/tmp` 路径加载 Playwright，运行说明同步为 `mktemp -d` 和显式模块路径。
3. City 初始化时写完所有实例矩阵，生长只改变实例显示数量，不逐帧重算矩阵或上传整个缓冲；Terrain 的高度场更新方式保持不变。
4. 已停止播放时 `pause()` 不取消待绘制帧，保留 `skip()` 请求的最终一次绘制。

验证范围在修改前确定并写入临时检查：真实交互难以可靠命中同一任务内 skip/pause 或已出队 RAF，因此使用受控调度隔离这些时序，再实际运行完整 City 动画。没有在实现后补写单元测试；临时检查和输入不入 Git。

受控检查直接导入真实 `createScene`，使用真实 WebGL renderer 与 `WEBGL_lose_context`，将 RAF 放入可推进的队列。输入沿用三组 7,305 天生成规则；分别对 City/Terrain 发起丢失上下文后的 wheel、pointer、尺寸变化、visibilitychange 和旧帧回调，检查帧数/天数不变且无待排帧；另验证同任务 skip→pause 最终绘制、正常暂停/继续/静止/释放。City 在初始化后包裹同一个 Three.js 模块的 `setMatrixAt` 计数，推进生长时不得继续增加；构造器自己的单位矩阵写入不算重复生长更新。

同一受控检查在原提交上为 2 项通过 / 13 项失败，包含 City 矩阵写入从 7,305 增至 8,674；修订后 15 项全部通过。人工事件仅验证处理路径，不代替真实后台/原生指针交互验收。验证页中最初混用了两份 Three.js 模块实例，修正导入后重新对照原提交与修订版，不把该验证计数问题误当作产品缺陷。

本地完整生长环境：同日 Chrome 156.0.8078.76，macOS，本机后端实际报告 `ANGLE (Apple, ANGLE Metal Renderer: Apple M1, Unspecified Version)`；浏览器窗口 1920 × 905，场景 800 × 460，设备 DPR 2，原型内部上限 1.5，Signature；电源模式、精确显存与功耗未记录。该验证页使用同一真实 renderer，运行默认约 8 秒的完整生长，再观察 500 ms 静止，没有使用受控 RAF。结果：

| City 密度 | 绘制帧数 | 帧间隔 P50 / P95 ms | 累计更新 ms | 累计 CPU render ms |
| --- | --- | --- | --- | --- |
| sparse | 202 | 40.0 / 40.7 | 0.3 | 42.7 |
| regular | 203 | 40.0 / 41.0 | 0.2 | 43.2 |
| dense | 203 | 40.0 / 40.9 | 0.6 | 34.6 |

三组均达到 7,305 天、`playing=false`、`pendingFrame=false`，随后 500 ms 未新增绘制；全量均为 1 draw call、87,660 三角形、geometryBuilds=1。以上不是云端 SwiftShader 的同机前后对照，不能从两套数字计算优化幅度；约 40 ms 的观测间隔也未达到 60 FPS 目标。不扩大为目标硬件全矩阵通过。

命令：`npm run check`、`npx tsc --noEmit -p probes/rendering/tsconfig.json`、`node --check probes/rendering/verify-browser.cjs`、`git diff --check` 通过。两个独立 `--outDir` 的构建同时执行均通过，产物分别存在，没有共用清空目录；不传 `--outDir` 则明确报错且不写固定目录。动态场景包仍约 530.94 kB，500 kB 警告保留。共享入口和依赖未修改，不额外重建或覆盖项目中正在安装的 P1-A `dist/`。

本次只保留本报告；临时服务、验证页、旧源码对照、样本、构建及日志结束后清理。云端首次的六组完整诊断脚本未在本轮重新运行；这里仅报告实际执行的针对性路径和三组本地 City 重测。Edge、真实后台、扩展集成、长期资源趋势和性能预算仍待验收。
