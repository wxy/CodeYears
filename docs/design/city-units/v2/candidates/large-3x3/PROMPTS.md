# 3×3 H1 大型单位候选：完整提示与来源

生成日期：2026-10-31。全部使用内置 imagegen；每次调用生成一个单独建筑。没有使用 CLI/API fallback，也没有使用 Python 或其他后处理修改图片。最终 PNG 从工具产物逐字节复制。

## 输入与调用链

共同设计参考：`../../06-large-3x3-buildings.png`（初次调用为设计参考，不是编辑目标）；体育场使用左上款，铁路总站使用右上款。投影规范来源：`../../projection-guide.svg`，提示由模板的 W=(48,24)、D=(-48,24)、H=(0,-48) 约束整理。

工具原图目录：`/Users/xingyuwang/.codex/generated_images/01a19202-886b-7d61-879b-d74d0af6244a/`。原文件保留在该目录，未覆盖。

| 最终候选 | 初次工具产物 | 一次相机修正后工具产物 |
| --- | --- | --- |
| `stadium-a.png` | `exec-4b924538-d2df-4c7d-98e1-74f57fc08b10.png` | `exec-ebe6587e-458a-4de2-8aaa-f65d3c812189.png` |
| `terminal-b.png` | `exec-f295443b-4f29-4f93-bfae-a38c3561824a.png` | `exec-8acad2e9-d7a8-4273-b8fe-661a67275b90.png` |

初次两次调用的参数均为 `referenced_image_paths=[共同设计参考的本机绝对路径]`、`transparent_background=true`。定向修正时，`referenced_image_paths` 各指向本款初次工具产物，作为编辑目标；`transparent_background=true`。没有同时传 `num_last_images_to_include`。工具没有单独的尺寸参数；提示中的 1024×1024 并未被严格执行，实际文件为 1254×1254。

初次结果前沿两组方向不对称，且主体占幅偏大，因此各执行一次仅针对相机/投影/占幅的修正。最后仍未通过 ±0.5 投影验收，见本目录 README。此处提示是请求规格，不能当作工具执行结果。

## 体育场 A：初次完整提示

```text
Use case: stylized-concept
Asset type: a single final transparent PNG city-building game sprite for CodeYears, candidate 3×3 H1 A.
Input image: the supplied 06-large-3x3-buildings.png is a DESIGN AND MATERIAL REFERENCE ONLY. Use ONLY its upper-left stadium design. It is not an edit target. Do not reproduce the four-up board, labels, ivory background, thin grid or presentation base.
Primary request: create one exquisitely crafted, believable low-rise red-brick city stadium, with a warm red-brick outer perimeter, stone trim and tall entrance arches, restrained dark charcoal partial canopies over stands, and a clearly open green football pitch in the center. Green field remains visibly uncovered. Keep the overall same low, broad proportions as the referenced 3×3 H1 stadium, not a taller arena.
Exact camera and ground geometry: fixed ORTHOGRAPHIC 2:1 DIMETRIC game camera, no perspective convergence, no camera roll. ALL ground rectangles must project to the SAME parallelogram. Ground W axis travels toward lower-right with vector (+2,+1), slope +0.5; ground D axis travels toward lower-left with vector (-2,+1), slope -0.5. Vertical architectural edges are exactly vertical in the image. Ground edges are approximately ±26.565 degrees from horizontal. Do not use 30-degree isometric axes. Do not rotate the building independently from the map.
Composition and shared scale: square 1024×1024 transparent canvas. Imagine an invisible 3×3 ground footprint whose rear, right, front and left corners are approximately O=(512,360), W=(896,552), W+D=(512,744), D=(128,552). Make the stadium's low perimeter follow this square-on-the-ground diamond with straight architectural ground edges parallel to those four directions. Entire architectural silhouette, planted accents and contact shadow stay within x=100..924 and y=190..790, leaving generous transparent margins. Use this footprint scale, NOT a crop that enlarges the object to fill the canvas. The second paired asset uses this same footprint and camera. H1 means broad one-storey perimeter mass, low stands and a few slender stadium lights only; do not inflate height.
Style and materials: premium detailed city-building game miniature, crisp believable brick and stone detail, rich but restrained color, realistic crafted geometry, readable at small scale; attractive rather than toy plastic. Exterior brick, entrance arches, restrained planting immediately by entrances; football markings only, no typography.
Lighting: one consistent soft upper-left key light; warm bright upper-left-facing surfaces and darker right-facing surfaces. Only a compact soft contact shadow close to the building, no broad cast shadow or background glow.
Background and output: actual transparent alpha everywhere outside the sprite, not a checkerboard painted into the image. Preserve the full silhouette and direct ground contact.
Avoid: any display background, square plinth, raised tile base, terrain block, outline footprint, grid, arrows, labels, numbers, text, captions, logos, watermark, surrounding street scene, detached objects, white roof cap, white cover over the field, complete enclosed roof, trains, clipped corners, perspective camera, skewed verticals, ground slopes other than +0.5/-0.5. ONE building, no design sheet.
```

## 铁路总站 B：初次完整提示

```text
Use case: stylized-concept
Asset type: a single final transparent PNG city-building game sprite for CodeYears, candidate 3×3 H1 B.
Input image: the supplied 06-large-3x3-buildings.png is a DESIGN AND MATERIAL REFERENCE ONLY. Use ONLY its upper-right railway terminal design. It is not an edit target. Do not reproduce the four-up board, labels, ivory background, thin grid or presentation base.
Primary request: create one exquisitely crafted, believable low-rise grand railway terminal, with a pale warm-stone front facade, elegant arched entrances and a central modest clock, and EXACTLY THREE attached copper-gray / bronze-framed glass barrel-vault roofs extending back in parallel. The three glazed roofs must read as three complete adjacent train halls, with subtle warm interior detail. All platforms and all railway tracks remain entirely INSIDE the 3×3 building footprint; no tracks or platforms protrude, no trains anywhere. Keep overall same broad low proportions as referenced 3×3 H1 terminal, not a multi-storey tower.
Exact camera and ground geometry: fixed ORTHOGRAPHIC 2:1 DIMETRIC game camera, no perspective convergence, no camera roll. ALL ground rectangles must project to the SAME parallelogram. Ground W axis travels toward lower-right with vector (+2,+1), slope +0.5; ground D axis travels toward lower-left with vector (-2,+1), slope -0.5. Vertical architectural edges are exactly vertical in the image. Ground edges are approximately ±26.565 degrees from horizontal. Do not use 30-degree isometric axes. Do not rotate the building independently from the map.
Composition and shared scale: square 1024×1024 transparent canvas. Imagine an invisible 3×3 ground footprint whose rear, right, front and left corners are approximately O=(512,360), W=(896,552), W+D=(512,744), D=(128,552). Make the terminal's ground perimeter follow this square-on-the-ground diamond with straight architectural ground edges parallel to those four directions. Entire architectural silhouette, planted accents and contact shadow stay within x=100..924 and y=190..790, leaving generous transparent margins. Use this footprint scale, NOT a crop that enlarges the object to fill the canvas. The paired stadium uses this same footprint and camera. H1 means a broad one-storey front concourse with low glazed train sheds; no tall towers or deep vertical building mass.
Style and materials: premium detailed city-building game miniature, crisp believable pale stonework and delicately segmented glass, subtly weathered copper-gray metal framing; rich but restrained color, realistic crafted geometry, readable at small scale; attractive rather than toy plastic. Small restrained entrance planters may remain immediately adjacent to facade.
Lighting: one consistent soft upper-left key light; warm bright upper-left-facing surfaces and darker right-facing surfaces. Only a compact soft contact shadow close to the building, no broad cast shadow or background glow.
Background and output: actual transparent alpha everywhere outside the sprite, not a checkerboard painted into the image. Preserve the full silhouette and direct ground contact.
Avoid: any display background, square plinth, raised tile base, terrain block, outline footprint, grid, arrows, labels, numbers, text, captions, logos, watermark, surrounding street scene, detached props, white roof cap, opaque white cover over the glass halls, trains, protruding platform or rail, clipped corners, perspective camera, skewed verticals, ground slopes other than +0.5/-0.5. ONE building, no design sheet.
```

## 体育场 A：一次定向修正完整提示

```text
Use case: precise-object-edit
Input image: supplied image is the edit target, preserve this exact building's subject, materials, roof design, fine architectural quality and low-rise character.
Primary edit: correct ONLY the CAMERA AND FOOTPRINT PROJECTION and the shared CANVAS SCALE. The current result has noticeably unequal left/right ground angles and must be re-rendered from a new orthographic camera. Keep its architecture but rotate the camera to exact 45-degree azimuth and the 2:1 dimetric game elevation. DO NOT merely add padding around the existing perspective.
Exact geometry: the 3×3 footprint is a SQUARE in world space, projected as a symmetric 2:1 diamond. The two front ground perimeter edges must have equal projected lengths and equal-and-opposite slopes, +0.5 and -0.5. The frontmost footprint vertex is directly below the rearmost footprint vertex on the central vertical axis. Leftmost and rightmost footprint vertices are at exactly the same y. W points lower-right (+2,+1), D points lower-left (-2,+1), and all verticals remain vertical. No perspective convergence, no camera roll, no 30-degree isometric axes.
Concrete layout proportional to the square canvas: rear ground corner at (50% width,36% height); right corner (86%,54%); front corner (50%,72%); left corner (14%,54%). These imaginary construction points are NOT visible. The building occupies this same footprint scale, with 12% clear transparent margin on both left and right. Do not enlarge until it fills the frame. Keep architectural height low, broad H1 massing, silhouette above ground as needed.
Retain: one single beautiful detailed finished city-game building, warm upper-left lighting, direct ground contact, restrained close entrance planting, minimal contact shadow. Genuine clean transparent alpha; no low-opacity haze specks outside the compact sprite.
Avoid: presentation background, checkerboard drawn into image, visible footprint or guide, grid, text, labels, logos, white cap, added plinth or raised tile, large cast shadow, clipping. Keep the FULL building within the canvas.
Building invariants: red-brick stadium with stone trims, charcoal PARTIAL canopy over stands, OPEN GREEN FOOTBALL PITCH visibly uncovered. Preserve football field, low perimeter and subtle stadium lights. The two visible outer stadium walls must now have equal projected ground lengths, following the symmetric square footprint. One stadium only.
```

## 铁路总站 B：一次定向修正完整提示

```text
Use case: precise-object-edit
Input image: supplied image is the edit target, preserve this exact building's subject, materials, roof design, fine architectural quality and low-rise character.
Primary edit: correct ONLY the CAMERA AND FOOTPRINT PROJECTION and the shared CANVAS SCALE. The current result has noticeably unequal left/right ground angles and must be re-rendered from a new orthographic camera. Keep its architecture but rotate the camera to exact 45-degree azimuth and the 2:1 dimetric game elevation. DO NOT merely add padding around the existing perspective.
Exact geometry: the 3×3 footprint is a SQUARE in world space, projected as a symmetric 2:1 diamond. The two front ground perimeter edges must have equal projected lengths and equal-and-opposite slopes, +0.5 and -0.5. The frontmost footprint vertex is directly below the rearmost footprint vertex on the central vertical axis. Leftmost and rightmost footprint vertices are at exactly the same y. W points lower-right (+2,+1), D points lower-left (-2,+1), and all verticals remain vertical. No perspective convergence, no camera roll, no 30-degree isometric axes.
Concrete layout proportional to the square canvas: rear ground corner at (50% width,36% height); right corner (86%,54%); front corner (50%,72%); left corner (14%,54%). These imaginary construction points are NOT visible. The building occupies this same footprint scale, with 12% clear transparent margin on both left and right. Do not enlarge until it fills the frame. Keep architectural height low, broad H1 massing, silhouette above ground as needed.
Retain: one single beautiful detailed finished city-game building, warm upper-left lighting, direct ground contact, restrained close entrance planting, minimal contact shadow. Genuine clean transparent alpha; no low-opacity haze specks outside the compact sprite.
Avoid: presentation background, checkerboard drawn into image, visible footprint or guide, grid, text, labels, logos, white cap, added plinth or raised tile, large cast shadow, clipping. Keep the FULL building within the canvas.
Building invariants: pale warm-stone railway terminal with elegant entrances and a modest central clock, EXACTLY THREE attached copper-gray glass barrel-vault sheds, no trains. All rails and platforms remain entirely within footprint. The whole terminal square footprint must now follow the symmetric diamond rather than the current elongated/unequal front and side axes. One terminal only.
```
