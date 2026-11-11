# 局部暖石步道样板

## 假设与取舍

现有正式入口已经有贴近楼脚的铺装、入口短接路和建筑边界窄支路。增加全城小物会增加噪声；本样板只验证加宽相连边界、保留半格接缝，是否让低层街区更像可步行空间。院落用铺装边缘表达，未新增围栏、车站、停车场或过街线。过街线需结合停止线、信号灯与路名净空单独规划，本轮不抢改正式道路绘制。

首个非里程碑、至少4×3格的有机片区取左侧最多12列。选取完整位于样板内的建筑地块，对地块外围的单位边去重；不拆合并地块。宽度0.16格，规范的建筑退让为每边至少0.1格，额外保留0.01格检查余量。两条接缝/单位边，线宽0.008投影单位。样板裁在片区内侧0.01格，保持外侧道路和街角空间。

包络使用规范的逻辑标定退让，不宣称从 PNG 像素重新量测楼脚；nativeWidth/nativeDepth 是素材单元尺寸，不能当作实际楼脚。现有素材标定误差和精确入口朝向仍须美术复核。程序 Path2D 是地面材质几何，不作为精绘新素材；正式楼体、树木与桥继续用现有 PNG。

## 正确阶段与后续最小接入

当前 `ground.ts` 在创建视图前规划 Path2D；`main.ts` 把它放在 `createOrganicGround(plan)` 之后、`createCityView` 原有楼脚铺装/入口/平地/深度排序之前。这样楼体、平地水塘自然遮挡地面，不在最终 Canvas 移动、删除或擦除道路/建筑。没有新增立体设施，也不需要改变深度排序。

若用户选用，只需将这一个局部规划函数移入允许的实验渲染模块，在正式地面回调的同一位置调用；入口仍须显式选用，先保持默认关闭。保留12列样板预算，不直接遍历全城铺装。无需改规划器、贡献数据、场景items、路网、桥、缩放器或素材库，不搭通用装饰框架。

## 运行

仓库根目录先执行 `npm ci`，再执行：

```sh
npx vite --config probes/city-polish/street/vite.config.ts
```

打开 `http://localhost:4193`；两侧同宽、同输入、同相机。默认100%，整体按钮缩到50%以显示全城，样板近景为内部倍率20（约1067%），滚轮按正式物理基准限制50%—2000%，同时保留素材细节上限。只改变观看，不改地块。

```sh
npx tsc --project probes/city-polish/street/tsconfig.json
npx vite build --config probes/city-polish/street/vite.config.ts
node probes/city-polish/street/verify-browser.cjs
```

构建与Vite缓存固定写入 `/tmp/codeyears-street-build`、`/tmp/codeyears-street-vite`。浏览器验证依赖现有 Chromium 与 Playwright Core；可用 `PLAYWRIGHT_CORE_PATH` 指定已安装模块位置、`STREET_URL` 指定预览地址，不修改仓库依赖。验证脚本使用专属临时浏览器上下文，截图置系统临时目录并自动清理，JSON仅输出至 stdout，需要日志时自行重定向 `/tmp/`。
