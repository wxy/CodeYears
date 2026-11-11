# 精绘城市路牌

2026-11-11。使用内置 imagegen，以建筑素材的制作方式保留正式源图、控制点和离线运行 PNG。两套造型现按东西/南北方向使用，不表示单向或双向关系；没有目的地时保留纯空牌。完整历史提示词及参考来源见 [PROMPTS.md](PROMPTS.md)，当前实施与验收见[出口规则报告](../../../reports/OUTBOUND-ROADS-AND-JUNCTIONS.md)。

| 用途 | 正式源图 | 运行图 |
| --- | --- | --- |
| 现代东西方向 | [薄铝板、绿底白边、镀锌立柱](modern-highway-source.png) | [PNG](../../../../public/assets/city-runtime/direction-board-x.png) |
| 现代南北方向 | [蓝底双白边、细立柱](modern-highway-mutual-source.png) | [PNG](../../../../public/assets/city-runtime/direction-board-z.png) |
| 小镇东西方向 | [木框、石基、灯笼与藤蔓](town-source.png) | [PNG](../../../../public/assets/town-runtime/direction-board-x.png) |
| 小镇南北方向 | [蓝色木牌、雕花与金属嵌边](town-mutual-source.png) | [PNG](../../../../public/assets/town-runtime/direction-board-z.png) |

现代厚重装饰框的早稿已弃用。正式现代款参考真实公路指路牌的薄板和立柱比例，仍采用项目所需的绘画质感；不宣称符合交通工程认证。

## 离线制作

```sh
node scripts/bake-direction-boards.mjs
npm run build
```

前置条件为 macOS、本机 Google Chrome 和仓库 Node 依赖。脚本从[实际控制点](calibration.json)生成四张运行 PNG，更新城市/小镇目录与 `direction-board-layout.json`。运行图保留透明背景；不把生成源图直接打入扩展。每种地图只加载自己的东西、南北两张图，图片生命周期沿用建筑缓存。源文件名中的 mutual 保留原始制作记录，当前不承担连接状态含义。

源图实际牌面斜率与提示词的目标不同；脚本将实测牌面轴校准到 +0.5，另一朝向通过世界变换镜像造型，文字始终正向。不重画图片内容，不把透明像素当成地面；支架的隐藏几何、地脚完整包络与物理相机恢复不作保证。已连接牌面绘制 ID 与出城箭头，未指定的牌面不绘制文字或箭头；路面只在出城半幅绘制目标 ID。

源图均为 1774×887 RGBA。运行图的实测尺寸及字节如下（SHA-256 见报告）：

| 运行图 | 像素 | 字节 |
| --- | --- | ---: |
| 现代东西 | 201×403 | 59,660 |
| 现代南北 | 151×337 | 42,678 |
| 小镇东西 | 282×479 | 150,460 |
| 小镇南北 | 255×484 | 147,867 |

只保留这四张选定源图和正式运行图；真实公路参考照片、截图、浏览器配置及中间制作页面使用系统临时目录，完成后清理。
