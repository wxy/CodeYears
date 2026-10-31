# 多年份顺序加载协调器

日期：2026-10-31。主线集成前置能力，不代表 P1-G 或正式 City / Time Travel 已完成。

## 职责与接口

新增 `src/platform/github/load-history.ts` 的 `loadContributionHistory(context, expectedYears, forceRefresh, signal, currentContext, onProgress?)`。仅显式调用后按年份升序逐个 `await loadContributionYear`，复用年度身份确认、作用域缓存、请求与解析；`forceRefresh`、`signal`、`currentContext` 原样传入，不复制验证实现。

输入年份列表复制后排序，先由 `assembleContributionHistory` 拒绝重复期望年度。每个年度成功后用同一组装器产生冻结快照，向同步 `onProgress` 报告 `{ year, source, warning, history }`，让调用方保留年度缓存警告与部分历史。快照包含已提供/缺失年份，不补零、不修改 count、不驱动播放；没有播放状态。

全部年度成功才返回完整历史。年度异常、身份改变或取消直接拒绝，不继续余下年度；已报告的快照由调用方选择是否保留。本模块不新增持久层，不自动重试/预取，不并发加载。进度回调抛出的异常同样直接终止；回调为同步观察接口，不等待异步回调。空年度列表返回空 complete（仍先检查取消），不发请求。complete 仅表示期望年度齐全，不表示全年覆盖或身份矩阵已验收。

## 实现前确定的失败方式和范围

1. 输入年度乱序或并发请求，导致报告次序与历史不一致。
2. 缺年被误报 complete，或真实零/闰日/数量丢失、被填补。
3. forceRefresh 未传递，每年没有经过已有作用域缓存与身份确认。
4. 第二年失败被吞掉，继续请求第三年或返回 complete。
5. 取消或 currentContext / 在线会话身份改变后仍继续请求、写入或报告未验证年度。
6. 原地排序修改输入，或对重复期望年度发出多余请求。

先在本轮独立系统临时目录编写浏览器检查，确认新增模块缺失时构建失败，再实现。只在 fetch 与 chrome.storage.local 外部边界模拟；真实协调器、年度加载器、身份读取、解析、缓存编解码和组装器全部参与。两年确定性输入和受影响路径验证，不扩展语言或时序矩阵。

## 状态与边界

纯前置模块与受控浏览器路径验证通过，源码提交和复现材料见 `docs/reports/YEAR-HISTORY-LOADER.md`，独立 PR 交付，暂不合入。仅新增本模块及本任务/报告；已有年度 loader/cache/parser/history、共享类型、入口、manifest、依赖、全局文档均只读。真实 GitHub 登录身份、多账户、Edge、正式 MV3/UI 及渲染性能不属于本轮验收。
