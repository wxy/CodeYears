# P1-C · 20 年渲染原型

状态：[PR #2 已合入](https://github.com/wxy/CodeYears/pull/2)；实现完成，本机 Metal 补充证据及目标帧率、真实后台待验收范围见 [P1-G 报告](../reports/P1-G-READINESS.md)。2026-10-30。

起点：`cde38e6fdb723471743041116df8d2e9f346a78f`。分支 `codex/p1-render-probe`；初始化 PR #1 已合入，PR base 为 `main`（核实合并提交 `ae876a45d7cb93fbd30826a5fe0ba350400bc85c`）。

## 范围

仅 `src/renderers/probe/`、`probes/rendering/` 与本任务/报告文档。复用只读 `DailyContribution`，运行时生成模拟数据；不改共享契约、依赖、扩展入口或主构建。它是扩展正式开发前的负载诊断入口，不是独立产品网站或 MVP，不获取 GitHub 数据，也不验证缓存与登录。

City 共享一个盒体、材质和 InstancedMesh；Terrain 复用一个高度场网格。激活才动态加载本地 Three.js，约 8 秒生长，可暂停、继续、跳过；拖动旋转、滚轮缩放。暂停停止时间轴推进，并保留已排队的最后一次补绘，以显示调整尺寸后的画布；完成后不连续请求帧。隐藏时取消帧并冻结时间，恢复时重置时钟；关闭/pagehide 释放对象、监听与上下文。异步加载通过代次标记取消。上下文丢失后停帧，可关闭或重新激活。

## 运行

仓库根目录。每轮建立独立系统临时目录；构建和 preview 必须显式提供 `--outDir`。配置使用 `emptyOutDir: false`，不自动清空输出目录中的其他资料；每轮仍使用新目录，记录报告并停止服务后再清理本轮目录：

```sh
CY_PROBE_TMP="$(mktemp -d "${TMPDIR:-/tmp}/codeyears-p1-c.XXXXXX")"
npm ci --cache "$CY_PROBE_TMP/npm-cache"
npm run check
npx tsc --noEmit -p probes/rendering/tsconfig.json
npm run build -- --outDir "$CY_PROBE_TMP/extension-dist"
npx vite build --config probes/rendering/vite.config.ts --outDir "$CY_PROBE_TMP/probe-dist"
npx vite --config probes/rendering/vite.config.ts
```

打开 Vite 输出的本地地址。或以静态服务提供本轮构建，例如 `python3 -m http.server 4173 --bind 127.0.0.1 --directory "$CY_PROBE_TMP/probe-dist"`。开发入口不接入扩展状态页。

点击“读取指标”更新显示；诊断本身没有轮询帧。控制台可调用 `window.renderProbe.snapshot()`，关闭后 `lastClosed` 保留释放后的纯数字快照。`setupMs` 是场景初始化耗时，不含动态下载；`renderMs` 是 CPU render 调用累计耗时，不是 GPU 时间；帧间隔分位数包含调度延迟，不能当作 GPU 耗时。资源计数不是显存字节。

可选完整浏览器诊断（Playwright 仅安装到临时目录，不修改项目依赖）：

```sh
npm install --prefix "$CY_PROBE_TMP/automation" --cache "$CY_PROBE_TMP/npm-cache" playwright-core
PROBE_PLAYWRIGHT_MODULE="$CY_PROBE_TMP/automation/node_modules/playwright-core" node probes/rendering/verify-browser.cjs
```

脚本默认访问 `127.0.0.1:4173`，使用 `/usr/bin/chromium` 与 SwiftShader；可通过 `PROBE_URL`、`PROBE_CHROMIUM`、`PROBE_PLAYWRIGHT_MODULE` 设置路径。未设置模块路径时只按标准 Node 模块解析查找 `playwright-core`，不读取其他轮次的固定临时路径。输出写到任务临时目录；停止服务、记录报告后删除 `$CY_PROBE_TMP`。脚本故意报告真实可见性结果；不支持的 CDP 命令不等于后台验收通过。

## 验收状态

类型与双构建通过；云端软件渲染的六组暂停/继续/跳过/静止、重复关闭、异步关闭、上下文丢失重开和 pagehide 通过。真实后台切换、Chrome/Edge 扩展集成、GitHub 交互对照、真实 GPU/功耗/显存仍待验收。输入规则、实际数字和本地步骤见 [报告](../reports/P1-C-RENDER-PROBE.md)。不因此宣布 P1-G 通过。
