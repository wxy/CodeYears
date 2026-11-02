# City 0.1.0 商店材料候选

更新：2026-11-02。对应固定源码 `e3a609e84a821b2a792711c888f63f27edc120e5`。本文与两张正式示例PNG供审阅，尚未上传商店、提交审核或发布。只描述当前 City；文案与截图仍需本地最终组合验收。商店名称来自 manifest，当前为 CodeYears；下列短说明是建议文案，不在本任务修改公共语言JSON或manifest。

## 简体中文 · 可复制

名称：

```text
CodeYears
```

简短说明：

```text
将 GitHub 每日贡献化作城市，查看多年街区与建筑细节。免费，无需 Token，数据在浏览器本地缓存。
```

详细说明：

```text
代码岁月，自成风景。

CodeYears 在 GitHub 个人主页的贡献区提供“城市 / 贡献图”标签。默认保留 GitHub 原图；点击“城市”后，才读取当前会话可见的每日贡献，默认展示最近三年。可修改起止年份后应用。

先看到完整空场地与道路，再随已校验的年度数据填入地块。未知、尚未返回和未来日期不会被填成零贡献。读取、取消、警告与失败状态在画布浮层中显示，正常完成后隐藏。

从多年全景到建筑近景，支持滚轮或按钮缩放、拖动平移、“全景”恢复取景，以及在当前页面内展开和收起。展开后可按 Esc 返回。缩放不会改变真实数量或重新决定建筑合并。

零贡献区域以自然地块或城市邻域铺装表达；少量正贡献从平房开始，逐步对应低层住宅、公寓、办公楼与大厦。道路、河道和城郊景观只作装饰。年份按 ISO 完整周组织，边界日期可能归入相邻周年，因此所选周年合计可能与 GitHub 公历年统计不同。

在“更多”中查看每日明细、数据与操作帮助，刷新或清除当前主页缓存，并选择英文、简体中文或跟随浏览器。界面双语不等于 GitHub 网页任意语言均可解析：当前贡献来源主要验证英文页面。

调整取景后，可在画布上右键使用浏览器原生保存或复制图片菜单。CodeYears 不提供独立导出或分享服务。

完全免费，无需 GitHub Token 或独立登录。没有后端、广告或遥测。贡献日期与数量按访问者、主页和年份在本机浏览器缓存；身份无法确认时不复用缓存。仅请求 GitHub，不自动上传城市图片。

GitHub 贡献页面不是稳定公开 API。页面语言、结构或访问权限变化可能导致获取停止；失败和缺失数据不会当作零。当前为 Chrome 的 0.1.0 候选版；Edge 尚未完成独立验收。商店示例图使用明确标记的合成日期与数量，不代表任何真实账户。
```

## English · Copy-ready

Name:

```text
CodeYears
```

Short description:

```text
Turn daily GitHub contributions into a city. Explore years and neighborhoods, with contribution data cached in your browser.
```

Detailed description:

```text
Your years of code, a city of their own.

CodeYears adds City and Contributions tabs to the contribution section of a GitHub profile. GitHub's original graph remains selected by default. Click City to read the daily contributions visible to your current GitHub session, starting with the most recent three years. Change the year range and apply it when you want to explore further.

A complete empty site and road network appear first. Validated yearly data then fills the city. Unknown, pending and future dates are never treated as zero contributions. Loading, cancellation, warnings and errors appear in an overlay on the canvas, which hides after normal completion.

Explore a multi-year overview or zoom into individual buildings. Use the wheel or zoom buttons, drag to pan, select Fit view to restore the overview, or expand the same canvas within the page. Press Esc to return from the expanded view. Zooming does not change the underlying counts or replan merged buildings.

Zero-contribution areas use natural plots or paving near urban neighborhoods. Positive contributions begin with small houses, then progress through low-rise homes, apartments, offices and towers. Roads, rivers and scenery outside the city are decorative. The city groups complete ISO weeks, so year-boundary dates and totals can differ from GitHub's calendar-year statistics.

Open More for daily details, data and viewing help, refresh and cache removal, and the interface language setting: English, Simplified Chinese or the browser language. A bilingual interface does not mean every GitHub page language can be parsed. The contribution source has primarily been validated on English pages.

After adjusting the view, right-click the canvas to use your browser's native image save or copy menu. CodeYears has no separate export or sharing service.

Free to use, with no GitHub token or separate sign-in. No backend, ads or telemetry. Contribution dates and counts are cached locally by viewer, profile and year; the cache is not reused when viewer identity cannot be confirmed. Requests go only to GitHub, and city images are not uploaded automatically.

GitHub's contribution pages are not a stable public API. Changes to page language, structure or access may stop loading. Missing or failed data is not replaced with zeros. This is a Chrome 0.1.0 candidate; Edge has not completed separate validation. Store examples use clearly labeled synthetic dates and counts, not a real account.
```

## 字段、链接与隐私填写依据

单一用途 / Single purpose：在 GitHub 个人贡献区，将当前会话可见的每日贡献数量呈现为可切换的城市视图。Visualize the daily contribution counts visible to the current GitHub session as a switchable city in a profile's contribution section.

建议主分类：Developer Tools（以提交时控制台实际选项为准）。界面/本地化目录：英文 `en`、简体中文 `zh_CN`。支持与反馈：[GitHub Issues](https://github.com/wxy/CodeYears/issues)。隐私政策候选链接：[PRIVACY.md](https://github.com/wxy/CodeYears/blob/main/PRIVACY.md)，上传前由维护者核对最终政策和公开链接。资料准备不等于已填写或提交隐私表单。

| 项目 | 对应行为 |
| --- | --- |
| GitHub 站点范围 | content_scripts.matches 为 https://github.com/*；自动挂轻量入口。点击城市前不请求贡献历史或读取贡献缓存，不预载建筑。不能填写为没有网站访问 |
| activeTab / scripting | 工具栏点击后，在当前 GitHub 标签页执行包内入口并定位城市 |
| storage | 本机语言偏好，以及按访问者/主页/源年隔离的日期数量缓存；提供刷新与清除 |
| 数据处理 | 主页名、访问者用户名/登录状态、日期数量、所选范围和必要缓存元信息；本地处理也应按控制台实际分类披露 |
| 传输与代码 | 仅向 GitHub 请求页面；程序、词库与运行图片来自安装包，无远程执行代码、项目后台、遥测或自动图片上传 |

以上是现有行为的填写依据，不替维护者选择法律分类或确认图片权利。用户已取消专门隔离账户与A/B登录切换验收；不再索取账号、密码或Cookie，不将未执行的身份矩阵写成通过。

## 图片与当前官方规范

本次最小集为两张1280×800正式候选PNG，见 [截图与复现说明](store/city-0.1.0/README.md)：

1. [多年总览与页内标签](store/city-0.1.0/01-overview.png)
2. [同一画布展开近景](store/city-0.1.0/02-closeup.png)

两图均清楚标“示例数据 / Demo data”，使用受控GitHub样式外壳与未修改的正式City入口/渲染器，不冒充真实登录页面。“更多”保持收起，不预告A的菜单分组或B的图标原生“选项”。正式图标沿用 `public/icons/codeyears-128.png`，本任务不修改或复制新图标。

2026-11-02核对Chrome官方现行文档：短说明最多132字符；截图至少1张、最多5张，采用1280×800（也接受640×400）、方角、无外围留白；本次选用前者。商店图标128×128；本地化详情和截图可按支持语言分别设置。可选宣传图不是本次两张截图的替代品。[文案建议](https://developer.chrome.com/docs/webstore/best-listing)、[图片规范](https://developer.chrome.com/docs/webstore/images)、[商店字段与本地化](https://developer.chrome.com/docs/webstore/cws-dashboard-listing)。上述为本次读取到的规范，不宣称商店已审核图片；提交时仍以控制台为准。

## 本地组合确认后再更新的项目

A的“更多”分组/键盘平移和B的图标原生右键“选项”是本轮独立工作包，在本材料对应基线尚未实现；不纳入可复制正文和截图，不写成验收通过。组合后若入口或文案变化，先复核截图再更新。最终仍需本地真实MV3、安装/更新提示、当前性能与支持浏览器确认，以及维护者对素材分发范围的决定；本次没有上传、审核或发布动作。详细实际证据见 [本任务报告](reports/CITY-RELEASE-STORE-MATERIALS.md)。
