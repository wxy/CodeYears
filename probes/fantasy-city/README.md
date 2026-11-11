# 西欧魔法小镇真实贡献渲染原型

本目录用于独立本机设计研究，不导入扩展入口、不发 GitHub 请求、不持久化用户数据，也不参与正式构建。正式新地图类型的实现与验收另行记录，不把本目录的图片或 headless 原型结果当作扩展验收。

`plan-courtyards.js` 负责矩形庭院与边界路径，`plan-building-forms.js` 按占地和强度选择建筑平面，`project-sprites.js` 将标注地面轴校正到同一投影，`render.js` 暴露 `window.renderCodeYearsFantasy(data, assetUrls, options)`。由调用方提供已经过日期、数量及矩形覆盖校验的数据。

总览画幅、年份走廊与装饰位置仅针对本次三年场景配置，不是通用城市布局器。

## 输入

- `data.profile`、`data.asOf`：主页与快照日期。
- `data.years[]`：每项包含 `year`、`total`、`active`、`rows`、`sha256`。
- `year.days[]`：包含 `date`、`count`、`x`（星期一至日为 0–6）、`y`（周行）。零值日期保留，未知/未来日期不伪造。
- `year.parcels[]`：包含 `id`、`x`、`y`、`w`、`h`、`mean`；地块需在输入边界完成互斥占用与贡献守恒校验。
- `assetUrls`：`atlas`/`catalog` 为原单格图集与标定，`forms`/`formCatalog` 为原多格形态；`magic`/`magicCatalog` 为魔法建筑与设施，`magicCompact` 为保留紧凑圆形建筑的第一版魔法图集，`life`/`lifeCatalog` 为居民、动物、花树和公共空间素材，`classicProjection` 为原素材的新增投影标注，`ground` 为地面。均由本机同源服务提供。前两组位于 `docs/design/ancient-town-concepts/2026-11-10/`，魔法/生活和投影标注位于 `2026-11-11/`。`magic-town-v2.json` 按项指定采用哪一版源图：前两种紧凑圆形建筑保留v1，其余采用低矮重画的v2。草地临时读取用户指定 Agent Control Plane 原有 `ground-town.png`，未复制入本仓库。

## 实际取景

页面依次加载 `plan-courtyards.js`、`plan-building-forms.js`、`project-sprites.js`、`render.js` 后，调用：

```javascript
const overview = await renderCodeYearsFantasy(data, assetUrls, {
  width: 6000,
  height: 3400,
});
const detail = await renderCodeYearsFantasy(data, assetUrls, {
  width: 3600,
  height: 2400,
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
const estate = await renderCodeYearsFantasy(data, assetUrls, {
  width: 3600,
  height: 2400,
  year: 2026,
  firstRow: 12,
  lastRow: 24,
});
document.body.append(overview.canvas, detail.canvas, farms.canvas, estate.canvas);
```

返回 `canvas` 和 `metadata`。`drawnUnits` 是实际建筑素材绘制次数，`visibleUnits` 是与输出画布相交的建筑单元数；一个农场图块包含多栋建筑，这两个值不统计组内物理房屋数量。`forms` 按形态汇总；`layouts`、`projection`、`plazas` 记录本机包络、投影与公共空间检查输入，不持久化。`life` 统计实际提交的居民组、家畜组、花树、公共设施和路灯素材次数，**不是贡献者、工时或实际人口计数**。导出直接使用 `canvas.toBlob(..., 'image/png')`，无需让图像模型重画地图。

每个年度先生成同一份完整庭院规划，近景只筛选与所选周行相交的庭院，不在取景时重新合并或改变均值。所有年份在总览中使用相同七列网格与世界尺度；年份间留出装饰走廊。

## 当前映射与限制

- 第一阶段输入仍为相近日贡献矩形；第二阶段把**原矩形均值处于同一繁荣档**、且能组成无孔洞完整矩形的相邻地块合并。不切开原矩形，不吞入零值/未知日期，不跨年。按面积、紧凑度、行列顺序确定性选择互斥矩形；均值从成员日贡献重新加权计算。
- 第二阶段使用的均值档位为 `≤2`、`(2,5]`、`(5,19]`、`(19,49]`、`>49`；同档不代表每天满足第一阶段的极差约束。这是本轮放宽相近条件的设计候选，尚未确定为正式规则。
- 单格多数保留小屋；第三档以上按稳定位置选择约三分之一的圆形法师工坊或观星台。所有多格地块使用长屋、长厅、魔法温室、侧翼庄园或农场组合，不通过增加楼层填满占地。
- 日期格间距仍为 1.7 世界单位。名义包络内等比放置并沿后边界退让，最大倍率 1.15；窄长素材需要时水平反射，交换两条等轴地面方向。可见地面轴经保持竖边垂直的校正映射到斜率 ±0.5；圆形底座映射为 2:1 水平椭圆。校准中的人尺度参考上限用于避免地面方向校正后楼体过高，不能把名义包络当成实体覆盖面积。
- 草坪、围栏、花圃与院门继续保留；种植区避开建筑声明包络与入户路，避免在谷仓或侧翼下面画菜畦。当前完整农场至少占四格，原三格低档地块可用乡间长屋。
- 每个贡献建筑单元配一组门前居民；魔法建筑还包含在观测、炼金或授课的原画人物。农场加家畜，已知零值日期可有花树或动物。它们只描述生活场景，不表达贡献类型或人口事实。
- 公共设施只选择已知零贡献日期：必须邻接贡献建筑，且该日期格至少一边有公共道路；每四周桶最多选一处。集市、长椅、泉台、魔力井或传送门通过格内路径接到原路网，另配路灯与花树，不生成新的贡献建筑。
- 公共小路只走庭院边界，不能穿过同一个庭院的内部；从公共西侧主路建立边界最短路树，每个前院门连接到树上。院内另外绘制入户路，门口保留围栏缺口。
- 图集是生成素材，并做了透明通道与落脚点初步标定；尚未完成正式世界包络、门窗尺度或全部屋檐遮挡验收。
- 草地、河道、桥、路径、树林和石块不表示额外贡献。本次检查了原型院门到主路的边界路径连通性，未进行交通模拟或正式路网验收。
- 只在调用时绘制一次，没有动画循环；这不代表正式扩展性能预算已通过。

按以下顺序匹配建筑形态；面积指日期格数，非贡献总量：

| 占地与强度 | 形态 |
| --- | --- |
| 一格 | 多数保留五档小屋，第三档以上稳定选择约三分之一圆形法师工坊/观星台 |
| 低两档、面积至少四格、宽高均至少二格 | 主屋 + 谷仓 + 马厩的完整农场 |
| 低两档、面积至少四格、窄长 | 线形农舍与仓储/畜舍组合 |
| 宽高均至少二格，宽高比至少 1.6 | 低矮宽厅与双侧翼的魔法学院 |
| 其他宽高均至少二格，第三档 / 更高档 | L 形炼金庄园 / U 形魔法行会 |
| 其他多格 | 乡间长屋/工坊长厅；较高档长条约三分之一使用魔法温室 |

裁切坐标与落脚点是本轮人工初标。名义矩形包含建筑翼间空隙，不能将其面积当作真实墙体或屋顶面积；地面包络断言不等于精确 Alpha 屋檐碰撞验收。

## 本轮验证

```sh
node --check probes/fantasy-city/render.js
node --check probes/fantasy-city/plan-courtyards.js
node --check probes/fantasy-city/plan-building-forms.js
node --check probes/fantasy-city/project-sprites.js
```

本机 Chrome headless 在独立临时配置和仅监听 `127.0.0.1` 的服务中执行完整数据到 PNG 路径，检查覆盖与守恒、边界路径、声明包络退让、投影主轴、居民/设施角色计数和零日期设施选址。最新报告见 [魔法小镇原型](../../docs/design/ancient-town-concepts/2026-11-11/MAGIC-TOWN-PROTOTYPES.md)；前版 [多格形态](../../docs/design/ancient-town-concepts/2026-11-10/REAL-RENDER-BUILDING-FORMS.md)、[庭院版](../../docs/design/ancient-town-concepts/2026-11-10/REAL-RENDER-COURTYARDS.md) 和 [初版](../../docs/design/ancient-town-concepts/2026-11-10/REAL-RENDER.md) 保留为历史对照。临时真实数据、浏览器配置和日志不进入 Git，结果图只存本机。七日网格之外的 [组织形式候选](../../docs/design/ancient-town-concepts/2026-11-11/ORGANIZATION-OPTIONS.md) 为通用结构示意，未实现多布局框架。
