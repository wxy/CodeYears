# P1-G 公开未登录会话有限补证

日期：2026-10-30（UTC+8）。验证代码提交：`a626ab47458586a6dba226c587cbfe03c95d4111`，即 fetch 核实后的 main / PR #6 合并提交。本 PR 只增加报告和任务文档，未改运行代码。

## 结论与证据范围

真实匿名请求取得 `wxy/2024`、`torvalds/2025` 两组主页及年度 HTML；原身份识别与解析代码分别得到已确认未登录、366 天 / 440 和 365 天 / 2925，逐日合计与各自年度标题一致。数量来自真实英文 tooltip，没有按颜色估算，没有填造缺失日期。

**这不是完整 MV3 扩展验收。** 一次性 Chromium 访问 GitHub 时遇 `ERR_CERT_AUTHORITY_INVALID`，尚未走到原 popup 主动入口。未修改 manifest/权限/注入策略，没有关闭 TLS 校验、复制用户资料或新建登录。按任务约定立即改走有限路径，不继续调环境。

## 环境与阻塞

- CodeYears 已连接云环境，Linux 6.18.57 x86_64；Node v24.19.0、npm 11.9.0；Debian Chromium 154.0.8037.57，headless；预装 Playwright 位于 `/opt/codex/cua_node/lib/node_modules/playwright`。
- 环境状态为 connected、observations_current=true、HTTP unrestricted/enforced，无环境 secrets、runtime variables、outbound identities；网络策略文件 vpn_configured=false。使用继承代理及默认 TLS 校验，不读取凭证值。
- 初次无网络授权的 `git fetch origin` / curl 无法连接代理，gh 报 socket operation not permitted。使用执行工具支持的 network enabled 后 fetch、gh、npm、curl 均可工作；不是 GitHub 拒绝或仓库权限问题。
- 初次 `npm ci` 因默认 `/home/agent/.npm/_cacache` 不可写而失败；改为任务临时目录的 `--cache` 后按原锁文件安装成功（29 packages），未更新任何依赖或锁文件。
- 浏览器脚本使用 `launchPersistentContext`，资料为任务目录下 `profile`，executablePath `/usr/bin/chromium`，headless=true，proxy.server 继承 HTTPS_PROXY，参数 `--no-sandbox`、`--disable-extensions-except=<任务目录>/dist`、`--load-extension=<任务目录>/dist`。首次 `page.goto('https://github.com/wxy', {waitUntil:'domcontentloaded', timeout:45000})` 即证书错误，随后关闭 context。扩展是否成功加载及主动授权均未核实；不能把该阻塞归因于 MV3 不受支持。

## 实际命令与有限路径

仓库 `/workspace/CodeYears`，任务临时目录 `/tmp/codeyears-public-session.elKAQT`。实际执行：

```sh
git status --porcelain=v1
git fetch origin
git rev-parse origin/main
gh pr view 6 --repo wxy/CodeYears --json state,mergeCommit
git switch -c codex/p1-public-session-validation origin/main
mktemp -d /tmp/codeyears-public-session.XXXXXX
npm ci
npm ci --cache /tmp/codeyears-public-session.elKAQT/npm-cache
npm run check
npm run build -- --outDir /tmp/codeyears-public-session.elKAQT/dist
node /tmp/codeyears-public-session.elKAQT/browser.cjs
```

两次 npm ci 的区别及首个失败如上。check、build 通过；原 popup 约 3.95 kB，content IIFE 约 13.01 kB。构建输出全在临时目录。

匿名请求实际使用下列四个 URL：

```text
https://github.com/wxy
https://github.com/wxy?action=show&controller=profiles&from=2024-01-01&tab=contributions&to=2024-12-31&user_id=wxy
https://github.com/torvalds
https://github.com/torvalds?action=show&controller=profiles&from=2025-01-01&tab=contributions&to=2025-12-31&user_id=torvalds
```

对每份主页执行 `curl --fail --silent --show-error --max-time 30 -H 'Accept: text/html' -D <临时响应头文件> -o <临时HTML文件> '<URL>'`，wxy 主页命令另有 `--location`；实际无重定向头或中间 3xx。年度同一命令增加 `-H 'X-Requested-With: XMLHttpRequest'`。全部最终为 HTTP/2 200、`text/html; charset=utf-8`，未使用 Cookie jar、Cookie/Authorization 请求头或登录资料。保留 TLS 验证；响应头未整体输出，报告不保留服务端 Cookie。

随后执行 `node /tmp/codeyears-public-session.elKAQT/parse.mjs`。复现算法：

1. 使用仓库 Vite Node API，`configFile:false, publicDir:false, build.write:false, minify:false`，library entry 为 `src/platform/github/probe.ts`，IIFE name 为 `RealProbe`。直接打包原 `readLivePageContext`、`fetchContributionYear` 及其原 `parseContributionYear` 依赖，没有改源码。
2. 本地 Chromium 的 about:blank 页面加载该内存 IIFE，使用浏览器原生 DOMParser。传输边界替换 `window.fetch`：按上述真实 URL 返回 curl 刚取得的原始 HTML，用 Response 表达 200 / text/html，url 属性设为对应来源 URL。这里的 Response 状态/URL 为依据 curl 观察设置的测试适配，**不是浏览器亲自取得的网络响应**，不证明浏览器同源请求、权限、重定向或缓存行为。
3. 分别调用 `readLivePageContext(login, signal)`，再调用 `fetchContributionYear(context, year, signal)`。记录原函数发出的 URL、credentials=same-origin、cache=no-store 与 headers；与实际 curl URL/请求头对应。未调用 loadContributionYear，也未替代 chrome.storage 为模拟存储来冒充真实缓存。
4. 从返回 days 统计覆盖与合计，从同一原始年度 DOM 按 data-date / id / tool-tip[for] 提取首尾、闰日、首个零值/非零及最大值作对照。首次脚本因 Vite build 返回数组而读取 output 失败，修正临时驱动后运行成功；不是产品缺陷。

## 实测结果

| 项目 | wxy / 2024 | torvalds / 2025 |
| --- | --- | --- |
| 主页 body.logged-out | true | true |
| meta user-login | 空字符串 | 空字符串 |
| 原 readLivePageContext | known / signed-out | known / signed-out |
| 原始完整主页日历表数量 | 0（延迟片段） | 0（延迟片段） |
| 年度日期范围 | 2024-01-01 至 2024-12-31 | 2025-01-01 至 2025-12-31 |
| 连续日期数 | 366 | 365 |
| 原解析器逐日合计 | 440 | 2925 |
| 真实年度标题总数 | 440 | 2925 |

主页用户名只作为被查看者；未登录结论来自实际响应标识，不是从 URL 推断。原始完整主页没有日历符合既有延迟加载观察；没有在主页伪造日历。年度解析同时校验完整连续日期、重复/越界、tooltip 日期和年度标题。

| 样本 | 日期 | 原解析数量 | 同一真实响应的 tooltip |
| --- | --- | --- | --- |
| wxy | 2024-01-01 | 7 | 7 contributions on January 1st. |
| wxy | 2024-01-14 | 0 | No contributions on January 14th. |
| wxy | 2024-01-25（样本最大值） | 35 | 35 contributions on January 25th. |
| wxy | 2024-02-29 | 0 | No contributions on February 29th. |
| wxy | 2024-12-31 | 0 | No contributions on December 31st. |
| torvalds | 2025-01-01 | 1 | 1 contribution on January 1st. |
| torvalds | 2025-01-15 | 0 | No contributions on January 15th. |
| torvalds | 2025-07-28（样本最大值） | 61 | 61 contributions on July 28th. |
| torvalds | 2025-12-31 | 6 | 6 contributions on December 31st. |

这只证明这次匿名可见数量及英文响应兼容性，不证明全部 Git 提交、隐藏私有活动、其他语言或长期接口稳定性。没有生成模拟贡献输入，也没有扩大账户/年份矩阵。

## 未验收与下一步

本次没有发现需主线修改的解析或身份缺陷。以下保持待验收：原 MV3 popup 主动授权/注入、真实未登录扩展中的 chrome.storage.local 写入/命中/刷新/清除、关闭/重开、权限提示及导航；真实 A/B/退出切换、多标签页、私有贡献/SSO；Edge；后台与 60 Hz 性能。关闭了临时 browser context 只证明测试进程清理，不代表诊断面板关闭路径通过。

最小后续是在具有正常 GitHub TLS 信任的真实 Chrome/Edge 一次性未登录资料中，加载未修改构建，由工具栏打开诊断，对这两个指定样本执行首次读取→再次命中→强制刷新→清除→再读→关闭，并核对来源、日期、合计、时间和存储作用域；再由独立真实会话任务负责多账户。不要引入额外 host/cookies 权限绕开主动入口。P1-G 未通过，正式 City MVP/P2 仍未完成。

## 交付与清理

静态检查 `git diff --check` 通过；本 PR 只含本报告及 `docs/tasks/P1-G-PUBLIC-SESSION.md`。报告完成后关闭测试浏览器，删除 `/tmp/codeyears-public-session.elKAQT`（全部 HTML、响应头、脚本、日志、npm cache、构建和浏览器资料）；本任务新安装的 `node_modules` 也移除，不留测试生成物。仅提交正式文档，通过独立 PR 交付，不合入、不发额外 GitHub 评论。
