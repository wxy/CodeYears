# CodeYears 1.0.0 审核说明

## English

```text
CodeYears turns the contribution calendar on GitHub personal profiles into an explorable city. The public profile below can be used in Chrome while signed out.

1. Open https://github.com/wxy/. The GitHub contribution graph is selected by default. Select Miniature city to show small buildings in the calendar. Hover over a date for GitHub’s tooltip, then switch back to GitHub original.
2. Select City, or click Open City in the CodeYears toolbar popup. Choose the years, then zoom or drag to explore. Houses outside the ring road show public repository names and creation dates on hover or selection.
3. Open More and select Data privacy for the rules on private contributions and public repository records. An empty blue exit sign offers English examples of how to mention another GitHub account in a Bio.
4. If Chrome is set to ask on each visit, open the toolbar popup and choose Open extension details. Allow automatic access to github.com for the City tab to appear on new profile pages.

The miniature view uses the contribution levels rendered by GitHub. The full city requests contribution data from github.com and requests public repository names and creation dates from api.github.com without sending login credentials to the repository API. Repository creations are shown separately from contribution totals. On the signed-in user’s own profile, GitHub can provide private contributions to that session. Other profiles use the signed-out view, which can include anonymized private counts the profile owner shares.

The extension uses activeTab and scripting to open the current profile’s city from the toolbar. storage retains preferences and annual contribution records locally. The automatic content script runs on github.com. Permissions are the same as in 0.1.4.

The privacy policy for this release is at https://github.com/wxy/CodeYears/blob/main/PRIVACY.md.
```

## 简体中文

```text
CodeYears 把 GitHub 个人主页的贡献日历绘成可以探索的城市。在 Chrome 未登录的情况下，也可用以下公开主页验证。

1. 打开 https://github.com/wxy/。默认选中 GitHub 贡献图。点击「微缩城市」，查看原日历中的小建筑。悬停日期可查看 GitHub 的提示。再次点击可回到原图。
2. 选择页面上的「城市」，也可以从 CodeYears 工具栏弹窗点击「打开城市」。选择年份，缩放或拖动画面。悬停或选中环外住宅，可查看公开仓库的名称和创建日期。
3. 在「更多」中打开「数据隐私」，查看私有贡献和公开仓库记录各自的可见范围。点击空白蓝色出口牌，可以复制在 GitHub 简介中提及个人账号的英文例句。
4. 如果 Chrome 设为每次访问都询问，在工具栏弹窗点击「打开扩展详情」。允许自动访问 github.com 后，新打开的个人主页会显示已启用的城市页签。

微缩城市使用 GitHub 已渲染的贡献档位。大规模城市向 github.com 请求贡献数据，另向 api.github.com 匿名读取公开仓库的名称和创建日期。仓库的创建记录独立于贡献合计。登录后看自己的主页时，可以看到该会话有权查看的私有贡献。其他主页使用 GitHub 的匿名视图，其中可能包含对方选择公开的匿名私有贡献数。

activeTab 和 scripting 用于从工具栏在当前主页打开城市，storage 用于在本机保存偏好和年度贡献记录。自动入口运行在 github.com。扩展权限与 0.1.4 一致。

本版的隐私政策见 https://github.com/wxy/CodeYears/blob/main/PRIVACY.md。
```
