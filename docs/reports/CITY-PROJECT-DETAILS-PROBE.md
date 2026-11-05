# 建筑对应项目详情：云端可行性验证

2026-11-05（Asia/Shanghai）。独立分支 `codex/city-project-details-probe`；启动时 fetch 最新 main，完整基线为 `0fa96154405d64ce3fd7dde1f37448e008307d7d`，与派发时一致。任务边界见 [任务](../tasks/CITY-PROJECT-DETAILS-PROBE.md)。状态：探针已实现、限定验证通过；正式悬停、真实已登录 MV3、私有贡献与本机性能均未验收。通过本分支 PR 交付，不合入、不发布。

## 结论

匿名公开网页可以按历史单日取得可解释的仓库与活动链接。值得进入**本机同源公开取数补验**，但目前不足以直接承诺正式“主要项目”排名。建议后续候选文案为“可见的相关项目 / 详情不完整”，由用户确认后才进入正式悬停接入。单日可见活动、review 的 PR 数与贡献日历合计的口径不能直接视为相同。

本轮只新增 `probes/project-details/**` 与本任务/报告，不修改生产请求、解析、缓存、共享类型、renderer、扩展、manifest、依赖或全局产品决策。没有把网页当稳定官方 API，没有用 Events、颜色等级或年度 overview 冒充完整历史。无产品后端；预览只用本机静态文件服务器。

## 环境及源码调查

Linux 云端、Node 24.19.0、npm 11.9.0、Chromium 154.0.8037.57。已读 AGENTS、PRODUCT、DEVELOPMENT_PLAN、CLOUD_DEVELOPMENT、DATA_AND_PRIVACY、PERFORMANCE 及相关源码，并应用 cloud-environment-runtime 技能。环境状态 observations_current=true、网络 unrestricted/enforced、无配置秘密/出站身份/VPN。命令默认网络沙箱起初无法连接 proxy:8080；显式正常 network 权限后通过继承代理成功，未改代理或绕行。

- `DailyContribution` 只有 date/count。`parse-year.ts` 以 tooltip 精确数量、连续日期及年度总计校验；详情模块没有写回路径。
- GitHub 生产请求是同源 HTML；年度片段需 `X-Requested-With: XMLHttpRequest`，现有会话与身份确认不因本探针改变。
- `load-year.ts` / `load-history.ts` 经访问者确认后按年读取、缓存或顺序加载，身份未知不使用缓存。缓存 schema 1 只保留日期/count及必要元信息，本探针不调用它们。
- `planWeeklyCity` 用输入 days 的原始 index 建单日 cell，普通矩形和奇观分别 flatMap 成员 indices；空间相邻可以是不同周、非连续日期。接入时必须用**创建该地块时同一快照**的 `days[index].date`，不能在后续增量重规划后拿旧 index 配新数组。本探针仅复现该索引→日期契约，不引入 renderer 依赖。

## 匿名真实公开证据

所有产品数据请求无 Cookie、Authorization、Token；curl 仅默认 HTTPS 及所列公开路径，未读取登录资料或真实缓存。Git/PR 使用现成仓库授权，与产品数据凭证分开；未为探针使用 GitHub API token。

公开来源请求形态：

```sh
curl --fail --silent --show-error \
  -H 'Accept: text/html' -H 'X-Requested-With: XMLHttpRequest' \
  'https://github.com/wxy?tab=overview&from=2024-04-27&to=2024-04-27'
```

此命令输出真实页面，仅在终端临时查看；如需保存只存系统临时目录并清理。探针采用此同源网页途径，`credentials: omit`、`cache: no-store`、重定向即失败。不是 GitHub API 合同。

| 公开样本 | 实际观察（仅脱敏数量与覆盖结论，不存内容明细） |
| --- | --- |
| wxy，2024-04-27 | HTTP 200；历史单日标题；8 commits、2 个打开的 PR；探针 3 条记录（一个汇总提交链接、两个 PR 链接）。对应日历 tooltip 为 10，该样本数量相符不代表一般覆盖完整 |
| wxy，2026-11-04 | HTTP 200；同一天两个仓库、commits / opened PR / review 三种类别；提交汇总 15、普通 PR 列表 5、被 review 的 PR 链接 3，探针 10 条记录。日历 tooltip 为 36；上述可见类别量相加仅 23，不能覆盖合计 |
| wxy，2024-10-01 | HTTP 200；明确 had no activity；日历 tooltip 为 No contributions。探针仍称“无可见详情（不等于真实零值）”，参考零值是独立来源，不由空详情推导 |
| wxy，2009-01-01 | HTTP 200；明确无可见活动，未取得/验证该日期完整年度数量，不推断零值 |
| wxy，2024-04-26 至 2024-04-28 | HTTP 200；短范围标题、12 commits、7 PR 的范围汇总；不能将汇总贡献归到某个成员日。生产候选采用逐个成员日请求；探针拒绝把这个范围响应当 4月27日单日结果 |

可重复的日历 tooltip 对照来源为 `https://github.com/wxy?action=show&controller=profiles&from=2024-10-01&tab=contributions&to=2024-10-01&user_id=wxy`（返回全年 2024）及相同参数的 `from=2026-01-01&to=2026-11-05`。本轮只是独立 tooltip 对照，并未在探针中重跑完整年度校验。面板手填 referenceCount 明确标成“未经本探针校验”；正式接入只能从既有已校验快照获得 count。

调查和完整路径共 **17 次成功的匿名公开 HTML GET**（包括入口/片段发现、短范围、日历对照和两轮各3次浏览器路径的实时传输），仅用户 wxy，未遍历其他参与者或所有历史。另有一次 Chromium 到 `/robots.txt` 的 TLS 失败诊断，不计入成功 HTML 请求。构建、npm、git/PR 请求不属于产品活动读取。受控响应和合成按钮均不计真实 GitHub 成功。

## 字段、分页及时间归属

正式探针结果仅使用已观察到的字段：查询成员日期、来源 URL、仓库路径、活动类别、提交汇总数量/筛选链接、公开 PR 或被 review 的 PR 链接、类别 summary、Show more 目标与覆盖限制。PR/review 每条链接**不添加 count=1 字段**；review 只是一个被 review 的 PR，不证明一次 review 等于一次贡献。未保存标题、正文、提交 SHA 或作者资料。Issue 的实际历史明细未观察/验证，本轮不实现 Issue 提取；未知类别保留原 summary 并标未支持。

- `.contribution-activity-listing` 与单日 h3 是当前观察结构。只解析活动区域，排除全年 Activity overview、仓库精选列表、年度统计。
- 提交链接实际带 `author`、`since=所选日期`、`until=次日`；可用汇总数量，未展开提交页获取 SHA。PR 时间标签只有 `Apr 27` 等文本，没有本轮可用的精确事件时间戳。采用请求日期与单日标题归属，不把它转换为上海/UTC事件时间；GitHub 的类型归日差异仍需本机核对。
- 2026 样本含精选 PR 和 `Opened 5 other pull requests`。探针支持已观察的 other 文案，但精选项不按普通 opened 类别重复计数，明确记覆盖限制。精选项未纳入逐项详情，不能以 23 推断漏了哪13次。
- “Show more activity” 的表单实际目标是前一个月（2024年3月或2026年10月），并非当前单日下一页。只记录 URL，不自动追踪；没有声称完成分页。真实样本未观察到当前日期的多页截断；探针识别活动内延迟加载/分页与类别汇总不符，受控验证截断提示，未证明 GitHub 任意限制都能检测。
- 无可见活动、未知 count、参考 count=0 和 HTTP/结构失败分别展示。请求失败不返回空成功，不写缓存，更不修改每日数量。即使类别数量相符也始终显示详情不完整、不作排名。

## 工程预览及重复验证

源码：`details.ts` 是局部请求/解析和成员日期入口；`main.ts` 是独立 Shadow DOM 工程面板；`build.mjs` 构建独立 IIFE 与静态 HTML。无正式命中检测/hover、持久详情缓存或通用请求层。一次显式操作最多12个不同成员日期，顺序请求；不预取、自动翻页或常驻轮询，可取消和关闭。

在仓库根目录：

```sh
npm ci
task_tmp=$(mktemp -d "${TMPDIR:-/tmp}/codeyears-project-details.XXXXXX")
npm run check
npx tsc --noEmit -p probes/project-details/tsconfig.json
node probes/project-details/build.mjs --outDir "$task_tmp/probe"
npm run build -- --outDir "$task_tmp/dist"
git diff --check
python3 -m http.server 4180 --bind 127.0.0.1 --directory "$task_tmp/probe"
# 浏览器打开 http://127.0.0.1:4180；完成后 Ctrl-C，清理 task_tmp
```

本地静态页可运行“合成成员过滤示例”；生成日期1/2/8日，indices=0,2，只显示1/8日，2日不请求/不显示；参考零和未知数量分开。合成结果逐项标 `evidence: synthetic`，来源链接仅为可访问入口，没有声称取数成功。跨源公开取数明确失败，不建转发后端绕 CORS。

真实同源复现：在正常打开的 `https://github.com/wxy` 页面，DevTools Sources → Snippets 新建临时片段，将 `$task_tmp/probe/project-details.js` 的内容粘入并运行。独立面板出现在页面末尾，滚动到底部操作；无需修改扩展、安装新权限或复制会话。其请求始终 omit credentials，即使浏览器已有登录仍为匿名模式。填入三个日期 `2024-04-27,10` / `2024-04-28` / `2026-11-04,36`，indices `0,2`：只应请求第1与第3行，结果明确来源/类别/限制。上述数量仅为本次观测参考，后续页面可变化。结束点“关闭并清除”、删除临时 Snippet、停止服务器并 `rm -rf "$task_tmp"`。

## 实际检查与证据边界

- `npm ci` 使用当前锁文件通过。首次因默认 npm cache 不可写失败，改为任务临时目录 `npm ci --cache <task_tmp>/npm-cache` 成功；未改锁文件或版本。
- 主线 `npm run check`、探针单独 tsc、探针构建、`npm run build -- --outDir <task_tmp>/dist`、`git diff --check` 通过。探针约8.6kB（gzip约4.3kB），不进入发行包。
- **原生浏览器 GitHub 网络未通过**：Chromium 到 GitHub 报 `ERR_CERT_AUTHORITY_INVALID`。curl 走同一受管代理并正常校验证书成功；未忽略证书、改代理或复制登录资料。可用标准 CA 文件已定位，未改变共享浏览器信任数据库；最小后续是在配置好正常信任的本机浏览器复跑。
- **真实公开取数→解析→展示路径通过，但传输受控**：临时 Playwright 使用全新无登录上下文，同源 GitHub 空白测试壳；拦截页面请求，用 curl（保留 TLS 校验、不转发 Cookie/Auth）实时获取公开 HTML，再交回浏览器 fetch→DOMParser→同一面板。两轮各请求上述两个非连续成员日及无活动日；最终取得历史3行/近期10行。检查请求无 Cookie/Authorization、无中间日期。该证据包含真实公开响应，但不冒充原生浏览器网络、真实页面注入或已登录 MV3。
- **受控浏览器响应通过**：429、非 HTML、活动结构缺失、范围返回不符、302重定向均显示失败且参考 count 不变；更改类别汇总模拟截断时给覆盖警告；延迟请求取消、关闭移除面板通过。没有声称真实触发 GitHub 限流/截断。
- **本地静态预览通过**：实际临时服务器/Chromium打开、合成按钮0请求、成员过滤/未知与零、公开按钮同源保护、关闭路径；检查过临时截图的布局与可读性。全部截图、页面、浏览器过程、测试脚本、缓存、构建和日志已在报告后清理，不进 Git。

## 明早 2026-11-06 本机验收及未来影响

1. 检出本 PR，按上述命令重复主线/探针检查与合成预览；正式扩展路径应保持不变。
2. 本机 Chrome / Edge 在 GitHub 同源运行临时 Snippet，核对两个公开样本及网络请求 omit 凭证、日期成员与来源，特别是跳过中间日期和前月 Show more。
3. 对照原生日历的已校验日期/count，复核近期样本缺口与不同活动归日；不要把手填参考值当已校验快照。测试断网/取消和页面变化反馈。
4. 当前探针不复用登录会话；真实已登录 MV3、私有贡献可见性、账户变化与身份隔离**未实现/未验证**。如要正式进入现有会话路径，先明确授权与隐私边界，再独立验证。云端也未测本机性能。

未来正式接入的候选最小字段是成员日期、repo路径/链接、已观察的活动类型、必要来源/覆盖状态；是否保留数量必须逐类型定义口径，标题/正文/SHA 不应默认采集。先考虑仅按需、短暂内存结果；本轮没有批准或实现持久化。若以后需要缓存，必须重新定义访问者+主页+成员日期作用域、过期/权限变化失效、取消/导航/身份变化清除，不能复用只有年度 count 语义的缓存，也不能按主页独占一个详情缓存。现有隐私说明明确不保存仓库详情，因此任何正式详情持久化都需要另行审查并修改 DATA_AND_PRIVACY、用户说明和相应验收；本报告不是政策变更或私有贡献支持声明。
