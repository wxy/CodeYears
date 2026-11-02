# City 渐进加载云端验证任务

日期：2026-11-01（Asia/Shanghai）。交付分支 `codex/cloud-city-loading-validation`，PR base `codex/city-profile-tabs`；不合入、不发布。

## 固定范围

正常 fetch 后核实远端分支完整 SHA 为 `c9febba1eb4bfe704b5ca0a6e632d19824e80244`，从此 SHA 检出并建立独立分支。环境默认 main 不是基线。只新增本文和 [实际报告](../reports/CLOUD-CITY-LOADING-VALIDATION.md)，不修改运行源码、权限、依赖、素材、其他任务或报告。

已读 AGENTS.md、云端接续、[本轮安排](CLOUD-2026-11-01-OVERNIGHT.md)、产品、数据与隐私、性能、开发计划及 CITY-PROFILE-TABS 实现报告。使用 cloud-environment-runtime 技能检查环境及网络策略；现有代理/连接权限，不引入 Token、独立登录、后端或网站。

## 验证目标与方法

1. 正式 npm ci/check/build；产物、npm 缓存、临时 HTTP 页面、浏览器会话、合成响应和观测全部在系统 TMP。
2. 正式 entry/content/landscape、PNG、parser/loader/cache 完整路径。仅在服务返回 entry/content 时替换 GitHub origin；Chrome runtime/storage 与访问者为明确替身。
3. 受控三源年检查空地 → 首年 → 部分 → 完整；真实合成日期/数量明细守恒、错误/取消清除、素材失败重试、晚到隔离、结束停帧及重复关闭释放。
4. 正式 createLandscape 第七个实参 reservedYears（含 host 的调用位置，接口签名共七个实参）与 updateDays 验证 2006–2025 二十个 ISO 展示年份。输入从真实日期生成，分别稀疏/常规/密集，不将缺失日期补零。接口本身见 src/renderers/landscape.ts；沿用既有接口，不为题面参数序号增加参数。
5. 临时额外编译现有 planCityScene，仅交叉核对所有 parcel.indices 与 count；此诊断模块不替换正式渲染、parser 或 loader，不计为正式发行产物。

## 判定原则

updateDays resolve 只表示素材就绪/新层交换；填入仍可能继续。revealedDays 是内部前缀，不是精确画出日期数。融合成员必须全在已验证快照中；每批可重规划，观看缩放不应重规划。失败、未运行、受控会话与真实硬件验收分别记录，不为通过而修改共享源码或穷举竞态。

最终以报告为准；目标路径完成即停止，清理 TMP。真实登录 MV3、Mac 硬件、Edge、后台及性能预算均不由本任务替代。
