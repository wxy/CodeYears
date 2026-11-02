# City 首发准备清单

2026-11-01 合入后更新：#31/#32/#33/#34/#36 已保留历史合入，main `12518a9`；#35 保持 OPEN/DRAFT，最终只有原生右键保存提示。用户已选择代码 MIT。当前发布准备分支统一版本为 `0.1.0`，新增根目录 LICENSE、THIRD_PARTY_NOTICES、ASSETS、PRIVACY 与 [商店材料草稿](STORE_LISTING.md)，提供 `npm run package:city` 本地发行 ZIP。源码、锁文件和 manifest 版本一致；这不是已发布版本。实际结果见 [本轮报告](reports/CITY-RELEASE-PREPARATION.md)，下面旧基线为历史核对记录。

补充：用户已选择第三款等轴街区，PR #34已导出正式16/32/48/128图标并注册manifest；本地组合构建通过。用户重载后Chrome工具栏已实际看到第三款等轴街区图标；Edge图标仍待验收。

本地最终组合补证（2026-11-01）：贯通道路、两侧年份雕塑和正式AI图片外围已接入；当前Chrome已登录七年City、默认收起设置、惰性明细、暂停/跳过/关闭与重开通过，见 [组合报告](reports/CITY-CONNECTED-LANDSCAPE.md)。下面“本轮受控UI”为云端阶段记录；本机单账户路径现已补充，但A/B/退出、Edge和当前完整性能预算仍未完成。新增外围原图8,886,798 bytes，运行源目录约93MiB；不是安装ZIP或运行内存测量。

核对日期：2026-11-01。代码实物基线 `510e5237c07707c4c608b96e5f3739925ebbc20b`，加本轮 City UI 分支；这是一份缺项清单，**尚未达到商店发布条件**，没有上传、提交审核或选择许可证。

## 已有实物与首发范围

首发入口仅 City：年份范围、生成、必要加载/失败/取消、缩放/暂停/跳过/重播/关闭；每日真实数量可展开，刷新/清缓存与数据说明收起。Terrain 源码与本地预览保留，正式扩展不显示入口或宣传；当前构建仍会生成 Terrain 分包，不能把“入口收起”写成代码/资源已剔除。

已有主动注入的 MV3 框架，权限为 activeTab、scripting、storage；无 host_permissions、Cookie 权限、Token、后端或遥测。数据路径按访问者/主页/年度隔离缓存，并核对实时会话、失败与取消。本轮只改 manifest description，version、权限、CSP、WAR 均未改。工程隐私规则见 [DATA_AND_PRIVACY](DATA_AND_PRIVACY.md)，不是已发布的用户隐私政策。

## 首发前的最小必要事项

| 项目 | 当前事实 | 发布前还须完成 |
| --- | --- | --- |
| 版本 | package/锁文件/manifest 统一为 `0.1.0` 候选 | 满足非全零版本规则；最终安装包和控制台仍待验收，不宣称已发布。[官方版本规则](https://developer.chrome.com/docs/extensions/reference/manifest/version) |
| 图标 | 用户选定C等轴街区，public/icons已有16/32/48/128/512 PNG，manifest注册icons/action图标；Chrome重载实物已检查 | Edge及商店材料中的实际显示仍需核对；Chrome 建议包含 128/48/16 等用途尺寸，商店图标必备，不能用程序默认图标交付。[manifest 图标](https://developer.chrome.com/docs/extensions/reference/manifest/icons)、[商店图片要求](https://developer.chrome.com/docs/webstore/images) |
| 许可证及素材权利 | 用户选择 MIT，代码 LICENSE、Three.js NOTICE、ASSETS 来源边界已补 | 生成素材适用条款与参考来源可分发范围仍须维护者确认；代码 MIT 不替代位图权利核查。 |
| 用户隐私与权限说明 | 根目录 PRIVACY.md 与商店字段依据已编写；明确缓存过期不会自动物理删除 | 本 PR 合入后核验公开 URL，提交时逐项填写实际商店字段；本地处理也如实披露。[Chrome 隐私字段](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy) |
| 商店资料与包 | City 文案、支持/隐私候选 URL 与发行 ZIP 命令已准备 | 无私有数据的正式商店截图、最终安装验收、账户/控制台配置及提交审核仍待完成；没有上传或审核回执。[Chrome 发布流程](https://developer.chrome.com/docs/webstore/publish)、[图片要求](https://developer.chrome.com/docs/webstore/images) |
| 当前组合的真实 UI | 本轮 Chromium 受控页面验证，非已登录 MV3 | 本地重载最终组合包，实测入口、City/素材、年份范围、每日明细、设置/刷新/清除、失败/取消、关闭/重开/导航；不得将受控 API 替身视为真实权限或会话验收。 |
| 真实身份与数据 | 历史有 Chrome 单账户主路径，完整矩阵尚未完成 | 同一主页 A/B/退出登录、请求中切换/多标签、身份未知、后台清空、私有可见性变化与缓存隔离；闰年/当年截止、语言/解析失败不填零，核对真实日数/合计。沿用 D1–D6 与身份门槛，不因收起文字降低要求。[隐私验收清单](DATA_AND_PRIVACY.md) |
| Edge | 未取得当前版本完整 Edge 证据 | 若首发宣称支持或发布 Edge，先实际 Edge/MV3、权限与身份/缓存/后台路径验收，再备 Partner Center 资料与认证。官方区分必填名称/描述/logo 等与可选截图，logo 最小 128×128；不要把 Chrome 上的结果或图片字段直接当作 Edge 通过。[Edge 发布流程](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension) |
| 当前性能与包体 | 城市 PNG 源目录约 85 MiB，按需烘焙/缓存实现存在；源文件大小不是运行内存 | 对最终 City 组合测常规 20 年首次全景、播放/缩放平移、静止/后台/重复关闭的提交耗时与长任务、内存趋势/解码释放；核对发行 ZIP 与实际资源成本，处理阻断卡顿。没有证据前不宣传完整预算达标。[性能约束](PERFORMANCE.md) |

Chrome 扩展图标、商店图标/截图是不同交付物；先做必要尺寸与截图，不为首发额外扩建宣传网站、收费账户或新功能。Edge 若暂缓，应同步收敛商店说明，不宣称已经支持完整矩阵。

## 性能证据不能跨版本继承

- 当前道路/车辆组合已有本机示例暂停 draw 稳定、画布清零，以及真实单年/七年 MV3 的直接操作证据；**没有当前完整 FPS/功耗/内存预算**，见 [CITY-ROAD-NETWORK](reports/CITY-ROAD-NETWORK.md)。本地并行道路、雕塑和外围地貌尚须绑定其最终提交重新核对相关风险。
- `e432b10` 的 M1/60 Hz 历史基线曾记录全景 CPU P50/P95 5.8/10 ms，同时有 327.3 ms 峰值；该版完整预算也未通过。不能迁移为新道路、车辆、奇观或本轮 UI 已通过，见 [历史本机性能报告](reports/CITY-LOCAL-PERFORMANCE.md)。
- 本轮类型/构建与云端受控 UI 结果见 [CITY-FIRST-UI](reports/CITY-FIRST-UI.md)，不替代本机登录会话、商店审核或硬件预算。

官方页面于上述日期查阅；临近提交时按 Chrome/Edge 控制台实际必填项再核验。完成具体包、资料和本机验收后再由用户授权提交/发布，本任务没有执行商店动作。
