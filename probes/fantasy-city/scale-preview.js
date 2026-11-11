/* 固定世界尺度的设计预览；所有新 CitySprite 都以 factor=1 绘制。
 * doorPoint 是相对素材地面原点的世界坐标。
 * crownPoint / workWindow 点与 left/top 共用投影原点、投影世界单位。
 * 依赖 private-courtyards.js；不读取贡献数据，不改运行素材或扩展入口。
 */
window.renderTownScalePreview = async function renderTownScalePreview({ sprites, oldSprites }) {
  const pixels = 140;
  const background = '#eee8d2', ink = '#304d40', quiet = '#75816c';
  const project = (x, z) => [(x - z) * .5, (x + z) * .25];
  const canvas = (width, height) => {
    const result = document.createElement('canvas');
    result.width = Math.ceil(width);result.height = Math.ceil(height);
    const ctx = result.getContext('2d');
    ctx.fillStyle = background;ctx.fillRect(0, 0, result.width, result.height);
    ctx.imageSmoothingQuality = 'high';
    return result;
  };
  const text = (ctx, value, x, y, size = 20, color = ink, weight = 400) => {
    ctx.fillStyle = color;ctx.font = `${weight} ${size}px system-ui, sans-serif`;
    ctx.fillText(value, x, y);
  };
  const polygon = (ctx, points, fill) => {
    ctx.beginPath();
    points.forEach(([x, z], i) => {
      const [sx, sy] = project(x, z);
      if (i) ctx.lineTo(sx, sy);else ctx.moveTo(sx, sy);
    });
    ctx.closePath();ctx.fillStyle = fill;ctx.fill();
  };
  const rectangle = (ctx, x, z, w, d, fill) => polygon(ctx, [[x, z], [x + w, z], [x + w, z + d], [x, z + d]], fill);
  const path = (ctx, points, width = .27) => {
    ctx.beginPath();
    points.forEach(([x, z], i) => {
      const [sx, sy] = project(x, z);
      if (i) ctx.lineTo(sx, sy);else ctx.moveTo(sx, sy);
    });
    ctx.lineWidth = width;ctx.lineCap = 'round';ctx.lineJoin = 'round';
    ctx.strokeStyle = '#b6ae87';ctx.stroke();
  };
  const placed = (sprite, x, z, factor = 1) => ({ sprite, x, z, factor });
  const spriteRect = item => {
    const [x, y] = project(item.x, item.z), { sprite, factor } = item;
    return [x + sprite.left * factor, y + sprite.top * factor, sprite.width * factor, sprite.height * factor];
  };
  const drawSprite = (ctx, item) => ctx.drawImage(item.sprite.canvas, ...spriteRect(item));
  const courtyard = item => {
    const { sprite, x, z } = item;
    const door = [x + sprite.doorPoint[0], z + sprite.doorPoint[1]];
    const court = { x: x - .3, z: z - .2, w: sprite.nativeWidth + .6, d: sprite.nativeDepth + 1,
      gateX: Math.max(x + .2, Math.min(x + sprite.nativeWidth - .2, door[0])),
      material: ['cottages-1', 'stable-0'].includes(sprite.id) ? 'wood' : 'stone' };
    return { item, court, door };
  };
  const doorPerson = record => placed(sprites['life-0'], record.door[0] + .24, record.door[1] + .28);
  const bounds = (items, courts = [], extra = []) => {
    const points = [...extra.map(p => project(...p))];
    for (const item of items) {
      const [x, y, w, h] = spriteRect(item);
      points.push([x, y], [x + w, y + h]);
    }
    for (const court of courts) {
      for (const [x, z] of [[court.x, court.z], [court.x + court.w, court.z],
        [court.x, court.z + court.d], [court.x + court.w, court.z + court.d]]) {
        const [sx, sy] = project(x, z);points.push([sx, sy - .2], [sx, sy]);
      }
    }
    const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
    return { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) };
  };
  const sceneSize = box => ({ width: Math.ceil((box.right - box.left) * pixels + 72), height: Math.ceil((box.bottom - box.top) * pixels + 72) });
  const beginScene = (ctx, box, x, y) => {
    ctx.save();ctx.translate(x + 36 - box.left * pixels, y + 36 - box.top * pixels);ctx.scale(pixels, pixels);
  };
  const workResident = (ctx, item) => {
    const [sx, sy] = project(item.x, item.z);
    window.paintTownWorkResident(ctx, item.sprite, sprites['life-0'], sx, sy);
  };
  const paintCourtGround = (ctx, record, roadZ) => {
    const { court, door } = record;
    rectangle(ctx, court.x, court.z, court.w, court.d, '#a4ae83');
    const inside = court.z + court.d - .20;
    path(ctx, [door, [door[0], inside], [court.gateX, inside], [court.gateX, roadZ]]);
  };
  const paintRecords = (ctx, records, people, roadZ, decorations = [], crops = false) => {
    const minX = Math.min(...records.map(r => r.court.x)), maxX = Math.max(...records.map(r => r.court.x + r.court.w));
    path(ctx, [[minX - .35, roadZ], [maxX + .35, roadZ]], .36);
    for (const record of records) {
      paintCourtGround(ctx, record, roadZ);
      if (crops) {
        const { court, item } = record;
        for (let x = item.x + .1; x + .34 < item.x + item.sprite.nativeWidth; x += .6) {
          if (Math.abs(x + .17 - court.gateX) < .48) continue;
          const z = court.z + court.d - .48;
          rectangle(ctx, x, z, .34, .18, '#8c926d');
          for (let line = 0; line < 3; line++) rectangle(ctx, x + .045 + line * .095, z + .025, .022, .13, '#c8ca91');
        }
      }
      window.paintPrivateCourtyard(ctx, record.court, 'back');
    }
    const objects = [...records.map(r => r.item), ...people, ...decorations];
    objects.sort((a, b) => a.x + a.z - b.x - b.z);
    for (const item of objects) { drawSprite(ctx, item);workResident(ctx, item); }
    for (const record of records) window.paintPrivateCourtyard(ctx, record.court, 'front');
  };
  const legend = (ctx, x, y) => {
    text(ctx, '相同镜头倍率，门窗与人物用共同尺度', x, y, 21, ink, 600);
    const bottom = y + 91, heights = [.8, 1, .48, .32, .4];
    const labels = ['成人约 1.7m', '普通门约 2.1m', '工作窗参照约 1.0m', '矮墙约 0.7m', '立柱约 0.9m'];
    heights.forEach((height, i) => {
      const px = x + i * 225, py = bottom - height * .5 * pixels;
      ctx.strokeStyle = '#7f8c70';ctx.lineWidth = 1;
      ctx.beginPath();ctx.moveTo(px + 9, py);ctx.lineTo(px + 9, bottom);
      ctx.moveTo(px + 3, py);ctx.lineTo(px + 15, py);ctx.moveTo(px + 3, bottom);ctx.lineTo(px + 15, bottom);ctx.stroke();
      text(ctx, labels[i], px + 23, bottom + 25, 18);
    });
    const adult = sprites['life-0'];
    const footY = project(adult.nativeWidth / 2, adult.nativeDepth / 2)[1];
    ctx.drawImage(adult.canvas, x + 25 + adult.left * pixels, bottom + (adult.top - footY) * pixels, adult.width * pixels, adult.height * pixels);
  };

  const selected = ['cottages-1', 'forms-0', 'stable-0', 'magic-0', 'mage-0', 'magic-2', 'magic-3', 'guild-0', 'academy-0'];
  const cards = selected.map(id => {
    const item = placed(sprites[id], 0, 0), record = courtyard(item), people = [doorPerson(record)];
    if (id === 'guild-0' || id === 'academy-0') {
      const middle = item.sprite.nativeWidth * .5, openZ = item.sprite.nativeDepth * .7;
      people.push(placed(sprites['life-2'], middle - .35, openZ), placed(sprites['life-1'], middle + .35, openZ));
    }
    const roadZ = record.court.z + record.court.d + .32;
    const box = bounds([item, ...people], [record.court], [[record.court.x - .4, roadZ + .2], [record.court.x + record.court.w + .4, roadZ + .2]]);
    return { id, record, people, roadZ, box, ...sceneSize(box) };
  });
  const columns = [0, 1].map(column => Math.max(610, ...cards.filter((_, i) => i % 2 === column).map(card => card.width)));
  const rowHeights = Array.from({ length: Math.ceil(cards.length / 2) }, (_, row) => Math.max(...cards.slice(row * 2, row * 2 + 2).map(card => card.height + 104)));
  const gallery = canvas(columns[0] + columns[1] + 108, 310 + rowHeights.reduce((a, b) => a + b + 24, 0) + 62);
  const galleryCtx = gallery.getContext('2d');
  text(galleryCtx, '门窗、成人与独立庭院 · 统一尺度校准', 36, 55, 36, ink, 650);
  text(galleryCtx, '设计校准，非贡献数据；成人约 1.7m、普通门约 2.1m，建筑和人物共用同一尺度。', 36, 91, 22, quiet);
  legend(galleryCtx, 44, 132);
  let rowY = 310;
  cards.forEach((card, i) => {
    const column = i % 2, x = column ? 72 + columns[0] : 36, height = rowHeights[Math.floor(i / 2)];
    galleryCtx.fillStyle = '#dce0c6';galleryCtx.fillRect(x, rowY, columns[column], height);
    text(galleryCtx, `${String(i + 1).padStart(2, '0')}  ${card.record.item.sprite.label ?? card.id}`, x + 22, rowY + 35, 25, ink, 600);
    const metrics = card.record.item.sprite.metrics;
    const metricText = [metrics.doorHeight != null ? `门约 ${(metrics.doorHeight * 2.125).toFixed(1)}m` : '',
      metrics.personHeight != null ? `图内成人约 ${(metrics.personHeight * 2.125).toFixed(1)}m` : '',
      metrics.windowHeight != null ? `可见玻璃约 ${(metrics.windowHeight * 2.125).toFixed(1)}m` : ''].filter(Boolean).join(' · ');
    text(galleryCtx, metricText || '独立标定参考', x + 22, rowY + 66, 18, quiet);
    beginScene(galleryCtx, card.box, x + (columns[column] - card.width) / 2, rowY + 86);
    paintRecords(galleryCtx, [card.record], card.people, card.roadZ);
    galleryCtx.restore();
    if (column || i === cards.length - 1) rowY += height + 24;
  });
  text(galleryCtx, '每栋建筑有独立庭院；矮墙和木栏保留自然断口，院门接入公共小路。', 36, gallery.height - 29, 20, quiet);

  const house = placed(sprites['cottages-1'], 0, 0), stable = placed(sprites['stable-0'], sprites['cottages-1'].nativeWidth + 1.35, 0);
  const front = Math.max(house.sprite.nativeDepth, stable.sprite.nativeDepth) + .8;
  house.z = front - .8 - house.sprite.nativeDepth;stable.z = front - .8 - stable.sprite.nativeDepth;
  const farmRecords = [courtyard(house), courtyard(stable)];
  const farmPeople = farmRecords.map(doorPerson);
  farmPeople.push(placed(sprites['life-1'], stable.x + stable.sprite.nativeWidth * .7, front + .57));
  const flowers = [placed(sprites['life-5'], -.8, front + .76)];
  const roadZ = front + .32;
  const farmBox = bounds([house, stable, ...farmPeople, ...flowers], farmRecords.map(r => r.court),
    [[-.8, roadZ + .3], [stable.x + stable.sprite.nativeWidth + .7, roadZ + .3]]);
  const newSize = sceneSize(farmBox);
  let oldItems = [], oldBox, oldSize;
  if (oldSprites) {
    const oldHouse = placed(oldSprites['cottages-1'], 0, 0, .85);
    const oldStable = placed(oldSprites['forms-7-x'], oldHouse.sprite.nativeWidth * .85 + 1.35, 0, .7);
    oldItems = [oldHouse, oldStable, placed(oldSprites['life-1'], oldStable.x + .3, oldStable.sprite.nativeDepth * .7 + .4, 1)];
    oldBox = bounds(oldItems);oldSize = sceneSize(oldBox);
  }
  const panelWidth = Math.max(850, newSize.width, oldSize?.width ?? 0), panelHeight = Math.max(newSize.height, oldSize?.height ?? 0) + 100;
  const farm = canvas((panelWidth + 24) * (oldSprites ? 2 : 1) + 48, panelHeight + 410);
  const farmCtx = farm.getContext('2d');
  text(farmCtx, '农舍与畜舍 · 两栋建筑、两个庭院', 36, 55, 36, ink, 650);
  text(farmCtx, '设计校准，非贡献数据；相同镜头倍率，门窗与人物用共同尺度。', 36, 91, 22, quiet);
  legend(farmCtx, 44, 132);
  if (oldSprites) {
    farmCtx.fillStyle = '#d7d9c3';farmCtx.fillRect(36, 310, panelWidth, panelHeight);
    text(farmCtx, '校准前 · 原有建筑组合', 58, 350, 28, ink, 600);
    text(farmCtx, '保留原来人物与门窗之间的比例，使用相同镜头倍率', 58, 383, 20, quiet);
    beginScene(farmCtx, oldBox, 36 + (panelWidth - oldSize.width) / 2, 410);
    for (const item of oldItems.sort((a, b) => a.x + a.z - b.x - b.z)) drawSprite(farmCtx, item);
    farmCtx.restore();
  }
  const newX = oldSprites ? 60 + panelWidth : 36;
  farmCtx.fillStyle = '#dce0c6';farmCtx.fillRect(newX, 310, panelWidth, panelHeight);
  text(farmCtx, '校准后 · 独立农舍 + 畜舍，各自围院', newX + 22, 350, 28, ink, 600);
  text(farmCtx, '每栋建筑有独立庭院，两个院门分别接入共同小路', newX + 22, 383, 20, quiet);
  beginScene(farmCtx, farmBox, newX + (panelWidth - newSize.width) / 2, 410);
  paintRecords(farmCtx, farmRecords, farmPeople, roadZ, flowers, true);farmCtx.restore();
  text(farmCtx, '保留门窗与人的相对尺度；菜畦、花树与人物是生活装饰，不代表贡献类型、人口或真实土地面积。', 36, farm.height - 28, 20, quiet);
  const [a, b] = farmRecords.map(r => r.court);
  const noOverlap = a.x + a.w <= b.x || b.x + b.w <= a.x || a.z + a.d <= b.z || b.z + b.d <= a.z;
  return { gallery, farm, checks: {
    pixelsPerWorld: pixels, newFactor: 1, referenceAdultHeight: .8, referenceAdultPixels: .8 * .5 * pixels,
    wallHeight: .32, postHeight: .4, galleryCourtCount: cards.length, farmCourtCount: farmRecords.length,
    courtCount: cards.length + farmRecords.length, buildingCount: cards.length + farmRecords.length, noOverlap,
    farmCourts: farmRecords.map(r => ({ building: r.item.sprite.id, ...r.court, door: r.door })),
    courtyardResidents: cards.filter(card => card.id === 'guild-0' || card.id === 'academy-0').map(card => ({
      id: card.id, people: card.people.map(item => ({ id: item.sprite.id, x: item.x, z: item.z, factor: item.factor })),
      addedSpacing: .7,
    })),
    workWindowActors: selected.filter(id => sprites[id].workWindow).length,
    metrics: selected.map(id => ({ id, ...sprites[id].metrics })),
    canvases: { gallery: [gallery.width, gallery.height], farm: [farm.width, farm.height] },
  } };
};
