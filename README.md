# CodeYears

保存当前画面：先调整城市的缩放和平移，在图上右键选择“图片存储为…”或“复制图片”。使用浏览器原生菜单，不提供独立大图导出或分享面板。当前图标采用用户选定的等轴街区；实际验证与缩放采样待反馈范围见 [本轮报告](docs/reports/CITY-EXPORT-AND-ZOOM.md)。

**代码岁月，自成风景。**

CodeYears 是完全免费的 Manifest V3 浏览器扩展项目，将 GitHub 多年的真实每日贡献数量呈现为 **City（贡献之城）**。当前准备 Chrome 0.1.0 City 预览版，尚未发布；Edge 仍待独立验收，Terrain（时光山脉）暂缓。

> 当前 City 已接入 **22 款新透明单元与 3 款旧中高层建筑**的共享标定数据，涵盖建筑、单树、树林、草地、水体与广场。每个 ISO 周年一条横向街区，完整周归周四所在年，52/53列、周一至周日为行；每13周交叉道路分段，建筑按地面包络居中留距。固定视角，支持缩放、平移与重置；缩放不改变建筑和合并结果。整体视觉、二十年性能预算与完整浏览器路径仍待验收，PR #15 已按用户授权合入。

根据实测反馈，City 已将灰白整块底面改为绿地庭院、建筑铺装与入户步道，沿合并地块边界连接窄支路；放大上限按实际投影尺寸计算，允许从多年全景进入建筑细节。上述改动仍待最终视觉验收。

已完成 [第二轮单元设计](docs/design/city-units/v2/README.md)：设计板覆盖含 3×3 的 13 种建筑组合，实际运行目录只使用已制作并标定的素材，尚未补齐全部组合和双变体。可运行 `npm run preview:units` 打开 <http://127.0.0.1:4176/> 查看 [标定数据](docs/design/city-units/v2/calibration/README.md)。警局、消防局、体育场、总站按标定后的低矮比例使用，不将其原定 H1 目标写成已完成；原 PNG 保留。景观带从所选最早年份起，每五年分组。

![City 六款建筑设计参考（已分别生成透明素材接入）](docs/design/city-buildings/v1/building-studies.png)

## 已确认的方向

- 完全免费，不要求 GitHub Token 或独立登录，没有后端。
- 在 GitHub 个人主页，利用现有会话与同源贡献页面请求，按年获取真实每日数量；可行性与解析规则先验证。
- 数据本地按年缓存，按登录访问者身份隔离；主页所有者不等于访问者。
- 首发仅 City，Terrain 暂缓；不开发独立 Classic 或 Orbit，保留 GitHub 原生贡献图。
- Apple 式精致克制设计，Signature / Natural 两种主题。
- Time Travel 从平地整体生长，即使缓存完整也可重播；支持暂停、跳过。
- 用户主动激活才加载景观，静止停止连续帧，离开释放 WebGL 资源，优先保障 GitHub 原页面体验。

## 文档入口

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
| [商店材料草稿](docs/STORE_LISTING.md) | City 文案、权限字段依据及图片待办 |
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

使用 Node.js 22.12+（22 系列）或 24+、npm。依赖版本由 `package-lock.json` 固定。

```sh
npm ci
npm run check
npm run build
```

在 Chrome 的 `chrome://extensions` 加载本项目 `dist/` 并允许扩展在 GitHub 运行。个人主页日历加载后，顶部左侧依次出现“城市 · CodeYears / 贡献图”，默认原图；右侧 GitHub 原贡献数量与设置只在原图显示。日历与活动概览（含蜘蛛图）整体切换，下面的活动流水保留。点击城市后先显示所选年份的完整空场地，再随已校验数据填入地块；尚未返回的区域保持待填充。可修改年份范围后“应用”，读取中可取消；完成后静止，不再另播统一楼宇生长，也没有进度条或独立重播控件。可缩放、拖动平移、“全景”恢复取景，或展开后按 Esc/收起返回。失败/取消清除部分贡献画面，保留空场地与重试。工具栏可直接定位城市；右键保存帮助、每日明细、刷新/清缓存收进“更多”。切回原图、后台隐藏或导航会取消并清空/释放，再进入重新核对身份。

制作本地发行候选需要 Python 3，运行 `npm run package:city`。它先完整构建，再按发行清单生成 `release/codeyears-0.1.0-city.zip` 与 SHA-256；ZIP 根目录直接包含 manifest、运行资源、许可和隐私说明。固定文件顺序与 ZIP 元信息，同一输入及 Python/zlib 环境下可复现。`release/` 已忽略，不提交发行产物。打包不等于验收通过或商店发布。

不安装扩展也可先体验画面：运行 `npm run preview:city`，打开 <http://127.0.0.1:4175/>，可切换 City / Terrain、一年/三年/二十年，以及系统/浅色/深色页面外观。City 的缩放仅调整画面大小，不重新采样或改变建筑。年度街区按 ISO 整周排列，必要时借取相邻公历源年并按真实日期筛选，相邻同强度档的格子按实际支持占地合并，保留真实日期和数量，不跨季度道路。当前按真实每日数量固定分档：0 自然地块/城市铺装、1–2 平房、3–5 低层、6–19 公寓、20–49 办公楼、50+ 大厦；建筑主色来自原素材。数据地块中的草地、树木、池塘与城市邻域广场表示零贡献；五年景观带内的树木、水体和道路只作装饰。Terrain 继续使用跨年份连续高度场。这个本地预览使用明确标记的确定性示例数据，复用同一风景渲染器；它不是独立产品网站，也不读取 GitHub 会话。

`npm run dev` 监听源文件并重新构建；修改后在扩展管理页重新加载。它不向扩展注入开发服务器代码。

manifest 的 `activeTab`、`scripting` 用于工具栏快捷定位，`storage` 保存隔离年度缓存；新增仅 `https://github.com/*` 匹配的自动 `entry.js`。轻量入口只识别 URL 与贡献 DOM，不读取每日数量或访问者身份，不提前请求历史/缓存/素材。点击城市后才加载本地 `content.js` 和 `landscape.js`。City 使用 Canvas 2D，素材按需标定烘焙并释放源位图；Terrain 仅留在开发预览中。没有 Cookie、所有网站权限、后台轮询或后端。本轮自动站点运行、紧凑 UI 和导航行为是新的验收范围，不能沿用旧版主动注入的真实 Chrome/Edge 结论，见 [本轮计划](docs/tasks/CITY-PROFILE-TABS.md)。

## 目录

```text
public/manifest.json        MV3 清单
popup.html                  扩展状态页入口
src/extension/              弹窗与按需注入的 Shadow DOM 风景 / 数据面板
src/platform/github/        页面上下文、年度同源请求原型
src/data/                   每日贡献数据契约与年度校验解析器
src/cache/                  作用域年度缓存、版本与有效期校验
src/timeline/               与数据加载解耦的播放控制器
src/renderers/              融合年份街区的 City / 连续 Terrain 及工程原型
probes/city/                复用风景渲染器的本地示例体验
docs/                       产品、架构、路线与验证记录
```

Three.js 位于按需 Terrain 分包，弹窗、注入脚本和 City 不静态导入它。`probes/rendering` 仍用于旧版 20 年 City / Terrain 工程负载检查，与当前风景实现的验收结论分开。

## 当前下一步

PR #31、#32、#33、#34、#36 已按依赖顺序保留历史合入，主线 `12518a9`；#35 分享实验保持未合入草稿，最终代码只有原生右键保存提示。当前推进 0.1.0 City 发布准备：MIT 许可、隐私说明、商店文案与本地 ZIP 候选。剩余真实身份矩阵、Edge、当前二十年性能预算及素材分发确认见 [首发清单](docs/RELEASE_READINESS.md)。不继承旧工程原型约 60 FPS 的结论。

GitHub 仓库 [wxy/CodeYears](https://github.com/wxy/CodeYears) 已公开；项目代码采用 [MIT](LICENSE)，[素材](ASSETS.md) 与 [第三方依赖](THIRD_PARTY_NOTICES.md) 分开说明。扩展尚未发布，没有商店下载链接。独立网站仍为后续设想，当前不建设。
