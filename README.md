# CodeYears

**代码岁月，自成风景。**

CodeYears 是完全免费的 Chrome / Edge Manifest V3 浏览器扩展项目，计划把 GitHub 多年的真实每日贡献数量呈现为 **City（贡献之城）**与 **Terrain（时光山脉）**。

> 当前处于项目初始化阶段。仓库包含中文产品文档、类型边界和可构建的扩展状态页；尚未实现 GitHub 数据获取、缓存、Time Travel 或 3D 视图，也尚未通过 Chrome / Edge 扩展实装验收。

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
| [数据与隐私](docs/DATA_AND_PRIVACY.md) | 数量准确性、身份隔离、缓存和权限待验证项 |
| [性能约束](docs/PERFORMANCE.md) | 20 年数据验证方法、按需渲染、资源释放 |
| [初始化验证记录](docs/reports/BOOTSTRAP.md) | 实际检查结果与未完成验收范围 |

## 本地开发

使用 Node.js 22.12+（22 系列）或 24+、npm。依赖版本由 `package-lock.json` 固定。

```sh
npm ci
npm run check
npm run build
```

在 Chrome 的 `chrome://extensions` 或 Edge 的 `edge://extensions` 开启开发者模式，选择“加载已解压的扩展”，选择本项目的 `dist/` 目录。点击扩展图标，只会看到项目状态页。

`npm run dev` 监听源文件并重新构建；修改后在扩展管理页重新加载。它不向扩展注入开发服务器代码。

当前 manifest 没有申请权限、注册 content script 或后台服务；不会读取 GitHub 页面、缓存贡献数据或创建 WebGL 上下文。P1 再根据真实请求验证选择最小权限。当前权限状态不代表未来完整功能无需权限。

## 目录

```text
public/manifest.json        MV3 清单
popup.html                  扩展状态页入口
src/extension/              平台入口与 Shadow DOM 状态页
src/platform/github/        GitHub 页面上下文契约（待实现适配器）
src/data/                   每日贡献数据契约（待验证解析器）
src/cache/                  年度缓存与访问者作用域契约（待实现存储）
src/timeline/               播放状态契约（待实现时间轴）
src/renderers/              City / Terrain、主题、生命周期契约
docs/                       产品、架构、路线与验证记录
```

Three.js 已列为依赖，但状态页不导入它，当前构建不会包含 3D 引擎。按需 `import()` 与拆包将在性能原型中实现并验证。

## 当前下一步

先验证无 Token 获取与准确解析、登录访问者隔离与年度缓存，以及约 20 年数据的 3D 性能。通过后再进入 City MVP。失败或不确定的结果按 [路线图](docs/ROADMAP.md) 记录，不能用模拟数据代表真实数据验证。

GitHub 仓库先保持 private；免费使用不等于已经选择开源许可证。公开与许可证另行决定。扩展尚未发布，没有商店下载链接。独立网站仅是扩展成功后的后续设想，当前不建设。
