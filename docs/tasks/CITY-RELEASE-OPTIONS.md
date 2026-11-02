# City 全局设置页

固定基线：`e3a609e84a821b2a792711c888f63f27edc120e5`。
分支：`codex/city-release-options`，PR base：`codex/city-first-release-rc`；不合入或发布。

只新增 options.html / options.ts，修改 manifest 的 options_ui、Vite 多入口与必要打包核验清单，以及自己的报告。
设置页嵌入浏览器原生选项（open_in_tab:false）；左键快捷 popup 源码不改。
复用 language.ts 和已有文案，仅使用语言键 codeyears:ui:language；auto/en/zh-CN 自动保存并显示成功或失败。
提供版本与帮助/隐私/反馈的明确点击链接，支持系统明暗与键盘焦点，不读取访问者/贡献缓存，无全局清缓存。

## 实现前的直接验证计划

使用 TMP 构建的正式页面配受控 chrome API，验证已有语言读取、默认浏览器语言、中英切换与重载持久化、写失败回退且可重试、读失败按原接口回退 auto。
检查键盘选择与链接、系统明暗/窄屏、初始无外部请求；检查版本/链接、清单仅新增选项配置以及 popup 源码不变。
运行 npm ci/check/build/package:city 与 ZIP 验收；针对缺 options HTML/JS/共享模块与额外文件制造临时 ZIP，确保拒绝。
没有实现后补单元测试；夹具、依赖缓存、构建、日志、浏览器资料和 ZIP 全部在 TMP，结束清理。
受控 HTTP 页面不冒充真实 Chrome 原生选项页；重载/原生右键/安装提示由本地验收。遵从本轮用户决定，不建立隔离账户或做 A/B 登录切换，不改身份协议。
