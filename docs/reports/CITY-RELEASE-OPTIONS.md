# City 全局设置页交付报告

日期：2026-11-02。固定共同基线 `e3a609e84a821b2a792711c888f63f27edc120e5`，实际 fetch 后完整 SHA 相符。
开始时工作区干净；分支 `codex/city-release-options`，PR base 为 `codex/city-first-release-rc`。本任务不合入、不发布。

## 实现结果

- 新增 `options_ui: {page: "options.html", open_in_tab: false}`，由扩展原生右键“选项”进入嵌入式设置。清单其他字段与基线逐对象比较一致，permissions/content_scripts/CSP/WAR 未变。
- 只有语言 auto/en/zh-CN 自动保存，无保存按钮、账户、全局缓存清理。复用 language.ts 的读取/校验/解析/保存，唯一存储键为 `codeyears:ui:language`。保存成功后刷新本页文案并显示“已保存”；失败恢复原选择/文案，保留失败提示并允许重试。保存期间暂时禁用选择，完成恢复焦点。
- 复用全部指定共享消息；English/简体中文选项使用各语言本名。版本读取当前 `chrome.runtime.getManifest().version`，三条帮助/隐私/反馈链接精确符合委托地址，仅点击打开新标签，使用 noopener/noreferrer。
- 简洁系统明暗样式、语义标签、键盘焦点、live status 与窄屏换行，无位图、动画、玻璃效果、引擎或额外依赖。
- Vite 增加 options HTML 入口，共享代码固定到 `assets/shared-[hash].js`；正式打包显式增加 options.html、options JS 和必要共享 JS。verify 脚本核对 options_ui/page 引用、正式文件内容与清单，识别共享模块引用；仅对 options.html 的三条明确外部链接放行。
- popup.ts、content.ts、entry.ts、language.ts、locale JSON、数据/缓存、锁文件与运行图片均未改；build.mjs 和现有 CI 无需改动。

## 实际构建与包结果

云端 Linux，Node v24.19.0、npm 11.9.0、Python 3.12.14。受控浏览器 Chromium 154.0.8037.57，Playwright 使用环境已有 playwright-core；未把测试依赖加到仓库。
所有依赖缓存/构建/ZIP/夹具/日志/截图均在系统 TMP 副本。实际成功执行：

```sh
task_tmp=$(mktemp -d /tmp/codeyears-options.XXXXXX)
trap 'rm -rf "$task_tmp"' EXIT
git archive HEAD | tar -x -C "$task_tmp"
cd "$task_tmp"
npm ci --cache "$task_tmp/npm-cache"
npm run check
npm run build -- --outDir "$task_tmp/check-dist"
npm run package:city
python3 scripts/verify-city-package.py release/codeyears-0.1.0-city.zip
```

开发检查时使用基线 archive 再覆盖本任务六个实现文件；提交后上述命令可直接复现。
结果：版本 0.1.0，**79 文件、112,526,153 bytes**，SHA-256：
`3672ebbb143f3275151ee556bb85897a501ccf07d266235356be722ecb2b6370`。
新增输出：options.html 2.80 kB、options JS 0.75 kB、共享 JS 17.84 kB；popup JS 1.07 kB。共享 JS 由 popup/options 复用，不加载 City/Terrain。Terrain 分包保留。
这些是构建体积，不是硬件性能结论；许可/素材 NOTICE 齐全不代替 AI 位图分发权确认。

## 受控端到端实际结果

用临时本地 HTTP server 提供最终 dist（HTML 和实际共享模块），在页面执行前注入仅含语言 storage/i18n/getManifest 的 chrome 替身。语言存储使用临时浏览器 localStorage 模拟扩展持久化；所有输入均合成，无账户/贡献/身份信息。

| 直接流程 | 观测结果 |
| --- | --- |
| en-US、无偏好打开 | auto、英文标题和 Version 0.1.0；只 get 语言键 |
| 选择 zh-CN 并重载 | 显示已保存、中文文案/版本；重载仍为 zh-CN |
| 中文状态下 storage.set 拒绝，改选 en | 仍为 zh-CN；原键值未变；显示共享 languageSaveError 中文文案；控件可继续使用 |
| 解除拒绝并重试 en，再选 auto | 英文 Saved；键值对应 en/auto，auto 解析浏览器英文 |
| 键盘 ArrowDown 改语言 | 成功保存，焦点回选择框；focus-visible 为 solid；Tab 顺序为帮助→隐私→反馈 |
| 页面请求与 API 记录 | 点击前请求全部为本地；get/set 仅语言键，无访客/贡献缓存访问 |
| 版本与链接 | 0.1.0 与 manifest 相符，三条 href 精确匹配委托地址；帮助点击才开新标签（外部目标由路由拦截，不实际取远程页面） |
| 系统 dark + 320×600 | html 背景 rgb(32,38,35)，无水平溢出；浅色 600×520 和深色窄屏截图已人工查看，文字/控件/焦点清楚 |
| zh-CN 浏览器 + auto | 自动中文 |
| en-US 浏览器 + 已存 zh-CN | 优先中文偏好 |
| zh-CN 浏览器 + storage.get 拒绝 | 按既有 readLanguagePreference 规则回退 auto，显示中文；没有另改共享错误政策 |
| 正式 popup + 受控 tabs/scripting | 原一键流程执行 entry.js、调用 openCity、关闭 popup；源码保持基线不变 |

最终完整浏览器流程退出 0，无 pageerror。首次监听本地端口因未显式启用命令网络权限报 EPERM，启用现有网络权限后正常；无绕过代理或换环境。调试过程中修正两处临时夹具：中文错误文案断言应使用基线原文，原生 select 的 ArrowDown 已提交后再 Enter 会重新打开下拉，移除多余 Enter 后验证正常；未据此改运行逻辑。

### 复现受控浏览器方法

使用 Playwright 的 `chromium.launch({executablePath:'/usr/bin/chromium', headless:true, args:['--no-sandbox']})`，browser.newContext 设置 locale/colorScheme/viewport。本环境模块入口 `/opt/codex/cua_node/lib/node_modules/playwright-core`，服务只绑定 127.0.0.1 随机端口。
context.addInitScript 在正式页面加载前注入如下最小 API，保留 get/set 调用记录；测试失败开关仅属于临时夹具：

```js
window.__calls = [];
window.chrome = {
  i18n: { getUILanguage: () => navigator.language },
  runtime: { getManifest: () => ({ version: '0.1.0' }) },
  storage: { local: {
    get: async key => {
      window.__calls.push(['get', key]);
      if (localStorage.getItem('fixture:readFail')) throw Error('synthetic');
      return { [key]: localStorage.getItem(key) };
    },
    set: async values => {
      window.__calls.push(['set', values]);
      if (localStorage.getItem('fixture:writeFail')) throw Error('synthetic');
      for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
    },
  } },
};
```

访问 options.html，等 `#language` 启用后，按表逐项 selectOption/reload/keyboard.press/emulateMedia/setViewportSize，断言选择值、html.lang、标题、#version、#save-status 和存储键。失败时用 fixture 开关拒绝 get/set；每个启动配置新建 context。捕获 request 与 pageerror，核对所有读取/写入只有语言键。链接 href 先比对，再拦截 github.com 后点击帮助并等待 context page 事件；不访问真实账户。
popup 另建 context，以受控 tabs.query 返回合成 GitHub URL、scripting.executeScript 记录两次调用并返回 true、window.close 记录标志，访问正式 popup.html 验证快捷路径。该流程不冒充真实 MV3 权限或原生右键菜单。

## 打包负向 CLI 验证

在 TMP 用 ZipFile 逐项复制正式 ZIP，每次只改变下列一项，再实际执行 verify CLI；每项都退出 1：

| 变更 | 结果 |
| --- | --- |
| 删除 options.html | file inventory mismatch |
| 删除 assets/options-DNPfpHpc.js | file inventory mismatch |
| 删除 assets/shared-DMlKT9lB.js | file inventory mismatch |
| 新增 src/options-fixture.ts | extra source rejected |
| 新增 assets/unlisted.js | extra JS rejected |
| 把 options_ui.open_in_tab 改为 true | options page changed |

样本只含合成内容，不提交通用测试框架或补单元测试。现有 CI 将运行新打包器及 verify；GitHub 上实际启动/成功与否在最终 PR 交付时单独查询，不能用本云端 CLI 代替。

## 本地待验收与范围

本地需要重载/安装最终组合：扩展原生右键“选项”确实嵌入打开、原生容器尺寸与明暗/键盘表现、左键仍直接打开城市、语言在真实扩展存储中跨重开生效、三个外部链接正常打开。用户设备/Edge 和安装提示不由本受控页面证明。
按用户本轮决定，不创建专门测试账户、不做 A/B/退出登录矩阵，不向用户索取账号/密码/Cookie；身份代码保持原样，该矩阵未覆盖且不作为本任务新增阻塞。不接独立导出/分享，不做商店上传/发布。临时过程材料在结束时清理，只保留本可复现报告。
