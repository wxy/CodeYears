# 魔法小镇：正式面板受控浏览器验证

日期：2026-11-11。状态：**实际构建代码的受控 Chrome UI 路径通过**。这是独立临时浏览器中的 CDP 网络替身验证，不是已安装扩展在真实登录 GitHub 中的验收，也不覆盖 Edge 或硬件性能预算。

## 环境与输入

- macOS，本机 Google Chrome 157.0.8103.39 headless，Node v26.7.0。
- 最终构建目录为系统临时目录中的 `codeyears-town-build-final`。验证实际 `content.js` 的 `mountCityPanel`、动态导入的 `landscape.js`、运行 PNG 和原有日期/项目解析代码；没有替换产品函数。
- 使用本轮匿名获取、已核对年度标题和日期覆盖的 2024/2025/2026 HTML。2024 为 440 次、2025 为 1,319 次、2026 截止 11 月 10 日为 5,959 次，合计 7,718 次。直接 API 验证使用同一公开输入的 1,045 个实际日期，不补未来日期。
- 页面运行于受控 `https://github.com/wxy` 上下文，CDP 拦截并返回上述响应。身份为显式的 signed-out 替身，`chrome.runtime.getURL` 和页内存储使用会话替身。没有打开个人 Chrome 配置、读取 Cookie 或访问用户登录凭证。
- 项目活动使用明确的 `example/town-fixture` 受控片段，随请求日生成相同英文日期标题及两次提交摘要；这验证成员日到项目解析/浮层的路径，不证明该项目或活动在真实账户中存在。

正式面板 UI 与多成员命中验证时的构建校验值（后续仅修正旧预览资源切换分支，最新值见下方补验）：

| 文件 | 字节 | SHA-256 |
| --- | --- | --- |
| `content.js` | 69,993 | `88d979c89a72746f5031fb453f3aed2adca6a75d3e139e77af1fdddd49afce8b` |
| `landscape.js` | 141,926 | `c9a3a55033d0618669560a6c4782016e184b60d5a97e21a770c1524938c9e0d8` |
| `manifest.json` | 1,108 | `db2799dc8d04baaefb22c0a94d44bc0814ce1095be2a810517b9799b1bd4fda6` |

## 实际结果

| 直接受影响的路径 | 结果 |
| --- | --- |
| 面板初次载入现代城市 | 显示画布与 7,718 次贡献；仅取得三个初始年度 |
| 真实 `#map-type` change：现代 → 小镇 → 现代 | 成功；日期合计保持不变，全年数据请求仍为三次，身份确认 GET 仍按原合同执行 |
| 小镇静止 | 连续观察 300 ms，Canvas `drawImage` 增量 0，RAF 回调增量 0 |
| 最大缩放、全景、滚轮缩放 | 实际控件可用，最大缩放到 1,525%；全景后滚轮可重新定位可见建筑 |
| 小镇 Alpha 命中与悬停 | 实际 PointerEvent 命中建筑，浮层显示其真实成员日的周次/星期概括和受控项目活动摘要；没有读取额外年度 |
| 多成员建筑命中 | 直接 `createLandscape` 返回一个两成员日的建筑组；日期唯一、均为正贡献且逐项数量与同一实际输入一致；高光可显示 |
| 键盘平移 | 聚焦场景后 ArrowLeft 改变实际输出像素 |
| 小镇 PNG 404 | 浮层显示素材加载错误，选择器回到现代城市，原现代画布和贡献合计保留；恢复资源后可重试 |
| 素材加载期间切回原图 | 持有小镇 PNG 响应，执行 `deactivate()`，再放行响应并重新激活；取消分支不交换视图，选择器和实际现代地图一致 |
| 隐藏与恢复 | 隐藏期间不再绘制或续帧；恢复后不重新解码素材，主画布没有新增 `drawImage`；恢复仅有两次调度回调后静止 |
| 隐藏期间命中 | 直接 API 不返回任何建筑成员数据 |
| 关闭清理 | UI 路径全部 246 个 ImageBitmap 均关闭，DOM 中无 Canvas，所有记录的 Canvas 宽高均归零；直接 API 路径额外 37 个 ImageBitmap 也全部关闭，Canvas 归零 |
| 浏览器未处理异常 | 两组最终路径均为 0 |

总 UI 流程有三个年度请求、两个项目活动请求，其余为身份确认和本地构建资源。一个活动请求来自既有注册里程碑检查，另一个来自小镇建筑悬停。公共设施、居民和动物没有触发额外贡献日期请求。

取消切换本轮保证的是交换前取消检查与晚到资源释放；已经发出的本地素材请求可完成后再关闭，不把它写成网络 I/O 已即时中止。

## 旧本地预览资源切换补验

主代理随后发现：未传 `reservedYears` 的旧本地预览进入或离开 Town 时，需要清理旧 `cityScene`、素材与 Promise，才能重建对应资源目录。修正只涉及非 progressive `setView` 分支，正式面板 UI 的上述路径未改变，因此不重复该组验收，单独补验实际旧预览路径。

最新 `landscape.js` 为 **142,061 字节**，SHA-256：`b6c257b2717008904f7845d619262f634d1102c0fa623b030d0780d2aa073384`。`content.js` 与 `manifest.json` 的大小和校验值仍与上表相同。

本次用同一公开源的最后 42 个实际日期（2026-09-30 至 2026-11-10，合计 1,206 次）调用实际构建的 `createLandscape(host, days, callback, 'city', cityAssetBase)`，不传 `reservedYears`。独立本机 HTTP 服务提供最终运行文件；Chrome 使用真实时钟，允许 SwiftShader 回退，但没有据此判断具体硬件后端或性能。

- 顺序为 **City → Town → City → Town → Terrain → City → Town**；各次仅有一个正确标注地图类型的主画布，渲染错误为 0。
- Town 阶段所有 PNG 来自 `assets/town/`，City 阶段来自 `assets/city/`，没有缺素材或目录混用。
- 两次返回 City 的完整原生 Canvas 像素均与初始 City 完全一致。像素比较前明确等待正确画布尺寸及两次 RAF，避免拿尚未绘制的初始画布作基准。
- Terrain 实际成功创建 WebGL2 上下文；最终关闭后该上下文 `isContextLost()` 为 true。所有 2D Canvas 尺寸归零，DOM 无残留画布，**120 个 ImageBitmap 全部关闭**。

同时按用户要求，从这次已经载入的 Town 原生 Canvas 直接导出可读近景 `real-public-town-detail.png`，只调整缩放和平移，没有在取景阶段重新筛选日期或合并。此图是上述 **42 日场景**，不是三年地图的裁切；它作为用户请求的最终本机数据图保存在可视化目录，不纳入 Git，也不作为测试附件归档。

成品为 2000×1200 RGBA，884,383 字节，SHA-256：`f40e7283cc6e3e55eda2c8570b692f2720a42cff3dbcf2489c8e5d49bf176c87`，已完整解码并实际查看。42 日紧凑 `date/count` 输入的 SHA-256 为 `b6dcf64ba85bc2a151bf606dda6691d5c0991b1fd4cb72eccc6fea5e1aa5e46c`；逐日数组未保留入 Git。

## 复现方法与命令

先按 [公开数据试算](../design/ancient-town-concepts/2026-11-10/REAL-PROFILE-TRIAL.md) 重新匿名取得年度 HTML，并核对当前快照。网页会更新，本报告不长期保留冻结响应；重跑时应使用实际新合计，不能固定期待 7,718。

```sh
npm ci
npm run check
npm run build -- --outDir "$TASK_TMP/build"

"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --no-first-run --no-default-browser-check \
  --disable-background-networking --disable-sync --disable-default-apps \
  --hide-scrollbars --force-device-scale-factor=1 --window-size=1280,850 \
  --remote-debugging-port=0 --user-data-dir="$TASK_TMP/chrome-profile"
```

当次脚本为 Node 原生 WebSocket CDP 客户端：从独立配置的 `DevToolsActivePort` 连接，`Target.createTarget` / `attachToTarget` 后启用 `Fetch.enable`、`Page.enable`、`Runtime.enable`。所有网络请求由本机客户端回答；未配置路径返回 404，不发真实账号会话请求。

受控主页包含实际年份入口、唯一贡献日历容器、面板和工具栏。以模块导入实际构建 `content.js`，调用 `mountCityPanel` 后 `activate()`。脚本实际派发地图选择器 change、缩放按钮点击、WheelEvent、PointerEvent 和焦点下 KeyboardEvent；通过 DOM 状态、真实 Canvas 像素、透明度命中、高光、浮层及网络计数核对结果。失败分支将 `assets/town/*.png` 返回 404，取消分支持有这些响应直到 `deactivate()` 后放行。

直接 API 补验导入相同构建的 `createLandscape`，用完整公开输入调用 `updateDays()` / `skip()`，扫描 `buildingAt()` 找到多成员地块，对照源日期及数量，调用高光、隐藏/恢复和关闭。通过代理原生 `createImageBitmap` / `close`、Canvas 创建及 `drawImage`、RAF 回调记录资源与停帧结果，没有以数组长度代替实际绘制和资源释放。

## 证据边界与清理

首轮在最大缩放中心落入空地，测试无法找到建筑；回到全景并通过实际滚轮重新定位后完成命中验证。这是测试取景调整，没有据此修改产品代码。最终素材包重建后完整重跑了 UI 主路径和失败/取消分支，再单独补验多成员命中，未使用旧素材的 Alpha 结果冒充最终结果。

没有验证实际扩展安装、`chrome-extension://` 资源可达性、真实登录/匿名 GitHub 页面、SSO、跨账号矩阵、Edge、屏幕阅读器或二十年硬件帧耗时/功耗预算。项目内容为受控片段，不宣称真实项目获取已经验收。正式版本仍需按发布门槛补齐对应环境证据。

测试截图、日志、CDP/HTTP 客户端、浏览器配置及 JSON 计数仅用于当次验证，完成报告后清理，不进入 Git；只保留本报告和用户单独请求的本机正式可视化成品。
