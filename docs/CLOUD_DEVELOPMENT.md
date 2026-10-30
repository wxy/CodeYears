# Codex 云端开发接续

更新日期：2026-10-29。此文档是环境配置与任务说明；不是环境已创建、已发布或已运行的证明。实际状态以 Codex 页面和任务结果为准。

## 环境目标

| 项目 | 配置 |
| --- | --- |
| 名称 | CodeYears |
| 仓库 | `wxy/CodeYears`，已公开 |
| 代码起点 | 初始化未合入时选 `codex/project-bootstrap`；合入后选实际最新 `main` |
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
5. 第一个任务固定正确的起点，并读下方指令执行 P1-A。记录环境与任务链接、实际提交和检查结果。

可在选定代码目录执行：

```sh
npm ci
task_tmp=$(mktemp -d "${TMPDIR:-/tmp}/codeyears-cloud.XXXXXX")
npm run build -- --outDir "$task_tmp/dist"
# 根据实际任务运行直接路径验证，完成报告后清理本次 task_tmp。
```

安装失败先保留报错并定位 Node、锁文件或网络原因，不绕过锁文件更新全部依赖；若确实需要修改依赖，按 PR 流程单独说明原因。

## 首个云端任务指令

```text
继续开发 wxy/CodeYears。先检查 Git 当前分支和提交，读取 AGENTS.md、README.md、docs/PRODUCT.md、docs/DEVELOPMENT_PLAN.md、docs/DATA_AND_PRIVACY.md、docs/PERFORMANCE.md。

本轮执行 DEVELOPMENT_PLAN 的 P1-A：无 Token 的 GitHub 同源贡献页面获取与真实每日数量解析原型。先观察真实公开页面及指定年份响应，记录证据，再选择数量来源、实现最小请求/解析与可运行的浏览器诊断路径。不能由贡献颜色等级反推数量，不猜测接口稳定性、解析规则或年度统计一致性。

扩展完全免费，无独立登录、无后端、无 Token；仅 City/Terrain、Signature/Natural，Time Travel 与按需渲染方向保持。此次不实现正式 3D 视图或网站。

从环境中实际存在的初始化分支开始；如果 PR #1 已合入，则使用最新 main。为本工作包创建功能分支，以正确 base 提交 PR；不直接写 main，不合入 PR。若初始化未合入，可向 codex/project-bootstrap 创建堆叠 PR。

按改动风险验证。云端无法证明的 Chrome/Edge 实装、本人/他人/退出登录和私有贡献路径，明确标为待本地验收，并提供最小可重复步骤。不要导入用户本机 Cookie/Token，不将模拟数据、软件渲染或公开匿名响应冒充已登录与硬件验收。

将环境、输入、命令/操作、实际结果、未验证项写到 docs/reports/P1-A-DATA-PROBE.md，更新工作包进度。测试过程文件只放任务临时目录并在报告后清理，不进入 Git。必要的隔离测试必须先列失败方式、先写测试再实现，不能实现后补写单元测试。

完成后提交、推送并创建/更新 PR，提供 PR 链接、验证结果和本地待验收清单。权限或环境阻塞时如实报告，不声称 PR 或验收成功；本轮不越过 P1-G 开始正式 City/Terrain MVP。
```

## 云端与本地证据

| 云端可推进 | 仍需真实目标环境验证 |
| --- | --- |
| 锁文件安装、类型检查、MV3 构建和产物核对 | Chrome / Edge 的实际加载、权限提示和页内导航 |
| 可访问的公开贡献页面与解析调查 | 现有登录会话、A/B/退出切换和私有贡献可见性 |
| 无凭证的浏览器诊断、失败/取消路径 | 多标签页登录变更及 SSO/权限变化 |
| 确定性 20 年输入、时间轴和渲染原型 | 用户目标设备的 GPU、功耗、内存趋势和 GitHub 交互影响 |

真实浏览器可用时云端也可形成对应证据，但应准确注明版本、是否登录、渲染后端和硬件。不能把“云端可运行”扩大为“所有本地验收通过”。

官方配置入口与说明：[Codex Cloud](https://learn.chatgpt.com/docs/cloud)、[Cloud environments](https://learn.chatgpt.com/docs/environments/cloud-environments)。账号界面、已连接仓库权限与实际准备结果优先于静态说明。
