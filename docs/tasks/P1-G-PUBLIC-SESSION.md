# P1-G 公开未登录会话补证

日期：2026-10-30。分支：`codex/p1-public-session-validation`。状态：调查与报告已完成，待独立 PR 审查；完整扩展验收未完成。

## 授权与边界

任务 A 仅调查 `wxy/2024`、`torvalds/2025` 两个公开样本。只新增本任务及 [报告](../reports/P1-G-PUBLIC-SESSION.md)，不改数据、缓存、GitHub 模块、manifest、入口、依赖、锁文件、全局计划或其他任务。不合入 PR，不发额外 GitHub 评论。

起点已通过本地 `git fetch origin`、`git rev-parse origin/main` 及 `gh pr view 6 --repo wxy/CodeYears --json state,mergeCommit` 核实：PR #6 已合入，main 为 `a626ab47458586a6dba226c587cbfe03c95d4111`。原检出为 `work` / `12b00e2c4ae74bb25156a96268bbed6a22f23159`，工作区干净，没有需要移动或暂存的未提交内容；从 origin/main 新建本分支。

## 预定路径与实际结果

1. 先读项目协作、产品、开发计划、云端、隐私、性能文档；锁文件安装、类型检查、原构建。
2. 一次性浏览器资料尝试原 MV3 构建，不改变权限、注入策略或 TLS 校验。GitHub 导航遇证书信任阻塞后立即收敛，不宣称扩展加载、activeTab 或真实缓存通过。
3. 改用真实匿名 HTML 请求及原解析器进行有限补证。两个样本的已确认未登录标识、完整年度覆盖、精确数量与年度标题合计通过；具体方法与结果见报告。
4. 清理临时资料、响应、日志、脚本、构建与 npm 缓存，文档静态核对后提交、推送、创建独立 PR。

没有改实现，因此不新增隔离单元测试。本任务不代替真实多账户、Edge、后台与 60 Hz 验收，也不表示 P1-G 或正式 City MVP/P2 完成。
