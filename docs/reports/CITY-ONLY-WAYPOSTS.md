# 撤下魔法小镇后的现代城市与路牌验收

2026-11-18。基线为主干 `f2181e2`。GitHub 个人页的扩展地图保留现代城市。旧的 `#codeyears-town` 书签和旧标签页的城际旅行记录都可以继续抵达现代城市。

## 浏览器

环境为 macOS 26.6.2、Chrome 157.0.8103.79、Node 26.7.0、Playwright 1.62.1，视口 1440×1100。运行 `npm run build` 后，通过 CDP 的 `Extensions.loadUnpacked` 在独立临时配置中加载根目录 `dist/`。使用真实 MV3 扩展、Canvas 绘制、标签页会话历史和扩展存储。GitHub 页面和身份响应在本地构造。

| 复现输入与操作 | 实际观察 |
| --- | --- |
| 构造 `sample-owner` 和 `sample-away` 的个人页及 2025 年原生日历，365 天中 4 月 10 日为 5，其余为 0。访问者固定为 `sample-owner`，从其 `#codeyears-town` 进入 | 直接打开现代城市，显示总数 5，工具条保留年份选择 |
| 为该历史项设置与访问者和目标匹配的旧旅程，来源为 `sample-previous`，地图值为 `town`，再刷新 | 恢复旧来路，返程目标为 `sample-previous#codeyears-city` |
| 在本城点第二个空路牌，填入 `sample-away` 并保存，再点该牌的编辑按钮 | 编辑框显示已保存目的地。扩展存储中本城路线为 `[null,"sample-away",null,null]` |
| 点本城路牌前往对方城市，点其返程牌回本城，再用浏览器后退 | 三次导航都打开对应的现代城市。回到本城后仍可返回更早的来源；对方城市的路线存储未被写入 |
| 记录整个过程的资源请求和页面异常 | 观察到 12 个现代城市素材路径，包括出城与返程两张路牌。小镇素材请求和页面异常均为 0 |

未覆盖真实 GitHub 登录会话、私有仓库和 Edge。此次不涉及新的用户数据来源。

## 构建和素材

- `npm run build` 通过，包含 TypeScript 类型检查。将构建目录、打包脚本及所需项目文件置于独立临时目录，运行 `python3 scripts/package-city.py`，随后用 `python3 scripts/verify-city-package.py <临时ZIP> --build-dir dist` 校验。ZIP 共 120 个文件，其中 100 张现代城市 PNG，两张路牌均与主干素材逐字节相同。资源清单、内容、引用、权限和 CRC 校验通过。ZIP 与构建目录中均无 `assets/town/`。
- 在临时目录从路牌源图和标定数据运行 `node scripts/bake-direction-boards.mjs`。两张现代路牌 PNG、城市素材目录表和路牌布局 JSON 与源码逐字节相同。
- 根目录 `dist/content.js` 的 SHA-256 为 `4c270daf792a7d742baf5dfe80e5f271d5f03544a15a693c0fe5ac795a663590`，`dist/landscape.js` 为 `7f550347923751ced7be1ab84d3cf4585090ca18b128662288a9c967839b8eb7`。
