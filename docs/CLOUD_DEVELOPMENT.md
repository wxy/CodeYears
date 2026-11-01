# Codex 云端开发接续

更新日期：2026-11-01。用户授权后，PR #15 已保留历史合入 main，共同起点为 `e432b1020518df414819b7202f305e53fbda218d`。标定 City、季度道路、连续 Terrain 和清晰近景已进入主线，功能证据见 [接入报告](reports/CALIBRATED-CITY-INTEGRATION.md)。新一轮四项实现与报告已通过 PR #16–#19 合入，组合检查见 [合入报告](reports/PR-16-20-INTEGRATION.md)；P1-G 尚未整体通过。

## 当前并行安排

各项均从上述合入提交建立独立分支，向 main 单独提 PR；本轮用户后续已授权审查并合入，四项均已完成。具体边界、验收和状态见 [本轮任务安排](tasks/CITY-PARALLEL-2026-10-31.md)。

| 任务 | 分支 | 独占范围 | 交付 |
| --- | --- | --- | --- |
| 云端 · 建筑占地匹配 | `codex/city-footprint-matching` | `src/renderers/city-parcels.ts` 与自己的任务/报告 | [PR #17](https://github.com/wxy/CodeYears/pull/17) 已审查合入；停止缺素材的长条中高层合并，保留有效组合和数据守恒 |
| 云端 · 城市图例 | `codex/city-legend` | `src/extension/content.ts`、`probes/city/` 的页面/入口、必要的图例模块与自己的任务/报告 | [PR #16](https://github.com/wxy/CodeYears/pull/16) 已审查合入；说明贡献等级、融合地块和装饰景观，City/Terrain 切换正确 |
| 本地 · 真实浏览器 | `codex/city-local-browser` | 只新增 `CITY-LOCAL-BROWSER` 任务/报告 | [PR #18](https://github.com/wxy/CodeYears/pull/18) 已审查合入；真实播放/近景/关闭/导航通过，后台无法定论，Edge 未验收 |
| 本地 · 性能基线 | `codex/city-local-performance` | 只新增 `CITY-LOCAL-PERFORMANCE` 任务/报告 | [PR #19](https://github.com/wxy/CodeYears/pull/19) 已审查合入；60 Hz 本机基线、暂停与释放有证据，首次全景尖峰仍待定位 |

云端环境配置显示就绪不代表任务实际执行或代理可用。本轮占地任务首次遇到 `proxy:8080` 连接拒绝，续跑查明命令工具需要显式启用网络权限；启用后原代理正常，取基线、依赖安装和构建通过，无需更换环境。应使用正常代理和平台诊断，不能绕过网络策略；有源码或规划检查也不冒充完整构建、真实 MV3 或硬件验收。主代理按实际结果承接必要的本地补验。

本地两项可并行准备和分析，桌面/浏览器操作由一项独占，交接后另一项才开始，避免后台可见性和性能测量互相干扰。主代理只维护共同计划、集成和 PR 审查；运行源码和图例分别交给两项云端任务，不抢写其文件。

## 历史并行安排

以下 A/B/C/D 从此前基线开发，均已合入。各自完成度与验收只以对应提交/报告为准，不把实例在线当作网络可用，也不把云端结果当作用户真实会话验收。

| 任务 | 分支 | 独占范围 | 核心交付与边界 |
| --- | --- | --- | --- |
| A · 公开未登录补证 | `codex/p1-public-session-validation` | 新增 `docs/tasks/P1-G-PUBLIC-SESSION.md`、`docs/reports/P1-G-PUBLIC-SESSION.md` | [PR #8](https://github.com/wxy/CodeYears/pull/8) 已合入 `0240d63`。两个真实匿名样本为 wxy/2024 366 天/440、torvalds/2025 365 天/2925，原解析器合计与标题一致。Chromium TLS 信任阻塞，未取得完整 MV3/真实缓存证据；未改权限或源码绕过。不冒充本机退出登录/A-B 验收 |
| B · 时间轴与渲染前置对接 | `codex/render-timeline-integration` | `src/renderers/probe/scene.ts`、必要的 `probes/rendering/main.ts`，自己的 `RENDER-TIMELINE-INTEGRATION` 任务/报告 | [PR #10](https://github.com/wxy/CodeYears/pull/10) 已合入 `bbdc299`，交付 `84adaf1`，源码 `b398830`。云端新旧路径对照通过；本地 City regular / Terrain dense 的暂停/跳过/自然完成与释放复核通过，约 16.7 ms P50。不改视觉、DPR、正式扩展或共享时间轴 |
| C · 年度历史组装 | `codex/contribution-history-assembly` | 新增 `src/data/history.ts`，自己的 `HISTORY-ASSEMBLY` 任务/报告 | [PR #7](https://github.com/wxy/CodeYears/pull/7) 已合入 `c82625b`，本地复跑原报告检查通过。组合真实日期有序的只读历史，区分完整/部分与缺失年份，不填零、不改 count、不推进播放，拒绝跨主页或重复年度混入 |
| D · 多年份顺序加载 | `codex/year-history-loader` | 新增 `src/platform/github/load-history.ts` 及自己的 `YEAR-HISTORY-LOADER` 任务/报告 | [PR #12](https://github.com/wxy/CodeYears/pull/12) 已合入 `0cb5044`，head `27bb516`、源码 `216c9a8`。云端报告 9 项受控浏览器检查及类型/构建通过；不等于真实登录会话。复用年度加载与历史组装，顺序加载、失败/取消/身份变化停止；UI 由本地后续分支接入 |

各任务不修改 README、全局计划、共享类型、依赖/锁文件、manifest 或扩展入口，不互相修改对方报告。发现主线缺陷或共享接口需求先报告；功能/修复仍在对应分支通过 PR 交付。不为保持并发而增加范围外功能，不等待全部边界条件一致才交付原型。

本地负责真实用户会话、Edge、实际显示器与后台验收。[60 Hz 原始补充](reports/P1-G-60HZ.md) 的六组证据与 [PR #10 本机复核](reports/MAINLINE-2026-10-31.md) 的两个组合分开绑定提交，不直接继承旧版本 PASS。当前已接入多年份，下一步优先完善可见场景，不为保持并发重复派发数据组织任务。正式验收仍依赖 P1-G 收敛。

## 环境目标

| 项目 | 配置 |
| --- | --- |
| 名称 | CodeYears |
| 仓库 | `wxy/CodeYears`，已公开 |
| 代码起点 | 本轮固定 `e432b102…`；其他后续任务使用各自明确约定的 main 提交，保留现有工作分支 |
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
