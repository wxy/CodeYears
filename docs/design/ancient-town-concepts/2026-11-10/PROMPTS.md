# 生成提示词

使用内置 `image_gen.imagegen`，不使用独立 API 或 CLI。两张图片均为原创美术概念，非产品运行截图；精确的同数据评估见 `DATA.md` 与 `03-data-comparison.png`。没有复用第三方美术素材。

## 01 · 同数据的片区尺度总览

```text
Use case: stylized-concept / infographic-diagram.
Asset type: a refined architectural concept comparison board for CodeYears, a GitHub contribution visualization. Create an original, beautiful isometric low-rise medieval riverside town study, NOT a game UI screenshot. Wide landscape board, preferably about 3200 by 2200 pixels, with crisp, readable simplified Chinese editorial typography. Warm ivory paper background, restrained moss green, warm timber, rough limestone, slate and terracotta roofs, soft identical daylight, painstakingly crafted architectural model aesthetics, consistent high-angle axonometric camera. Buildings all one or two storeys, same world scale in every panel. No high towers, no skyscrapers, no giant castles, no fantasy characters. Material sophistication, complete courtyards, workshops, paved lanes and small civic structures express maturity, never building height.

Main title verbatim: 古代城镇 · 片区尺度对照
Subtitle verbatim: 同一合成样本：52 周 · 2,206 次贡献 · 210 个活跃日

Two generously spaced HORIZONTAL long isometric town bands stacked vertically, both occupy the SAME horizontal timeline extent W01 through W52, SAME camera, SAME scale, SAME terrain shape and SAME river course. The year proceeds left to right. Do not give the bottom town more land or taller buildings. Maintain the same broad physical footprint and same underlying activity distribution in both rows. No oversized blank plots artificially inflating either town. Thin understated boundary ticks outside the architecture distinguish evaluation regions; NO fortress walls at every boundary.

Top band label: A / 每 4 周评估 · 13 个片区
Subdivide by week ranges 01-04, 05-08, 09-12, 13-16, 17-20, 21-24, 25-28, 29-32, 33-36, 37-40, 41-44, 45-48, 49-52. The architectural maturity levels of these 13 windows are exactly L1,L1,L2,L3,L3,L1,L3,L3,L3,L3,L3,L4,L4. Give each window a coherent building family. L1 simple timber/thatch low cottages; L2 more complete timber-and-stone cottages with enclosed yards; L3 good stone/timber houses with tiled roofs, small workshops and paved paths; L4 refined masonry, complete paved courtyards, guild/workshop and market architecture, ALL still one or two storeys.

Bottom band label: B / 每 13 周评估 · 4 个片区
Four contiguous equally long zones W01-13, W14-26, W27-39, W40-52. Label these four zones unobtrusively. Maturity levels exactly L1,L3,L3,L4. Larger areas have consistent material families, but maintain the localized activity gaps within them.

Both bands share the same activity pattern, based on EXACTLY the same synthetic input: weeks 1-13 have scattered low-intensity activity with 33 active days out of 91 and 85 contributions; weeks 14-26 have sharp isolated bursts separated by open meadow, ONLY 7 active days out of 91 yet 448 contributions, so refined L3 buildings should be VERY sparse, like a few high-quality stone compounds amid substantial grass; weeks 27-39 have steady nearly daily activity, 89 active days out of 91 and 504 contributions, so L3 buildings form a continuous compact low-rise town with linked street fronts and small courtyards; weeks 40-52 show rising intensity, 81 active days out of 91 and 1169 contributions, so a dense settlement gradually becomes more sophisticated in the 4-week band while having a unified L4 family in the 13-week band. The two middle zones deliberately have nearly the SAME maturity but a very DIFFERENT density. This must be strikingly clear.

Use small detached houses at the quiet left, few isolated refined stone compounds with deep open gaps in the second quarter, a compact lively low-rise village in the third quarter, and a mature low-rise town on the right. Do not populate every active date literally: individual house count in this art is illustrative, not a quantitative chart. Architectural silhouettes, roof texture and ground spacing must remain legible. The two rows should make material changes at shorter boundaries versus longer boundaries easy to compare.

Bottom three brief captions, exactly:
材质与设施 → 成熟度
间距与连续街面 → 疏密
美术概念示意；精确分组与数值见数据对照图
Keep text sparse, correctly spelled and elegantly aligned. No other invented metrics, no real usernames, no legends implying physical density is the exact active-day percentage, no medieval parchment border, no UI buttons, no dark vignette. Leave breathing room between labels and architecture.
```

## 02 · 成熟度与疏密的独立表达

```text
Use case: stylized-concept / architectural study.
Asset type: a second refined concept board for the SAME CodeYears medieval town design. Original low-rise isometric architectural miniature dioramas on warm ivory paper, meticulously crafted material detail, understated moss-green grass, pale limestone, timber, terracotta and slate roofs, soft daylight, consistent high-angle axonometric camera and scale. Wide landscape board approximately 3000 by 2200 pixels, clear simplified Chinese editorial typography, large breathing margins.

Title verbatim: 建筑成熟度 × 聚落疏密
Subtitle verbatim: 先看建筑怎样建成，再看建筑怎样聚集

Create a clean 2 ROW by 3 COLUMN MATRIX of six equal-sized square grass land plots, with IDENTICAL footprint, identical camera and identical world size for houses. Column headers, left to right: 初步聚落 / 稳定村落 / 繁荣城镇. Row labels: 疏 / 密. There must be EXACTLY six plots, not an extra comparison row.

In each TOP ROW plot, place exactly THREE main low-rise buildings, with wide grass gaps, generous yards and a narrow connecting path. In each BOTTOM ROW plot, place exactly NINE main low-rise buildings, same individual size as the row above, arranged as compact low-rise street fronts with smaller shared courtyards and a clearly connected path. Plot land area is the SAME in all six panels. Do not inflate building size, building height or plot size to show density. The main building count is controlled here purely to isolate the visual language, not to represent the synthetic 52-week data.

Column 1 architecture in BOTH rows: simple one-to-two-storey timber and rough wattle cottages, some straw roofs, earth paths, modest unenclosed yards. Column 2 in BOTH rows: same height and same footprint, better timber framing with stone bases, tiled roofs, more complete fenced/walled yards and small workshops. Column 3 in BOTH rows: same height and same footprint, refined limestone/timber houses, well-fitted slate or terracotta roofs, complete courtyards, neatly paved paths and guild/workshop details. Each column retains the SAME material quality between sparse and dense examples. A sparse refined stone hamlet must look clearly advanced despite low density; a dense cluster of thatch cottages must look clearly basic despite high density. No towers, no great castles, no spires, no skyscrapers.

Below the matrix, two visually identical-size enlarged BUILDING DETAIL specimens, one basic and one refined, with a small caption: 同样高度，比较建材、屋顶、院落和设施的完成度. These are close-up material details, not extra land plots. If the board would become crowded, omit the extra specimens and retain the caption.

Footer verbatim: 视觉语法示意 · 房屋数量仅用于控制疏密对照 · 非贡献数据映射结果
The primary task is visual comparison, not explanatory paragraphs. Crisp restrained typography, no decorative parchment border, no UI buttons, no fantasy characters, no unnecessary labels, no night lighting, no dark vignette. Sophisticated architectural art direction, never toy-like or over-saturated.
```

## 03 · 总览定向修订

首轮总览在长片区内仍保留了短片区的部分材质变化。以下修订用于将 B 行材质统一到其 L1/L3/L3/L4 评级。正式交付采用修订图；生成器原始文件按默认规则保留。

```text
Use case: precise-object-edit. Edit the attached CodeYears concept comparison board with one targeted correction: make the BOTTOM B / 每13周评估 row actually apply the FOUR long-window architectural maturity levels, whereas the TOP A row retains its existing short-window variations.

Preserve the title, subtitle, all Chinese text and numbers exactly, the top A band entirely unchanged, the four B labels exactly as they are, the full canvas composition, camera, terrain, river, bridge, architectural positions, building scale, building heights, plot extent, density and gaps. Keep ALL houses low-rise. Do NOT add houses or change density. Change ONLY the materials, roof types, yard enclosure finish and architectural detail quality of selected existing houses in the BOTTOM band.

The existing bottom row repeats some top-row short-window materials; replace those local variations with these long-window shared material families:
1. B's FIRST quarter labeled W01–13 / L1 (the leftmost quarter, from left edge to the first vertical B division near 26% width): EVERY building in this entire zone should read as a basic rustic timber/wattle cottage with straw/thatch roof, modest earth paths, simple rough wooden fencing rather than refined stone courtyards. Specifically downgrade the grey-roof stone-walled compound immediately left of the arched bridge, as well as the taller terracotta-roof timber house behind it, into thatch/rough timber at the SAME positions, approximate envelope and height. No high-quality grey tile or elaborate masonry in this L1 quarter. The reference TOP still keeps its L2/L3 transitions there.
2. B's SECOND quarter labeled W14–26 / L3 (about 26% through 50% width): all the VERY SPARSE existing buildings should be well-finished stone/timber with proper fitted tiled roofs and complete stone courtyards. Upgrade the tiny isolated THATCHED cottage near the river just left of center (roughly x43% width in the bottom town) into a refined pale-stone cottage with a dark slate roof and neat little stone yard, SAME position and footprint. Preserve the large meadow gaps and very low density. This L3 quarter must remain sparse, visually emphasizing that good architecture can be isolated.
3. B's THIRD quarter labeled W27–39 / L3 (about50% to75%): preserve the compact stone/timber low-rise town and its linked street fronts. It should share the same architectural quality as the sparse L3 quarter to its left.
4. B's FOURTH quarter W40–52 / L4 (about75% to100%): all its existing buildings should share well-finished masonry, carefully fitted slate/terracotta roofs, paved yards and restrained guild/workshop details. The buildings at the LEFT EDGE of this fourth quarter must already look L4. Keep exact heights and silhouettes and do not introduce taller towers.

Result should make the distinction unmistakable: the top row changes architectural material quality in 4-week pieces; the bottom row has four consistent material families L1,L3,L3,L4, with original local density retained. Use the same sophisticated warm ivory architectural illustration rendering. No extra text or annotations, no new panels.
```
