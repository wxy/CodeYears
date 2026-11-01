import { cityLegendStyles, createCityLegend } from "../../src/extension/city-legend";
import { createLandscape, type ContributionLandscape } from "../../src/renderers/landscape";
import type { ViewMode } from "../../src/renderers/types";
import { generateDays, type Density } from "../../src/renderers/probe/data";
import { isoYearStart } from "../../src/data/iso-week";
import { createCityShare } from "../../src/extension/city-share";

const legendStyle = document.createElement("style");
legendStyle.textContent = cityLegendStyles;
document.head.append(legendStyle);
const cityLegend = createCityLegend();
document.querySelector(".controls")!.after(cityLegend);

const scene = document.querySelector<HTMLElement>("#scene")!;
const progress = document.querySelector<HTMLElement>("#progress")!;
const pause = document.querySelector<HTMLButtonElement>("#pause")!;
const density = document.querySelector<HTMLSelectElement>("#density")!;
const range = document.querySelector<HTMLSelectElement>("#range")!;
const view = document.querySelector<HTMLSelectElement>("#view")!;
document.querySelector<HTMLSelectElement>("#appearance")!.onchange = event => {
  document.documentElement.dataset.previewTheme = (event.target as HTMLSelectElement).value;
};
let city: ContributionLandscape | undefined;
const shareRoot = document.createElement("div"); document.body.append(shareRoot);
const shareShadow = shareRoot.attachShadow({mode:"open"});
let share: ReturnType<typeof createCityShare> | undefined;
let displayedRange = "";
const viewName = () => view.value === "city" ? "贡献之城" : "时光山脉";
const legend = document.querySelector<HTMLElement>("#year-legend")!;
let paused = false;
function show() {
  share?.dispose(); share = undefined;
  city?.dispose();
  const start = range.value === "1" ? 2024 : range.value === "3" ? 2023 : 2006;
  const end = range.value === "1" ? 2024 : 2025;
  const first = new Date(isoYearStart(start)).toISOString().slice(0, 10);
  const after = new Date(isoYearStart(end + 1)).toISOString().slice(0, 10);
  const days = generateDays(density.value as Density).filter(day => first <= day.date && day.date < after);
  displayedRange = `${start === end ? start : `${start}–${end}`}`;
  document.querySelector("#year-title")!.textContent = `${displayedRange} · ${viewName()}`;
  document.querySelector("#summary")!.textContent = `${days.length} 天 · ${days.reduce((sum, day) => sum + day.count, 0).toLocaleString()} 次示例贡献`;
  legend.replaceChildren();
  for (let year = start; year <= end; year++) { const item = document.createElement("span"); item.textContent = String(year); item.style.borderColor = "#809484"; legend.append(item); }
  cityLegend.hidden = legend.hidden = view.value !== "city";
  city = createLandscape(scene, days, (state, error, detail) => {
    document.querySelector("#scene-detail")!.textContent = detail ?? "";
    paused = state.status === "paused";
    pause.textContent = paused ? "继续" : "暂停";
    pause.disabled = state.status === "completed";
    progress.textContent = error ?? `景观生长 · ${Math.round(state.revealedDays / state.totalDays * 100)}%`;
  }, view.value as ViewMode, new URL("/assets/city/", location.href).href);
  const landscape = city;
  share = createCityShare(shareShadow, {prepare: () => landscape.exportImage(), range: displayedRange,
    filename: `CodeYears-${start === end ? start : `${start}-${end}`}.png`});
}
pause.onclick = () => paused ? city?.resume() : city?.pause();
document.querySelector<HTMLButtonElement>("#skip")!.onclick = () => city?.skip();
document.querySelector<HTMLButtonElement>("#replay")!.onclick = () => city?.replay();
document.querySelector<HTMLButtonElement>("#zoom-out")!.onclick = () => city?.zoomBy(0.8);
document.querySelector<HTMLButtonElement>("#reset-view")!.onclick = () => city?.resetView();
document.querySelector<HTMLButtonElement>("#zoom-in")!.onclick = () => city?.zoomBy(1.25);
document.querySelector<HTMLButtonElement>("#export")!.onclick = () => { void share?.open(); };
density.onchange = show;
range.onchange = show;
view.onchange = () => { city?.setView(view.value as ViewMode); document.querySelector("#year-title")!.textContent = `${displayedRange} · ${viewName()}`; cityLegend.hidden = legend.hidden = view.value !== "city"; };
window.addEventListener("pagehide", () => { share?.dispose(); city?.dispose(); });
show();
