# 公共服务候选包

本目录的 catalog 仅由 `probes/city-models-civic/` 显式使用。五款本轮新图与两款旧图引用分别标记；没有接入正式分档、没有发布。素材来源为内置 imagegen，未调用外部付费 API、未使用或索取生成 API key，未复制外部游戏资产。

## 交付与造型

| id | 外观 | 逻辑占地 | 来源 |
| --- | --- | --- | --- |
| civic-library | 红砖高阅读窗、连续锯齿铜顶 | 1×2 | 本轮新图 |
| civic-clinic | 浅石门廊、青绿重檐坡顶、台阶扶手 | 1×1 | 本轮新图 |
| civic-school | 赭砖两层教室、双山墙、入口小庭院 | 2×1 | 本轮新图 |
| civic-post | 红砖、铜顶灯笼天窗、嵌入式投递口 | 1×1 | 本轮新图 |
| civic-center | 浅石围合翼楼、玻璃门厅、内部庭院 | 2×2 | 本轮新图 |
| civic-fire-b | 红砖车库、行政入口 | 2×1 | 已存在 fire-b，引用正式预烘焙图 |
| civic-police-a | 灰石警务门厅 | 2×1 | 已存在 police-a，仅补充参考 |

诊所外观是非机构化的小型服务门厅，没有十字标志或招牌；是否足够表达诊所由次日审查决定。学校在2×1逻辑地块中按实际包络等比容纳，未将近方形楼体横向拉伸填满；庭院中心不超2×2。邮局靠投递口和门厅区分，不依赖小文字。公共用途不是贡献分类。

## 标定与边界

`source.png` 为生成工具返回的完整透明设计板，实际像素/字节/哈希见报告。`generation.json` 保留生成和重排提示词；第一轮外缘裁切被拒绝，未作为候选运行图。未把生成板当作运行素材。

`calibration.json` 记录各图源像素 crop、W/D 轴线、地面 L/F/R、锚点、楼身参考。地面选取包括必要台阶与花池，隐藏背角由 L+R−F 推断，是逻辑包络，不声称恢复了完整物理矩形。源图局部装饰不一定与测量主边一致，不能把两条轴校正通过视为全部建筑线条通过。

候选采用正式 `unit-calibration.ts` 的 `loadUnit → calibrate → drawUnit`；先用Canvas无损截出各栋独立源图（sources/），再分别解码，遵循现行768长边限制，避免整板缩小损失单栋细节，低alpha清理沿用正式规则。变换保留竖边竖直，将量测双轴归一至±0.5。按地面包络居中与至少0.1格退让等比缩放，地面限制优先于目标高度；不会为凑满占地拉伸楼身。`bake.ts` 的建筑烘焙公式沿用 `city-source-assets.ts`，padding=2、长边≤384、ratio≤4。

`catalog.json` 保存烘焙后位置、世界尺寸、实际像素、实际高度和退让量，直接对应 `public/assets/city-candidates-civic/*.png`。旧警消图只引用 `/assets/city-runtime/`，没有复制、重新计数或互改。旧原图/标定位于 `docs/design/city-units/v2/candidates/services/` 与 `docs/design/city-units/v2/calibration/buildings.json`，并非新增模型。

## 验收入口

仓库根执行：

```sh
npm ci
npx vite --config probes/city-models-civic/vite.config.ts
```

打开 `http://127.0.0.1:4187/`，选择1/3/20年，切换候选隔离/完整混排，依次全景、150%、当前最大倍率，拖动至候选；页面下方提供透明棋盘上的全部实际PNG，审计区显示实际使用次数、CSS/DPR尺寸、守恒与映射。预览只替换兼容占地的外观，不重排原 parcel。

`?bake` 是离线制作入口，不用于正常验收，结果保存在 `window.civicBake`；正式预览只读小PNG，不重新烘焙源板。复现制作可用 `node probes/city-models-civic/bake-candidates.cjs`（先启动上方Vite服务，需要已安装的 Playwright：`PLAYWRIGHT_MODULE=/已安装/playwright-core CHROMIUM_PATH=/浏览器路径 node probes/city-models-civic/bake-candidates.cjs`；不新增项目依赖）。

尚待用户接受造型、局部投影、白边与近景细节，之后再决定正式映射。云端软件Canvas不替代Mac GPU、GitHub真实登录或完整性能预算。
