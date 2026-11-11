/* 原型与运行PNG烘焙共用的独立庭院绘制；不负责地块规划。
 * court = { x, z, w, d, gateX, material?: 'stone' | 'wood' }。
 * gateX 是世界坐标；院门位于 z + d 一侧，缺省居中。
 * 调用方先 translate/scale 画布，再按 back → 建筑/人物 → front 绘制。
 * 地面投影为 ((x-z)*.5, (x+z)*.25)，垂直高度另减 height*.5。
 * 成人参考高 .8；墙/栏高 .32、柱高 .4，不随庭院面积变高。
 */
window.paintPrivateCourtyard = function paintPrivateCourtyard(ctx, court, phase) {
  const { x, z, w, d } = court;
  const wood = court.material === 'wood';
  const thickness = wood ? .07 : .10;
  const inset = thickness / 2;
  const left = x + inset, right = x + w - inset;
  const back = z + inset, front = z + d - inset;
  const gateWidth = Math.min(.64, w * .35);
  const gateX = Math.max(left + gateWidth / 2 + .10,
    Math.min(right - gateWidth / 2 - .10, court.gateX ?? x + w / 2));
  const project = (px, pz, height = 0) => [(px - pz) * .5, (px + pz) * .25 - height * .5];
  const polygon = (points, color) => {
    ctx.beginPath();
    points.forEach(([px, pz, height], i) => {
      const [sx, sy] = project(px, pz, height);
      if (i) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy);
    });
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };
  const prism = (px, pz, width, depth, base, height, colors) => {
    const endX = px + width, endZ = pz + depth, top = base + height;
    polygon([[px, endZ, base], [endX, endZ, base], [endX, endZ, top], [px, endZ, top]], colors[0]);
    polygon([[endX, pz, base], [endX, endZ, base], [endX, endZ, top], [endX, pz, top]], colors[1]);
    polygon([[px, pz, top], [endX, pz, top], [endX, endZ, top], [px, endZ, top]], colors[2]);
  };
  const colors = wood ? ['#8b7451', '#716044', '#b29a6b'] : ['#9f9d87', '#828a78', '#bbb69d'];
  const commands = [];
  const posts = new Map();
  const post = (px, pz) => {
    // 两个近角归 front 绘制，避免跨阶段重复覆盖同一根柱。
    if (phase === 'back' && (px === right || pz === front)) return;
    posts.set(`${px}:${pz}`, [px, pz]);
  };
  const section = (a, b) => {
    const horizontal = a[1] === b[1];
    const length = horizontal ? b[0] - a[0] : b[1] - a[1];
    commands.push({ depth: (a[0] + a[1] + b[0] + b[1]) / 2, draw() {
      if (wood) {
        for (const base of [.105, .27]) {
          prism(a[0] - (horizontal ? 0 : .022), a[1] - (horizontal ? .022 : 0),
            horizontal ? length : .044, horizontal ? .044 : length, base, .05, colors);
        }
      } else {
        prism(a[0] - (horizontal ? 0 : inset), a[1] - (horizontal ? inset : 0),
          horizontal ? length : thickness, horizontal ? thickness : length, 0, .32, colors);
        // 稀疏灰缝只作低墙材质，不绘制城垛或加高边界。
        const faceOffset = inset + .001;
        const start = project(a[0] + (horizontal ? 0 : faceOffset), a[1] + (horizontal ? faceOffset : 0), .16);
        const end = project(b[0] + (horizontal ? 0 : faceOffset), b[1] + (horizontal ? faceOffset : 0), .16);
        ctx.beginPath();ctx.moveTo(...start);ctx.lineTo(...end);
        ctx.strokeStyle = '#7f87746b';ctx.lineWidth = .008;ctx.stroke();
      }
    }});
    const spaces = wood ? Math.ceil(length / .72) : 1;
    for (let i = 0; i <= spaces; i++) {
      post(a[0] + (b[0] - a[0]) * i / spaces, a[1] + (b[1] - a[1]) * i / spaces);
    }
  };
  const brokenEdge = (a, b, opening, gap) => {
    const horizontal = a[1] === b[1];
    const low = opening - gap / 2, high = opening + gap / 2;
    section(a, horizontal ? [low, a[1]] : [a[0], low]);
    section(horizontal ? [high, a[1]] : [a[0], high], b);
  };

  ctx.save();
  ctx.lineJoin = 'round';
  if (phase === 'back') {
    // 只保留院门附近的短进路；入户路由建筑自己的门位继续连接。
    polygon([[gateX - .16, front - .58, 0], [gateX + .16, front - .58, 0],
      [gateX + .16, front + .28, 0], [gateX - .16, front + .28, 0]], '#b7b08a');
    brokenEdge([left, back], [right, back], left + (right - left) * .68, Math.min(.25, w * .12));
    brokenEdge([left, back], [left, front], back + (front - back) * .36, Math.min(.25, d * .12));
  } else {
    brokenEdge([right, back], [right, front], back + (front - back) * .72, Math.min(.25, d * .12));
    brokenEdge([left, front], [right, front], gateX, gateWidth);
  }
  for (const [px, pz] of posts.values()) {
    commands.push({ depth: px + pz, draw() {
      const size = wood ? .07 : .10;
      prism(px - size / 2, pz - size / 2, size, size, 0, .4, colors);
    }});
  }
  commands.sort((a, b) => a.depth - b.depth);
  for (const command of commands) command.draw();
  ctx.restore();
};
