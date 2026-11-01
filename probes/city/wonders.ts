import { createLandscape, type ContributionLandscape } from '../../src/renderers/landscape';
import { planCityScene } from '../../src/renderers/city-view';
import { generateDays, type Density } from '../../src/renderers/probe/data';
import { isoWeekDate, isoYearStart } from '../../src/data/iso-week';

const $ = <T extends Element>(selector: string) => document.querySelector<T>(selector)!;
const range = $<HTMLSelectElement>('#range'), density = $<HTMLSelectElement>('#density');
let cities: ContributionLandscape[] = [];
const labels: Record<string, string> = { 'wonder-stadium': '体育馆', 'wonder-theater': '剧院', 'wonder-park': '地标公园' };
const close = () => { cities.forEach(city => city.dispose()); cities = []; };
function show() {
  close();
  const start = range.value === '1' ? 2024 : range.value === '3' ? 2023 : 2006, end = range.value === '1' ? 2024 : 2025;
  const first = new Date(isoYearStart(start)).toISOString().slice(0,10), after = new Date(isoYearStart(end+1)).toISOString().slice(0,10);
  const days = generateDays(density.value === 'empty' ? 'sparse' : density.value === 'districts' ? 'regular' : density.value as Density)
    .filter(day => first <= day.date && day.date < after)
    .map((day, index) => {
      if (density.value === 'empty') return { ...day, count: 0 };
      if (density.value !== 'districts') return day;
      const iso = isoWeekDate(day.date), x = iso.week - 1, z = iso.weekday - 1;
      return { ...day, count: x >= 18 && x < 22 && z >= 4 ? 60
        : x >= 30 && x < 33 && z >= 4 ? 50
        : x >= 1 && x <= 40 ? 3 + index % 5 : 0 };
    });
  $('#summary').textContent = `${start}–${end} · ${days.length.toLocaleString()} 天 · ${days.reduce((sum, day) => sum + day.count, 0).toLocaleString()} 次贡献`;
  for (const [id, enabled] of [['ordinary', false], ['wonder', true]] as const) {
    const scene = planCityScene(days, enabled), parcels = scene.weekly.parcels, wonders = parcels.filter(p => p.wonder);
    const indices = parcels.flatMap(p => p.indices), unique = new Set(indices), total = parcels.reduce((sum, p) => sum + p.count, 0);
    const metrics = $<HTMLElement>(`#${id}-metrics`);
    metrics.textContent = `${parcels.length.toLocaleString()} 地块 · ${wonders.length} 奇观 · ${unique.size.toLocaleString()} 个源日期 · ${total.toLocaleString()} 次贡献`;
    metrics.dataset.parcels = String(parcels.length); metrics.dataset.wonders = String(wonders.length);
    metrics.dataset.covered = String(indices.length); metrics.dataset.unique = String(unique.size); metrics.dataset.total = String(total);
    // 保留稳定布局摘要，供手动缩放前后核对；不包含真实用户数据。
    let hash = 2166136261;
    const layout = JSON.stringify(scene.items.map(p => [p.id, p.factor, p.x, p.z, p.w, p.d]));
    for (let i = 0; i < layout.length; i++) hash = Math.imul(hash ^ layout.charCodeAt(i), 16777619) >>> 0;
    metrics.dataset.layout = String(hash);
    if (enabled) $('#wonder-list').textContent = wonders.length
      ? wonders.map(p => `${scene.weekly.districts[p.block].year} · ${labels[p.wonder!]} · ${p.w}×${p.d} / ${p.indices.length} 天 / ${p.count} 次贡献`).join('　｜　')
      : '当前数据没有达到奇观条件，保持普通楼群或自然地块。';
    cities.push(createLandscape($<HTMLElement>(`#${id}`), days, (state, error, detail) => {
      $(`#${id}-status`).textContent = error ?? `景观生长 · ${Math.round(state.revealedDays / state.totalDays * 100)}%`;
      $(`#${id}-detail`).textContent = detail ?? '';
    }, 'city', new URL('/assets/city/', location.href).href, enabled));
  }
}
range.onchange = density.onchange = show;
$<HTMLSelectElement>('#appearance').onchange = e => { document.documentElement.dataset.previewTheme = (e.target as HTMLSelectElement).value; };
for (const [id, action] of [
  ['zoom-out', (city: ContributionLandscape) => city.zoomBy(.8)], ['zoom-in', (city: ContributionLandscape) => city.zoomBy(1.25)],
  ['reset', (city: ContributionLandscape) => city.resetView()], ['replay', (city: ContributionLandscape) => city.replay()],
  ['pause', (city: ContributionLandscape) => city.pause()], ['resume', (city: ContributionLandscape) => city.resume()], ['skip', (city: ContributionLandscape) => city.skip()],
] as const) $<HTMLButtonElement>(`#${id}`).onclick = () => cities.forEach(action);
$<HTMLButtonElement>('#close').onclick = close;
$<HTMLButtonElement>('#generate').onclick = show;
window.addEventListener('pagehide', close, { once: true });
document.documentElement.dataset.previewTheme = 'light';
show();
