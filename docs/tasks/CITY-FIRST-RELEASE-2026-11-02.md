# City 首发收尾：2026-11-02

共同主线：`4024b7617dc88cd706c82d154228dfe685f4e30e`（#45保留历史合入）。本轮用户授权完成此前设计审查后的首发收尾，并将独立工作委托云端。#35已按用户要求关闭，独立导出/分享实验不再接入。

## 完成条件与授权边界

1. 页内控件与“更多”分组清楚，点击外部/Esc可退出菜单；保留原图/城市、同一画布展开返回、真实数据填入与浮层，补齐基础键盘平移。用户追加：英文菜单各组/折叠行边界清楚，展开dialog可点击遮罩退出，内容操作与拖动不误关。
2. 扩展图标左键仍一键打开城市；图标原生右键“选项”提供全局语言、帮助、隐私、版本、反馈。复用现有本地语言键，不增加权限、账户、后端或遥测。
3. 当前组合在本机完成20年首次加载/缩放平移/静止/后台/重复关闭的直接检查，记录长任务与可取得的内存/释放证据；不把历史3D原型或云端软件渲染结果迁移为通过。
4. 中英文商店材料、正式示例截图、README、隐私与素材说明对应实际City，不再宣称暂停/跳过/重播或Terrain/独立导出。
5. 核对最终ZIP、干净安装/更新提示与支持浏览器；达到可审阅候选后，再由用户决定商店上传/提交审核/发布。本轮没有这些最终发布动作授权。

用户2026-11-02明确决定不做隔离测试账户：本轮不创建第二账户、不退出日常会话、不安排A/B切换矩阵；保留既有身份作用域与实时核对逻辑。报告明确该范围未覆盖，不能写成测试通过，也不将其继续列为本轮必须向用户索取账户的阻塞。

## 并行文件边界

共同文案契约在 `codex/city-first-release-rc` 先推送，新增12条中英文消息；不改变当前运行流程。所有任务从该分支推送的固定SHA开新分支，PR base为该分支，各自独立交付，不自动合入。

| 工作包 | 分支 | 独占修改与交付 |
| --- | --- | --- |
| 云端A：页内体验/键盘 | `codex/city-release-page-polish` | `src/extension/content.ts`、`src/renderers/landscape.ts`，自己的任务/报告；“更多”分组/折叠、外部与Esc关闭、焦点恢复、键盘平移；不改数据/缓存/年份/渲染布局/素材/时间轴协议 |
| 云端B：图标设置入口 | `codex/city-release-options` | 新`options.html`/`src/extension/options.ts`、`public/manifest.json`、`vite.config.ts`、必要构建/打包核验脚本、自己的任务/报告；左键popup行为不改；只用已有权限和本地语言键 |
| 云端C：商店材料 | `codex/city-release-store-materials` | `docs/STORE_LISTING.md`、`README.md`、`docs/store/city-0.1.0/**`及自己的任务/报告；双语准确文案、可复现正式示例截图；不改运行源码/素材、全局计划或权限 |
| 本地：组合验收/发布清单 | `codex/city-first-release-rc` | 本任务、`docs/RELEASE_READINESS.md`/`docs/DEVELOPMENT_PLAN.md`/`docs/CLOUD_DEVELOPMENT.md`/`docs/ROADMAP.md`、必要来源/隐私说明和本地报告；构建组合到项目dist，在独立Chrome窗口验收；不抢写云端源码 |

共用 `public/_locales/*/messages.json` 由本地维护，云端仅使用已有消息。A使用 `moreProfileSection`/`moreHelpSection`/`keyboardControls`/`canvasKeyboardLabel`；B使用 `settingsTitle`/`settingsHelp`/`settingsAbout`/`settingsSaved`/`version`/`privacy`/`help`/`feedback` 与既有语言文案。若确需额外文案先报告，不并发争写词库。

## 顺序与证据

先固定共同文案/任务基线 → 云端A/B/C并行 → 本地审查各PR → 临时组合工作树直接验收与打包 → 汇总实际结果和剩余外部条件。云端可做受控端到端、软件绘制与包检查，不代表真实GitHub登录、用户硬件、Edge或安装提示。

截图/日志/生成数据/ZIP/测试浏览器目录等过程产物放TMP，结束清理，只保留报告；`docs/store`明确作为正式商店产品素材生成的图片可以交付，必须标注示例数据和所对应提交，不能把测试截图改名当正式素材。云端需要测试时优先临时端到端，不在实现后补单元测试。

新增“缩放比例显示”“放大到最大”由用户明确后置，本轮不实施；建议全景为100%，最大倍率复用当前画布动态上限。Terrain、双主题、扩充素材、独立网站和导出/分享不扩张。

## 实际派发与结果

共同执行SHA `e3a609e84a821b2a792711c888f63f27edc120e5` 已推送。2026-11-02向三个既有Codex Cloud任务发送后继指令，现已分别交付#47/#48/#49。没有新建用户聊天；PR仍开放、不合入：

| 工作包 | 云端chat ID | host |
| --- | --- | --- |
| A 页内体验 | `01a1974f-7af2-76fc-8a1c-fd8660c8908c` | durable |
| B 全局选项 | `01a1974f-aaac-771a-a1e2-544fe1ee00bb` | durable |
| C 商店材料 | `01a1974f-df31-7711-8cec-407e619df09c` | durable |

本机只有Chrome可用浏览器连接，`/Applications/Microsoft Edge.app`不存在。按Chrome候选先准备，不宣称Edge已验收；未执行安装Edge或商店上传。

| 工作包 | 交付与本地结果 |
| --- | --- |
| A | [PR #47](https://github.com/wxy/CodeYears/pull/47)，af0d675。按用户确认移除每日数据表，保留内部数据；分组/折叠、键盘、英文边界与原生遮罩关闭；本机定位并最小修复快照连续微任务阻塞。真实重载菜单/遮罩/Esc通过，最终CI成功。 |
| B | [PR #48](https://github.com/wxy/CodeYears/pull/48)，3bde951。原生选项页；用户已验证English Saved/刷新保留，GitHub入口实际联动，结束恢复auto；最终CI成功。 |
| C | [PR #49](https://github.com/wxy/CodeYears/pull/49)，77d94fc。同步每日表移除与实际验收；双语当前功能与两张正式1280×800示例图，目视接受；最终CI成功。 |
| 本地 | [PR #46](https://github.com/wxy/CodeYears/pull/46)。来源/隐私、主线文档、真实Chrome与三密度20年正式renderer验收、最终79文件ZIP候选。结果/限制见[本地报告](../reports/CITY-FIRST-RELEASE-LOCAL.md)。 |

当前停止点是可审阅候选：未核验干净安装/首次站点提示、商店账户、Edge和真实后台；不宣称完整性能预算通过。浏览器工具不能读取商店控制台，未绕过；没有上传/审核/发布动作。用户随后明确授权移除“每日数据”入口，已在原#47实现；内部数据保留，中英文图例及公开说明同步。缩放百分比/最大倍率继续后置，不安排新本地或云端实现。

## 用户后续授权的两项云端预检

每日表移除交付后，用户询问剩余工作并授权继续委托云端。已向既有A/B发送后继指令，联合快照确认两者均active/inProgress（不是已通过或已交付）。固定基线`0116ceac5d6785b3ddc595fe1937e5d047213c11`，临时组合#47 af0d675、#48 3bde951、#49 77d94fc；各自报告PR向协调分支提交，不把别人的源码/素材提交混入，不合入或发布。

| 任务 | 既有云端chat / 分支 | 边界与交付 |
| --- | --- | --- |
| MV3干净环境预检 | A，`01a1974f-7af2-76fc-8a1c-fd8660c8908c`；`codex/city-mv3-install-preflight` | 使用已有Chromium和一次性目录尝试真实加载扩展，核对资源、权限、原生选项及真实storage持久化；禁止chrome替身冒充安装。环境不支持即记录具体阻塞，不搭新基础设施；仅`docs/reports/CITY-MV3-INSTALL-PREFLIGHT.md`入PR。 |
| 独立最终组合审查 | B，`01a1974f-aaac-771a-a1e2-544fe1ee00bb`；`codex/city-release-final-review` | goal-driven-review，只找首发阻断：取消/释放/批次合同、菜单焦点、Options/清单/打包一致、移除表格后原始数据保留、公开说明真实。源码只读，有具体疑点才最小验证；仅`docs/reports/CITY-RELEASE-FINAL-REVIEW.md`入PR。 |

不重复20年性能，不补单元测试或做边界重构。云端预检不能代替本机Chrome首次站点提示、真实后台或商店账户。本地下一步只处理这些剩余外部条件并审查云端结果；不安排新功能，缩放控件/Terrain等保持后置。

用户随后明确要求本地收工：仅完成正在进行的PR同步与临时材料清理；本机干净安装/首次站点提示、真实后台及商店账户检查暂停，明天由用户恢复后继续。两项已启动的云端预检继续运行，不停止、不追加本地验收。
