# 建筑高度与变体选择

日期：2026-11-01。基线：`ac876352e899528669a6a760240d14818c2398b6`；分支：`codex/city-building-families`。

## 授权与范围

仅新增 `src/renderers/city-building-style.ts`、本任务文档和对应报告。唯一运行接口为 `selectCityBuilding(parcel: CityParcel, seed: number): { id: string; factor: number }`，以 type import 使用已有地块类型，只接受内部已验证的合法建筑地块。

不修改规划、同档合并、数量、city-view、素材、标定、目录、依赖、权限、缓存或全局文档。类型和颜色仅作造型差异，不表达活动类型；保留现有设施地块，不扩大设施占比或引入游戏系统。

## 选择契约

| band | 占地 | 两个候选 id | factor |
| --- | --- | --- | --- |
| 1 | 1×1 | townhouse-a / mixed-use-b | 1 |
| 1 | 2×1 | police-a / fire-b | 1 |
| 1 | 3×3 | stadium-a / terminal-b | 1 |
| 2 | 1×1 | apartment-h2-a / apartment-h2-b | 1 |
| 2 | 2×2 | townhouse-a / mixed-use-b | 2 |
| 3 | 1×1 | office-h3-a / office-h3-b | 1 |
| 4 | 1×1 | tower-h4-a / tower-h4-b | 1 |
| 4 | 2×2 | apartment-h2-a / apartment-h2-b | 2 |

factor 对地面和高度一起等比应用；不横向拉伸，不用旧塔楼 0.82 代替 H3。合法组合已由现有规划器限定，因此不重复校验或增加通用注册框架。函数将 seed 转为无符号 32 位后按奇偶选择 A/B，不读取时间、缩放或随机源，也不修改地块。

## 本地组合依赖

本地生成并标定六张原生 1×1 PNG：两张 apartment-h2（H2）、两张 office-h3（H3）、两张 tower-h4（H4），使用上表固定 id。每对须有造型/材质差异。由本地加入 CITY_UNIT_CATALOG，并在 city-view 建筑分支调用本函数；调用方须使用基于年份及成员日期的稳定 seed。最终组合 PR 验证素材加载、比例、整体画面和重播/缩放稳定性。本 PR 是该组合工作的明确依赖，不构成最终接入。

## 验证计划

运行锁文件安装、类型检查、临时目录构建，以及直接选择/现有规划路径检查；覆盖全部八个合法组合、两候选、factor、一致输入稳定和输入不变。只保留可复现报告，不补单元测试、不提交临时输入或产物。未取得六张素材前，不宣称素材加载、视觉或本机验收通过。
