# CodeYears 0.1.4 审核说明

## English

```text
CodeYears visualizes the contribution calendar on GitHub personal profiles.

1. Open https://github.com/wxy/ in Chrome. The public contribution calendar can be used while signed out.
2. Open CodeYears from the browser toolbar. Set Contribution graph style to Miniature city. Miniature buildings appear within GitHub's contribution calendar. Hover over a date to see GitHub's date tooltip. Choose GitHub original to restore the original graph.
3. With Show City tab checked, click Open City to view multiple years. Use the Contributions tab on the page to return to the calendar. The toolbar setting also lets you hide the City tab.
4. Author in the popup footer opens an author information view. Its four project links open each extension's own Chrome Web Store listing in a new tab when clicked. Back to settings returns to the popup settings.

The miniature view uses the contribution levels GitHub has already rendered, without making additional contribution requests. The full City view requests contribution data directly from GitHub. CodeYears stores interface preferences and the annual contribution cache locally. The extension uses the same permissions as 0.1.3. activeTab and scripting let the toolbar open City on the current GitHub profile, and storage saves preferences and the annual contribution cache.
```

## 简体中文

```text
CodeYears 在 GitHub 个人主页可视化贡献日历。

1. 在 Chrome 打开 https://github.com/wxy/。未登录时也可以用公开贡献图验证。
2. 点击浏览器工具栏的 CodeYears 图标，把「贡献图样式」切换为「微缩城市」。建筑在原贡献图范围内显示，悬停日期可看到 GitHub 的提示。选择「GitHub 原图」可以恢复原图。
3. 勾选「显示城市页签」，点「打开城市」查看多年贡献。点击页面中的「贡献图」页签可回到日历。也可在弹窗取消勾选来隐藏城市页签。
4. 页脚「关于作者」进入作者介绍页。点击四个扩展链接中的任一项会在新标签页打开它各自的 Chrome 商店详情。「返回设置」回到弹窗设置。

微缩图直接使用 GitHub 已渲染的贡献档位，无需再请求贡献数据。大规模城市直接向 GitHub 请求贡献数据。权限沿用 0.1.3。activeTab 和 scripting 用于从工具栏打开当前 GitHub 个人主页的城市，storage 用于在本机保存界面偏好和年度贡献缓存。
```
