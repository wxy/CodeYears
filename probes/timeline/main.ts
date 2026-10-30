import { createTimeline } from "../../src/timeline/controller";

const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
// Runtime-only synthetic calendar, independent of any request or cache.
const days: string[] = [];
for (let time = Date.UTC(2006, 0, 1); time < Date.UTC(2026, 0, 1); time += 86400000) {
  days.push(new Date(time).toISOString().slice(0, 10));
}

let timeline: ReturnType<typeof createTimeline> | null = createTimeline(days.length);
let raf = 0;
let frameCallbacks = 0;
let displayUpdates = 0;

function snapshot() {
  return {
    loadedDays: days.length,
    state: timeline?.getState() ?? null,
    pendingFrame: raf !== 0,
    frameCallbacks,
    displayUpdates,
    closed: timeline === null,
  };
}

function render() {
  const state = timeline?.getState();
  const revealedDays = state?.revealedDays ?? 0;
  displayUpdates++;
  element("loaded-count").textContent = String(days.length);
  element("revealed-count").textContent = String(revealedDays);
  for (const id of ["loaded", "revealed"]) element<HTMLProgressElement>(id).max = days.length;
  element<HTMLProgressElement>("loaded").value = days.length;
  element<HTMLProgressElement>("revealed").value = revealedDays;
  element("date").textContent = revealedDays === 0 ? "起点 · 2006-01-01 尚未呈现" : `呈现至 ${days[revealedDays - 1]}`;
  const labels = { idle: "待播放", playing: "播放中", paused: "已暂停", completed: "已完成" };
  element("status").textContent = state ? labels[state.status] : "演示已关闭，可重新打开从起点播放。";
  element<HTMLButtonElement>("play").disabled = state?.status !== "idle";
  element<HTMLButtonElement>("pause").disabled = state?.status !== "playing";
  element<HTMLButtonElement>("resume").disabled = state?.status !== "paused";
  element<HTMLButtonElement>("skip").disabled = !state || state.status === "completed";
  element<HTMLButtonElement>("replay").disabled = !state;
  element<HTMLButtonElement>("close").disabled = !state;
  element<HTMLButtonElement>("open").disabled = !!state;
  element("metrics").textContent = JSON.stringify(snapshot(), null, 2);
}

function syncSchedule() {
  if (timeline?.getState().status === "playing" && !document.hidden) {
    if (!raf) raf = requestAnimationFrame(tick);
  } else {
    cancelAnimationFrame(raf);
    raf = 0;
  }
}

function tick(nowMs: number) {
  raf = 0;
  frameCallbacks++;
  timeline?.advance(nowMs);
  syncSchedule();
  render();
}

function update(action: () => void) {
  action();
  syncSchedule();
  render();
}

function close() {
  update(() => { timeline = null; });
}

element("play").onclick = element("resume").onclick = () => update(() => timeline?.play(performance.now()));
element("pause").onclick = () => update(() => timeline?.pause());
element("skip").onclick = () => update(() => timeline?.skip());
element("replay").onclick = () => update(() => timeline?.replay(performance.now()));
element("close").onclick = close;
element("open").onclick = () => update(() => { timeline = createTimeline(days.length); });
document.addEventListener("visibilitychange", () => {
  // Visibility policy belongs to the caller. Return to the tab and press Continue.
  if (document.hidden && timeline?.getState().status === "playing") update(() => timeline?.pause());
});
window.addEventListener("pagehide", close);
Object.assign(window, { timelineProbe: { snapshot } });
render();
