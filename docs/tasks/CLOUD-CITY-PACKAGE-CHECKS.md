# City 发行包自动核验

固定基线：`c9febba1eb4bfe704b5ca0a6e632d19824e80244`，PR base 为 `codex/city-profile-tabs`。
仅新增独占脚本、只读工作流与本任务/报告，不改打包器、依赖或运行源码。

## 先列失败输入

依据 `scripts/package-city.py`、`public/manifest.json`、`docs/RELEASE_READINESS.md` 和 `docs/DATA_AND_PRIVACY.md`：

- ZIP 重复条目、绝对/上级路径、CRC 损坏：不能安全代表唯一完整发行文件。
- package、锁文件根版本、源码 manifest、ZIP manifest 版本不一致或 Chrome 非法版本。
- 缺少入口、popup 引用、动态模块/chunk、图标、本地 PNG，或资源声明无法匹配文件。
- 多出源码、source map、测试输入、缓存、凭证及清单外文件；保留当前 Terrain 分包。
- 自动入口偏离唯一 GitHub 范围，增加 Cookie、host/optional 权限或其他清单能力。
- 缺失/改写 LICENSE、THIRD_PARTY_NOTICES.md、ASSETS.md、PRIVACY.md。

## 验收设计

先运行现有 npm ci/check/build/package:city，随后实际调用 Python CLI 验收 ZIP。
在系统 TMP 复制正式 ZIP，分别删除被引用资源、加额外文件、改权限/版本、制造重复/越界路径和 CRC 错误，要求 CLI 非零退出且说明失败。
不补单元测试，不引入通用校验框架。过程副本、构建、依赖缓存及日志仅在 TMP，结束清理。
CI 使用 Node 24 与现有锁文件，仅 contents: read，无上传、发布或 Secrets。
许可证/素材说明齐全仅是文件核验，不代替维护者确认 AI 位图分发权；CLI 不证明真实浏览器或性能预算通过。
