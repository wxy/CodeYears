import { createLandscape, type ContributionLandscape } from "../../src/renderers/landscape";
import type { ViewMode } from "../../src/renderers/types";
import { generateDays, type Density } from "../../src/renderers/probe/data";

const scene = document.querySelector<HTMLElement>("#scene")!;
const progress = document.querySelector<HTMLElement>("#progress")!;
const pause = document.querySelector<HTMLButtonElement>("#pause")!;
const density = document.querySelector<HTMLSelectElement>("#density")!;
const range = document.querySelector<HTMLSelectElement>("#range")!;
const view = document.querySelector<HTMLSelectElement>("#view")!;
let city: ContributionLandscape | undefined;
let displayedRange = "";
const viewName = () => view.value === "city" ? "贡献之城" : "时光山脉";
let paused = false;
function show() {
  city?.dispose();
  const start = range.value === "1" ? 2024 : range.value === "3" ? 2023 : 2006;
  const end = range.value === "1" ? 2024 : 2025;
  const days = generateDays(density.value as Density).filter(day => Number(day.date.slice(0, 4)) >= start && Number(day.date.slice(0, 4)) <= end);
  displayedRange = String(start === end ? start : `${start}–${end}`);
  document.querySelector("#year-title")!.textContent = `${displayedRange} · ${viewName()}`;
  document.querySelector("#summary")!.textContent = `${days.length} 天 · ${days.reduce((sum, day) => sum + day.count, 0).toLocaleString()} 次示例贡献`;
  city = createLandscape(scene, days, (state, error, detail) => {
    document.querySelector("#scene-detail")!.textContent = detail ?? "";
    paused = state.status === "paused";
    pause.textContent = paused ? "继续" : "暂停";
    pause.disabled = state.status === "completed";
    progress.textContent = error ?? (state.revealedDays === 0 ? "历史起点 · 从第一天重新生长" : `${days[state.revealedDays - 1].date} · ${state.revealedDays} / ${state.totalDays} 天`);
  }, view.value as ViewMode);
  city.skip();
}
pause.onclick = () => paused ? city?.resume() : city?.pause();
document.querySelector<HTMLButtonElement>("#skip")!.onclick = () => city?.skip();
document.querySelector<HTMLButtonElement>("#replay")!.onclick = () => city?.replay();
document.querySelector<HTMLButtonElement>("#zoom-out")!.onclick = () => city?.zoomBy(0.8);
document.querySelector<HTMLButtonElement>("#zoom-in")!.onclick = () => city?.zoomBy(1.25);
density.onchange = show;
range.onchange = show;
view.onchange = () => { city?.setView(view.value as ViewMode); document.querySelector("#year-title")!.textContent = `${displayedRange} · ${viewName()}`; };
window.addEventListener("pagehide", () => city?.dispose());
show();
