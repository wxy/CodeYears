import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

// 母版正视图的牌面边缘、足底及裁切包络（像素）。朝向仅在地图投影时决定。
const crop = { x: 353, y: 18, width: 1466, height: 689 };
const face = { left: 361, right: 1811, top: 41, bottom: 329, ground: 701 };
const worldWidth = 6.5;
const worldHeight = 1.5;
const scaleX = worldWidth / (face.right - face.left);
const scaleY = worldHeight / (face.bottom - face.top);
const source = await readFile('docs/design/city-wayposts/v2/motorway-guide-source.png');
const temporary = await mkdtemp(join(tmpdir(), 'codeyears-waypost-bake-'));

try {
  // 在同一正视空间中换漆，只调整蓝色反光膜，保留铝边、支柱和螺栓的受光。
  const page = `<!doctype html><meta charset="utf-8"><body><script>
  (async () => {
    document.currentScript.remove();
    const image = new Image();
    image.src = 'data:image/png;base64,${source.toString('base64')}';
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = ${crop.width};
    canvas.height = ${crop.height};
    const ctx = canvas.getContext('2d', {willReadFrequently:true});
    const records = [];
    for (const finish of ['blue', 'green']) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, -${crop.x}, -${crop.y});
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = pixels.data;
      for (let i = 0; i < data.length; i += 4) {
        // 原图有淡背景辉光；保留金属的实边和亚像素抗锯齿。
        data[i+3] = (data[i+3]-120)*255/(249-120);
        if (!data[i+3]) continue;
        const r = data[i], g = data[i+1], b = data[i+2];
        const enamel = Math.min(1, Math.max(0, (b - Math.max(r, g) - 15) / 60));
        if (!enamel) continue;
        const light = .21*r + .72*g + .07*b;
        const color = finish === 'blue'
          ? [18+.52*light, 53+.78*light, 99+.98*light]
          : [18+.46*light, 69+.74*light, 48+.69*light];
        for (let c = 0; c < 3; c++) data[i+c] += (color[c]-data[i+c])*enamel;
      }
      ctx.putImageData(pixels, 0, 0);
      records.push(canvas.toDataURL('image/png').split(',')[1]);
    }
    document.body.innerHTML = '<pre id="result"></pre>';
    document.querySelector('#result').textContent = JSON.stringify(records);
  })().catch(error => document.body.textContent = String(error.stack || error));
  </script>`;
  await writeFile(join(temporary, 'index.html'), page);
  const { stdout } = await promisify(execFile)(
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ['--headless=new', '--no-first-run', '--disable-background-networking', '--disable-sync',
      '--virtual-time-budget=12000', '--user-data-dir='+join(temporary,'profile'),
      '--dump-dom', 'file://'+join(temporary,'index.html')],
    {timeout:90000, maxBuffer:12*1024*1024},
  );
  const encoded = stdout.match(/<pre id="result">([^<]+)<\/pre>/)?.[1];
  if (!encoded) throw new Error('路牌预烘焙失败：'+stdout.slice(-1000));
  const images = JSON.parse(encoded.replaceAll('&quot;', '"'));
  const catalogPath = 'src/renderers/city-baked-catalog.json';
  const catalog = JSON.parse(await readFile(catalogPath,'utf8'));
  // 既有键 z 表示出城，x 表示返程。
  for (const [i, id] of ['direction-board-z','direction-board-x'].entries()) {
    const file = id+'.png';
    await writeFile('public/assets/city-runtime/'+file, Buffer.from(images[i], 'base64'));
    catalog[id] = {
      file, left:(crop.x - (face.left+face.right)/2)*scaleX, top:(crop.y-face.ground)*scaleY,
      width:crop.width*scaleX, height:crop.height*scaleY,
      nativeWidth:worldWidth, nativeDepth:.5, baselineHeight:worldHeight, sampleId:id,
    };
  }
  await writeFile(catalogPath, JSON.stringify(catalog,null,2)+'\n');
  const layout = {width:worldWidth, height:worldHeight, top:(face.top-face.ground)*scaleY};
  await writeFile('src/renderers/direction-board-layout.json', JSON.stringify(layout,null,2)+'\n');
  console.log(`蓝色出城和绿色返程：${crop.width}×${crop.height}`);
} finally {
  await rm(temporary, {recursive:true, force:true, maxRetries:5, retryDelay:100});
}
