# 建筑高度与变体选择

日期：2026-11-01。基线：`ac876352e899528669a6a760240d14818c2398b6`；分支：`codex/city-building-families`。

## 授权与范围

本轮沿用 `0a10a65`，独占 `src/renderers/city-parcels.ts`、`src/renderers/city-building-style.ts`、本任务文档和对应报告。唯一运行接口为 `selectCityBuilding(parcel: CityParcel, seed: number): { id: string; factor: number }`，以 type import 使用已有地块类型，只接受内部已验证的合法建筑地块。

仅扩展 H3/H4 已授权占地候选；不修改同档规则、道路/年度边界、日期、数量、强度映射、city-view、素材、标定、目录、依赖、权限、缓存或全局文档。类型和颜色仅作造型差异，不表达活动类型；保留现有设施地块，不扩大设施占比或引入游戏系统。

## 选择契约

| band | 占地 | 两个候选 id | factor |
| --- | --- | --- | --- |
| 1 | 1×1 | townhouse-a / mixed-use-b | 1 |
| 1 | 2×1 | police-a / fire-b | 1 |
| 1 | 3×3 | stadium-a / terminal-b | 1 |
| 2 | 1×1 | apartment-h2-a / apartment-h2-b | 1 |
| 2 | 2×2 | townhouse-a / mixed-use-b | 2 |
| 3 | 1×1 | office-h3-a / office-h3-b | 1 |
| 3 | 2×1 | office-wide-h3-a / office-wide-h3-b | 1 |
| 3 | 1×2 | office-deep-h3-a / office-deep-h3-b | 1 |
| 4 | 1×1 | tower-h4-a / tower-h4-b | 1 |
| 4 | 2×2 | apartment-h2-a / apartment-h2-b | 2 |

| 4 | 2×1 | tower-wide-h4-a / tower-wide-h4-b | 1 |
| 4 | 1×2 | tower-deep-h4-a / tower-deep-h4-b | 1 |

`planWeeklyCity(days, mergeTallRectangles = false)` 默认保持旧合法占地：H3 仅 1×1，H4 为 2×2、1×1。本地 #24 在素材、目录和选择调用一起接入时，在 planCityScene 显式调用 `planWeeklyCity(days,true)`。此布尔参数仅处理两个 PR 的实际依赖。启用后 H3 按 2×1、1×2、1×1 选择；H4 按 2×2、2×1、1×2、1×1 选择。不开放 H2 长条或三格占地；三连续格自然为两格加一格。长条使用原生素材 factor 1，不旋转、不拉伸。

factor 对地面和高度一起等比应用；不横向拉伸，不用旧塔楼 0.82 代替 H3。合法组合已由现有规划器限定，因此不重复校验或增加通用注册框架。函数将 seed 转为无符号 32 位后按奇偶选择 A/B，不读取时间、缩放或随机源，也不修改地块。

## 本地组合依赖

本地生成并标定六张原生 1×1 PNG：两张 apartment-h2（H2）、两张 office-h3（H3）、两张 tower-h4（H4），使用上表固定 id。每对须有造型/材质差异。由本地加入 CITY_UNIT_CATALOG，并在 city-view 建筑分支调用本函数；由调用方提供稳定 seed，不随缩放或播放变化。最终组合 PR 验证素材加载、比例、整体画面和重播/缩放稳定性。本 PR 是该组合工作的明确依赖，不构成最终接入。

本轮额外依赖八张原生长条 PNG：office-wide-h3-a/b（2×1 H3）、office-deep-h3-a/b（1×2 H3）、tower-wide-h4-a/b（2×1 H4）、tower-deep-h4-a/b（1×2 H4），每对造型不同。本地负责生成、标定、登记和最终画面验收，并将依赖提交组合进已有功能 PR #24，不合入 main。

## 验证计划

运行锁文件安装、类型检查、临时目录构建，以及直接选择/现有规划路径检查；新长条诊断显式传 true，并与 `0a10a65` 深度比较默认规划结果；覆盖全部十二个合法组合、两候选、factor、一致输入稳定和输入不变。只保留可复现报告，不补单元测试、不提交临时输入或产物。未取得对应新素材前，不宣称素材加载、视觉或本机验收通过。
