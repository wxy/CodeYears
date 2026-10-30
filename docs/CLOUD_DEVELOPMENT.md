# Codex 云端开发接续

更新日期：2026-10-30。P1-C、P1-A、时间轴、缓存及 [P1-G 进度 PR #6](https://github.com/wxy/CodeYears/pull/6) 均已合入，当前 main 起点为 `a626ab4`。用户明确要求增加可独立进行的云端任务，已在现有可运行 CodeYears 环境启动下列三项；本地 `codex/p1-60hz-validation` 独占本机验收与全局状态文档。P1-G 尚未整体通过，不提前把云端前置模块当作正式 MVP。

## 当前并行安排

三项从已合入 PR #6 的最新 main 分别建分支，独立 PR 交付，暂不合入。创建后已通过任务状态确认均已启动；本轮结束时 A/C 已分别交付 PR #8/#7，尚未由根任务完整审查，B 仍在执行。实际完成度、提交和验收以各自报告/PR 为准。

| 任务 | 分支 | 独占范围 | 核心交付与边界 |
| --- | --- | --- | --- |
| A · 公开未登录补证 | `codex/p1-public-session-validation` | 新增 `docs/tasks/P1-G-PUBLIC-SESSION.md`、`docs/reports/P1-G-PUBLIC-SESSION.md` | [PR #8](https://github.com/wxy/CodeYears/pull/8) 已交付待审，`e19b81d`。两个真实匿名样本为 wxy/2024 366 天/440、torvalds/2025 365 天/2925，原解析器合计与标题一致。Chromium TLS 信任阻塞，未取得完整 MV3/真实缓存证据；未改权限或源码绕过。不冒充本机退出登录/A-B 验收 |
| B · 时间轴与渲染前置对接 | `codex/render-timeline-integration` | `src/renderers/probe/scene.ts`、必要的 `probes/rendering/main.ts`，自己的 `RENDER-TIMELINE-INTEGRATION` 任务/报告 | 独立 3D 原型复用已合入的 createTimeline，替换重复播放算法，保持生长/暂停/跳过/停帧与释放行为。不改视觉、DPR、正式扩展或共享时间轴；受影响路径直接验证，云端渲染证据不代替本机 GPU |
| C · 年度历史组装 | `codex/contribution-history-assembly` | 新增 `src/data/history.ts`（或同名目录）、必要的 `probes/history/`，自己的 `HISTORY-ASSEMBLY` 任务/报告 | [PR #7](https://github.com/wxy/CodeYears/pull/7) 已交付待审，`bd2fd34`。将已校验年度记录组合为真实日期有序的只读历史，区分完整/部分与缺失年份，不填零、不改 count、不推进播放，拒绝跨主页或重复年度混入。不做网络、缓存或正式 UI |

三个任务不修改 README、全局计划、共享类型、依赖/锁文件、manifest 或扩展入口，不互相修改对方报告。发现主线缺陷或共享接口需求先报告；功能/修复仍在对应分支通过 PR 交付。不为保持并发而增加范围外功能，不等待全部边界条件一致才交付原型。

本地负责真实用户会话、Edge、实际显示器与后台验收。[60 Hz 本机补充](reports/P1-G-60HZ.md) 已取得六组约 60 FPS 证据，云端后续渲染改动须按影响面另行复验，不能直接继承旧提交的 PASS。三项前置工作可独立于这些本地条件推进，正式 City 集成仍依赖 P1-G 收敛。

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
