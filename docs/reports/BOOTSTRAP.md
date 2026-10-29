# 初始化验证记录

日期：2026-10-29。范围：P0 文档与基本 MV3 / TypeScript / Vite 骨架。

## 选择依据

本次新增构建配置、依赖与固定文案状态页，因此执行类型检查、生产构建、产物静态检查和本地浏览器显示检查。数据、缓存、时间轴、GitHub 注入与渲染均未实现，不执行或宣称这些路径通过，也不为类型契约补建单元测试。

## 环境与输入

- macOS 26.6.2；Node.js v26.7.0、npm 11.19.0。
- TypeScript 7.0.2、Vite 8.3.5；Three.js 0.186.1 作为正式依赖但未被状态页引用。
- 输入为仓库固定源码、manifest、锁文件与中文 Markdown 文档；不使用真实 GitHub 用户数据或模拟贡献数据。
- 浏览器检查使用 Codex 内置浏览器与本机临时 HTTP 服务，打开生产构建的 `popup.html`。这不是 Chrome / Edge 的扩展安装验收。

## 可重复步骤

```sh
npm ci
task_tmp=$(mktemp -d "${TMPDIR:-/tmp}/codeyears-check.XXXXXX")
npm run build -- --outDir "$task_tmp/dist"
python3 -m http.server 4173 --bind 127.0.0.1 --directory "$task_tmp/dist"
# 在浏览器打开 http://127.0.0.1:4173/popup.html，检查下表项目。
# 完成后停止服务并删除本次创建的 task_tmp 目录。
git diff --check
```

本次首次安装用 `npm install` 生成锁文件；后续使用上述 `npm ci` 固定安装。构建命令内部先执行 `tsc --noEmit`。静态检查逐项核对 manifest 与本地产物，文档链接按相对路径解析。

## 实际结果

| 检查 | 结果 |
| --- | --- |
| 依赖安装及锁文件 | 成功，固定直接依赖版本；没有修改全局 npm 或 Git 配置 |
| TypeScript 严格检查 | 通过 |
| Vite 生产构建 | 通过，5 个模块；状态页 JS 为 2,224 字节（该值不代表未来 3D 包体积） |
| manifest | MV3、名称 CodeYears、版本 0.0.0，popup 入口与引用资源存在 |
| 当前能力边界 | 没有权限/host permissions、content script 或后台；未向 GitHub 注入内容 |
| 引擎与远程脚本 | 当前状态页产物无 Three.js / WebGL 引擎引用或远程运行时代码引用 |
| 文档相对链接 | 通过，产品、架构、路线、数据隐私、性能与报告入口相互可达 |
| 本地浏览器显示 | CodeYears、中文标语、City / Terrain 和“功能尚未实现”状态正常显示；Shadow DOM 页面无明显裁切或重叠 |
| 差异格式 | `git diff --check` 通过 |

## 未执行范围

- 未实装 Chrome / Edge 扩展或核实实际安装权限提示。
- 未验证 GitHub 同源请求、页面数量解析、年度合计、登录身份或缓存。
- 未创建 Three.js 场景；未测 City / Terrain、20 年数据、动画、帧率或 GPU 资源回收。
- 未提交商店、发布扩展、公开仓库或选择开源许可证。

这些项目留待 P1 及后续阶段，不能由本报告推导为已通过。

## 交付与留存

远程仓库为 `wxy/CodeYears`，已用本地 `gh` 创建并通过 API 核实为 private。默认分支仅为空白仓库基线，文档与骨架通过初始化分支和 PR 交付；是否合入以 GitHub 状态为准。

构建、npm 下载缓存和预览服务使用本次任务的系统临时目录。完成检查后关闭预览并清理，只保留本报告。项目正式依赖 `node_modules/` 不进入 Git；无测试截图、录屏、响应、缓存或构建产物加入版本管理。
