# CodeYears

**代码岁月，自成风景。**

CodeYears 是完全免费的 Chrome / Edge Manifest V3 浏览器扩展项目，计划把 GitHub 多年的真实每日贡献数量呈现为 **City（贡献之城）**与 **Terrain（时光山脉）**。

> 当前处于 P1 可行性验证阶段。本地分支提供年度数据诊断原型；云端渲染原型通过独立 PR 交付。缓存与正式 Time Travel / 3D 视图尚未集成，Chrome / Edge 和真实硬件验收按报告分别记录。

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

## 本地开发

使用 Node.js 22.12+（22 系列）或 24+、npm。依赖版本由 `package-lock.json` 固定。

```sh
npm ci
npm run check
npm run build
```

在 Chrome 的 `chrome://extensions` 或 Edge 的 `edge://extensions` 开启开发者模式，选择“加载已解压的扩展”，选择本项目的 `dist/` 目录。在 GitHub 个人主页贡献日历加载完成后，点击扩展图标，再选择“打开数据诊断”。面板中选择一个年份后才请求该年数据；可以取消或关闭。

`npm run dev` 监听源文件并重新构建；修改后在扩展管理页重新加载。它不向扩展注入开发服务器代码。

当前 manifest 使用 `activeTab` 与 `scripting`，在主动点击后临时访问当前 GitHub 标签页并注入诊断面板；没有持久网站访问、Cookie 或存储权限，没有自动 content script 或后台服务。数据只在本页内存，未加载 WebGL。这是 P1-A 的权限选择，完整产品仍需后续验证。

## 目录

```text
public/manifest.json        MV3 清单
popup.html                  扩展状态页入口
src/extension/              弹窗与按需注入的 Shadow DOM 数据诊断
src/platform/github/        页面上下文、年度同源请求原型
src/data/                   每日贡献数据契约与年度校验解析器
src/cache/                  年度缓存与访问者作用域契约（待实现存储）
src/timeline/               播放状态契约（待实现时间轴）
src/renderers/              City / Terrain、主题、生命周期契约
docs/                       产品、架构、路线与验证记录
```

Three.js 已列为依赖，但状态页不导入它，当前构建不会包含 3D 引擎。按需 `import()` 与拆包将在性能原型中实现并验证。

## 当前下一步

本地 P1-A 与云端 P1-C 独立分支并行。数据路径、身份隔离/年度缓存及真实硬件性能通过后再进入 City MVP。失败或不确定的结果按 [路线图](docs/ROADMAP.md) 记录，不能用模拟数据代表真实数据验证。

GitHub 仓库 [wxy/CodeYears](https://github.com/wxy/CodeYears) 已于 2026-10-29 按用户决定公开；尚未选择开源许可证。扩展尚未发布，没有商店下载链接。独立网站仅是扩展成功后的后续设想，当前不建设。
