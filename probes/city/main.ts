import { createCityPreview, type CityPreview } from "../../src/renderers/city-preview";
import { generateDays, type Density } from "../../src/renderers/probe/data";

const scene = document.querySelector<HTMLElement>("#scene")!;
const progress = document.querySelector<HTMLElement>("#progress")!;
const pause = document.querySelector<HTMLButtonElement>("#pause")!;
const density = document.querySelector<HTMLSelectElement>("#density")!;
let city: CityPreview | undefined;
let paused = false;
function show() {
  city?.dispose();
  const days = generateDays(density.value as Density).filter(day => day.date.startsWith("2024-"));
  document.querySelector("#summary")!.textContent = `${days.length} 天 · ${days.reduce((sum, day) => sum + day.count, 0).toLocaleString()} 次示例贡献`;
  city = createCityPreview(scene, days, (state, error) => {
    paused = state.status === "paused";
    pause.textContent = paused ? "继续" : "暂停";
    pause.disabled = state.status === "completed";
    progress.textContent = error ?? (state.revealedDays === 0 ? "历史起点 · 从第一天重新生长" : `${days[state.revealedDays - 1].date} · ${state.revealedDays} / ${state.totalDays} 天`);
  });
  city.skip();
}
pause.onclick = () => paused ? city?.resume() : city?.pause();
document.querySelector<HTMLButtonElement>("#skip")!.onclick = () => city?.skip();
document.querySelector<HTMLButtonElement>("#replay")!.onclick = () => city?.replay();
density.onchange = show;
window.addEventListener("pagehide", () => city?.dispose());
show();
