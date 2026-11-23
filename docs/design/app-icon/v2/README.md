# CodeYears 应用图标 · 贡献格

1.0.0 采用「贡献格」图标。三栋等距楼宇延续初代构图，底座用深浅不同的绿色地块呼应 GitHub 贡献图。压低底座下的阴影，收弱立面的细线，保留三段建筑高度的辨识度。

标准母版为 `codeyears-contribution-tiles.svg`。16 px 工具栏使用 `codeyears-contribution-tiles-toolbar.svg`，略微放大建筑与底座，简化窗线和接触阴影。两张母版均为方形，圆角外透明。安装包和商店的 128 px 图标以 96 px 主体居中，每边保持 16 px 透明留白。[Chrome 商店图标规格](https://developer.chrome.com/docs/webstore/images#icon)

在仓库根目录重新导出发版资产：

```sh
rsvg-convert -w 16 -h 16 -o public/icons/codeyears-16.png docs/design/app-icon/v2/codeyears-contribution-tiles-toolbar.svg
for size in 32 48 512; do
  rsvg-convert -w "$size" -h "$size" -o "public/icons/codeyears-$size.png" docs/design/app-icon/v2/codeyears-contribution-tiles.svg
done
rsvg-convert --page-width 128 --page-height 128 --left 16 --top 16 -w 96 -h 96 -o public/icons/codeyears-128.png docs/design/app-icon/v2/codeyears-contribution-tiles.svg
```
