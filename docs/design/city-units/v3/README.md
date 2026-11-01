# City 中高层透明单元 · v3

日期：2026-11-01。六款单格与新增八款长条 PNG、共享格式标定通过本地 [PR #24](https://github.com/wxy/CodeYears/pull/24) 接入；云端选择/合并见 [PR #22](https://github.com/wxy/CodeYears/pull/22)，街区/河道见 [PR #23](https://github.com/wxy/CodeYears/pull/23)。各项仍待合入，最终美术接受由用户判断。独立目录保留原图，不覆盖 v2 或旧中高层。

| 档位 | A | B | 实际楼身参考高度 |
| --- | --- | --- | --- |
| 1×1 H2 | [赤陶砖石公寓](candidates/h2/apartment-h2-a.png) | [浅石中层住宅](candidates/h2/apartment-h2-b.png) | 2.000H / 2.000H |
| 1×1 H3 | [棕铜退台办公楼](candidates/h3/office-h3-a.png) | [蓝灰单肩办公楼](candidates/h3/office-h3-b.png) | 3.000H / **2.800H** |
| 1×1 H4 | [蓝玻璃直塔](candidates/h4/tower-h4-a.png) | [青绿退台塔](candidates/h4/tower-h4-b.png) | 4.000H / 4.000H |

H3 B 为保留占地内的间距，实际高度受约束；接受为同档略低的造型，不拉伸图像、不改参考尺冒充 3H。高度是视觉楼身参考，不代表精确楼层或物理相机恢复。既有警消/体育场/总站仍为低矮设施，其实际比例不因本轮高层完成而改写为严格 H1 达标。

## 新增长条建筑

| 组合 | A | B | 实际楼身参考高度 |
| --- | --- | --- | --- |
| 2×1 H3 | [铜色办公](candidates/h3-rect/office-wide-h3-a.png) | [蓝灰办公](candidates/h3-rect/office-wide-h3-b.png) | 3.000 / 3.000H |
| 1×2 H3 | [纵深办公 A](candidates/h3-rect/office-deep-h3-a.png) | [纵深办公 B](candidates/h3-rect/office-deep-h3-b.png) | 3.000 / 3.000H |
| 2×1 H4 | [蓝玻璃宽塔](candidates/h4-rect/tower-wide-h4-a.png) | [青绿宽塔](candidates/h4-rect/tower-wide-h4-b.png) | 4.000 / **3.820H** |
| 1×2 H4 | [蓝玻璃深塔](candidates/h4-rect/tower-deep-h4-a.png) | [青绿深塔](candidates/h4-rect/tower-deep-h4-b.png) | 4.000 / 4.000H |

两种方向分别生成，不镜像、不把单格图横向拉长。八款实际长轴 1.146–1.798 格，长短比 1.757–2.985，最小每侧退让≥0.1格；地面包络居中且主轴映射±0.5。wide H4 B 保留约4.5%的档内较低比例，不冒充严格4H；部分后角与楼身底点为明确记录的推断。长条仍有各自退让，不要求楼体占满两格。

八张共 15,265,306 bytes。源/运行副本一致，均1024×1536 RGBA；`office-wide-h3-b`左上角alpha=1，其余边角为0，低值残留由既有显示缓存处理，源PNG不改。完整提示和量测分别见 [H3来源](candidates/h3-rect/SOURCES.md)、[H4来源](candidates/h4-rect/SOURCES.md)、[H3标定](calibration/h3-rect.json)、[H4标定](calibration/h4-rect.json)。

H3/H4 开放 2×1 与 1×2，三连可拆2+1；H4 2×2仍优先复用H2×2，H3 2×2拆成合法长条。H2长条、三格组合不扩张。仅随本地目录和选择调用显式启用新规划，默认调用保留旧布局，避免依赖PR单独合入时先产生缺图地块。

## 比例与复用

- 统一地面轴 W=(48,24)、D=(-48,24)，竖边保持竖直。记录两组主边、L/F/R 支撑包络、同一竖边高度参考与半开裁框；可见、隐藏推断与近似依据保留在 JSON 和来源中。
- 地面包络居中，每向每侧至少退让 0.1 格。六款最小单侧退让为 0.100–0.250 格，未用整张透明图的中心替代地面落点。
- 1×1 H1 住宅等比 ×2 → 2×2 H2；1×1 H2 公寓等比 ×2 → 2×2 H4。地面与高度一起缩放，不把单格图横向拉伸为长条建筑。H3/H4 不加入 ×2 的 H6/H8 组合。
- 同一地块的造型与材质在创建时确定，缩放、平移和重播不重新选择。颜色与类型不代表真实 GitHub 活动类别。

## 来源与标定

| 组 | 来源 / 完整提示 | 标定 |
| --- | --- | --- |
| H2 | [SOURCES](candidates/h2/SOURCES.md) | [h2.json](calibration/h2.json) |
| H3 | [SOURCES](candidates/h3/SOURCES.md) | [h3.json](calibration/h3.json) |
| H4 | [SOURCES](candidates/h4/SOURCES.md) | [h4.json](calibration/h4.json) |

每款独立使用内置 imagegen；部分首稿过宽，只作一次针对性比例修订。最终六张均为 1024×1536 RGBA，运行副本与正式源图逐字节一致，六张共 10,893,292 bytes。没有程序去底、重绘、改色或修改原始 alpha；低值 alpha 仅由已有显示缓存处理。裁框等于 alpha>8 的范围；完整隐藏几何、所有未测屋顶细节和物理准确性不作保证。

本地 `npm run preview:units` 将 v2 与 v3 共 36 款一起拼接，可逐款比较原图/标定、浅深背景和参考尺；建筑行和自然单元分开摆放，避免目录变宽后重叠。按需加载、共享解码与最大384像素烘焙规格沿用既有实现。PNG目录共41个id/39个文件，另有铺装及三种朝向的程序灯共4个id；不把目录数量写成原建议矩阵全部完成。

画面与直接交互证据见 [本地组合报告](../../../reports/CITY-VISUAL-POLISH.md)。包体压缩、正式主题、其他大占地双变体与完整发布验收留在后续主线，不在本轮扩张。

长条恢复、环境地块、河道与信号灯的最新结果见 [反馈修正报告](../../../reports/CITY-RECTANGLES-AND-ENVIRONMENT.md)。用户提出的“固定基座＋重复楼层＋独立楼顶”已记入单元规范的后续设想，本轮未实现叠层系统。
