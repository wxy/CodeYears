import { loadSourceCityImages } from '../../src/renderers/city-source-assets';
import { closeCityImages, loadCityImages, type CityImages } from '../../src/renderers/city-assets';
import { CITY_UNIT_CATALOG } from '../../src/renderers/city-unit-catalog';
import { CITY_OUTSKIRT_IDS } from '../../src/renderers/city-outskirts';
import { createCityView, planCityScene } from '../../src/renderers/city-view';
import { generateDays } from '../../src/renderers/probe/data';
import { isoYearStart } from '../../src/data/iso-week';
import type { LandscapeViewport } from '../../src/renderers/types';

declare const __BAKE_TOKEN__: string;
const sampleIds = ['office-h3-a', 'forest-2x2-a', 'grass-1x1-a', 'natural-ground'];
const sampleButton = document.querySelector<HTMLButtonElement>('#sample')!;
const allButton = document.querySelector<HTMLButtonElement>('#all')!;
const status = document.querySelector<HTMLOutputElement>('#status')!;
const rows = document.querySelector<HTMLTableSectionElement>('#rows')!;
const samples = document.querySelector<HTMLElement>('#samples')!;
const compareButton = document.querySelector<HTMLButtonElement>('#compare')!;
const pngBlob = (canvas: HTMLCanvasElement) => new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG编码失败。')), 'image/png'));

async function generate(ids: string[]) {
  sampleButton.disabled = allButton.disabled = compareButton.disabled = true;
  rows.replaceChildren(); samples.replaceChildren();
  const entries = [], sources = new Map<string, number>(); let total = 0;
  try {
    for (const id of ids) {
      status.textContent = `正在生成 ${id}（${entries.length + 1}/${ids.length}）`;
      const file = CITY_UNIT_CATALOG[id]?.file ?? `${id}.png`;
      if (!sources.has(file)) sources.set(file, (await (await fetch(`/assets/city/${file}`)).arrayBuffer()).byteLength);
      const images = await loadSourceCityImages(new URL('/assets/city/', location.href).href, [id]);
      try {
        const sprite = images[id], original = sprite.canvas;
        const blob = await pngBlob(original), decoded = await createImageBitmap(blob);
        const restored = document.createElement('canvas'); restored.width = decoded.width; restored.height = decoded.height;
        restored.getContext('2d')!.drawImage(decoded, 0, 0); decoded.close();
        const before = original.getContext('2d')!.getImageData(0, 0, original.width, original.height).data;
        const after = restored.getContext('2d')!.getImageData(0, 0, restored.width, restored.height).data;
        let rgba = 0, alpha = 0;
        for (let i = 0; i < before.length; i += 4) {
          if (before[i] !== after[i] || before[i + 1] !== after[i + 1] || before[i + 2] !== after[i + 2] || before[i + 3] !== after[i + 3]) rgba++;
          if (before[i + 3] !== after[i + 3]) alpha++;
        }
        const tr = rows.insertRow();
        for (const value of [id, sources.get(file), blob.size, `${original.width}×${original.height}`, rgba, alpha]) tr.insertCell().textContent = String(value);
        if (rgba || original.width !== restored.width || original.height !== restored.height) throw new Error(`${id} PNG重新载入后的像素不同，停止写入。`);
        if (sampleIds.includes(id)) showSample(id, original, restored);
        const { canvas: _canvas, ...metadata } = sprite;
        const png = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob);
        });
        entries.push({ id, metadata: { file: `${id}.png`, ...metadata }, png }); total += blob.size;
        restored.width = restored.height = 0;
      } finally { closeCityImages(images); }
    }
    const response = await fetch('/__bake', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-city-bake-token': __BAKE_TOKEN__ }, body: JSON.stringify(entries) });
    if (!response.ok) throw new Error(await response.text());
    const result = await response.json(), sourceBytes = [...sources.values()].reduce((a, b) => a + b, 0);
    status.textContent = `PASS：${ids.length}张，RGBA及Alpha差异为0。原图${sourceBytes} bytes → 运行图${total} bytes，减少${(100 * (1 - total / sourceBytes)).toFixed(2)}%。\n已写入：${result.output}`;
  } catch (error) { status.textContent = `FAIL：${String(error)}`; }
  finally { sampleButton.disabled = allButton.disabled = compareButton.disabled = false; }
}

function showSample(id: string, original: HTMLCanvasElement, restored: HTMLCanvasElement) {
  const card = document.createElement('section'); card.className = 'sample';
  const heading = document.createElement('h2'); heading.textContent = id; card.append(heading);
  const pair = document.createElement('div'); pair.className = 'pair'; card.append(pair);
  for (const [label, source] of [['当前运行贴图', original], ['预烘焙PNG重新载入', restored]] as const) {
    const column = document.createElement('div'), text = document.createElement('p'); text.textContent = label;
    const canvas = document.createElement('canvas'); canvas.width = source.width; canvas.height = source.height; canvas.getContext('2d')!.drawImage(source, 0, 0);
    column.append(text, canvas); pair.append(column);
  }
  const near = document.createElement('div'); near.className = 'near';
  const canvas = document.createElement('canvas'); canvas.width = original.width + restored.width; canvas.height = Math.max(original.height, restored.height);
  canvas.style.width = `${canvas.width * 2}px`;
  canvas.getContext('2d')!.drawImage(original, 0, 0); canvas.getContext('2d')!.drawImage(restored, original.width, 0);
  near.append(canvas); card.append(near); samples.append(card);
}

sampleButton.onclick = () => void generate(sampleIds);
allButton.onclick = () => void generate([...Object.keys(CITY_UNIT_CATALOG), ...CITY_OUTSKIRT_IDS]);

compareButton.onclick = async () => {
  sampleButton.disabled = allButton.disabled = compareButton.disabled = true;
  const output = document.querySelector<HTMLOutputElement>('#scene-result')!, scenes = document.querySelector<HTMLElement>('#scenes')!;
  scenes.replaceChildren(); output.textContent = '正在比较完整场景…';
  let source: CityImages = {}, baked: CityImages = {};
  try {
    const plans = [1, 3, 20].map(years => {
      const start = 2026 - years, first = new Date(isoYearStart(start)).toISOString().slice(0, 10);
      const after = new Date(isoYearStart(2026)).toISOString().slice(0, 10);
      const days = generateDays('regular').filter(day => first <= day.date && day.date < after);
      return { years, days, scene: planCityScene(days, true, Array.from({ length: years }, (_, i) => start + i)) };
    });
    const ids = [...new Set(plans.flatMap(plan => plan.scene.keys))];
    source = await loadSourceCityImages(new URL('/assets/city/', location.href).href, ids);
    baked = await loadCityImages(new URL('/assets/city-runtime/', location.href).href, ids);
    const results = [];
    for (const plan of plans) for (const framing of ['fit', 'initial', 'max'] as const) {
      const viewport: LandscapeViewport = { width: plan.years === 20 ? 1398 : 744, height: plan.years === 20 ? 752 : 340, dpr: 1.5, zoom: 1, panX: framing === 'max' ? 80 : 0, panY: framing === 'max' ? -30 : 0, dark: plan.years !== 1 };
      const before = createCityView(plan.scene, source, plan.days.length), after = createCityView(plan.scene, baked, plan.days.length);
      try {
        viewport.zoom = framing === 'fit' ? 1 : framing === 'initial' ? 1.875 : before.maxZoom!(viewport);
        before.draw(1, viewport); after.draw(1, viewport);
        const a = before.canvas.getContext('2d')!.getImageData(0, 0, before.canvas.width, before.canvas.height).data;
        const b = after.canvas.getContext('2d')!.getImageData(0, 0, after.canvas.width, after.canvas.height).data;
        let pixels = 0;
        for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3]) pixels++;
        const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', a))].map(n => n.toString(16).padStart(2, '0')).join('');
        const result = `${plan.years}年 ${framing} ${plan.days.length}天：${pixels}差异像素；${hash}`;
        results.push(result); output.textContent = results.join('\n');
        if (pixels) throw new Error(result);
        if (plan.years === 3 && framing !== 'fit') {
          const title = document.createElement('h2'); title.textContent = `三年 ${framing}：左为源图流程，右为预烘焙流程`; scenes.append(title);
          const pair = document.createElement('div'); pair.className = 'pair';
          for (const view of [before, after]) {
            const canvas = document.createElement('canvas'); canvas.width = view.canvas.width; canvas.height = view.canvas.height;
            canvas.getContext('2d')!.drawImage(view.canvas, 0, 0); const column = document.createElement('div'); column.append(canvas); pair.append(column);
          }
          scenes.append(pair);
        }
      } finally { before.dispose(); after.dispose(); }
    }
    output.textContent = `PASS：9组最终场景逐像素一致；${ids.length}种实际场景素材。\n` + results.join('\n');
  } catch (error) { output.textContent += `\nFAIL：${String(error)}`; }
  finally {
    closeCityImages(source); closeCityImages(baked);
    sampleButton.disabled = allButton.disabled = compareButton.disabled = false;
  }
};
