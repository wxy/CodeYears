# 西式奇幻与自适应合并 · 提示词

使用内置 `image_gen.imagegen`。实际图片输入依次为 Agent Control Plane 的城镇全景、工坊、行会，均为用户指定参考项目的原图，路径与校验值见 `REFERENCE-ACP.md`。本次全面调整构图与建筑形态，输出新文件，参考源文件与此前概念图保留。

## 08 · 西式奇幻的可变占地聚落

```text
Use case: style-transfer / concept-layout redesign.
Redesign the supplied Agent Control Plane medieval-town artwork into ONE new CodeYears architectural concept board about ADAPTIVE MERGING. The source images are our own project's visual references: image 1 the rich magical town scene, image 2 the warm terracotta-roof workshop, image 3 the slate-blue guild cutaway. Preserve the original reference's richly detailed crisp pixel-art rendering, dark timber, warm lanterns, mossy stone, flowers and blue-green trees. Completely replace its composition with the new concept below. Do not preserve any agent UI, people, role portraits, nameplates or conversation panels.

MOST IMPORTANT STYLE: unmistakably WESTERN EUROPEAN FANTASY. Steep straight-edged gabled roofs, asymmetric intersecting gables, exposed medieval European half-timber frames, stone chimneys, irregular warm stone foundations, iron-hinged doors, leaded/stained-glass windows, small dormers, guild heraldry, arcane workbenches and restrained magical gems. Cozy original fantasy hamlets and artisan guilds. No East Asian palace or courtyard typology, no pagoda roofs, no upturned eaves, no Chinese/Japanese tile ridges, no symmetrical siheyuan, no repeated U-shaped courtyard template for every building. Use Western farmsteads, irregular half-timber hamlets, L/T-shaped craft halls, and stone-and-timber guild lodges with steep gables. All primary buildings keep a comparable LOW eave-height baseline, one storey with usable roof space, same human doorway scale. No tower, keep, spire or taller high-contribution building. Prosperity must be read through plan form, materials, craftsmanship and equipment, never height.

Wide landscape architectural study board, warm ivory margin, refined readable Simplified Chinese typography, consistent parallel isometric camera and daylight with warm lantern accents. Illustration dominates; sparse unobtrusive labels. Main title exactly: 相近贡献，自然长成不同村落
Subtitle exactly: 西式奇幻 × 自适应合并

CORE MODEL: Region boundaries are formed where NEIGHBORING CONTRIBUTION VALUES ARE SIMILAR. There are NO fixed 4-week regions and NO 13-week regions, NO equal-width strip, NO identical-footprint matrix. Areas and shapes vary. A larger area means a longer/wider adjacent run of similar contributions; average contribution means prosperity. Small area can be rich; big area can be ordinary. A large region may have just two or three coherent buildings forming a little hamlet; a small region may have one tiny precise workshop. Do not add one cottage per calendar day.

UPPER TWO-THIRDS: Show ONE continuous grass-and-stone-path landscape with FIVE clearly identifiable SELECTED modular regions of DIFFERENT footprint dimensions, joined by a globally shared winding lane and very faint irregularly sized rectangular parcel corner markers. These are selected building-form examples, not a full calendar layout. Do NOT pretend they are consecutive dates. No individual floating terrain slabs or scenic tiles. All ground and path are common. Put a compact ordinary hamlet on the largest plot, a smaller timber craft farmstead on the medium plot, two smaller prosperous workshops/guild units on matching narrower plots, and one VERY small ornate enchanter's atelier. Clearly contrast footprint sizes. Keep all roofs and buildings inside their plot; preserve setbacks and accessible entrances. Same doorway and eave scale everywhere; do not uniformly enlarge the houses of big plots.

FIVE REGION EXAMPLES, labels outside buildings with fine leader lines:
P01 · 8×7 · 均值 6.00 : largest near-square footprint, a modest Western timber hamlet of exactly three low thatched/terracotta gabled cottages, a simple barn or work-yard implied through attached timber wings, lots of common yard space, restrained material quality. Three cottages are an illustrative village unit, not fifty-six houses. No castle or lavish giant manor. Primary meaning: LARGE AREA / ORDINARY PROSPERITY.
P02 · 4×6 · 均值 5.17 : a distinctly smaller rectangular footprint, an ordinary connected L-shaped half-timber farm/workshop with steep simple gable and modest yard, close material quality to P01. Do not make it grander solely because it is a building rather than a village.
P03 · 3×7 · 均值 18.00 : narrower footprint, one coherent artisan hall with joined timber wings, better fitted terracotta roof, stone base, fine doors and work equipment. WESTERN L/T-shaped gabled plan, not a rectangular East Asian courtyard.
P04 · 3×7 · 均值 24.00 : SAME footprint dimensions as P03, one refined Western fantasy guild lodge, slate-blue steep intersecting gables, finished stone/half-timber walls, restrained gold heraldry, leaded windows, visible finely equipped craft/archive interior via a small cutaway. One low storey, not a tower. Architecture must be richer than P03 through material and equipment, not height or extra land.
P45 · 1×1 · 均值 210.00 : a TINY single-bay enchanter or jeweller atelier, the smallest ground footprint by far, only one human-scaled door and a fine leaded window, superb carved joinery, a few luminous gems, brass instruments and restrained gilding. No tall wizard tower. Primary meaning: SMALL AREA / VERY HIGH PROSPERITY. Make its small footprint obvious in the shared landscape, use a leader label so text remains readable.

LOWER THIRD: Three compact enlarged detail specimens, clearly labelled 局部放大 so the magnification does not suggest equal ground areas. Show details of P01's ordinary gabled timber cottage, P04's refined low guild lodge facade, and P45's small ornate magical workshop. Maintain the same material vocabulary as the corresponding buildings above. Below these three details, captions exactly: 大地块可以朴素 / 相同占地可以更繁荣 / 小地块也可以精致

Footer exactly: 面积看合并范围，均值看繁荣程度；相近容差待确认
Small second footer exactly: 精选形态示意；完整数据地块见自适应合并图

Do not show any 4-week or 13-week labels anywhere. No regular repeated strip parcels, no identical plot sizes, no ranking by building height, no giant doorways, no noisy crowds, no agent UI. Actual sample ID dimensions and averages above are precise, but architectural forms are visual design studies, not pixel-calibrated runtime assets. Crisp pixel-art detail and strong Western fantasy silhouettes are essential.
```
