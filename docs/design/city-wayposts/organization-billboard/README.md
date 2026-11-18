# 外环组织广告牌

[牌架正视原画](frame-source.png)由内置 ImageGen 绘制。参考本项目邮局的铜绿金属、浅色石材，以及城市办公楼和高速出口牌的左上方暖光。设计为双立柱的街边招贴牌，顶部有金属压边，铸铁立柱落在两个独立石座上。象牙白面板留给当前 GitHub 主页的组织图标。

## 位图与投影

源图是 1122 × 1402 的透明 PNG。以原图左上为坐标原点，图标使用左上角 (227, 223)、边长 664 像素的方窗。双脚落地点的中心为 (559, 1372)。以图标宽 1.552 个世界单位换算裁切边界，牌架总宽约 2.36、高约 3.19，与原设施尺寸接近，整张牌架、图标和链接按同一块竖直平面投影到外环。立柱在两个朝向上均保持竖直。

在 macOS 项目根目录运行以下命令可重建[运行图](../../../../public/assets/city-runtime/organization-billboard.png)。先按源图坐标裁切，再等比缩放至 378 × 512。构建时分发这张运行图，地图中的所有组织共用。

```sh
billboard_tmp=$(mktemp -d)
sips --cropToHeightWidth 1366 1008 --cropOffset 16 56 \
  docs/design/city-wayposts/organization-billboard/frame-source.png --out "$billboard_tmp/frame.png"
sips --resampleHeightWidthMax 512 "$billboard_tmp/frame.png" \
  --out public/assets/city-runtime/organization-billboard.png
rm "$billboard_tmp/frame.png"
rmdir "$billboard_tmp"
```
