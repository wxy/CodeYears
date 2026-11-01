import type { CitySprite } from './city-assets';
import { project, type Point } from './unit-calibration';

/** 轻量地砖与路口灯具只烘焙一次，共用城市地面投影，不请求图片。 */
export function createCityDecoration(id: string): CitySprite | undefined {
  if (id !== 'urban-paving' && id !== 'traffic-signal-w' && id !== 'traffic-signal-d' && id !== 'traffic-signal-d-reverse') return;
  const paving = id === 'urban-paving', ratio = 3, padding = 2;
  const minX = paving ? -48 : -16, minY = paving ? 0 : -30;
  const maxX = paving ? 48 : 16, maxY = paving ? 48 : 10;
  const canvas = document.createElement('canvas');
  canvas.width = (maxX - minX) * ratio + padding * 2;
  canvas.height = (maxY - minY) * ratio + padding * 2;
  const context = canvas.getContext('2d');
  if (!context) {
    canvas.width = canvas.height = 0;
    throw new Error('无法创建城市装饰画布。');
  }
  context.setTransform(ratio, 0, 0, ratio, padding - minX * ratio, padding - minY * ratio);
  const polygon = (points: Point[], fill: string) => {
    context.beginPath();
    points.forEach((p, i) => i ? context.lineTo(...p) : context.moveTo(...p));
    context.closePath(); context.fillStyle = fill; context.fill();
  };
  if (paving) {
    polygon([project(0, 0), project(1, 0), project(1, 1), project(0, 1)], '#c8c5b7');
    for (let z = 0; z < 4; z++) for (let x = 0; x < 4; x++) {
      polygon([project(x / 4, z / 4), project((x + 1) / 4, z / 4), project((x + 1) / 4, (z + 1) / 4), project(x / 4, (z + 1) / 4)],
        (x + z) % 3 === 0 ? '#cbc8bb' : '#c5c2b4');
    }
    context.strokeStyle = '#b7b4a6'; context.lineWidth = .24;
    context.beginPath();
    for (let n = 1; n < 4; n++) {
      context.moveTo(...project(n / 4, 0)); context.lineTo(...project(n / 4, 1));
      context.moveTo(...project(0, n / 4)); context.lineTo(...project(1, n / 4));
    }
    context.stroke();
  } else {
    const wFacing = id === 'traffic-signal-w', base = project(.125, .125), top = project(.125, .125, .6);
    const arm = wFacing ? project(.315, .125, .6) : project(.125, id === 'traffic-signal-d-reverse' ? -.065 : .315, .6);
    polygon([project(.085, .085), project(.165, .085), project(.165, .165), project(.085, .165)], '#607071');
    context.lineCap = 'round'; context.lineJoin = 'round';
    context.strokeStyle = '#46585b'; context.lineWidth = 1.45;
    context.beginPath(); context.moveTo(...base); context.lineTo(...top); context.lineTo(...arm); context.stroke();
    context.strokeStyle = '#a0afab'; context.lineWidth = .4;
    context.beginPath(); context.moveTo(base[0] - .35, base[1] - .6); context.lineTo(top[0] - .35, top[1]); context.stroke();
    const face = wFacing ? project(0, .085) : project(.085, 0);
    const x = arm[0] - face[0] / 2, y = arm[1] - 1;
    polygon([[x + 1, y + .5], [x + face[0] + 1, y + face[1] + .5], [x + face[0] + 1, y + face[1] + 13], [x + 1, y + 13]], '#172b30');
    polygon([[x, y], [x + face[0], y + face[1]], [x + face[0], y + face[1] + 12.5], [x, y + 12.5]], '#304248');
    context.strokeStyle = '#75837e'; context.lineWidth = .3;
    context.beginPath(); context.moveTo(x, y); context.lineTo(x + face[0], y + face[1]); context.stroke();
    for (let light = 0; light < 3; light++) {
      const lx = x + face[0] / 2, ly = y + face[1] / 2 + 2.8 + light * 3.45;
      context.fillStyle = light === (wFacing ? 2 : 0) ? (wFacing ? '#83c4aa' : '#db8b73') : '#52615b';
      context.beginPath(); context.ellipse(lx, ly, 1.1, 1.3, 0, 0, Math.PI * 2); context.fill();
      context.fillStyle = light === (wFacing ? 2 : 0) ? '#dbe6cf' : '#77837a';
      context.beginPath(); context.ellipse(lx - .22, ly - .42, .28, .3, 0, 0, Math.PI * 2); context.fill();
    }
  }
  return {
    canvas, left: (minX - padding / ratio) / 96, top: (minY - padding / ratio) / 96,
    width: canvas.width / ratio / 96, height: canvas.height / ratio / 96,
    nativeWidth: paving ? 1 : .25, nativeDepth: paving ? 1 : .25,
    baselineHeight: paving ? 0 : .6, sampleId: id,
  };
}
