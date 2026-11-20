import { text } from './i18n';
import type { Language } from './language';

const selector = 'td.ContributionCalendar-day[data-date][data-level][data-ix]';
const sceneClass = 'codeyears-miniature-scene';
const buildings = [
  [],
  ['cottage.webp', 'villa.webp', 'courtyard.webp'],
  ['terrace.webp', 'bakery.webp', 'villa.webp'],
  ['duplex.webp', 'townhouse.webp', 'limestone.webp'],
  ['terracotta.webp', 'apartment.webp', 'limestone.webp'],
] as const;
const files = [...new Set(buildings.flat()), 'asphalt-strip.png'];
const lotScale = 0.7;
const modelSeed = Math.floor(Math.random() * 0x100000000);
type Level = 0 | 1 | 2 | 3 | 4;
interface Day { cell: HTMLTableCellElement; date: string; column: number; row: number; level: Level }
type Point = readonly [number, number];

let assetsPromise: Promise<Map<string, HTMLImageElement>> | undefined;
function loadAssets() {
  assetsPromise ??= Promise.all(files.map(async file => {
    const image = new Image();
    image.src = chrome.runtime.getURL('assets/calendar/' + file);
    await image.decode();
    return [file, image] as const;
  })).then(images => new Map(images)).catch(error => {
    assetsPromise = undefined;
    throw error;
  });
  return assetsPromise;
}

function readDays(grid: HTMLTableElement) {
  const rows = Array.from(grid.tBodies[0]?.rows ?? []);
  if (rows.length !== 7) return;
  const days: Day[] = [];
  const dates = new Set<string>();
  for (const [row, tr] of rows.entries()) {
    const columns = new Set<number>();
    for (const cell of tr.querySelectorAll<HTMLTableCellElement>('td.ContributionCalendar-day[data-date]')) {
      const { date = '', ix = '', level = '' } = cell.dataset;
      const column = Number(ix);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || dates.has(date)
          || !/^\d{1,2}$/.test(ix) || column > 53 || columns.has(column) || !/^[0-4]$/.test(level)) return;
      dates.add(date);
      columns.add(column);
      days.push({ cell, date, column, row, level: Number(level) as Level });
    }
  }
  if (days.length) return { days, rows };
}

const sceneCss = `
  .${sceneClass} { position: relative; inline-size: max-content; isolation: isolate; }
  .${sceneClass}[data-painted] thead > tr { height: 37px !important; }
  .${sceneClass} > table { position: relative; z-index: 1; }
  .${sceneClass} > canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .${sceneClass}[data-painted]:not([data-measuring]) td[data-date][data-level] {
    translate: var(--codeyears-x, 0px) var(--codeyears-y, 0px);
    background-color: transparent !important;
    box-shadow: none !important;
  }
  .${sceneClass}[data-painted] td[data-date]:is([aria-selected="true"], :focus-visible) {
    outline: 2px solid var(--fgColor-accent, #0969da);
    outline-offset: -1px;
  }
`;

export function mountMiniatureCalendar(grid: HTMLTableElement, initialLanguage: Language) {
  const scroller = grid.parentElement!;
  const scene = document.createElement('div');
  scene.className = sceneClass;
  const style = document.createElement('style');
  style.textContent = sceneCss;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.hidden = true;
  const controls = document.createElement('div');
  controls.id = 'codeyears-miniature-controls';
  controls.hidden = true;
  const shadow = controls.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      :host { align-self:stretch; display:block; color:var(--fgColor-default,#1f2328); font:12px/1.45 system-ui,sans-serif; }
      :host([hidden]) { display:none; }
      .controls { display:flex; align-items:center; flex-wrap:wrap; gap:4px 12px; padding:4px 0; text-align:start; }
      label { display:inline-flex; align-items:center; gap:6px; }
      input { width:82px; margin:0; accent-color:var(--fgColor-accent,#0969da); }
      output { color:var(--fgColor-muted,#59636e); }
    </style>
    <div class="controls" role="group">
      <label><span></span><input type="range" min="100" max="400" step="50" value="100"></label>
      <output id="scale">100%</output>
      <output id="day" aria-live="polite"></output>
    </div>`;
  const input = shadow.querySelector('input')!;
  const record = shadow.querySelector<HTMLOutputElement>('#day')!;
  const scaleLabel = shadow.querySelector<HTMLOutputElement>('#scale')!;
  let language = initialLanguage;
  let snapshot: ReturnType<typeof readDays>;
  let chosenDate = '';
  let descriptions = new Map<string, string>();
  let pictures: Map<string, HTMLImageElement> | undefined;
  let frame = 0, zoom = 1;
  let disposed = false;

  function localize(next: Language) {
    language = next;
    controls.lang = next;
    shadow.querySelector('.controls')!.setAttribute('aria-label', text(next, 'miniatureControls'));
    shadow.querySelector('label span')!.textContent = text(next, 'miniatureZoom');
    input.setAttribute('aria-valuetext', text(next, 'zoomLevel', [input.value]));
    record.setAttribute('aria-label', text(next, 'miniatureRecord'));
  }

  function showRecord(day: Day) {
    chosenDate = day.date;
    record.textContent = descriptions.get(day.cell.id) || day.date;
  }

  function updateDays() {
    snapshot = readDays(grid);
    descriptions = new Map(Array.from(scroller.querySelectorAll('tool-tip[for]'), node =>
      [node.getAttribute('for')!, node.textContent?.trim().replace(/\s+/g, ' ') ?? '']));
    const days = snapshot?.days ?? [];
    const selected = days.find(day => day.date === chosenDate)
      ?? days.reduce<Day | undefined>((last, day) => !last || day.date > last.date ? day : last, undefined);
    if (selected) showRecord(selected);
    else record.textContent = '';
    schedule();
  }

  function selectDay(event: Event) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const cell = target.closest(selector);
    const day = snapshot?.days.find(day => day.cell === cell);
    if (day) showRecord(day);
  }

  function paint() {
    frame = 0;
    if (!pictures || !snapshot || !scene.isConnected) {
      scene.removeAttribute('data-painted');
      scene.style.removeProperty('zoom');
      canvas.hidden = controls.hidden = true;
      return;
    }
    scene.style.setProperty('zoom', String(zoom));
    scene.setAttribute('data-painted', '');
    scene.setAttribute('data-measuring', '');
    const area = scene.getBoundingClientRect();
    const { days, rows } = snapshot;
    const positions = days.map(day => day.cell.getBoundingClientRect());
    const left = Math.min(...positions.map(rect => rect.left));
    const right = Math.max(...positions.map(rect => rect.right));
    const top = rows[0].getBoundingClientRect().top;
    const bottom = rows[6].getBoundingClientRect().bottom;
    scene.removeAttribute('data-measuring');
    if (left === right || top === bottom || !area.width || !area.height) {
      scene.removeAttribute('data-painted');
      scene.style.removeProperty('zoom');
      canvas.hidden = controls.hidden = true;
      return;
    }
    const columns = Math.max(...days.map(day => day.column)) + 1;
    const columnStep = (right - left) / zoom / (columns + 1);
    const rowStep = (bottom - top) / zoom / 7.5;
    const originX = (left - area.left) / zoom;
    const originY = (top - area.top) / zoom;
    const pixelRatio = Math.min(window.devicePixelRatio * zoom, 4);
    canvas.width = Math.ceil(area.width / zoom * pixelRatio);
    canvas.height = Math.ceil(area.height / zoom * pixelRatio);
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.fillStyle = 'rgba(124, 124, 121, .18)';
    const halfWidth = columnStep * lotScale;
    const halfHeight = rowStep * lotScale / 2;
    const segments = new Map<string, readonly [Point, Point]>();
    const houses: { x: number; bottom: number; image: HTMLImageElement }[] = [];
    for (const [index, day] of days.entries()) {
      const { cell, row, column, level } = day;
      const parity = column % 2;
      const x = originX + (column + 1) * columnStep;
      const y = originY + (row + parity / 2) * rowStep;
      const center = y + rowStep / 2;
      const rect = positions[index];
      cell.style.setProperty('--codeyears-x', `${x - (rect.left + rect.width / 2 - area.left) / zoom}px`);
      cell.style.setProperty('--codeyears-y', `${center - (rect.top + rect.height / 2 - area.top) / zoom}px`);
      if (!level) continue;
      ctx.beginPath();
      ctx.moveTo(x, center - halfHeight);
      ctx.lineTo(x + halfWidth, center);
      ctx.lineTo(x, center + halfHeight);
      ctx.lineTo(x - halfWidth, center);
      ctx.fill();
      const options = buildings[level];
      const seed = Number(day.date.replaceAll('-', '')) ^ modelSeed;
      const mixed = Math.imul(seed ^ (seed >>> 16), 0x45d9f3b);
      const image = pictures.get(options[((mixed ^ (mixed >>> 16)) >>> 0) % options.length])!;
      houses.push({ x, bottom: center + halfHeight, image });
      const halfRow = row * 2 + parity;
      const corners: Point[] = [[column + 1, halfRow], [column + 2, halfRow + 1], [column + 1, halfRow + 2], [column, halfRow + 1]];
      for (const [i, point] of corners.entries()) {
        const other = corners[(i + 1) % corners.length];
        const [a, b] = point[0] < other[0] ? [point, other] : [other, point];
        segments.set(a.join(',') + '|' + b.join(','), [a, b]);
      }
    }
    const strip = pictures.get('asphalt-strip.png')!;
    const thickness = rowStep * 0.19;
    const extension = thickness * 0.2;
    for (const [[x1, y1], [x2, y2]] of segments.values()) {
      const dx = (x2 - x1) * columnStep;
      const dy = (y2 - y1) * rowStep / 2;
      ctx.save();
      ctx.translate(originX + x1 * columnStep, originY + y1 * rowStep / 2);
      ctx.rotate(Math.atan2(dy, dx));
      ctx.drawImage(strip, -extension, -thickness / 2, Math.hypot(dx, dy) + 2 * extension, thickness);
      ctx.restore();
    }
    const houseWidth = 2 * halfWidth;
    for (const house of houses.sort((a, b) => a.bottom - b.bottom)) {
      const height = houseWidth * house.image.naturalHeight / house.image.naturalWidth;
      ctx.drawImage(house.image, house.x - houseWidth / 2, house.bottom - height, houseWidth, height);
    }
    canvas.hidden = controls.hidden = false;
  }

  function schedule() {
    if (!frame && !disposed) frame = requestAnimationFrame(paint);
  }
  input.addEventListener('input', () => {
    zoom = input.valueAsNumber / 100;
    scaleLabel.value = input.value + '%';
    input.setAttribute('aria-valuetext', text(language, 'zoomLevel', [input.value]));
    schedule();
  });

  const updates = new MutationObserver(updateDays);
  const resize = new ResizeObserver(schedule);
  localize(initialLanguage);
  void loadAssets().then(loaded => {
    if (disposed || !grid.isConnected) return;
    pictures = loaded;
    scroller.before(controls);
    grid.before(scene);
    scene.append(style, canvas, grid);
    grid.addEventListener('focusin', selectDay);
    grid.addEventListener('click', selectDay);
    updates.observe(grid, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-ix', 'data-level', 'data-date'] });
    resize.observe(scene);
    updateDays();
  }, () => { /* Leave the native chart visible if the local artwork did not load. */ });

  return {
    localize,
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      updates.disconnect();
      resize.disconnect();
      grid.removeEventListener('focusin', selectDay);
      grid.removeEventListener('click', selectDay);
      for (const cell of grid.querySelectorAll<HTMLElement>('td.ContributionCalendar-day')) {
        cell.style.removeProperty('--codeyears-x');
        cell.style.removeProperty('--codeyears-y');
      }
      if (grid.parentElement === scene) scene.replaceWith(grid);
      else scene.remove();
      controls.remove();
      canvas.width = canvas.height = 0;
    },
  };
}
