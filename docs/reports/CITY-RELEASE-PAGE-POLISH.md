# City 首发页内体验与键盘收口报告

日期：2026-11-02（Asia/Shanghai）。工作包A。基线 `e3a609e84a821b2a792711c888f63f27edc120e5`，从正常fetch的 `origin/codex/city-first-release-rc` 核实完整SHA后创建 `codex/city-release-page-polish`。起始工作区干净。PR base为 `codex/city-first-release-rc`；不合入、不发布。

## 实现

- `src/extension/content.ts`：“更多”保留现有语言入口，按“当前主页”和“帮助与数据说明”分组；身份、刷新、清缓存和逐日明细归主页操作；帮助与图例为独立原生details，默认折叠。复用moreProfileSection、moreHelpSection、help、legendLabel及既有文案，无公共locale或偏好协议变更。
- document捕获pointerdown，用composedPath判断是否在更多菜单内；点击原生页面、另一Shadow DOM中的画布/工具或其他控件时关闭，不调用focus。内部折叠操作不误关菜单。切回原图沿既有deactivate关闭。
- Esc菜单优先：捕获keydown关闭菜单、阻止同一次Esc继续收起dialog，并恢复summary焦点；再次Esc走dialog.cancel收起，恢复展开按钮焦点。dialog.cancel也保留菜单优先的后备处理。新增document监听随dispose移除。
- `#scene`作为稳定tabindex=0/region入口，复用canvasKeyboardLabel和keyboardControls，聚焦可见时显示3px轮廓。说明在setLanguage更新，不增加逐帧ARIA写入；画布更换不替换此容器。
- `src/renderers/landscape.ts`：只在City的host本身有焦点、事件target为host且无Alt/Ctrl/Meta/Shift时处理方向键，内容向对应方向平移40 CSS像素，调用原schedule单帧机制；忽略其他键和子控件事件。keydown随renderer.dispose移除。不改缩放API、倍率、布局、素材、时间轴或数据路径。

只修改上述两个源码与本任务说明/报告。未改entry、公共语言JSON、数据/缓存/身份逻辑、依赖锁、运行图片或其他工作包。

## 环境与命令

原共享CodeYears云环境，Linux x86_64，Node v24.19.0，npm11.9.0，Chromium154.0.8037.57（Debian13），Python Playwright为环境已有安装；1440×900、DPR1，headless受控会话。City为Canvas2D，云端软件会话不代表用户Mac硬件、真实MV3、Edge或后台验收。

已读AGENTS.md、本轮首发任务、产品/隐私/性能与云端约定。使用cloud-environment-runtime检查当前环境与 `/etc/codex/network-policy.json`：unrestricted/enforced、observations_current=true、无VPN。沿原连接使用显式网络权限，无新Token、登录或后端。正常fetch约数十秒后成功，完整SHA一致，未从旧分支/main继续实现。

实际运行并通过：

```sh
git status --short
git fetch origin refs/heads/codex/city-first-release-rc:refs/remotes/origin/codex/city-first-release-rc
git rev-parse origin/codex/city-first-release-rc
git checkout --detach e3a609e84a821b2a792711c888f63f27edc120e5
git rev-parse HEAD
git switch -c codex/city-release-page-polish
npm ci --cache /tmp/codeyears-page-polish/npm-cache
npm run check
npm run build -- --outDir /tmp/codeyears-page-polish/dist
git diff --check
```

初始构建后执行受控端到端；末次将ARIA说明从逐帧updateControls移到setLanguage，再次check/build，并针对语言与展开态键盘补查。正式构建最终content约48.31kB/gzip15.25，landscape147.46kB/gzip39.90（构建显示精度）；包体不是性能预算。

## 受控完整路径与复现方式

临时HTTP `127.0.0.1:4196` 服务正式dist和原PNG。仅在返回entry.js/content.js时将 `https://github.com` 字面量映射为本地origin，未替换parser/loader/render实现。runtime.getURL映射静态路径，storage.local以structuredClone内存对象实现get/set/remove，onChanged派发同样的key/newValue；i18n.getUILanguage固定en。这是明确的Chrome API与身份替身，不代表真实权限或持久化通过。

主页 `/demo` 包含meta user-login=fixture-viewer、唯一ContributionCalendar-grid、`.js-yearly-contributions > div`中的 `h2#js-contribution-activity-description` 与日历、同级overview、root外活动流水；年度入口2023–2025。完整主页身份GET返回相同meta。年度query.from响应以公历真实日期生成完整年：从0开始的年度日索引i，`count = i % 11 < 3 ? 0 : (i * 17 + year * 3) % 39`。h2为精确总量 `N contributions in YYYY`，每个td的data-date/id与英文tool-tip for一一对应，数量为No或整数、日期格式如 `January 1th.`。数据经过正式身份确认、parser、cache和history loader，不直接注入可信结果。

运行环境已有Python Playwright，启动 `/usr/bin/chromium`、headless=True、`--no-sandbox`；主交互轮加disable-background-timer-throttling、disable-renderer-backgrounding、disable-backgrounding-occluded-windows，仅为受控前台测试，不用于证明后台。复跑顺序：打开城市等三年完成→更多及两个折叠项→Esc/外部按钮/画布/缩放按钮→Tab聚焦scene并方向键→年份下拉方向键→切中英文→展开并连按两次Esc→刷新期间聚焦scene待换层→切回原图→刷新取消/403/恢复重试→Turbo before-cache销毁。

临时封装原drawImage与RAF仅计数，记录主画布底图drawImage坐标；不额外驱动帧。记录创建的canvas及新增/移除的指定监听用于dispose核对，仍调用原API。稳定窗口不做RAF轮询，累计RAF中可能含Playwright等待回调，不冒充FPS。原始夹具/输入/日志均不提交，只保留此输入算法、协议和操作步骤。

## 实际结果

| 检查 | 结果 |
| --- | --- |
| 分组与折叠 | PASS。英文This profile与Help and data分组存在；帮助与图例初始均closed，分别打开仍保持更多open。语言入口继续复用现有设置。 |
| Esc及焦点 | PASS。更多open时Esc关闭并focus其summary；外部按钮点击关闭且焦点保留在外部按钮；画布点击关闭并聚焦scene；缩放工具点击关闭且工具按钮保持focus。 |
| 展开Esc顺序 | PASS。展开后打开更多：第一次Esc仅关菜单、dialog仍open、焦点回summary；第二次Esc收起并focus展开按钮。保存的同一canvas引用仍connected，没有为展开重建画布。最终构建展开态ArrowLeft使底图x从16到-24（宽1366不变）；收起后scene仍可重新聚焦并用ArrowUp。 |
| 键盘入口与平移 | PASS。Tab/Shift+Tab进入scene，focus-visible轮廓3px。底图起点 `[400.7830065359477,12]`，Right后 `[440.7830065359477,12]`，Down后 `[440.7830065359477,52]`；宽高620.4339869281046×316未改变。 |
| 不吞其他操作 | PASS。四种修饰键组合未改变平移；非聚焦scene的可取消方向键事件未被preventDefault。原生年份下拉ArrowDown使2025→2024，未切换城市页签；原城市按钮ArrowRight仍选原图。最终补查：焦点在外部按钮时ArrowDown使页面scrollY=40，未被城市处理。 |
| 语言 | PASS。通过现有语言下拉选择zh-CN，既有key `codeyears:ui:language`为zh-CN；新分组为“当前主页”，稳定host标签为“贡献之城。可用方向键或拖动平移，通过缩放按钮或滚轮缩放。”，未建新偏好。最终构建再次切zh-CN→en，host标签与aria-description均随语言更新。 |
| 换层保持焦点 | PASS。刷新年度响应各延迟0.8秒，聚焦scene，3.5秒后同一host仍connected且focus，方向键可用；无需focus易被替换的canvas。 |
| 切回与读取反馈 | PASS。更多开启后切原图关闭菜单、canvas=0。刷新中取消后保留空地canvas=1、重试可见，提示Loading was cancelled. The field is incomplete.；HTTP403同样清贡献层而保留空地/重试；恢复正常可重试成功。 |
| 完成静止 | PASS。无轮询1秒窗口draw5675→5675，RAF34→34，未增加常驻绘制。 |
| dispose | PASS。Turbo before-cache触发现有entry销毁路径，新增document pointerdown/keydown和scene keydown监听活跃数0，所有记录canvas宽高归零/live0；脱离DOM的旧scene方向键不再被preventDefault。补充轮pageerror=[]。 |

首次主脚本已通过菜单、焦点、键盘、语言、展开/返回与换层检查，随后在取消检查遇到测试定位器 `#retry` 跨Shadow DOM匹配两个元素的strict-mode错误；这是夹具定位错误，不能计为产品失败或通过。补充脚本使用 `.status #retry` 精确定位，重新检查取消、失败、重试、静止、原图键盘和dispose，均通过。没有为测试修改产品源码、隐藏错误或补单元测试。

## 本地待验收与清理

- 本地组合A/B/C后真实Chrome重载确认焦点提示、菜单位置、屏幕阅读器读法、原生年份选择与Esc顺序；Edge及目标硬件/后台/完整性能预算不由本次云端交互结果代替。
- 用户已明确取消独立测试账户和A/B登录切换验收；本轮未覆盖，不索取账号、密码、Cookie，也不将其列为本轮要求用户完成的阻塞。身份逻辑没有修改。
- 没有接入已关闭#35导出/分享，也没有增加缩放百分比或最大倍率入口。
- 停止临时HTTP服务、关闭本次Playwright浏览器，删除 `/tmp/codeyears-page-polish` 内构建、npm缓存、夹具、输入与日志；只长期保留任务/报告。提交前diff检查与文件边界核对通过，不提交任何过程产物。

## 原PR #47追加：批次让出与实际界面反馈

2026-11-02继续原分支，在 `d6f009563332766697ef24cf0b03765a71affe1f` 后追加。主代理报告原菜单/Esc/真实方向键主路径已在本地通过，本节不撤销该范围。用户提供的本机性能诊断：147463B renderer、regular7301天/93111，填入2696.2ms、长任务775ms；另一次857ms任务连续包含source-2007至2018的12个updateDays，单批createCityView约40–93ms、plan约5–37ms，而mip每批2–5ms、loadUnit像素块通常<10ms。**这些是主代理提供的证据，不是本云端测得的时长。** 修复针对已证明的无新素材快照微任务链，未将问题归因于GPU/mip或新增共享缓存重构。

### 最小实现

- progressive City的updateDays先递增generation，再 `await new Promise<void>(resolve=>setTimeout(resolve,0))`，恢复后立即throwIfAborted并检查disposed/token，然后才planCityScene。让浏览器有处理其他任务、输入与绘制的机会；不是Promise.resolve微任务，不为观赏延长加载。原资产等待、顺序、图层交换与650ms动画合同不变，Promise仍在资产就绪/新层交换时resolve。
- 英文More实际页面核对后，语言行与主页操作之间增加1px分隔和12px留白；原主页/帮助区分隔保留，逐日明细/帮助/图例折叠行分别加轻边框和6px间距，原生三角放在行内。数据按钮max-width100%、正常换行/长词断行，保持既有组件与文案。
- dialog追加原生 `closedby="any"`，不加兼容框架或全局遮罩事件。沿既有cancel→collapse生命周期恢复toolbar/画布位置和展开按钮焦点；既有Esc菜单优先规则保留。document pointerdown会在遮罩点击时先关闭More，随后原生cancel收起dialog；内容内操作仍由浏览器原生light-dismiss判定，避免按坐标猜测拖动。

原生行为核对来源：[MDN dialog closedby说明](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog#closedby)明确any支持light-dismiss、平台关闭和开发者关闭；[MDN浏览器支持数据](https://github.com/mdn/browser-compat-data/blob/main/html/elements/dialog.json)的Chrome version_added=134。本轮系统Chromium154实际存在HTMLDialogElement.prototype.closedBy，真实点击验证通过。尝试的两条Chrome blog猜测地址返回404，未据此认定支持；以上文档、支持数据和直接实测才作为依据。

### 实际验证与复现

复用Node24.19.0/npm11.9.0/Chromium154环境及已装锁文件依赖。运行 `npm run check`、`npm run build -- --outDir /tmp/codeyears-batch-yield/dist`、`git diff --check`通过；界面反馈追加及折叠行marker收口后再次check/build，最终renderer147631 bytes；最终构建单年/菜单/遮罩/拖动/键盘复查通过，销毁live0且pageerror为空。正式renderer、content及原PNG在临时HTTP4196直接运行，无依赖、locale、数据/缓存/布局/素材变更，也未新建单元测试。

二十年输入复用仓库 `generateDays('regular')`，seed初始20060101；每天 `seed=(Math.imul(seed,1664525)+1013904223)>>>0`，`count=seed%5===0?0:1+seed%30`，从公历2006-01-01生成至2025-12-31，再过滤ISO展示窗口2006-01-02至2025-12-28（含）。只读诊断模块临时导出现有generateDays/planCityScene作守恒交叉核对，不替换正式renderer。reservedYears=2006–2025，在同一场景中按源年2006到2025依次 `await field.updateDays(all.filter(d=>+d.date.slice(0,4)<=year))`；每批调用前排队一个0ms任务设置sentinel，同时记录原生RAF/Canvas drawImage回调，最终在浏览器外以100ms轮询等待state.completed，未调用skip。

| 追加路径 | 实际结果 |
| --- | --- |
| 二十年顺序自然填入 | PASS。20批均完成，最终state.completed/7301；原始days、cells、parcel成员数与唯一成员数均7301，原量与parcel量均93111；未补未知日期0。20个sentinel全部在该批resolve前执行，每批均有RAF及drawImage回调，表明批次之间确实可处理普通任务与绘制回调。不是完整输入延迟或硬件呈现时限保证。 |
| resolve合同 | PASS。批次resolve时仍观测playing，后续自然completed；没有将updateDays改为等待650ms动画。Linux软件会话各批墙钟包含PNG、CPU和调度；不能与本机2696.2ms/775ms直接比较或宣称提速。 |
| 让出时立即关闭 | PASS。调用updateDays后同任务立即dispose，await拒绝AbortError；用临时Proxy记录输入map访问=0，新增canvas=0，200ms后live canvas=0。说明恢复后取消检查发生在规划前；未隐藏错误。 |
| 正常单年完整数据路径 | PASS。2024年度HTML从同LCG输入生成完整366日与精确h2/英文tooltip，经正式content/parser/loader/cache路径按ISO筛选，最终364日/4487；与合成源数据过滤一致。API/身份为受控替身。首次断言读了body面板ShadowRoot而表格实际在toolbar ShadowRoot，得到0行；修正测试定位至#details后通过，未据此改产品逻辑。 |
| 英文More边界与宽度 | PASS。实际英文截图目视检查：语言/This profile/Help and data边界、折叠行边框清楚。语言下边线与帮助/图例框均1px。1440px视口菜单clientWidth/scrollWidth=388/388，360px视口342/342，两个英文操作按钮分别145/145、120/120，无水平溢出。折叠与展开均可用。截图仅TMP，结束删除。 |
| 原生遮罩与焦点 | PASS。展开后实际mouse.click(5,5)落遮罩：收起、焦点回展开按钮；More开启时点击遮罩同样完成收起。不是模拟cancel事件。 |
| 内容点击与拖动不误关 | PASS。点击帮助、画布、缩放按钮均保持dialog.open；场景内拖动，以及从内容拖到遮罩后松开，均不触发关闭。随后独立遮罩点击仍可关闭。 |
| Esc/键盘/关闭回归 | PASS。第一Esc仅关More、dialog仍开，第二Esc收起；正常scene聚焦ArrowRight产生新绘制，最后dispose后live canvas=0、pageerror=[]。未改前轮已通过的方向键和原图/年份处理。 |

批次验证不将普通任务sentinel冒充真实硬件输入延迟；RAF/绘制回调也不冒充GPU帧率。本机regular/sparse/dense、长任务、静止/重复关闭和真实MV3重载按用户指示由主代理最后复核，不将本云端结果写成完整性能预算通过。不要求隔离账号或A/B切换。

测试页面、临时诊断编译、模拟HTML/输入、截图、下载的文档、日志及正式测试构建均位于 `/tmp/codeyears-batch-yield`，完成停止服务器/浏览器并删除。仅追加自己的任务/报告，仍更新原PR #47，不另建PR、不合入或发布。
