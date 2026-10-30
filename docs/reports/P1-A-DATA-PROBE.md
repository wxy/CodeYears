# P1-A 数据诊断验证记录

日期：2026-10-30。状态：原型已实现、编译与产物检查通过，真实扩展运行路径待用户加载后验收。

## 范围与环境

- 本地仓库 `/Volumes/MacSSD/develop/CodeYears`；分支 `codex/p1-data-probe`，基线为初始化合并提交 `ae876a4`。
- macOS 26.6.2、Node.js v26.7.0、npm 11.19.0；本机 Chrome 156.0.8078.76。
- 云端 P1-C 使用独立 `codex/p1-render-probe` 分支和 PR #2；本工作不修改该原型的目录。
- 本轮实现主动打开的单年诊断，不做缓存或正式 3D 集成。不新增单元测试；验证以真实页面、HTTP 响应和扩展直接路径为主。

## 已执行：真实来源观察

1. 在现有 Chrome 登录会话打开 `https://github.com/wxy`；页面 DOM 的 `meta[name="user-login"]` 为 `wxy`。点击原生 2024 年入口后，地址为 `https://github.com/wxy?tab=overview&from=2024-12-01&to=2024-12-31`，页面日历包含 2024-01-01 至 2024-12-31 的 366 个日期，标题为年度 440 次贡献。
2. 日期来自日历格的 `data-date`；精确数量来自 `tool-tip` 文本，通过 `for` 绑定日期格 ID。原始响应尚没有客户端补充的 `aria-labelledby`，因此解析器采用实际存在的 `for` 绑定。未读取或使用 `data-level` 推算数量。
3. 公开主页原始 HTML 包含同源 `include-fragment` 请求形式。直接 GET 该地址得到外层主页；添加 `X-Requested-With: XMLHttpRequest` 与 `Accept: text/html` 后取得实际贡献片段。
4. 使用不带 Cookie/Token 的公开 GET 获取三个年度片段，仅存入任务临时目录。用独立 HTML 读取核对源页面覆盖和 tooltip 数值；这一步是来源观察，不是本项目解析器的运行验收。

| 公开输入 | 原始日历日期 | 页面年度总数 / 源 tooltip 合计 | 已观察的边界 |
| --- | --- | --- | --- |
| `wxy` · 2024 | 366 天，完整闰年 | 440 / 440 | 295 个零贡献日，最大单日 35 |
| `wxy` · 2026，查询截至 10-30 | 返回整年 365 格 | 5,417 / 5,417 | 包含未来日期占位；原型必须剔除抓取日之后的格子 |
| `torvalds` · 2025 | 365 天，完整平年 | 2,925 / 2,925 | 零贡献与非零日期，最大单日 61 |

2026 片段不因为 `to=2026-10-30` 就只返回截至当日的数据。解析器显式排除未来日期，且对已经发生的日期检查连续覆盖，避免将未来或缺失日期填为零。当前源数据中大于 100 的单日数量和带千分位的年度标题均已观察到；其他语言格式尚未验证。

公开响应可复现形式（普通终端，不带认证信息）：

```sh
curl --fail --location --silent --show-error \
  -H 'X-Requested-With: XMLHttpRequest' -H 'Accept: text/html' \
  'https://github.com/wxy?action=show&controller=profiles&from=2024-01-01&tab=contributions&to=2024-12-31&user_id=wxy' \
  --output <本次系统临时目录>/year.html
```

这是 2026-10-30 实际观察到的网页行为，不能据此保证私有页面接口稳定、所有年份/语言一致或全部私有活动可见。

## 已执行：构建与静态核对

命令：

```sh
npm run build -- --outDir <本次系统临时目录>/dist
node --check <本次系统临时目录>/dist/content.js
git diff --check
```

- TypeScript 严格检查通过；主 popup 与单独 IIFE 注入脚本的 Vite 构建通过。
- 当前产物 popup JS 约 3.53 kB、注入脚本 8,507 字节；不是正式产品完整包体积预算。
- manifest 仅声明 `activeTab`、`scripting`，没有 `host_permissions`、自动 content script、后台服务或 web accessible resources。
- `content.js` 为独立脚本，无 ESM import/export；产物未发现 Cookie 读取、持久缓存或 WebGL 入口。
- 所有外部页面内容仅在离线 DOM 中解析，结果以 `textContent` 呈现；不将 GitHub 响应 HTML 注入活页面。

## 待执行：扩展完整路径

浏览器工具的安全策略禁止打开 `chrome://extensions`，无法代替用户完成本地加载。已经请求用户将本次临时构建加载到 Chrome；尚未获得加载完成的确认。

- [ ] 在实际 Chrome 点击扩展并打开诊断，不自动请求数据。
- [ ] 2024 年 366 天与真实页面逐日数量/合计对照。
- [ ] 当年仅保留已发生日期（2026-10-30 时为 303 天），年度合计校验。
- [ ] 另一个公开主页，页面所有者与访问者分别呈现。
- [ ] 取消、网络失败、关闭、重复打开和非主页反馈。
- [ ] Edge 实装、其他语言、本人/他人/退出登录及私有贡献差异。

实现中的解析失败（日期/数量/绑定/覆盖/标题/合计）、HTTP 错误与重定向反馈尚需真实路径验证，不因编译通过标为已验收。账户切换、跨标签页与缓存隔离属于 P1-B；本轮无缓存可复用，不宣称这些路径已通过。

## 留存

原始 HTML、测试构建和过程文件均位于任务系统临时目录，不加入 Git。在实际加载验证结束后清理；如果需要后续用户继续加载，则保留期间仍视为当次测试所需，而非正式长期产物。只长期保留此报告及正式诊断源码。
