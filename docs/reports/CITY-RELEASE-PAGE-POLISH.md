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
