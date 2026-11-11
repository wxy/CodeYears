# 精绘城市路牌

2026-11-11。使用内置 imagegen，以建筑素材的制作方式保留正式源图、控制点和离线运行 PNG。完整提示词及参考来源见 [PROMPTS.md](PROMPTS.md)，实施与验收见[精绘路牌报告](../../../reports/PAINTED-CITY-WAYPOSTS.md)。

| 用途 | 正式源图 | 运行图 |
| --- | --- | --- |
| 现代单向 | [薄铝板、绿底白边、镀锌立柱](modern-highway-source.png) | [PNG](../../../../public/assets/city-runtime/direction-board.png) |
| 现代双向 | [蓝底双白边、细立柱](modern-highway-mutual-source.png) | [PNG](../../../../public/assets/city-runtime/direction-board-mutual.png) |
| 小镇单向 | [木框、石基、灯笼与藤蔓](town-source.png) | [PNG](../../../../public/assets/town-runtime/direction-board.png) |
| 小镇双向 | [蓝色木牌、雕花与金属嵌边](town-mutual-source.png) | [PNG](../../../../public/assets/town-runtime/direction-board-mutual.png) |

现代厚重装饰框的早稿已弃用。正式现代款参考真实公路指路牌的薄板和立柱比例，仍采用项目所需的绘画质感；不宣称符合交通工程认证。

## 离线制作

```sh
node scripts/bake-direction-boards.mjs
npm run build
```

前置条件为 macOS、本机 Google Chrome 和仓库 Node 依赖。脚本从[实际控制点](calibration.json)生成四张运行 PNG，更新城市/小镇目录与 `direction-board-layout.json`。运行图保留透明背景；不把生成源图直接打入扩展。每种地图只加载自己的单向、双向两张图，图片生命周期沿用建筑缓存。

源图实际牌面斜率与提示词的目标不同；脚本将实测牌面轴校准到 +0.5，另一朝向通过世界变换镜像造型，文字始终正向。不重画图片内容，不把透明像素当成地面；支架的隐藏几何、地脚完整包络与物理相机恢复不作保证。牌面 ID、问号、单/双向箭头及路面 ID 由当前配置绘制。

源图均为 1774×887 RGBA。运行图的实测尺寸及字节如下（SHA-256 见报告）：

| 运行图 | 像素 | 字节 |
| --- | --- | ---: |
| 现代单向 | 201×403 | 59,660 |
| 现代双向 | 151×337 | 42,678 |
| 小镇单向 | 282×479 | 150,460 |
| 小镇双向 | 255×484 | 147,867 |

只保留这四张选定源图和正式运行图；真实公路参考照片、截图、浏览器配置及中间制作页面使用系统临时目录，完成后清理。
