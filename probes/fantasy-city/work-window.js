/* Shared design/runtime-bake window actor. Coordinates use projected world units.
 * The actor keeps the same adult scale; original braces and bottles mask it.
 */
window.paintTownWorkResident = function paintTownWorkResident(ctx, sprite, person, sx = 0, sy = 0) {
    const opening = sprite.workWindow;
    if (!opening) return;
    const topEdge = [...opening.clipPolygon].sort((a, b) => a[1] - b[1]).slice(0, 2);
    const crown = [(topEdge[0][0] + topEdge[1][0]) / 2, (topEdge[0][1] + topEdge[1][1]) / 2 + .045];
    const ox = sx + crown[0] - person.crownPoint[0], oy = sy + crown[1] - person.crownPoint[1];
    ctx.save();ctx.beginPath();
    opening.clipPolygon.forEach(([x, y], i) => { if (i) ctx.lineTo(sx + x, sy + y);else ctx.moveTo(sx + x, sy + y); });
    ctx.closePath();ctx.clip();
    const xs = opening.clipPolygon.map(p => p[0]), ys = opening.clipPolygon.map(p => p[1]);
    const left = Math.min(...xs) - .01, top = Math.min(...ys) - .01;
    const width = Math.max(...xs) - left + .01, height = Math.max(...ys) - top + .01;
    // 实际瓶子/斜撑可越出窗洞且互相重叠；逐项相交，不能合并成一次奇偶裁剪。
    for (const points of opening.exclusions) {
      ctx.beginPath();ctx.rect(sx + left, sy + top, width, height);
      points.forEach(([x, y], i) => { if (i) ctx.lineTo(sx + x, sy + y);else ctx.moveTo(sx + x, sy + y); });
      ctx.closePath();ctx.clip('evenodd');
    }
    ctx.drawImage(person.canvas, ox + person.left, oy + person.top, person.width, person.height);
    ctx.restore();
};
