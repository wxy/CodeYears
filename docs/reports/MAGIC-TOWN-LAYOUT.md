# 魔法小镇正式布局与渲染直通验证

日期：2026-11-11。结果：**12 个场景通过正式 Town 规划、运行 PNG 加载、实际 Canvas 绘制和释放路径**。本报告不覆盖面板类型切换、真实登录身份矩阵或硬件性能预算；不将本机直通验证当作全部 MV3 验收。

## 实际调用与输入

页面实际导入 `planTownScene`、`createTownGround`、`createCityView`、`loadTownImages` 和 `closeCityImages`，未使用原型绘图函数或隔离替身。正式 `town-layout.ts` 的相同输入会产生自己的 Town 模型，不复用旧现代 City 的地块或仅替换贴图。

真实输入为本轮匿名取得、按日期及 tooltip 校验的 2024–2026/11/10 数据，共 **1,045 天、7,718 次贡献、443 个活跃日**，来源及逐日 SHA-256 见 [原型记录](../design/ancient-town-concepts/2026-11-11/MAGIC-TOWN-PROTOTYPES.md)。本轮正式模型得到 **296 个正贡献地块、300 个主/附建筑体、30 处零日期公共设施**；与概念原型的 270 个地块不同，不能混用计数。

正式模型采用 **ISO 周年、逐日同强度档、最多八日且最长边四格的建筑容量**；原型采用公历年度，以及“严格相近矩形 → 均值档再合并”的两阶段规则。两者共用同一批每日数量，但年度组织和合并规则不同。本报告不称它们为同一地块算法，也不在验证阶段另改正式合并规则。

合成输入只用于负载和边界路径，不冒充真实贡献：

- `generateDays('sparse' | 'regular' | 'dense')` 提供相同种子的 2006–2025 公历二十年，共 7,305 日。原始日期覆盖 ISO 2005 与 2026 的不完整边界，因此规划为 22 个 ISO 年区；没有丢弃边缘真实输入。
- 一年样本从上述序列筛选 `isoWeekDate(day.date).year === 2024`，共 364 日，是一个完整 ISO 周年。
- 全零、常数 1、常数 50 使用 2024-01-01 起连续 56 日。常数 50 另以 2024-01-11 作为注册里程碑。
- 缺日样本从相同 56 日去掉零起序号 `3,9,13,22,41`，其余按剩余序号每四日设 0，其它设 7；2024-01-12 为里程碑。缺失日期不补零。
- 空输入保留 `[2024]` 年场地，验证逐年数据尚未到达时的真实绘图路径。

## 几何与数据检查

对所有 12 个场景，在浏览器内检查以下不变量；实际校验 **24,271 个输入日、6,660 个主/附建筑包络、17,028 段公共路径**：

1. 每个源日期在 `weekly.cells` 和 `weekly.parcels` 中恰好覆盖一次，成员索引、星期列、ISO 周行及年度归属与输入一致；逐地块合计与加权均值正确，全局贡献守恒。
2. 正贡献成员才生成建筑；同一地块成员的强度档位相同。矩形宽不越七列，长宽均不超过四格、面积不超过八日；未知日期不形成矩形孔洞。
3. 注册里程碑保持 1×1 且不参与相邻合并。里程碑样本和缺日样本均通过。
4. 实际主体与附属建筑的声明地面包络都在所属地块内，主附包络彼此不交叉。场景尺寸与已加载运行素材的 `nativeWidth/nativeDepth × factor` 一致。
5. 公共路径中心线不穿过正贡献地块内部；院内路径中心线不穿建筑声明包络。公共设施的源日期真实存在且计数为 0，设施不持有贡献建筑的成员索引。

建筑组中多个实体可以引用同一个地块成员列表，供悬停解释；贡献唯一性按规划地块而非实体图片提交次数统计。声明包络检查不等于完整 Alpha 屋檐或隐藏三维几何验收。

## 实际运行结果

所有样本均实际加载所需正式 `public/assets/town-runtime/` PNG，调用 `createCityView(scene, images, 0, createTownGround(plan))`，以 `progress=1` 绘制，再以相同取景重复调用一次，最后销毁 view 和 images。运行资源总目录共 45 张 PNG，实际最大长边 372px，未超过 384px。

| 场景 | 日数 | 贡献总数 | 正贡献地块 | 主/附实体 | 公共路径段 | 公共设施 | 实际加载 PNG |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 真实三年公开输入 | 1,045 | 7,718 | 296 | 300 | 844 | 30 | 37 |
| 一 ISO 年 sparse | 364 | 179 | 19 | 19 | 112 | 12 | 13 |
| 二十公历年 sparse | 7,305 | 3,471 | 351 | 351 | 1,986 | 220 | 17 |
| 一 ISO 年 regular | 364 | 4,487 | 199 | 199 | 522 | 13 | 28 |
| 二十公历年 regular | 7,305 | 93,171 | 3,800 | 3,823 | 10,115 | 262 | 37 |
| 一 ISO 年 dense | 364 | 47,676 | 52 | 91 | 156 | 0 | 5 |
| 二十公历年 dense | 7,305 | 913,530 | 1,048 | 1,828 | 3,160 | 0 | 8 |
| 全零 | 56 | 0 | 0 | 0 | 0 | 0 | 1 |
| 常数 1 | 56 | 56 | 8 | 14 | 24 | 0 | 5 |
| 常数 50 与里程碑 | 56 | 2,800 | 11 | 16 | 44 | 0 | 6 |
| 含缺失日期与里程碑 | 51 | 266 | 19 | 19 | 65 | 2 | 15 |
| 空输入预留一年 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

每个样本的 Canvas 都完成实际绘制，尺寸和非透明像素检查通过；主画布存在实际 `drawImage` 提交。相同状态的第二次 `draw` 新增提交为 **0**。本页直接调用绘图接口的 `requestAnimationFrame` 调度为 **0**，未产生自续绘制循环；这不衡量浏览器合成线程或整个扩展功耗。

每次 `dispose()` 后主画布已从 DOM 移除且宽高归零，加载的所有素材画布也归零。这里只验证已持有资源的生命周期，不宣称浏览器总驻留内存已经实测下降。

## 复现环境与命令

环境为本机 Chrome 157.0.8103.39 headless、Node v26.7.0、Vite 8.3.5、Python 3.14.6。未再次安装依赖，也未修改产品源码或补写单元测试。

在系统临时目录建立模块入口，导出以下实际模块：

```ts
export { planTownScene, createTownGround } from '/Volumes/MacSSD/develop/CodeYears/src/renderers/town-layout.ts';
export { createCityView } from '/Volumes/MacSSD/develop/CodeYears/src/renderers/city-view.ts';
export { loadTownImages } from '/Volumes/MacSSD/develop/CodeYears/src/renderers/town-assets.ts';
export { closeCityImages } from '/Volumes/MacSSD/develop/CodeYears/src/renderers/city-assets.ts';
export { generateDays } from '/Volumes/MacSSD/develop/CodeYears/src/renderers/probe/data.ts';
export { isoWeekDate } from '/Volumes/MacSSD/develop/CodeYears/src/data/iso-week.ts';
```

从仓库执行 Vite 的独立临时打包，不改变正式构建脚本：

```js
await build({
  configFile: false, publicDir: false, root: taskTemp,
  build: {
    outDir: taskTemp + '/runtime-bundle', emptyOutDir: true, target: 'es2022',
    lib: { entry: temporaryEntry, name: 'TownRuntimeProbe', formats: ['es'], fileName: () => 'town-runtime.js' },
  },
});
```

临时 HTTP 服务仅监听 `127.0.0.1`，提供这份 bundle、已校验真实输入及正式运行 PNG。加载器 base 使用绝对本机 URL。浏览器页面依次运行上表样本，完成后向本机服务提交汇总，进程收到完成信号后终止。

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --no-first-run --no-default-browser-check \
  --disable-background-networking --disable-sync --hide-scrollbars \
  --force-device-scale-factor=1 \
  --user-data-dir="$TASK_TMP/runtime-layout-browser-profile" \
  "http://127.0.0.1:$TASK_PORT/"
```

验证页首次误将相对 URL 作为加载器的 `base`，已修正；随后发现 `--dump-dom` 与虚拟时钟会在 `createImageBitmap` 异步链完成前退出，因此改为实际完成信号等待。两项均为临时验证器问题，未将它们算作产品缺陷或通过重跑掩盖失败。

本次独立 bundle SHA-256 为 `28ff8923703eea0c565c49ae363d1aef39b404b3dbc3a870e245475a1ffd0c26`。测试结束核对 `town-layout.ts`、`town-assets.ts`、`city-view.ts` 与运行 catalog 的内容未在验证期间改变。

## 用户可视化与留存

实际正式渲染器导出的真实地图为本机 `integrated-town-2026-11-11/real-public-town.png`，3000×1800 RGBA；已完整解码并实际查看。它是用户请求的最终数据可视化，未加入 Git。SHA-256：`a058475042a4eac8622e48be1bf511f4058757a54472bbc284a643d7f8fe2adc`。

本项验证的临时入口、bundle、浏览器配置、过程日志和汇总 JSON 在报告完成后清理。真实输入仍暂留给同一主线的 UI 代理使用，由主代理在本轮验收结束后统一清理；不进入 Git。长期只保留报告、正式产品素材与源码，以及用户本机最终图片。

## 未覆盖范围

本项没有验证 UI 类型选择、跨类型切换与复用、真实登录 GitHub/MV3、Edge、20 年硬件帧耗时、显存、内存或功耗预算。三种密度都实际画出了二十年场景，但数量守恒、静止不重画和资源释放不代表这些性能预算通过。
