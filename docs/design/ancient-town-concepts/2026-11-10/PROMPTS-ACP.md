# Agent Control Plane 视觉参考 · 提示词

使用内置 `image_gen.imagegen` 编辑现有扩大合并概念稿。每次实际传入四张本地图片：第一张为编辑目标，后三张为 Agent Control Plane 风格参考。来源、参考边界和原文件校验值见 `REFERENCE-ACP.md`。建筑单元数量、区域均值、合并口径保持不变。

## 06 · 同数据合并尺度对照

```text
Use case: style-transfer / precise-object-edit.
Asset type: CodeYears medieval town concept comparison, restyled to match OUR existing Agent Control Plane visual design using actual provided artwork.

INPUT IMAGES:
Image 1 is the EDIT TARGET: the current CodeYears comparison board showing thirteen small merged architectural units in A and four larger merged architectural units in B, with accurate labels.
Image 2 is a STYLE REFERENCE ONLY: Agent Control Plane compact workshop sprite, red terracotta roof, timber and mossy stone, warm lanterns, open cutaway craft interior.
Image 3 is a STYLE REFERENCE ONLY: Agent Control Plane compact guild sprite, slate-blue roof, timber and stone, golden lamps, blue-and-gold banners, books and archive desks, open cutaway interior.
Image 4 is a STYLE REFERENCE ONLY: Agent Control Plane riverside town composition. Use its richly detailed crisp pixel-art texture, cozy original medieval magical-town atmosphere, golden-green meadow, blue-green foliage, mossy rounded stones, warm illumination and precise isometric asset rendering.

EDIT ONLY the ART DIRECTION of Image 1. Preserve the entire comparison structure, text, numbers, regions and main architectural count. The target should unmistakably belong to the same visual family as the actual Agent Control Plane references, with carefully articulated visible pixel texture, stylized chunky roof tiles, rich dark structural timber, warm stone, small vines, flowers and cozy golden lanterns. Use the reference palette and asset design language rather than realistic architectural miniatures or pale classical villas. Clear ornamental detail with legible silhouettes. Warm ivory comparison-board background stays. Do not copy the reference's UI panel, role portraits, dialogue labels, characters or agent status overlays into this board.

INVARIANTS:
Keep the title EXACTLY: 扩大合并区域，用更少建筑表达平均贡献
Keep the subtitle EXACTLY: 同一输入：52 周 · 364 天 · 2,206 次贡献
Keep A label EXACTLY: A / 每 4 周合并 → 13 个建筑单元
Keep B label EXACTLY: B / 每 13 周合并 → 4 个建筑单元
Keep ALL original week ranges and maturity tags. A is exactly thirteen units, one per region, levels left to right L1,L1,L2,L3,L3,L1,L3,L3,L3,L3,L3,L4,L4. B is exactly four units. B labels are W01–13 平均0.93 L1; W14–26 平均4.92 L3; W27–39 平均5.54 L3; W40–52 平均12.85 L4. Retain accurate labels outside the buildings and unobstructed by foliage.
Keep both complete site footprints the SAME total size. Keep thirteen small connected building units above versus four larger-footprint connected building units below. Each region has ONE main building or ONE integrated compound with continuous wings. Never scatter detached cottages inside a region. Preserve the single continuous ground and shared stone pedestrian path along each site, with faint subdivision guides. No individual floating lawn islands, rectangular scenic puzzle tiles, separate rivers or rocky tile bases.

ARCHITECTURAL TRANSLATION TO AGENT CONTROL PLANE:
All architecture stays SINGLE STOREY. Contributions are encoded through PLAN FORM, crafting sophistication, material quality and interior equipment, never extra storeys or taller roofs. Keep the same human doorway scale and eave-height reference between all grades and between A and B. Larger merged footprints need more connected roof bays and a larger internal court, not an enlarged cottage with huge doorways.
L1: a cozy rough-timber cottage/longhouse with thatch, modest work yard, a few flower pots and a warm door lantern, inspired by the humble cottages in the town scene.
L2: a modest framed timber-and-stone longhouse with fitted terracotta roof tiles, more finished joinery, compact work area and a simple enclosed yard.
L3: ONE connected U-shaped workshop courtyard inspired directly by Image 2. Chunky red/orange terracotta roof, dark timber posts, irregular warm stone bases, visible craft benches, tools and small warm lamps. A front-facing cutaway/open arcade lets the craft function read clearly, similar to the reference sprite; roofed side wings remain connected to the back workshop. Do not turn three wings into three detached houses. Both B middle regions use similar workshop compounds, ONE each, regardless of their different raw activity-day distributions.
L4: ONE connected guild/archive courtyard inspired directly by Image 3. Distinct slate-blue roof planes, finished timber-and-stone joinery, continuous roofed galleries, visible archive shelves/work tables and restrained blue-and-gold guild details. SAME single-storey eave baseline as L3, no tower or taller headquarters. Replace the target's classical arcaded villa appearance with the compact cozy magical guild architectural language, adapted to the large connected footprint.

GROUND AND ENVIRONMENT:
Apply Agent Control Plane's mossy golden-green meadow texture, tiny wildflowers, rounded worn paving and restrained blue-green vegetation. A few small conifers and bushes may sit at the outer margins only. Keep building entrances accessible and parcel boundaries clear. Buildings rest naturally on ONE common ground surface. Warm lanterns add accents within consistent ambient daylight; no per-panel nighttime lighting or black backgrounds. No castle skyline or extra settlement houses.

Keep the existing footer ideas readable: 区域平均贡献 → 建筑形态 / 扩大合并占地 → 减少建筑单元 / 统一地面与道路，建筑独立落位 / 概念示意 · 合并尺寸与素材拼接尚待验证
The result is a visual-style correction of the existing board, NOT a new data mapping. Crisp pixel-art illustration, excellent text readability, no extra panels or labels, no decorative game UI, no modern structures, no photorealism, no character crowds.
```

## 07 · 建筑形态与连续地面

```text
Use case: style-transfer / precise-object-edit.
Asset type: CodeYears same-footprint architectural concept board, matching OUR existing Agent Control Plane art.

INPUT IMAGES:
Image 1 is the EDIT TARGET: the existing board of three equal-footprint building specimens and the same three assembled on one continuous ground below.
Image 2 is STYLE REFERENCE: actual Agent Control Plane compact workshop sprite, terracotta roof, timber/stone, craft bench, tools, vines and warm lanterns, open cutaway front.
Image 3 is STYLE REFERENCE: actual Agent Control Plane compact guild sprite, slate-blue roof, blue-and-gold accents, archive shelves and warm illuminated work tables, open cutaway front.
Image 4 is STYLE REFERENCE: actual Agent Control Plane medieval riverside-town composition, richly detailed original magical pixel art, mossy meadow, blue-green plants, rounded stones and warm lighting.

Restyle Image 1 into the unmistakable Agent Control Plane visual family. Make the small visible pixel texture, rich dark structural beams, stylized roof tiles, mossy warm masonry, climbing vines, flower pots and warm lanterns match the ACTUAL reference sprites. This should feel like expanded building assets for that same cozy original medieval magical town. Avoid realistic miniature models, flat vector art, smooth photorealistic materials or austere classical courtyards. Keep the warm ivory editorial board and its clear Chinese labels. Reference characters, agent lists, UI panels and signage carrying session names are not part of the target scene.

Preserve every text label, statistic and the two-row arrangement exactly. Title: 同样占地，用建筑形态表达平均贡献. Subtitle: 一个合并区域，对应一座建筑或一个整体院落. Top columns: W01–13 / 日均0.93 / L1 ; W14–26 / 日均4.92 / L3 ; W40–52 / 日均12.85 / L4. Keep the middle annotation about same footprint and height baseline, and the three bottom callouts for continuous ground, common path and independently placed buildings. Keep the footer's concept-only and asset-validation boundary.

EXACT OBJECT COUNT AND SIZE:
Three distinct integrated architectural units on the TOP row, with faint identical footprint guides. The SAME three units are repeated once on a single continuous meadow in the BOTTOM row: six depictions total, but only three unique architectural units. Keep all units single-storey with the SAME eave-height reference, same doorway/human scale and compatible isometric camera. Preserve the same rectangular footprint for all three grades. Contribution strength is PLAN FORM, construction quality and equipment, NEVER height. A connected compound is one body with joined wings and interior court, not a collection of detached cottages. Do not uniformly enlarge small assets so doors and roof tiles change human scale.

Translate the LEFT specimen into a humble cozy straw-roof timber longhouse with a simple work yard, rough timber joinery, a few flower pots and one modest lantern, in the same style as the humble town cottage. Leave generous internal yard area; its large merged footprint need not be filled with extra houses.
Translate the MIDDLE specimen into a connected U-shaped WORKSHOP COURTYARD directly derived from Image 2's red-roof workshop. Continuous roofed wings, dark beams on mossy stone bases, visible tool benches and crafting equipment, open front/cutaway or covered workspace like the reference. Rich but restrained warm lantern light. One connected architectural unit.
Translate the RIGHT specimen into a connected GUILD / ARCHIVE COURTYARD directly derived from Image 3's slate-blue-roof guild. Finished timber/stone, connected galleries around a court, visible bookshelves and tables, a few blue-and-gold details, warm lamps and vines. It remains one storey at the SAME height as the workshop. No tower, no church, no monumental Roman arcade, no enormous keep.

Bottom assembly: preserve ONE unbroken golden-green meadow, ONE globally continuous worn stone lane connecting the three entrances, and faint compatible parcel guides. Use Agent Control Plane's moss, little flowers, rounded stones and subtle blue-green plants. Keep the ground separate from the three building objects; no floating terrain slabs or individual scenic tile borders. The top specimens sit directly on ivory as asset studies, not on black backgrounds or their own landscape islands. The bottom has no extra houses, trees obscuring labels, characters or UI chrome. This illustrates art direction and asset placement only, not proof of seamless runtime composition.

Use crisp richly detailed isometric pixel art with the same warm-cool palette balance as the reference sprites. Retain original board composition and numeric meaning. No extra text, modern materials, fantasy creatures or duplicated structures.
```
