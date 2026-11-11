# 人体尺度校准素材提示词

日期：2026-11-11。全部使用内置 `image_gen`，`transparent_background:true`。原建筑/生活图集只作项目风格参考；没有向图像工具提供贡献数据。原图保留，新增文件使用独立版本名。stable v1 经实际同场景查看后发现净门过窄，v2 只针对门口重画；预览使用 v2。

参考输入：单体畜舍v1使用旧多格建筑图集与生活图集；圆形工坊使用magic-town-v1.png；行会/学院使用magic-town-v2.png；畜舍v2编辑本轮stable-human-scale-v1.png。

## stable-human-scale-v1.png

```text
Use case: production fantasy-town sprite. Make ONE standalone compact medieval Western European stable, matching the warm hand-painted stone-and-timber style of image 1 (architecture reference). Image 2 is the adult-character style reference, NOT a sheet to reproduce.
Critical scale: a single storey stable with a clearly visible normal human side door beside an open horse bay. Ordinary door clear height is 2.1m, clear width 0.9m; adult full standing height 1.7m. This is a modest stable, overall walls about 2.6m high, roof ridge about 4m; the standard side door occupies about HALF the total building image height before ground depth. Small rectangular windows approximately 1.0m high at adult chest level. A half visible horse in the stall, hay and a trough, warm lantern, discreet protective rune. The door is adult-sized, not a gigantic gate. Do not draw people: the app will place the same calibrated adult characters at the doorway later.
Architecture: ONE continuous small timber-framed stone-footed stable with red-brown tiled roof, one normal human door and one open horse bay; no additional detached cottages, no whole farm, no large background or courtyard, no perimeter fence (the app adds individual courtyard walls).
Projection: orthographic 2:1 isometric map view. Horizontal ground/foundation/eave edges in the two orthogonal directions have screen dy/dx +0.5 and -0.5. All vertical posts and door jambs vertical. Clearly show two facades, an unoccluded continuous rectangular stone foundation and straight horizontal door threshold so the camera can be measured. Door sill, window sill and eaves agree with those axes; avoid low frontal camera.
Composition: one isolated sprite, tightly grouped in a square canvas with 10% transparent margins; entire roof, foundation and trough visible. Genuine transparent alpha background, no painted backdrop, no checkerboard, no text, no chart, no ruler, no giant shadow. Preserve the architectural palette and detail language of reference 1; make its real-size door and windows unambiguous.
```

## mage-workshop-human-scale-v1.png

```text
Create ONE standalone round mage workshop sprite for a Western European magical medieval town. Reference image: its TOP MIDDLE small round purple-roof mage workshop is the architecture/style reference. Preserve warm stone, oak timbers, purple conical shingles, small golden rune ornament, lanterns, flowers, cozy hand-painted strategy-game detail.
Redesign for consistent human scale: circular single-storey wall diameter about 4m, wall height 2.8m, conical roof ridge about 4.4m. Clearly visible ordinary arched wooden entrance door with 2.1m CLEAR opening height and 0.9m clear width. Next to it, ONE open working window: clear opening height about 1.0m, sill about 0.9m above floor, width about 1.3m, a few potion bottles at counter edge. Window interior dark/empty, with clear unobstructed corners, straight sill and wood frame, so a calibrated adult can be composited inside afterward.
No people or animals in the image. Characters will be added at a shared real-size scale by the renderer. Door/window proportions must be believable for an adult 1.7m high; no tiny dollhouse door, no oversized worker head.
Camera: elevated orthographic 2:1 isometric, ground axes screen slopes +0.5 and -0.5. Show two wall directions and a small rectangular stone entrance stoop whose straight edges share those map axes. Upright vertical door jambs. Horizontal round foundation projects as a 2:1 ellipse, not a thin low-angle oval. No perspective vanishing point.
ONE building only, compact circular foundation, no surrounding fenced plot or huge paved tile: renderer adds a private courtyard separately. Entire roof/steps inside 10 percent clear margins. Genuine transparent alpha background, no backdrop/checkerboard/text/rulers/guide lines, no giant shadow. Match the supplied established magical-town art, not photorealism.
```

## guild-human-scale-v1.png

```text
Create ONE isolated sprite of a western medieval magical guildhall, following the supplied reference atlas's CENTER MIDDLE U-shaped blue-roof guild, preserving its attached side wings, open forecourt, warm stone and oak, blue shingles, gold rune details, flowers and lanterns.
This is a human-scale building, not a miniature inhabited by tiny people. Redesign the central facade to have an UNAMBIGUOUS real wooden arched entrance door reaching the courtyard ground: 2.1m clear height, 1.0m clear width. It must not look like a symbol panel or a window. Two smaller matching doorways on side wings may share that normal 2.1m height. Ordinary window clear heights around 1m with sills0.9m above floor; decorative rune medallions are separate above doors. Single-storey wall/eave height around3m, roof ridge4.7m. Attached wings bound a modest working forecourt; no detached buildings. Wider buildings get more floor area, not giant door openings.
No people anywhere in this sprite: the renderer will add calibrated 1.7m adult residents at the entrances and forecourt. No tiny baked-in figures, no chairs/lectern that conceal the central entrance, no fountain obscuring the doors.
Orthographic elevated 2:1 isometric map camera. All horizontal foundation/eave/threshold directions align with screen slopes +0.5 and -0.5; vertical columns strictly vertical. Show a clear rectangular paved footprint, enough uncluttered foundation edges and the doorway sills for measurement. Keep courtyard small, avoid huge empty front tile. No perimeter walls in sprite; renderer will build a separate private courtyard around this building.
Transparent alpha background, entire building visible with10% margin, no landscape/backdrop/checkerboard/text/guides/rulers. Warm hand-painted strategy-game artwork matching the supplied town, restrained magic, no photorealistic restyling. ONE U-shaped guildhall only.
```

## academy-human-scale-v1.png

```text
Create ONE isolated wide magical academy sprite for a western European medieval fantasy town, using the reference atlas's CENTER RIGHT broad blue-and-purple roof academy as the architecture/style reference. Preserve its warm stone/oak, gold trim, blue main roof and purple side roofs, arcane detailing, flowers, attached long wings and open central courtyard.
Human scale is the priority: a broad SINGLE-STOREY school with more rooms and floor area, not giant architectural details. Show at least three CLEAR HUMAN ENTRANCE DOORS reaching the courtyard floor, each ordinary clear height2.1m and width0.9m; one central main door may be2.3m high but not a small rune panel pretending to be a door. Identical side-room doors are the same2.1m height despite their positions. Ordinary windows clear height~1m and sill~0.9m; top decorative rune windows may be separately marked by shape. Eaves~3m, roofs~4.5m. Wide footprint around12m by6m, shallow U wings around a usable forecourt, width clearly greater than depth.
No people, no tiny baked-in students: renderer will add the same1.7m adult figures in every building. No central fountain/table blocking the doorways. Empty central courtyard with a few planted edges, no perimeter wall (renderer gives each building its own courtyard boundary).
Projection elevated ORTHOGRAPHIC 2:1 ISOMETRIC. Ground/foundation/eave/door-sill direction families screen dy/dx +0.5 and -0.5; every vertical post vertical; no vanishing point or low frontal camera. Show straight visible foundation edges and enough thresholds to measure scale and camera. No warped differently-scaled wings.
Genuine transparent alpha background, entire ONE connected academy and foundation inside 10% transparent margins, no landscape/backdrop/checkerboard/text/guides/rulers or giant shadow. Warm hand-painted strategy-game sprite matching the established artwork.
```

## stable-human-scale-v2.png

```text
Edit this exact single stable sprite. Preserve its canvas, architecture footprint, red roof, one horse stall, colors, stone foundation, camera direction, and especially the vertical positions/height of the human door.
Critical correction ONLY to human doorway proportions: the existing human door leaf clear opening is far too narrow. WIDEN the arched ordinary entrance and its wooden leaf to approximately 2.3 TIMES the existing clear width, while keeping its clear opening TOP AND BOTTOM AT THE SAME HEIGHT (about source y719..930). The new clear door leaf should be about190..200 source pixels wide rather than83. This is a deliberately wide human passage, around0.9:1 screen width-to-height, not a tiny narrow slit. Move the lantern/door surround slightly outward as needed. Keep the adjacent small window if space permits, otherwise make it a compact ventilation window; do not shrink the new door to preserve that window.
No people added. The renderer places an adult with the same1.7m scale across all buildings, so the adult shoulders must visibly fit through this opening after map projection. The doorway's stone surround must be coherent and not overlap structural corner posts.
Retain all other stable identity and perspective details as closely as possible: normal vertical jambs, the existing foundation and roof dimensions, the horse bay, trough and rune. Same square canvas, entire object visible, genuine transparent alpha background. No new courtyard, fences, backdrop, text, rulers or guides. One isolated building.
```

