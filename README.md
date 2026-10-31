# CodeYears

**代码岁月，自成风景。**

CodeYears 是完全免费的 Chrome / Edge Manifest V3 浏览器扩展项目，计划把 GitHub 多年的真实每日贡献数量呈现为 **City（贡献之城）**与 **Terrain（时光山脉）**。

> City 已按年份分成独立城区，Terrain 已接入同一份历史与时间轴，切换时保留相机、播放位置和暂停状态。两种视图的本地预览与受控完整 UI 检查通过；此前真实 Chrome 三年数据主路径已验证，新版 MV3 重载后的实装与完整发布验收仍待完成，见 [年份风景报告](docs/reports/YEAR-LANDSCAPES.md)。

## 已确认的方向

- 完全免费，不要求 GitHub Token 或独立登录，没有后端。
- 在 GitHub 个人主页，利用现有会话与同源贡献页面请求，按年获取真实每日数量；可行性与解析规则先验证。
- 数据本地按年缓存，按登录访问者身份隔离；主页所有者不等于访问者。
- 仅 City 与 Terrain，不开发独立 Classic 或 Orbit；保留 GitHub 原生贡献图。
- Apple 式精致克制设计，Signature / Natural 两种主题。
- Time Travel 从历史起点逐渐呈现，即使缓存完整也可重播；支持暂停、跳过。
- 用户主动激活才加载 3D，静止停止连续帧，离开释放 WebGL 资源，优先保障 GitHub 原页面体验。

## 文档入口

| 文档 | 内容 |
| --- | --- |
| [产品定义](docs/PRODUCT.md) | 已确认决策、使用流程、范围与后续设想 |
| [技术架构](docs/ARCHITECTURE.md) | 模块边界、数据流、生命周期与当前骨架 |
| [开发路线](docs/ROADMAP.md) | 数据与性能验证 → City MVP → Terrain → 发布 |
| [执行计划](docs/DEVELOPMENT_PLAN.md) | 工作包、依赖、PR 切分与阶段验收 |
| [云端开发](docs/CLOUD_DEVELOPMENT.md) | Codex 环境配置、首次任务与本地验收边界 |
| [数据与隐私](docs/DATA_AND_PRIVACY.md) | 数量准确性、身份隔离、缓存和权限待验证项 |
| [性能约束](docs/PERFORMANCE.md) | 20 年数据验证方法、按需渲染、资源释放 |
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

## 本地开发

使用 Node.js 22.12+（22 系列）或 24+、npm。依赖版本由 `package-lock.json` 固定。

```sh
npm ci
npm run check
npm run build
```

在 Chrome 的 `chrome://extensions` 或 Edge 的 `edge://extensions` 开启开发者模式，选择“加载已解压的扩展”，选择本项目的 `dist/` 目录。在 GitHub 个人主页贡献日历加载完成后，点击扩展图标，再选择“打开 CodeYears”。选择起止年份（默认最近三年，也可选择更早起点或相同年份）及 City / Terrain，点击生成。逐年读取时显示进度，全部完成后展示风景，可拖动旋转、滚轮缩放、暂停/继续、跳过或重播；同时显示各年概览。切换视图不重新请求，保留播放位置与相机。还可仅查看每日数量、强制刷新整个范围、清除此访问者在当前主页的缓存、取消或关闭风景。每日明细在展开时才建立，避免预先插入数千行。使用缓存前仍会联网确认身份；后台隐藏时清空显示、销毁风景并取消请求，返回后需重新生成。

不安装扩展也可先体验画面：运行 `npm run preview:city`，打开 <http://127.0.0.1:4175/>，可切换 City / Terrain 以及一年、三年或二十年。这个本地预览使用明确标记的确定性示例数据，复用同一风景渲染器；它不是独立产品网站，也不读取 GitHub 会话。

`npm run dev` 监听源文件并重新构建；修改后在扩展管理页重新加载。它不向扩展注入开发服务器代码。

当前 manifest 使用 `activeTab`、`scripting` 与 `storage`：主动点击后临时注入，本地保存按访问者隔离的年度数量；没有持久网站访问、Cookie 权限、自动 content script 或后台服务。生成风景时才动态加载本地 `landscape.js` 并创建 WebGL；该模块仅向 GitHub 页面声明为可访问资源。新版替换了原 City 资源声明，升级后需在扩展管理页重新加载并刷新主页；此前单一 City 的实装证据不代替新版资源/视图验收。

## 目录

```text
public/manifest.json        MV3 清单
popup.html                  扩展状态页入口
src/extension/              弹窗与按需注入的 Shadow DOM 风景 / 数据面板
src/platform/github/        页面上下文、年度同源请求原型
src/data/                   每日贡献数据契约与年度校验解析器
src/cache/                  作用域年度缓存、版本与有效期校验
src/timeline/               与数据加载解耦的播放控制器
src/renderers/              按年份组织的 City / Terrain 渲染器及工程原型
probes/city/                复用风景渲染器的本地示例体验
docs/                       产品、架构、路线与验证记录
```

Three.js 随安装包独立打包，弹窗和注入脚本不静态导入它。`probes/rendering` 仍用于旧版 20 年 City / Terrain 工程负载检查，与当前风景实现的验收结论分开。

## 当前下一步

PR #14 已按用户授权合入；本轮已完善 City 年份布局并接入 Terrain。下一步先完成新版 MV3 真实主页验收，再完善主题与日期探索。P1-G 的真实身份矩阵、Edge、后台与正式集成性能门槛并行收敛；二十年示例能显示不等于性能预算已通过，不继承旧工程原型约 60 FPS 的结论。

GitHub 仓库 [wxy/CodeYears](https://github.com/wxy/CodeYears) 已于 2026-10-29 按用户决定公开；尚未选择开源许可证。扩展尚未发布，没有商店下载链接。独立网站仅是扩展成功后的后续设想，当前不建设。
