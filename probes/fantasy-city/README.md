# 西式奇幻真实贡献渲染原型

仅用于本机设计研究，不导入扩展入口、不发 GitHub 请求、不持久化用户数据，也不参与正式构建。`plan-courtyards.js` 负责矩形庭院合并和边界路径，`render.js` 暴露 `window.renderCodeYearsFantasy(data, assetUrls, options)`。由调用方提供已经过日期、数量及矩形覆盖校验的数据。

总览画幅、年份走廊与装饰位置仅针对本次三年场景配置，不是通用城市布局器。

## 输入

- `data.profile`、`data.asOf`：主页与快照日期。
- `data.years[]`：每项包含 `year`、`total`、`active`、`rows`、`sha256`。
- `year.days[]`：包含 `date`、`count`、`x`（星期一至日为 0–6）、`y`（周行）。零值日期保留，未知/未来日期不伪造。
- `year.parcels[]`：包含 `id`、`x`、`y`、`w`、`h`、`mean`；地块需在输入边界完成互斥占用与贡献守恒校验。
- `assetUrls`：`atlas`、`catalog`、`ground` 三个可由本机同源服务读取的 URL。图集与标定 JSON 位于 `docs/design/ancient-town-concepts/2026-11-10/`。本次草地使用用户指定的 Agent Control Plane 原有 `ground-town.png`，由临时本机服务读取原文件，未复制入本仓库。

## 实际取景

页面依次加载 `plan-courtyards.js`、`render.js` 后，调用：

```javascript
const overview = await renderCodeYearsFantasy(data, assetUrls, {
  width: 6000,
  height: 3400,
});
const detail = await renderCodeYearsFantasy(data, assetUrls, {
  width: 4000,
  height: 2500,
  year: 2026,
  firstRow: 30,
  lastRow: 46,
});
const farms = await renderCodeYearsFantasy(data, assetUrls, {
  width: 3200,
  height: 2400,
  year: 2025,
  firstRow: 37,
  lastRow: 45,
});
document.body.append(overview.canvas, detail.canvas, farms.canvas);
```

返回 `canvas` 和 `metadata`。`metadata.drawnBuildings` 是实际执行房屋绘制的次数，`visibleBuildings` 是与输出画布相交的房屋数；树木、石块另计。导出直接使用 `canvas.toBlob(..., 'image/png')`，无需让图像模型重画整个地图。

每个年度先生成同一份完整庭院规划，近景只筛选与所选周行相交的庭院，不在取景时重新合并或改变均值。所有年份在总览中使用相同七列网格与世界尺度；年份间留出装饰走廊。

## 当前映射与限制

- 第一阶段输入仍为相近日贡献矩形；第二阶段把**原矩形均值处于同一繁荣档**、且能组成无孔洞完整矩形的相邻地块合并。不切开原矩形，不吞入零值/未知日期，不跨年。按面积、紧凑度、行列顺序确定性选择互斥矩形；均值从成员日贡献重新加权计算。
- 第二阶段使用的均值档位为 `≤2`、`(2,5]`、`(5,19]`、`(19,49]`、`>49`；同档不代表每天满足第一阶段的极差约束。这是本轮放宽相近条件的设计候选，尚未确定为正式规则。
- 每个最终庭院绘制一栋主屋，按均值档位选择两种外观之一，高度不按贡献变化。变体按年份和星期列组稳定选择，不因取景改变。
- 日期地格间距扩大至 1.7 世界单位，建筑物理尺寸保持原值；主屋沿地块后侧固定偏移摆放，不再居中于不同宽高的地块。移除旧绘制层的额外整体偏移，围栏、院门与房屋共用坐标。
- 多格地块保留全部占地，用草坪、围栏、花圃、入户路表达庭院。低两档且面积至少三格时布置菜畦，表现为农场；较高档以花园和门前铺装表达较繁荣的院落。没有拉伸主屋，也没有用房屋高度表达贡献。
- 公共小路只走庭院边界，不能穿过同一个庭院的内部；从公共西侧主路建立边界最短路树，每个前院门连接到树上。院内另外绘制入户路，门口保留围栏缺口。
- 图集是生成素材，并做了透明通道与落脚点初步标定；尚未完成正式世界包络、门窗尺度或全部屋檐遮挡验收。
- 草地、河道、桥、路径、树林和石块不表示额外贡献。本次检查了原型院门到主路的边界路径连通性，未进行交通模拟或正式路网验收。
- 只在调用时绘制一次，没有动画循环；这不代表正式扩展性能预算已通过。

## 本轮验证

```sh
node --check probes/fantasy-city/render.js
node --check probes/fantasy-city/plan-courtyards.js
```

本机 Chrome headless 在独立临时配置和仅监听 `127.0.0.1` 的服务中执行完整数据到 PNG 路径，检查逐日互斥覆盖、原地块完整归属、均值档位、贡献守恒、边界路径和实际房屋绘制次数。最新报告见 [庭院与农场渲染记录](../../docs/design/ancient-town-concepts/2026-11-10/REAL-RENDER-COURTYARDS.md)，[初版](../../docs/design/ancient-town-concepts/2026-11-10/REAL-RENDER.md) 保留为历史对照。真实公开 HTML、逐日 JSON、临时页面、浏览器配置和日志不进入 Git，结果图只保存在用户本机。
