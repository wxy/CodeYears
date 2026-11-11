import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, mkdtemp, rm, readdir, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify, parseArgs } from 'node:util';
import { prepareTownScale } from './town-scale.mjs';

const { values } = parseArgs({ options: {
  outDir: { type: 'string' }, catalog: { type: 'string' }, board: { type: 'string' }, proof: { type: 'string' },
} });
if (!values.outDir) throw new Error('请用 --outDir 指定运行素材目录。');
const root = fileURLToPath(new URL('..', import.meta.url)), out = resolve(values.outDir);
const { frames, sources } = await prepareTownScale({ root, collection: 'rustic' });
const buildingIds = ['cottages-1', 'cottages-2', 'cottages-3', 'cottages-4', 'forms-0', 'forms-1', 'forms-2', 'forms-4', 'stable-0', 'magic-0', 'magic-2', 'magic-3', 'mage-0', 'rustic-hut-front', 'rustic-hut-back'];
const mirrors = ['forms-0', 'forms-1', 'forms-2', 'forms-4', 'magic-2', 'magic-3', 'rustic-hut-front', 'rustic-hut-back'];
const paths = new Map([...sources, ...['scale-sprites', 'work-window', 'private-courtyards'].map(name => [
  '/' + name + '.js', resolve(root, 'probes/fantasy-city/' + name + '.js'),
])]);
const page = `<!doctype html><meta charset="utf-8"><script src="/scale-sprites.js"></script><script src="/work-window.js"></script><script src="/private-courtyards.js"></script><script>
(async () => {
  const includeBoard = ${Boolean(values.board)};
  const frames = ${JSON.stringify(frames)}, buildingIds = ${JSON.stringify(buildingIds)}, mirrors = ${JSON.stringify(mirrors)};
  const load = url => new Promise((resolve, reject) => { const im = new Image();im.onload = () => resolve(im);im.onerror = reject;im.src = url; });
  const sprites = await prepareTownScaleImages({ frames, load }), records = [];
  // The same shared actor and exclusions used by the design preview are baked once.
  for (const sprite of Object.values(sprites)) if (sprite.workWindow) {
    const c = sprite.canvas.getContext('2d'), ratio = sprite.canvas.width / sprite.width;
    c.save();c.scale(ratio, ratio);c.translate(-sprite.left, -sprite.top);
    paintTownWorkResident(c, sprite, sprites['life-0']);c.restore();
  }
  const encode = (id, sprite, metadata, mirror = false, maxEdge = 384) => {
    const left = mirror ? -sprite.left - sprite.width : sprite.left;
    const { top, width, height } = sprite, ratio = (maxEdge - 8) / Math.max(width, height), padding = 3;
    const canvas = document.createElement('canvas');canvas.width = Math.ceil(width * ratio) + padding * 2;canvas.height = Math.ceil(height * ratio) + padding * 2;
    const c = canvas.getContext('2d');c.imageSmoothingQuality = 'high';
    if (mirror) { c.translate(padding + width * ratio, padding);c.scale(-1, 1); }
    else c.translate(padding, padding);
    c.drawImage(sprite.canvas, 0, 0, width * ratio, height * ratio);c.resetTransform();
    const pixels = c.getImageData(0, 0, canvas.width, canvas.height);let x0 = canvas.width, y0 = canvas.height, x1 = -1, y1 = -1;
    for (let y = 0;y < canvas.height;y++) for (let x = 0;x < canvas.width;x++) {
      const i = (y * canvas.width + x) * 4 + 3, a = pixels.data[i];
      if (a <= 8) pixels.data[i] = 0;else if (a < 32) pixels.data[i] = Math.round(a * (a - 8) / 24);
      if (pixels.data[i]) { x0 = Math.min(x0, x);y0 = Math.min(y0, y);x1 = Math.max(x1, x);y1 = Math.max(y1, y); }
    }
    if (x1 < 0) throw new Error('透明空素材：' + id);c.putImageData(pixels, 0, 0);
    const trimmed = document.createElement('canvas');trimmed.width = x1 - x0 + 3;trimmed.height = y1 - y0 + 3;
    trimmed.getContext('2d').drawImage(canvas, x0, y0, x1 - x0 + 1, y1 - y0 + 1, 1, 1, x1 - x0 + 1, y1 - y0 + 1);
    if (Math.max(trimmed.width, trimmed.height) > maxEdge) throw new Error('PNG尺寸超限：' + id);
    const m = { file: id + '.png', left: left + (x0 - padding - 1) / ratio, top: top + (y0 - padding - 1) / ratio,
      width: trimmed.width / ratio, height: trimmed.height / ratio, ...metadata, sampleId: id };
    records.push({ id, metadata: m, png: trimmed.toDataURL('image/png').split(',')[1], pixels: [trimmed.width, trimmed.height] });
  };
  const fenceSprite = (w, d, phase, material) => {
    const corners = [[0, 0], [w, 0], [w, d], [0, d]].map(([x, z]) => [(x - z) * .5, (x + z) * .25]);
    const left = Math.min(...corners.map(p => p[0])) - .01, right = Math.max(...corners.map(p => p[0])) + .01;
    const top = Math.min(...corners.map(p => p[1])) - .21, bottom = Math.max(...corners.map(p => p[1])) + .01;
    const ratio = 512 / Math.max(right - left, bottom - top), canvas = document.createElement('canvas');
    canvas.width = Math.ceil((right - left) * ratio);canvas.height = Math.ceil((bottom - top) * ratio);
    const c = canvas.getContext('2d');c.scale(ratio, ratio);c.translate(-left, -top);
    paintPrivateCourtyard(c, { x: 0, z: 0, w, d, material }, phase);
    return { canvas, left, top, width: canvas.width / ratio, height: canvas.height / ratio };
  };
  for (const frame of frames) for (const mirror of mirrors.includes(frame.id) ? [false, true] : [false]) {
    const id = frame.id + (mirror ? '-x' : ''), isBuilding = buildingIds.includes(frame.id);
    const nw = mirror ? frame.nativeDepth : frame.nativeWidth, nd = mirror ? frame.nativeWidth : frame.nativeDepth;
    const nativeAxis = frame.entranceAxis ?? 'z';
    const entrance = isBuilding ? {
      entrancePoint: mirror ? [...frame.doorPoint].reverse() : frame.doorPoint,
      entranceAxis: mirror ? (nativeAxis === 'z' ? 'x' : 'z') : nativeAxis, entranceSide: frame.entranceSide ?? 'front',
      entranceBasis: frame.entranceBasis ?? (frame.metrics.doorHeight ? 'observed-door' : 'inferred'),
    } : {};
    encode(id, sprites[frame.id], {
      nativeWidth: nw, nativeDepth: nd, groundWidth: nw, groundDepth: nd,
      groundBasis: 'human-scale-source-envelope', directionBasis: frame.directionBasis,
      baselineHeight: frame.metrics.referenceHeight, ...entrance,
    }, mirror);
  }
  // 与各栋建筑共用地面深度排序的独立栏段；转向不改变真实柱高。
  for (const [name, material, thickness] of [['yard-fence', 'wood', .07], ['yard-wall', 'stone', .10]]) {
    for (const [axis, width, depth] of [['x', .95, thickness], ['z', thickness, .95]]) {
      encode(name + '-' + axis, fenceSprite(width, depth, 'short-' + axis, material), {
        nativeWidth: width, nativeDepth: depth, groundWidth: width, groundDepth: depth,
        groundBasis: 'shared-courtyard-fence', directionBasis: 'native-2-to-1', baselineHeight: .4,
      }, false, 256);
    }
  }
  const board = document.createElement('canvas');
  if (includeBoard) {
    const scale = 100, margin = 20, columns = 4, caption = 42;
    const cellW = Math.ceil(Math.max(...records.map(r => r.metadata.width)) * scale + margin * 2);
    const cellH = Math.ceil(Math.max(...records.map(r => r.metadata.height)) * scale + margin * 2 + caption);
    board.width = columns * cellW; board.height = Math.ceil(records.length / columns) * cellH;
    const c = board.getContext('2d'); c.fillStyle = '#c4d0ab'; c.fillRect(0, 0, board.width, board.height);
    c.fillStyle = '#28392b'; c.font = '17px sans-serif';
    for (const [index, record] of records.entries()) {
      const x = index % columns * cellW, y = Math.floor(index / columns) * cellH;
      const m = record.metadata, image = await load('data:image/png;base64,' + record.png);
      c.drawImage(image, x + (cellW - m.width * scale) / 2, y + cellH - caption - m.height * scale,
        m.width * scale, m.height * scale);
      c.fillText(record.id + '  ' + m.nativeWidth.toFixed(2) + ' × ' + m.nativeDepth.toFixed(2),
        x + margin, y + cellH - 14);
    }
  }
  await fetch('/result', { method: 'POST', body: JSON.stringify({ records, board: board.toDataURL('image/png').split(',')[1],
    proof: { adultHeight: .8, ordinaryDoorHeight: 1, postPlacementFactor: 1, spriteMaxPngEdge: 384, fenceMaxPngEdge: 256,
      frames: frames.map(({ id, nativeWidth, nativeDepth, metrics }) => ({ id, nativeWidth, nativeDepth, ...metrics })),
      windowActors: frames.filter(f => f.workWindow).map(f => ({ building: f.id, actor: 'life-0', exclusions: f.workWindow.exclusions.length })),
      files: records.map(({ id, pixels }) => ({ id, pixels })) } }) });document.title = 'READY';
})().catch(async error => { await fetch('/error', { method: 'POST', body: String(error.stack || error) });document.title = 'ERROR'; });
</script>`;
let result, error;
const server = createServer(async (req, res) => {
  if (req.url === '/') { res.setHeader('Content-Type', 'text/html;charset=utf-8');res.end(page);return; }
  if (paths.has(req.url)) { res.setHeader('Content-Type', req.url.endsWith('.png') ? 'image/png' : 'text/javascript');res.end(await readFile(paths.get(req.url)));return; }
  if (req.method === 'POST' && ['/result', '/error'].includes(req.url)) {
    const chunks = [];for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString();if (req.url === '/result') result = JSON.parse(body);else error = body;res.end('ok');return;
  }
  res.writeHead(404).end();
});
const temporary = await mkdtemp(join(tmpdir(), 'codeyears-town-bake-'));
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  await promisify(execFile)('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--disable-sync', '--hide-scrollbars',
    '--virtual-time-budget=12000', '--user-data-dir=' + join(temporary, 'profile'), '--dump-dom', 'http://127.0.0.1:' + server.address().port,
  ], { timeout: 90000, maxBuffer: 4 * 1024 * 1024 });
  if (error) throw new Error(error);if (!result) throw new Error('浏览器没有返回素材。');
  await mkdir(out, { recursive: true });
  const entries = Object.fromEntries(result.records.map(entry => [entry.id, entry.metadata]));
  // 路牌由独立烘焙器维护。生成完整小镇目录时使用其正式图和投影参数。
  const runtime = resolve(root, 'public/assets/town-runtime');
  const existing = JSON.parse(await readFile(resolve(root, 'src/renderers/town-baked-catalog.json'), 'utf8'));
  for (const id of ['direction-board-x', 'direction-board-z']) {
    const metadata = existing[id];
    if (out !== runtime) await copyFile(join(runtime, metadata.file), join(out, metadata.file));
    entries[id] = metadata;
  }
  for (const entry of result.records) await writeFile(join(out, entry.metadata.file), Buffer.from(entry.png, 'base64'));
  const workingCatalog = join(temporary, 'catalog.json');
  await writeFile(workingCatalog, JSON.stringify(entries, null, 2) + '\n');
  await promisify(execFile)(process.execPath,[resolve(root,'scripts/bake-town-ground.mjs'),'--outDir',out,'--catalog',workingCatalog],{timeout:90000});
  const complete = await readFile(workingCatalog, 'utf8');
  const catalog = values.catalog ? resolve(values.catalog) : join(out, 'catalog.json');await mkdir(resolve(catalog, '..'), { recursive: true });
  await writeFile(catalog, complete);
  const names = new Set(Object.values(JSON.parse(complete)).map(entry => entry.file));
  for (const name of await readdir(out)) if (name.endsWith('.png') && !names.has(name)) await rm(join(out, name));
  for (const [option, data] of [['board', Buffer.from(result.board, 'base64')], ['proof', JSON.stringify(result.proof, null, 2) + '\n']]) {
    if (values[option]) { await mkdir(resolve(values[option], '..'), { recursive: true });await writeFile(values[option], data); }
  }
  console.log(JSON.stringify({ files: result.records.length, catalog, pixels: result.proof.files }, null, 2));
} finally { await new Promise(resolve => server.close(resolve));await rm(temporary, { recursive: true, force: true }); }
