# City MV3 干净环境安装预检

日期：2026-11-02（Asia/Shanghai）。报告分支 `codex/city-mv3-install-preflight`，PR base `codex/city-first-release-rc`。本PR只新增本文，不带入组合源码/图片，不合入、不发布。

## 结论：真实加载阻塞，未以mock替代

现有系统Chromium154能够启动一次性干净浏览器目录并打开原生 `chrome://extensions/`，但在带 `--load-extension` / `--disable-extensions-except` 参数、移除Playwright默认 `--disable-extensions` 后，**原生扩展列表仍只有内置Chromium PDF Viewer，没有CodeYears**。因此本次没有取得真正CodeYears MV3加载成功证据。

没有为绕过这个结果注入chrome对象、替换扩展API、伪装GitHub origin、安装新浏览器、搭建显示基础设施或新增权限。按任务停止条件，确认未加载后停止扩展能力试探；尚不能把原因准确归为特定Chrome版本禁令、策略或参数实现差异。结果是当前启动配置下的安装/能力阻塞，不是已证明的产品manifest缺陷。

Options真实保存/重启持久化、运行时CSP/WAR、popup实际工具栏入口与GitHub联动**均未在此云端通过**。主代理已报告的本机菜单/遮罩/Esc/方向键、用户确认的Options Saved/刷新保留和GitHub联动保持其原通过范围；这里不冒充补齐云端干净安装证据。

## 固定来源与临时组合

初始工作区干净。正常fetch后四个ref完整SHA均与指令一致，从固定基线建立独立报告分支；组合仅在系统TMP的detached worktree中完成。

| 来源 | 固定SHA | 加入顺序（全部独有提交） |
| --- | --- | --- |
| origin/codex/city-first-release-rc | `0116ceac5d6785b3ddc595fe1937e5d047213c11` | 临时工作树起点 |
| PR #47 | `af0d675f3ab1d245d2e88d01e728bc06cc636889` | `d6f009563332766697ef24cf0b03765a71affe1f` → `c7493c7e4ef9cfa163c45f67f4aa14ad0e532fa7` → `af0d675f3ab1d245d2e88d01e728bc06cc636889` |
| PR #48 | `3bde9516125fc909c7e3e5722b25a7268fe677fd` | 同head一个提交 |
| PR #49 | `77d94fc082801fd4edc8c7b62212e1d9ec83ecaf` | `d1623e68273595e949d6f616ede6abaefa90db02` → `a24013b377184b982b1f68ebacbcc9d54debc7a5` → `77d94fc082801fd4edc8c7b62212e1d9ec83ecaf` |

cherry-pick无冲突。临时组合HEAD为 `706f2523f8fa5eb9e1ff3b8d6a58b9e290fdbbfd`，tree为 `d25da676fae404af4f322191cd41713a779e9feb`。临时提交SHA包含本次cherry-pick元信息，复现时以固定基线、上述原提交顺序及tree校验为准。renderer源文件git blob为 `71f15831028c96cb0800ee87b32ff2b97f9f2041`，与PR #47固定head中的该文件一致；每日表移除提交已包含，未恢复它。

## 环境与实际准备

- 原共享CodeYears云环境，Linux x86_64；Node v24.19.0、npm11.9.0、系统 `/usr/bin/chromium`，版本 `154.0.8037.57 built on Debian GNU/Linux 13 (trixie)`；Python Playwright使用环境已有安装。
- 已读AGENTS及cloud-environment-runtime技能，并检查CLOUD_DEVELOPMENT。环境observations_current=true、connected、network policy unrestricted/enforced；`/etc/codex/network-policy.json`记录vpn_configured=false。网络命令使用执行器显式网络权限与继承代理，不变更环境、登录或凭证。
- 现有环境找不到Xvfb；未安装。真实加载尝试使用headless persistent context，不使用路由响应替身或HTTP夹具。
- 为真实安装准备确需本地构建一次；临时工作树用软链接复用原工作区既有node_modules，不改依赖/锁，不再npm ci；`npm run build -- --outDir /tmp/codeyears-mv3-preflight/dist`（包含check）成功。没有重复20年性能、单元测试或ZIP打包。

本次renderer为147631 bytes，SHA-256 `c25fae668c0d7fcb8a2237aaf8ecc71a3ff71a5d18822f9923224bb54abdbaef`。**它与主代理提供的本地产物SHA-256 `c040946adcf8a5cfaba4e23d4ac3662023d1574b6d43cb84e663523360680297` 不同**；renderer源blob一致，但本次构建还产生不同Terrain分包文件名/字节，因此不宣称是同一字节产物或已验证本地最终79文件ZIP。没有为追求相同hash改源码、构建脚本或依赖，构建可复现性/本地发行包一致性留待主代理按需核对。

## 实际命令与原生观测

```sh
git status --short
git fetch origin \
  refs/heads/codex/city-first-release-rc:refs/remotes/origin/codex/city-first-release-rc \
  refs/pull/47/head:refs/remotes/origin/preflight-pr47 \
  refs/pull/48/head:refs/remotes/origin/preflight-pr48 \
  refs/pull/49/head:refs/remotes/origin/preflight-pr49
git rev-parse origin/codex/city-first-release-rc origin/preflight-pr47 origin/preflight-pr48 origin/preflight-pr49
git switch -c codex/city-mv3-install-preflight 0116ceac5d6785b3ddc595fe1937e5d047213c11
git worktree add --detach /tmp/codeyears-mv3-preflight/combined 0116ceac5d6785b3ddc595fe1937e5d047213c11
# 在临时工作树按上表顺序git cherry-pick全部7个提交
ln -s /workspace/CodeYears/node_modules /tmp/codeyears-mv3-preflight/combined/node_modules
# cwd=/tmp/codeyears-mv3-preflight/combined
npm run build -- --outDir /tmp/codeyears-mv3-preflight/dist
sha256sum /tmp/codeyears-mv3-preflight/dist/landscape.js
```

核心实际浏览器调用（未给chrome赋值，也未拦截网络）：

```python
context = await playwright.chromium.launch_persistent_context(
    '/tmp/codeyears-mv3-preflight/profile',
    executable_path='/usr/bin/chromium', headless=True,
    ignore_default_args=['--disable-extensions'],
    args=['--no-sandbox',
          '--disable-extensions-except=/tmp/codeyears-mv3-preflight/dist',
          '--load-extension=/tmp/codeyears-mv3-preflight/dist'])
page = await context.new_page()
await page.goto('chrome://extensions')
await page.wait_for_timeout(1000)
items = await page.evaluate('''async () => await chrome.developerPrivate.getExtensionsInfo(
    {includeDisabled:true, includeTerminated:true})''')
await context.close()
```

`chrome.developerPrivate`来自浏览器原生扩展管理页的内部API，仅用于只读枚举，未借此修改权限/加载路径或模拟产品API。实际返回只有：

```text
id=mhjfbmdgcfjbbpaeojofohoefgiehjai
name=Chromium PDF Viewer
state=ENABLED
optionsPage=null
installWarnings=[] / manifestErrors=[] / runtimeErrors=[]
```

这些空错误数组属于PDF Viewer，**不是CodeYears无错误的证据**。CodeYears没有扩展ID、enabled状态或Options target可观测，因此不继续以猜测的chrome-extension URL测试、不把构建成功写成安装成功。

## 成功、失败与未执行范围

| 项目 | 判定与实际依据 |
| --- | --- |
| 固定来源组合 | PASS。4个远程SHA精确一致、7个独有提交无冲突加入临时树，renderer源blob与固定#47一致。 |
| 安装准备构建 | PASS，仅本次云构建。build含check通过，manifest与options/popup/entry/content/renderer/图标必需文件存在。dist计76文件、assets/city计59张PNG；此计数不是本地79文件发行ZIP的校验。 |
| MV3清单与权限范围 | 静态确认。manifest_version=3；permissions仅activeTab/scripting/storage，无host_permissions；content_scripts精确匹配https://github.com/*，document_idle加载entry.js。没有取得CodeYears真实安装后的权限页或首次提示，不能标运行时PASS。 |
| CSP / WAR | 静态确认，运行时未验证。extension_pages为 `script-src 'self'; object-src 'none'`；WAR为content.js/landscape.js/chunks/*.js/assets/city/*.png，仅https://github.com/*。文件存在不等于跨源WAR授权已成功。 |
| background / popup | manifest未声明background/service worker，不应等待不存在的后台target。popup.html已构建，但因CodeYears未加载，未执行真实工具栏popup及scripting链路；未用其他页面脚本冒充popup。 |
| 原生Options与真实storage | BLOCKED/未执行。options_ui为options.html/open_in_tab=false，但没有CodeYears Options target。未取得真实chrome.storage.local写入、Saved或刷新/浏览器重启持久化证据。只关闭一次性profile，不将该关闭算作持久化重启验收。 |
| 浏览器启动和原生管理页 | PASS，但CodeYears加载BLOCKED。进程正常启动/退出，原生管理API可读，加载列表不含CodeYears；没有误把内置扩展当作产品。 |
| GitHub数据与站点范围 | 未执行。没有匿名GitHub数据请求，没有真实登录/账号/Token/Cookie或origin替身；不声称个人主页全链路、受限站点提示或用户账户已通过。 |
| Edge/本机首次提示/商店 | 未执行，不由Linux headless替代。未接受条款、上传或发布。 |

## 停止与清理

在安装能力阻塞处停止，不搭基础设施、不安装新浏览器、不试图扩大启动权限来换取通过。余下真实干净安装、Chrome/Edge首次权限提示、实际WAR/CSP及重启持久化仍需能可靠加载扩展的目标浏览器；用户已取消的隔离账号/A-B矩阵不重新作为要求。

本次persistent context已正常close；删除临时node_modules链接、移除detached组合worktree，并清理 `/tmp/codeyears-mv3-preflight` 下profile、构建、脚本和日志。没有截图、ZIP、真实缓存或组合源码/图片进入报告PR。最终报告分支只新增本文，`git diff --check`通过。
