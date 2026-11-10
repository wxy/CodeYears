# 西式奇幻真实贡献渲染原型

仅用于本机设计研究，不导入扩展入口、不发 GitHub 请求、不持久化用户数据，也不参与正式构建。`render.js` 暴露 `window.renderCodeYearsFantasy(data, assetUrls, options)`，由调用方提供已经过日期、数量及矩形覆盖校验的数据。

总览画幅、年份走廊与装饰位置仅针对本次三年场景配置，不是通用城市布局器。

## 输入

- `data.profile`、`data.asOf`：主页与快照日期。
- `data.years[]`：每项包含 `year`、`total`、`active`、`rows`、`sha256`。
- `year.days[]`：包含 `date`、`count`、`x`（星期一至日为 0–6）、`y`（周行）。零值日期保留，未知/未来日期不伪造。
- `year.parcels[]`：包含 `id`、`x`、`y`、`w`、`h`、`mean`；地块需在输入边界完成互斥占用与贡献守恒校验。
- `assetUrls`：`atlas`、`catalog`、`ground` 三个可由本机同源服务读取的 URL。图集与标定 JSON 位于 `docs/design/ancient-town-concepts/2026-11-10/`。本次草地使用用户指定的 Agent Control Plane 原有 `ground-town.png`，由临时本机服务读取原文件，未复制入本仓库。

## 两个实际取景

页面加载 `render.js` 后，调用：

```javascript
const overview = await renderCodeYearsFantasy(data, assetUrls, {
  width: 5000,
  height: 2800,
});
const detail = await renderCodeYearsFantasy(data, assetUrls, {
  width: 2800,
  height: 1900,
  year: 2026,
  firstRow: 30,
  lastRow: 46,
});
document.body.append(overview.canvas, detail.canvas);
```

返回 `canvas` 和 `metadata`。`metadata.drawnBuildings` 是实际执行房屋绘制的次数，`visibleBuildings` 是与输出画布相交的房屋数；树木、石块另计。导出直接使用 `canvas.toBlob(..., 'image/png')`，无需让图像模型重画整个地图。

近景只绘制与所选周行相交的原始地块，不重新合并或改变均值。所有年份在总览中使用相同七列网格与世界尺度；年份间留出装饰走廊。

## 当前映射与限制

- 每个合并单元绘制一栋建筑，均值使用 1–2、3–5、6–19、20–49、50+ 的示意档位选择两种外观变体之一；高度不按贡献变化。
- 变体由年份和地块位置稳定选择，不因取景改变。
- 多格地块保留全部占地，用庭院、围栏和铺装表达多余空间，建筑主体仍使用单格素材；没有把小房子整体拉伸填满。
- 图集是生成素材，并做了透明通道与落脚点初步标定；尚未完成正式世界包络、门窗尺度或全部屋檐遮挡验收。
- 草地、河道、桥、路径、树林和石块是静态装饰，不表示额外贡献，也没有进行交通模拟或正式路网验收。
- 只在调用时绘制一次，没有动画循环；这不代表正式扩展性能预算已通过。

## 本轮验证

```sh
node --check probes/fantasy-city/render.js
```

本机 Chrome headless 在独立临时配置和仅监听 `127.0.0.1` 的服务中执行完整数据到 PNG 路径。报告见 [真实渲染记录](../../docs/design/ancient-town-concepts/2026-11-10/REAL-RENDER.md)。真实公开 HTML、逐日 JSON、临时页面、浏览器配置和日志不进入 Git，结果图只保存在用户本机。
