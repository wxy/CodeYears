const sceneClass = 'codeyears-miniature-scene';
const buildings = [
  [],
  ['garden.webp', 'cottage.webp', 'courtyard.webp'],
  ['terrace.webp', 'mansard.webp', 'clinic.webp'],
  ['limestone.webp', 'apartment.webp', 'duplex.webp'],
  ['office-blue.webp', 'office-amber.webp', 'tower-green.webp'],
] as const;
const files = [...buildings.flat(), 'asphalt-strip.png'];
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
  .${sceneClass} { position: relative; isolation: isolate; }
  .${sceneClass} > table { position: relative; z-index: 1; }
  .${sceneClass} > canvas {
    position: absolute; pointer-events: none; border-radius: 3px;
    background-color: color-mix(in srgb, var(--bgColor-muted, #f6f8fa) 90%, var(--fgColor-muted, #59636e));
  }
  .${sceneClass}[data-painted]:not([data-measuring]) td[data-date][data-level] {
    translate: var(--codeyears-x, 0px) var(--codeyears-y, 0px);
    background-color: transparent !important; box-shadow: none !important;
  }
  .${sceneClass}[data-painted] td[data-date]:is([aria-selected="true"], :focus-visible) {
    outline: 2px solid var(--fgColor-accent, #0969da); outline-offset: -1px;
  }
  [data-codeyears-miniature-legend] {
    position: relative;
    background-color: transparent !important; box-shadow: none !important;
  }
  [data-codeyears-miniature-legend] > img {
    position: absolute; inset-inline-start: -1px; inset-block-end: -1px;
    width: 12px; height: 13px; object-fit: contain; object-position: center bottom; pointer-events: none;
  }
  [data-codeyears-miniature-legend="0"] {
    background-color: var(--bgColor-neutral-muted, #d0d7de) !important;
    clip-path: polygon(50% 20%, 100% 50%, 50% 80%, 0 50%);
  }
`;

export function mountMiniatureCalendar(grid: HTMLTableElement, initialRoads: boolean) {
  const scroller = grid.parentElement!;
  const graph = grid.closest('.js-calendar-graph');
  const style = document.createElement('style');
  style.textContent = sceneCss;
  const canvas = document.createElement('canvas');
  canvas.id = 'codeyears-miniature-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.hidden = true;
  const swatches = new Map<HTMLElement, HTMLImageElement | undefined>();
  let snapshot: ReturnType<typeof readDays>;
  let pictures: Map<string, HTMLImageElement> | undefined;
  let showRoads = initialRoads;
  let frame = 0;
  let disposed = false;

  function resetLegend() {
    for (const [swatch, icon] of swatches) {
      swatch.removeAttribute('data-codeyears-miniature-legend');
      icon?.remove();
    }
    swatches.clear();
  }

  function paintLegend() {
    for (const [level, options] of buildings.entries()) {
      const swatch = graph?.querySelector<HTMLElement>('#contribution-graph-legend-level-' + level);
      if (!swatch || swatches.has(swatch)) continue;
      swatch.dataset.codeyearsMiniatureLegend = String(level);
      let icon: HTMLImageElement | undefined;
      if (options.length) {
        icon = document.createElement('img');
        icon.src = pictures!.get(options[0])!.src;
        icon.alt = '';
        swatch.append(icon);
      }
      swatches.set(swatch, icon);
    }
  }

  function updateDays() {
    snapshot = readDays(grid);
    schedule();
  }

  function hide() {
    scroller.removeAttribute('data-painted');
    canvas.hidden = true;
    resetLegend();
  }

  function paint() {
    frame = 0;
    if (!pictures || !snapshot || !grid.isConnected) { hide(); return; }
    scroller.setAttribute('data-measuring', '');
    const area = scroller.getBoundingClientRect();
    const { days, rows } = snapshot;
    const positions = days.map(day => day.cell.getBoundingClientRect());
    const left = Math.min(...positions.map(rect => rect.left));
    const right = Math.max(...positions.map(rect => rect.right));
    const top = rows[0].getBoundingClientRect().top;
    const bottom = rows[6].getBoundingClientRect().bottom;
    scroller.removeAttribute('data-measuring');
    const width = right - left, height = bottom - top;
    if (!width || !height || !area.width) { hide(); return; }

    // 以原生日格的矩形为画布边界，图层绝对定位，不给表格加行或留白。
    canvas.style.left = `${left - area.left + scroller.scrollLeft - scroller.clientLeft}px`;
    canvas.style.top = `${top - area.top + scroller.scrollTop - scroller.clientTop}px`;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const columns = Math.max(...days.map(day => day.column)) + 1;
    const columnStep = width / (columns + 1);
    const rowStep = height / 7.5;
    const pixelRatio = Math.min(window.devicePixelRatio, 3);
    canvas.width = Math.ceil(width * pixelRatio);
    canvas.height = Math.ceil(height * pixelRatio);
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    ctx.fillStyle = 'rgba(127, 127, 125, .19)';
    const halfWidth = columnStep * lotScale;
    const halfHeight = rowStep * lotScale / 2;
    const segments = new Map<string, readonly [Point, Point]>();
    const houses: { x: number; bottom: number; image: HTMLImageElement }[] = [];
    for (const [index, day] of days.entries()) {
      const { cell, row, column, level } = day;
      const parity = column % 2;
      const x = (column + 1) * columnStep;
      const center = (row + parity / 2 + 0.5) * rowStep;
      const rect = positions[index];
      cell.style.setProperty('--codeyears-x', `${x - (rect.left + rect.width / 2 - left)}px`);
      cell.style.setProperty('--codeyears-y', `${center - (rect.top + rect.height / 2 - top)}px`);
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
      if (!showRoads) continue;
      const halfRow = row * 2 + parity;
      const corners: Point[] = [[column + 1, halfRow], [column + 2, halfRow + 1], [column + 1, halfRow + 2], [column, halfRow + 1]];
      for (const [i, point] of corners.entries()) {
        const other = corners[(i + 1) % corners.length];
        const [a, b] = point[0] < other[0] ? [point, other] : [other, point];
        segments.set(a.join(',') + '|' + b.join(','), [a, b]);
      }
    }
    const strip = pictures.get('asphalt-strip.png')!;
    const thickness = rowStep * 0.16;
    const extension = thickness * 0.2;
    ctx.globalAlpha = 0.48;
    for (const [[x1, y1], [x2, y2]] of segments.values()) {
      const dx = (x2 - x1) * columnStep;
      const dy = (y2 - y1) * rowStep / 2;
      ctx.save();
      ctx.translate(x1 * columnStep, y1 * rowStep / 2);
      ctx.rotate(Math.atan2(dy, dx));
      ctx.drawImage(strip, -extension, -thickness / 2, Math.hypot(dx, dy) + 2 * extension, thickness);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    for (const house of houses.sort((a, b) => a.bottom - b.bottom)) {
      const aspect = house.image.naturalWidth / house.image.naturalHeight;
      const width = Math.min(2 * halfWidth, Math.min(house.bottom, rowStep * 2.45) * aspect);
      const height = width / aspect;
      ctx.drawImage(house.image, house.x - width / 2, house.bottom - height, width, height);
    }
    paintLegend();
    canvas.hidden = false;
    scroller.setAttribute('data-painted', '');
  }

  function schedule() {
    if (!frame && !disposed) frame = requestAnimationFrame(paint);
  }

  const updates = new MutationObserver(updateDays);
  const resize = new ResizeObserver(schedule);
  void loadAssets().then(loaded => {
    if (disposed || !grid.isConnected) return;
    pictures = loaded;
    scroller.classList.add(sceneClass);
    grid.before(style, canvas);
    updates.observe(grid, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-ix', 'data-level', 'data-date'] });
    resize.observe(grid);
    updateDays();
  }, () => { /* Leave the native chart available if the local artwork did not load. */ });

  return {
    setRoads(roads: boolean) {
      showRoads = roads;
      schedule();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      updates.disconnect();
      resize.disconnect();
      hide();
      scroller.classList.remove(sceneClass);
      for (const cell of grid.querySelectorAll<HTMLElement>('td.ContributionCalendar-day')) {
        cell.style.removeProperty('--codeyears-x');
        cell.style.removeProperty('--codeyears-y');
      }
      style.remove();
      canvas.remove();
      canvas.width = canvas.height = 0;
    },
  };
}
