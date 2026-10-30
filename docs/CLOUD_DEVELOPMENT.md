# Codex 云端开发接续

更新日期：2026-10-30。云端 P1-C 的 PR #2 和本地 P1-A 的 PR #3 均已合入。独立 Time Travel 时间轴原型（`codex/time-travel-probe`）以 `12b00e2` 为起点，已交付 [PR #4](https://github.com/wxy/CodeYears/pull/4)；本地 P1-B 交付 [PR #5](https://github.com/wxy/CodeYears/pull/5)。两者均未合入。实际验收状态以对应报告、PR 和 Codex 结果为准。

## 环境目标

| 项目 | 配置 |
| --- | --- |
| 名称 | CodeYears |
| 仓库 | `wxy/CodeYears`，已公开 |
| 代码起点 | 初始化已合入；后续任务使用实际最新 `main`，保留现有工作分支 |
| 运行时 | 优先 Node.js 24 系列与 npm；实际版本写入云端报告 |
| 依赖 | 仓库根目录 `npm ci`，使用现有锁文件 |
| 检查 | `npm run check`；构建输出到本任务临时目录 |
| 凭证 | 产品和环境准备无需新增 GitHub Token、Cookie、独立登录或 API 密钥；Git 仓库权限使用 Codex 已连接账户的正常能力 |
| 共享 | 环境保持仅本人可用即可；源码公开不要求环境也公开 |
| 网络 | 允许包管理器；数据原型需要访问 `github.com`，官方技术文档按实际需要放行；不为未知需要启用所有域名 |

云端创建界面可能存在当前环境和 legacy 环境两种流程。按账号实际显示创建；不要把 legacy 环境配置或 ChatGPT Work 云端聊天误称为已经创建 CodeYears 的 Codex 开发环境。

## 创建与检查

1. 在 Codex 的 Cloud 环境选择器或环境设置中查找 CodeYears，优先复用匹配环境，避免重复创建。
2. 新建时仅选择 `wxy/CodeYears`，让环境安装项目依赖。若默认检出 `main` 而它还是空白，应明确选择初始化分支，或让环境准备任务先检出该分支再安装；不要假设安装过空白分支就已准备好开发环境。
3. 确认 Node/npm 版本、锁文件安装、类型检查及临时目录构建成功。当前本地证据是 macOS/Node 26，不替代云端 Linux/Node 24 的实际检查。
4. 当前环境有 Publish 时，审阅准备结果、保存并发布，看到实际成功状态后才启动任务；legacy 流程按实际可用状态确认。
5. 本地执行 P1-A，云端固定正确的起点并执行 P1-C。记录环境与任务链接、实际提交和检查结果。

可在选定代码目录执行：

```sh
npm ci
task_tmp=$(mktemp -d "${TMPDIR:-/tmp}/codeyears-cloud.XXXXXX")
npm run build -- --outDir "$task_tmp/dist"
# 根据实际任务运行直接路径验证，完成报告后清理本次 task_tmp。
```

安装失败先保留报错并定位 Node、锁文件或网络原因，不绕过锁文件更新全部依赖；若确实需要修改依赖，按 PR 流程单独说明原因。

## 首轮云端 P1-C 任务指令（历史）

```text
继续开发 wxy/CodeYears 的 P1-C 20 年渲染原型，先读 AGENTS.md、docs/PERFORMANCE.md 和 docs/DEVELOPMENT_PLAN.md。

使用独立分支 codex/p1-render-probe，以包含共同起点 cde38e6 的 main 为 PR base。保留已有修改，不重置，不合入 PR。

仅修改 src/renderers/probe/**、probes/rendering/**、docs/tasks/P1-C.md 和 docs/reports/P1-C-RENDER-PROBE.md。本地 P1-A 独占数据解析、GitHub 请求、扩展入口、manifest、依赖及主构建；需要改共享文件时先协调。

使用现有 Three.js / Vite 依赖，运行时确定性生成 2006–2025 共 7305 天，覆盖稀疏/常规/高密度。实现独立 City / Terrain 轻量原型、按需加载、生长/暂停/继续/跳过、静止停帧、后台暂停及关闭释放。此入口是工程诊断工具，不是独立网站或正式 MVP。

验证完整浏览器路径，记录输入规则、版本、渲染后端、实际命令、观测数据和未完成验收。云端软件渲染不代表真实 GPU、功耗、显存或 GitHub 集成已通过。不在实现后补单元测试；测试过程文件在临时目录并在报告后清理。

提交、推送并创建独立 PR，明确未完成的真实硬件/浏览器验收。完成后仍须与 P1-A/B 的结果一起经过 P1-G。
```

## 云端与本地证据

第二轮只允许云端修改 `src/timeline/**`、`probes/timeline/**` 和自己的时间轴任务/报告；不改缓存、GitHub 请求、主扩展入口、权限、共享依赖或全局计划。目标是 7,305 天全量输入从零生长、暂停/继续/跳过/重播，暂停和完成后不续帧。核心控制器由调用者推进时间，不常驻 RAF，不耦合 WebGL 或数据请求。它是 P2-B 前置原型，不代表 P1-G/正式集成通过；仍通过独立 PR 交付并等待用户合入授权。

| 云端可推进 | 仍需真实目标环境验证 |
| --- | --- |
| 锁文件安装、类型检查、MV3 构建和产物核对 | Chrome / Edge 的实际加载、权限提示和页内导航 |
| 可访问的公开贡献页面与解析调查 | 现有登录会话、A/B/退出切换和私有贡献可见性 |
| 无凭证的浏览器诊断、失败/取消路径 | 多标签页登录变更及 SSO/权限变化 |
| 确定性 20 年输入、时间轴和渲染原型 | 用户目标设备的 GPU、功耗、内存趋势和 GitHub 交互影响 |

真实浏览器可用时云端也可形成对应证据，但应准确注明版本、是否登录、渲染后端和硬件。不能把“云端可运行”扩大为“所有本地验收通过”。

官方配置入口与说明：[Codex Cloud](https://learn.chatgpt.com/docs/cloud)、[Cloud environments](https://learn.chatgpt.com/docs/environments/cloud-environments)。账号界面、已连接仓库权限与实际准备结果优先于静态说明。
