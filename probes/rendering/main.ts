import { generateDays, type Density } from '../../src/renderers/probe/data';
import type { createScene } from '../../src/renderers/probe/scene';
const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
let active: ReturnType<typeof createScene> | undefined, generation = 0, opens = 0, closes = 0;
let lastClosed: unknown = null;
const status = element('status');
function snapshot() { return { opens, closes, canvases: document.querySelectorAll('canvas').length, active: active?.snapshot() ?? null, lastClosed }; }
function inspect() { element('metrics').textContent = JSON.stringify(snapshot(), null, 2); return snapshot(); }
function close() { generation++; if (active) { active.dispose(); lastClosed = active.snapshot(); active = undefined; closes++; } inspect(); }
async function open() {
  close(); const ticket = generation; status.textContent = '正在按需加载本地 Three.js…';
  const density = element<HTMLSelectElement>('density').value as Density;
  const mode = element<HTMLSelectElement>('mode').value as 'city' | 'terrain';
  const natural = element<HTMLSelectElement>('theme').value === 'Natural';
  try {
    const { createScene } = await import('../../src/renderers/probe/scene');
    if (ticket !== generation) return;
    active = createScene(element('scene'), generateDays(density), mode, natural); opens++;
    status.textContent = `${mode} / ${density} / 7305 天；生长约 8 秒，指标按按钮读取。`; inspect();
  } catch (error) { if (ticket === generation) status.textContent = `无法启动 WebGL：${String(error)}`; }
}
element('open').onclick = open;
element('close').onclick = () => { close(); status.textContent = '已关闭并释放 WebGL。'; };
for (const action of ['pause', 'resume', 'skip'] as const) element(action).onclick = () => { active?.[action](); inspect(); };
element('inspect').onclick = inspect;
window.addEventListener('pagehide', close);
// Browser diagnostics can call this without a polling loop in the prototype.
Object.assign(window, { renderProbe: { snapshot, open, close, generateDays } });
