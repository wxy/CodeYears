# 手动城际道路：真实匿名 Chrome 验证

本报告记录首版四槽菜单交互；最新路牌直接编辑、八出口上限与输入修复见[后续报告](ROAD-SIGN-EDITOR.md)。下方结果保留对应构建的历史范围。

日期：2026-11-11。状态：功能已实现，最终构建及真实匿名 Chrome MV3 直接路径通过；通过独立后续 PR 交付，依赖魔法小镇 PR #78，尚未合入或发布。

## 行为与边界

- 工具栏“道路”接受 GitHub 用户名，可带一个前导 `@`，大小写归一。最多连接四个固定出口，支持移除；中间槽位移除后，其他目的地不换出口。用户名不合法、自连接和重复连接均显示错误并保留原设置。
- 设置按出发主页保存在当前浏览器的 `chrome.storage.local`。两个地图类型共用目的账号，贡献缓存仍按原有身份作用域隔离。它是当前浏览器的查看偏好，不是城主公开发布的道路，也不会给对方添加返程道路。
- 出口路面和路牌都是原生链接；路牌支持键盘访问，实际屏幕区域与地图使用同一投影，随缩放、平移和展开更新。四个出口沿西、东、北、南固定排列，账号不随贡献批次或地图切换调换方向。
- 链接携带 `#codeyears-city` 或 `#codeyears-town`。目标 Profile 的个人贡献区可用后自动打开对应地图，继续使用原有真实日期解析、访问者确认和缓存隔离。普通 Profile 访问仍默认贡献图。页面在后台打开时，等待可见再激活。
- 出发页在沿路离开时记录同类片段，后退可回到地图；地图切换同步片段，用户切回贡献图则清除片段，刷新保留这一选择。
- 零贡献现代城市保留原装饰环路和四向出口；小镇新增连接原有主步道的四条外接步道。道路不代表贡献数量或协作者人数。
- 本轮只做手动道路，不请求关注列表、扫描协作关系或实现自动推荐。添加时只检查账号名称格式；不存在账号、组织页等没有个人贡献区的目的地保留 GitHub 原页面，不生成虚假地图。

## 环境与输入

- macOS，本机 Google Chrome **157.0.8103.39**，Node **v26.7.0**，Playwright **1.62.1**。
- 独立临时 Chrome 配置，无用户 Cookie、Token 或个人浏览器资料；实际加载构建目录中的 Manifest V3 扩展。没有替换 `chrome.runtime`、存储、身份确认、年度请求、解析器或渲染器，没有使用网络响应替身。
- 真实匿名公开页面：`wxy`、`torvalds`、`octocat`。默认 2024–2026 地图在本次快照中分别显示 **7,718 / 9,364 / 0** 次贡献。页面和合计可随时间更新；这不是所有私有贡献或硬件性能验收。
- `@ToRvalds` 用于大小写与前导 `@`；`bad/name`、`WXY`、重复 `TORVALDS` 用于输入失败分支；`jashkenas`、`octocat`、`antirez` 用于四槽填满与中间移除，不向这些账号写入任何内容。

## 构建与重现

```sh
npm ci --ignore-scripts --no-audit --no-fund
TASK_TMP=$(mktemp -d -t codeyears-roads)
npm run build -- --outDir "$TASK_TMP/build"
```

最终构建成功，包含 `tsc --noEmit`。构建全部位于系统临时目录，没有覆盖现有 `dist/` 或发行包。最终 JS SHA-256：

| 文件 | SHA-256 |
| --- | --- |
| `entry.js` | `d6e524c18ab389de0f261056fad4e6bc709ab312ac3d830742d114b849c58fa6` |
| `content.js` | `3b253e9acd6c5824140fdc7e1b84b6e095885929e7c03f862b011b4fd4e7f46b` |
| `landscape.js` | `c391954836e879143ebed55f3a9d834f3c8e6b52bd8f2bc78a21f3ffe6d5e25b` |

浏览器执行方式：用 Playwright `chromium.launchPersistentContext` 创建 `$TASK_TMP/chrome`，设置 `executablePath` 为 `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`、`headless: true`、1280×960 视口、`ignoreDefaultArgs: ['--disable-extensions']`，仅对这份临时配置传入 `--enable-unsafe-extension-debugging`、`--no-first-run`、`--disable-background-networking`。随后在 **browser session** 调用 CDP `Extensions.loadUnpacked({path: '$TASK_TMP/build'})`。在返回 ID 的扩展 `options.html` 中通过真实 `chrome.storage.local` 清空这份临时配置的测试设置，并将 `codeyears:ui:language` 设为 `en`，然后打开公开 GitHub 页面。

Chrome 此版本直接使用旧 `--load-extension` 启动参数没有启用扩展；初次通过 page session 调用加载接口也不可用。改用上述 browser session 后，`Extensions.getExtensions` 确认扩展 `enabled: true`，实际 GitHub DOM 出现正式入口，后续验证全部使用此加载方式。

可重复的直接操作顺序：

1. 打开 `https://github.com/wxy`，确认默认贡献图；点击城市，等待真实合计、一个主画布及可用控件。
2. 打开“道路”，依次尝试 `bad/name`、`WXY`；添加 `@ToRvalds`，再次输入 `TORVALDS`。检查错误文案和扩展本地存储没有错误写入。
3. 添加 `jashkenas`、`octocat`、`antirez`；确认四槽已满，移除 `jashkenas`，存储应为 `['torvalds', null, 'octocat', 'antirez']`。
4. 关闭菜单，点击全景，聚焦地图后按 ArrowRight，确认路牌随画面平移；回到全景后点击 torvalds 路牌，核对目标 URL、自动选择的现代城市、一个画布和目标合计。目标没有继承 wxy 的本地道路。
5. 浏览器后退，再刷新，确认回到 wxy 地图且保留三个目的账号。
6. 切换魔法小镇，确认链接变为 `#codeyears-town`；在路面命中多边形内、路牌以外的位置执行真实鼠标点击，核对 torvalds 自动打开小镇及同一目标合计。
7. 后退，展开地图，在展开后的工具栏管理道路，按 Escape 只关闭道路菜单；收起后切换中文，核对道路文案。切回贡献图并刷新，保持原图。
8. 打开 `https://github.com/wxy#codeyears-town`，切现代城市，核对片段同步；切贡献图，核对片段清除。
9. 打开 `https://github.com/octocat#codeyears-city`，取得真实零贡献日历，添加 `wxy`，全景中仍应有一条可见路牌。

当次自动化使用 Playwright locator 穿透开放 Shadow DOM，执行真实 click、fill、selectOption、键盘、鼠标、导航、后退和刷新，并通过扩展自己的 `options.html` 读取真实存储。未调用产品内部函数来代替这些交互。

## 实际结果与修正

| 直接路径 | 最终结果 |
| --- | --- |
| 真实匿名 wxy 现代城市 → torvalds 现代城市 | 通过；目标合计 9,364，自动打开地图，一个主画布 |
| wxy 小镇 → 点击实际出口路面 → torvalds 小镇 | 通过；正确地图类型，同一目标合计 |
| 普通 Profile 默认原图 | 通过；未因新增道路默认启动地图 |
| 用户名、自连接、重复、四槽上限 | 通过；不产生错误连接 |
| 中间移除保持其他出口 | 通过；存储和画面保留固定槽位 |
| 后退恢复、刷新持久化、目的地配置隔离 | 通过 |
| 键盘平移后路牌位置、全景、展开管理 | 通过；两种地图画面已实际查看 |
| 英文/中文文案、Escape 关闭菜单 | 通过 |
| 切换地图后片段同步、切原图后刷新保持原图 | 通过 |
| octocat 零贡献城市仍可建立出口 | 通过；0 次贡献、1 个可见路牌 |
| 浏览器未处理页面异常 | 最终主路径 0 |

补验首先复现三项失败：地图切换后仍保留旧片段、切原图后片段未清除、真实零贡献城市配置后没有路牌。分别在地图选择提交处同步片段、原图选择处清除片段，并为零地块现代城市保留原有装饰环路/出口。重新构建后重跑直接主路径与这组三项边界，最终全部通过；没有通过无条件重跑掩盖失败，也没有在实现后补单元测试。

## 未验收与留存

本轮没有使用真实登录会话，因此不提升为登录/私有贡献/SSO 验收；Edge、屏幕阅读器、后台新标签打开的完整实际浏览器矩阵、存储 I/O 拒绝、硬件 FPS/内存/功耗预算及上架发布未验收。自动发现、公开共享路线和双向关系均属于后续范围。

测试脚本、公开 HTML、截图、日志、JSON 结果、Chrome 配置和构建均仅在本次系统临时目录中使用；报告完成后清理，不加入 Git。长期只保留本报告；正式源码、文案与产品约定按正常项目文件管理。
