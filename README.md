# CodeYears

**代码岁月，自成风景。**

CodeYears 是免费的 Manifest V3 浏览器扩展，将 GitHub 个人主页中当前会话可见的真实每日贡献呈现为一座城市。当前准备 Chrome 0.1.0 候选版，尚未发布；Edge 尚待独立验收。

![CodeYears 城市总览：示例数据 / Demo data，受控页面外壳](docs/store/city-0.1.0/01-overview.png)

## 使用方式

允许扩展在 GitHub 运行后，个人贡献区出现文件夹式“城市 / 贡献图”标签，默认仍显示 GitHub 原图。点击城市后才加载面板、确认当前会话并读取历史，默认最近三年。先显示完整空场地与道路，再随已校验年度数据填入地块；未知、未返回和未来日期不补零。读取、取消、警告和失败在画布浮层内显示，正常完成后隐藏。

修改年份范围后点击“应用”。滚轮或按钮缩放、拖动平移，“全景”恢复取景；可在当前页面内展开同一画布，按Esc或“收起”返回。原图与活动概览一同切换，页面下方的活动流水保留。切回原图、页面隐藏或导航时取消并释放城市，再进入重新核对身份。缩放不改变数量和建筑合并。

“更多”中可查看每日明细与帮助、刷新或清除当前主页缓存，并选择英文、简体中文或跟随浏览器。界面双语不表示所有GitHub网页语言都能解析：当前贡献来源主要验证英文页面。GitHub页面结构或访问权限变化可能导致读取停止，失败不会当作零贡献。

调整取景后，在画布上右键使用浏览器原生保存或复制图片菜单。没有独立导出或分享服务；正式入口不提供暂停、继续、跳过或重播。

## 城市与数据

按ISO完整周组织年度街区，每13周道路分段，同档相邻日期可按支持的矩形占地合并，不跨道路或缺失日期，保留原始日期、数量与成员明细。周年范围的边界日期可能与GitHub公历年不同，合计须按同一日期范围比较。

当前固定分档为0自然地块/城市邻域铺装、1–2平房、3–5低层、6–19公寓、20–49办公楼、50+大厦。已接入普通住宅、别墅、庭院住宅和横纵联排等低层素材；道路、河道与外围景观仅作装饰。占地、高度与造型不是某类真实GitHub活动的推断。

无需GitHub Token或独立登录，没有后端、广告或遥测。年度日期/数量在浏览器本地按访问者、主页与年份隔离缓存；身份无法确认时不复用缓存。只向GitHub请求，不自动上传图片。详见 [隐私说明](PRIVACY.md) 与 [数据边界](docs/DATA_AND_PRIVACY.md)。

截图是正式City渲染器与入口在受控外壳中的合成示例，不是真实登录主页或私有活动。[图片来源、对应提交和复现方法](docs/store/city-0.1.0/README.md)。

## 文档入口

下表早期报告按各自提交保留，包含历史控件与视图；不代表当前正式入口功能或验收状态。

| 文档 | 内容 |
| --- | --- |
| [产品定义](docs/PRODUCT.md) | 已确认决策、使用流程、范围与后续设想 |
| [技术架构](docs/ARCHITECTURE.md) | 模块边界、数据流、生命周期与当前骨架 |
| [开发路线](docs/ROADMAP.md) | 数据与性能验证 → City MVP → City 发布，Terrain 暂缓 |
| [执行计划](docs/DEVELOPMENT_PLAN.md) | 工作包、依赖、PR 切分与阶段验收 |
| [云端开发](docs/CLOUD_DEVELOPMENT.md) | Codex 环境配置、首次任务与本地验收边界 |
| [数据与隐私](docs/DATA_AND_PRIVACY.md) | 数量准确性、身份隔离、缓存和权限待验证项 |
| [性能约束](docs/PERFORMANCE.md) | 20 年数据验证方法、按需渲染、资源释放 |
| [用户隐私说明](PRIVACY.md) | 读取范围、本地缓存、删除及权限用途 |
| [City 首发准备](docs/RELEASE_READINESS.md) | 发行候选、已完成项和发布前门槛 |
| [商店材料候选](docs/STORE_LISTING.md) | 中英文候选文案、权限字段依据与正式示例截图 |
| [初始化验证记录](docs/reports/BOOTSTRAP.md) | 实际检查结果与未完成验收范围 |
| [P1-A 任务](docs/tasks/P1-A.md) | 年度数据诊断的范围、运行方式与并行边界 |
| [P1-B 任务](docs/tasks/P1-B.md) | 访问者隔离、年度缓存及本地/云端分工 |
| [P1-B 验证记录](docs/reports/P1-B-VIEWER-CACHE.md) | 实际检查、输入规则与真实环境待验收范围 |
| [P1-G 可行性进度](docs/reports/P1-G-READINESS.md) | 本机 Metal 负载、显示调度基线与剩余验收门槛 |
| [60 Hz 补充验证](docs/reports/P1-G-60HZ.md) | 内建屏幕六组约 60 FPS 的原型证据 |
| [主线审查与对接复核](docs/reports/MAINLINE-2026-10-31.md) | 年度组装/匿名报告合入、时间轴对接候选验证与下一步 |
| [City 体验报告](docs/reports/CITY-EXPERIENCE-PREVIEW.md) | 单年份真实贡献之城、缓存重播与本地交互预览 |
| [多年份体验报告](docs/reports/MULTI-YEAR-CITY.md) | PR #12/#13 合入、三年真实城市与二十年示例展示 |
| [年份风景报告](docs/reports/YEAR-LANDSCAPES.md) | PR #14 合入、City 年份城区、Terrain、切换与释放 |
| [连续景观报告](docs/reports/CONTINUOUS-LANDSCAPES.md) | 前一版连续画面及旧版真实 MV3 的版本化证据 |
| [融合景观报告](docs/reports/SCENIC-UI.md) | 前版透明背景、连续山脉及整体生长证据 |
| [城市图样报告](docs/reports/CITY-TYPOLOGIES.md) | 历史 3D 图样版的贡献植被、相邻合并与道路验证 |
| [标定城市接入报告](docs/reports/CALIBRATED-CITY-INTEGRATION.md) | 当前新单元、季度道路、清晰近景与 Chrome MV3 直接路径 |

## 本地开发

使用Node.js 22.12+（22系列）或24+、npm；依赖版本由锁文件固定。

```sh
npm ci
npm run check
npm run build
```

在Chrome的 `chrome://extensions` 加载 `dist/`，允许扩展在GitHub运行。修改后重新构建并重载扩展；`npm run dev` 可监听构建，不向扩展注入开发服务器代码。City使用Canvas 2D和包内透明素材，点击后按需加载；静止停止连续帧，离开释放资源。

制作本地发行候选需要Python3：`npm run package:city` 生成 `release/codeyears-0.1.0-city.zip` 与SHA-256。产物不提交Git，打包不等于验收、商店上传或发布。ZIP内容和最终运行检查由 [首发收尾](docs/tasks/CITY-FIRST-RELEASE-2026-11-02.md) 与 [发布清单](docs/RELEASE_READINESS.md) 记录。

素材检查可运行 `npm run preview:units`，打开 [本地标定预览](http://127.0.0.1:4176/)。`probes/` 中的历史体验/负载工具包含旧播放控件，只用于开发；不代表正式入口功能或支持范围。本轮A的“更多”分组/键盘、B的图标原生“选项”尚待独立PR和本地组合验收，本材料不将计划写成通过。

## 当前状态与许可

#37–#45已合入，#35独立分享实验已关闭。首发仅提供City；未上线的视图或主题不属于当前功能。完整性能预算、真实MV3最终组合、安装/更新提示与Edge结果以当前版本报告为准，不继承旧原型约60FPS的结论。用户已取消专门隔离账户和A/B登录切换验收；该范围未覆盖，不再作为索取第二账户的条件。

仓库 [wxy/CodeYears](https://github.com/wxy/CodeYears) 已公开，尚无商店下载链接。代码采用 [MIT](LICENSE)；[素材分发边界](ASSETS.md) 与 [第三方依赖许可](THIRD_PARTY_NOTICES.md) 分开说明。生成位图的可分发范围仍由维护者核对，本材料不替代权利确认。本轮仅准备候选，不执行商店上传、提交审核或发布。
