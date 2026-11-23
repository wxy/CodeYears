# CodeYears 1.0.0 发布验证

2026-11-23。以主干 `e2bffeb` 为基线准备首个正式 Chrome 版本。扩展运行代码和素材取自该提交，清单和 npm 版本同步为 `1.0.0`。

## 初次候选的构建和安装包

- 从 `git archive` 导出的源码加上本轮版本文件，运行 `npm ci`、`npm run build`、`python3 scripts/package-city.py --output-dir <临时目录>` 和 `python3 scripts/verify-city-package.py <临时目录>/codeyears-1.0.0-city.zip`。构建和包体验证通过。
- 安装包含 139 个文件，35,703,979 字节。SHA-256 为 `7d97f08424dcd2ea2e06f76aa654ddec3f22e900097acedbe40ba76ddcd1a985`。对照已验证的 0.1.4 上传候选包，安装清单字段的差异仅为版本号。

## Chrome 验证

使用独立 macOS Chrome 158.0.8127.36 配置，通过 `Extensions.loadUnpacked` 加载解压后的实际安装包。

- 在 0.1.4 设置简体中文、微缩样式和隐藏城市页签。替换同一路径中的文件并重新加载 1.0.0 后，扩展 ID 相同，弹窗显示新版本号，三项偏好均保留。
- 以单个受控浏览器会话访问本人及另一人的 GitHub 个人主页。输入为 2025 年日历，带会话的响应含 10 次贡献，匿名响应含 5 次。本人城市显示 10，其他人的城市显示 5，两处公开仓库请求均未携带测试会话凭据。
- 升级检查使用本机解压安装，身份与年度日历响应为受控输入。真实 GitHub 登录态、Chrome 商店更新通道及 Edge 留待独立验收。

## 初次候选的商店材料

- `codeyears-store-media-1.0.0.zip` 包含 12 张截图、两张宣传图、图标、素材清单、商店文案和审核说明。核对原 0.1.4 素材包的 SHA-256、ZIP CRC 及全部 15 项图像的哈希和字节长度。四张截图在全球组与英文组中逐字节相同。新版素材包 SHA-256 为 `066685b5c4c0db80d58b89f0a3226ec621fe734ba476ed41a9dc4ed194fa0f44`。
- 现有中英文官网隐私页尚未覆盖公开仓库创建记录。提交材料填写已覆盖此数据用途的[仓库公开隐私说明](https://github.com/wxy/CodeYears/blob/main/PRIVACY.md)。

## 「贡献格」图标候选

- 重新导出 16、32、48、128、512 px PNG，检查尺寸、透明圆角及明暗背景下的 16 px 轮廓。128 px PNG 的非透明边界为 `[16, 16, 112, 112)`，参照商店的 96 px 主体规格。 [Chrome 商店图标规格](https://developer.chrome.com/docs/webstore/images#icon)
- `npm run build`、`python3 scripts/package-city.py --output-dir <候选目录>` 和 `python3 scripts/verify-city-package.py <候选目录>/codeyears-1.0.0-city.zip` 通过。139 个文件，35,715,564 字节，SHA-256 为 `00bf9ac5c663e5b87165babe398db8322809112972d29c6f59a347a53c53008d`。与初次候选逐文件比对，差异为四张注册 PNG、地图署名中的同一 128 px 内嵌 PNG、素材来源说明。
- 独立 Chrome 解压加载新安装包。扩展页逐张解码清单中的图标，扩展管理页正常显示 48 px 图标。本次测了 Chrome API 和管理页，工具栏小尺寸以独立导出的 PNG 对比图核对。
- 新商店素材 ZIP 的 SHA-256 为 `0eef45f469811e6d0551084689b9f858eb156ad573bf2e6167ea1569a826d8b9`。已核验 ZIP CRC、15 项图像哈希和上传用 128 px 图标。三组截图和两张宣传图沿用已核对的 0.1.4 素材。

## 128 px 商店图标复核

- 对照旧版与新导出的 128 px 原尺寸图标及 48 px 缩略预览。楼群及底座占宽约从 65 px 增至 81 px，窗线从约 0.54 px 调至 1 px，并收短阴影。明暗背景下复核轮廓。Pillow 核对 RGBA 尺寸和 16 px 透明留白。
- `npm run build`、`python3 scripts/package-city.py --output-dir <候选目录>` 和 `python3 scripts/verify-city-package.py <候选目录>/codeyears-1.0.0-city.zip` 通过。与前一候选逐文件比对，差异为 128 px PNG 和地图署名中内嵌的相同 PNG。
- 本轮安装包 SHA-256 为 `862db9cf9bbf275265771683a33d9d41baca14e67876fd5310902fdbe9becceb`。商店素材包 SHA-256 为 `ee1a64d23da291b6ed54f4c0f3dbf4a40a5cb8d3dd1634d851a4d2dcba2c9c65`。上传用 PNG、商店素材包、安装包和本地 `dist/` 的 128 px PNG 字节一致。
