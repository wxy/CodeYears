import { cityLegendStyles, createCityLegend } from "./city-legend";
import { readPageContext } from "../platform/github/probe";
import { clearContributionCache } from "../platform/github/load-year";
import { loadContributionHistory } from "../platform/github/load-history";
import { isoYearStart } from "../data/iso-week";
import type { DailyContribution } from "../data/types";
import type { ContributionLandscape } from "../renderers/landscape";
import type { TimelineState } from "../timeline/types";

(() => {
  const existing = document.getElementById("codeyears-data-probe");
  if (existing?.shadowRoot?.querySelector("form")) { existing.scrollIntoView({ block: "center" }); return; }
  existing?.remove();

  const context = readPageContext(document, new URL(location.href));
  const years = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[id^="year-link-"]'))
    .map(link => Number(link.id.slice("year-link-".length)))
    .filter(year => Number.isInteger(year) && year >= 2008 && year <= new Date().getFullYear())
    .sort((a, b) => b - a);
  if (!years.length) throw new Error("当前页面没有可识别的年度入口。");

  const host = document.createElement("section");
  host.id = "codeyears-data-probe";
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      ${cityLegendStyles}
      :host { display:block; margin:16px 0; font:14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:var(--fgColor-default,#1f2328); }
      * { box-sizing:border-box; } .panel { padding:20px; border:1px solid var(--borderColor-default,#d1d9e0); border-radius:16px; background:var(--bgColor-default,#fff); }
      header, form { display:flex; align-items:center; flex-wrap:wrap; gap:10px; } header { justify-content:space-between; }
      h2 { margin:0; font-size:22px; letter-spacing:-.03em; } p { margin:8px 0; } .note { color:var(--fgColor-muted,#59636e); font-size:12px; }
      select, button { font:inherit; padding:6px 12px; border-radius:8px; border:1px solid var(--borderColor-default,#d1d9e0); background:var(--bgColor-muted,#f6f8fa); color:var(--fgColor-default,#1f2328); }
      button { cursor:pointer; } button:disabled { cursor:default; opacity:.5; } button.primary { background:#245b3c; color:white; }
      output { display:block; margin:12px 0; white-space:pre-line; } table { width:100%; border-collapse:collapse; font-variant-numeric:tabular-nums; }
      td,th { padding:3px 10px; text-align:left; border-bottom:1px solid var(--borderColor-default,#d1d9e0); } .days { max-height:280px; overflow:auto; }
      button:active { transform:scale(.97); } button:focus-visible,select:focus-visible { outline:2px solid #268f80; outline-offset:3px; }
      .city { margin:22px 0 8px; overflow:hidden; background:transparent; }
      .city[hidden] { display:none; } .city-head { padding:20px 22px 0; } h3 { margin:0; font-size:18px; letter-spacing:-.02em; }
      #loading-progress { width:100%; accent-color:#268f80; } #loading-progress[hidden] { display:none; }
      #scene { height:580px; min-height:340px; max-height:68vh; background:transparent; } .city-controls { display:flex; flex-wrap:wrap; align-items:center; gap:8px; padding:12px 18px 18px; }
      output:empty, button[hidden] { display:none; } details { margin-top:12px; } summary { cursor:pointer; } .data-actions { display:flex; flex-wrap:wrap; gap:8px; margin:10px 0; }
      #progress { flex:1 1 190px; color:var(--fgColor-muted,#59636e); font-size:12px; font-variant-numeric:tabular-nums; }
    </style>
    <div class="panel">
      <header><div><h2>CodeYears</h2><p class="note">代码岁月，自成风景。</p></div><button id="close" type="button">关闭 CodeYears</button></header>
      <form><label>从 <select id="start-year" aria-label="起始 ISO 周年"></select></label><label>到 <select id="year" aria-label="结束 ISO 周年"></select></label><button class="primary" id="run" type="submit">生成贡献之城</button><button id="cancel" type="button" hidden disabled>取消</button></form>
      <p class="note">ISO 周年：周一至周日归周四所在年，源日期不变；合计可能与 GitHub 公历年度不同。</p>
      <output id="status" role="status" aria-live="polite">选择 ISO 周年范围，生成你的贡献之城。</output>
      <progress id="loading-progress" value="0" max="1" hidden aria-label="公历源年加载进度"></progress>
      <section class="city" id="city" hidden aria-label="贡献之城">
        <div class="city-head"><h3 id="city-title">贡献之城</h3><p class="note" id="city-summary"></p></div>
        <div id="scene"></div>
        <div class="city-controls"><span id="progress"></span><button id="zoom-out" type="button" aria-label="缩小景观">−</button><button id="zoom-in" type="button" aria-label="放大景观">＋</button><button id="reset-view" type="button">重置视图</button><button id="pause" type="button">暂停</button><button id="skip" type="button">跳过动画</button><button id="replay" type="button">重播</button><button id="close-city" type="button">关闭城市</button></div>
      </section>
      <details id="data-settings"><summary>设置与数据说明</summary>
        <p id="identity" class="note"></p>
        <p class="note">显示当前 GitHub 会话可见的真实每日贡献；数量以明细为准。数据只缓存在本机，按访问者与主页隔离。刷新会重新请求所选年份，清除仅影响当前访问者在此主页的缓存。</p>
        <p class="note">所选年份为 ISO 周年，完整周归入周四所在年。边界所需日期从相邻公历年读取，缓存仍按公历年保存；周年合计只包含范围内的源日期。未提供或未来日期不会补零。</p>
        <div class="data-actions"><button id="refresh" type="button">刷新所选年份</button><button id="clear" type="button">清除此主页缓存</button></div>
      </details>
      <details id="details" hidden><summary>查看真实每日数量</summary><div class="days"><table><thead><tr><th>日期</th><th>贡献数量</th></tr></thead><tbody></tbody></table></div></details>
    </div>`;
  const cityLegend = createCityLegend();
  shadow.querySelector("#data-settings")!.append(cityLegend);
  const select = shadow.querySelector<HTMLSelectElement>("#year")!;
  const startSelect = shadow.querySelector<HTMLSelectElement>("#start-year")!;
  for (const year of years) {
    select.add(new Option(`${year} ISO`, String(year)));
    startSelect.add(new Option(`${year} ISO`, String(year)));
  }
  startSelect.value = String(years[Math.min(2, years.length - 1)]);
  const identity = context.viewer.state === "unknown" ? "身份未识别" : context.viewer.identity.kind === "signed-out" ? "未登录" : `已登录访问者 ${context.viewer.identity.login}`;
  shadow.querySelector("#identity")!.textContent = `主页 ${context.profileLogin} · ${identity}`;
  const form = shadow.querySelector("form")!;
  const run = shadow.querySelector<HTMLButtonElement>("#run")!;
  const refresh = shadow.querySelector<HTMLButtonElement>("#refresh")!;
  const clear = shadow.querySelector<HTMLButtonElement>("#clear")!;
  const cancel = shadow.querySelector<HTMLButtonElement>("#cancel")!;
  const status = shadow.querySelector<HTMLOutputElement>("#status")!;
  const loadingProgress = shadow.querySelector<HTMLProgressElement>("#loading-progress")!;
  const details = shadow.querySelector<HTMLDetailsElement>("#details")!;
  const body = shadow.querySelector("tbody")!;
  const cityBox = shadow.querySelector<HTMLElement>("#city")!;
  const cityHost = shadow.querySelector<HTMLElement>("#scene")!;
  const progress = shadow.querySelector<HTMLElement>("#progress")!;
  const pause = shadow.querySelector<HTMLButtonElement>("#pause")!;
  shadow.querySelector<HTMLButtonElement>("#reset-view")!.onclick = () => city?.resetView();
  let city: ContributionLandscape | undefined;
  let timelineState: TimelineState | undefined;
  let visibleDays: readonly DailyContribution[] = [];
  const disposeCity = () => { city?.dispose(); city = undefined; timelineState = undefined; cityBox.hidden = true; cityHost.replaceChildren(); };
  let controller: AbortController | undefined;
  const currentContext = () => readPageContext(document, new URL(location.href));
  const resetResult = () => { disposeCity(); details.hidden = true; details.open = false; visibleDays = []; body.replaceChildren(); };
  // 多年份可能有数千天，仅在用户展开时建立明细 DOM。
  details.addEventListener("toggle", () => {
    if (!details.open || body.childElementCount) return;
    const fragment = document.createDocumentFragment();
    for (const day of visibleDays) {
      const row = document.createElement("tr");
      for (const value of [day.date, String(day.count)]) { const cell = document.createElement("td"); cell.textContent = value; row.append(cell); }
      fragment.append(row);
    }
    body.append(fragment);
  });
  const setBusy = (busy: boolean) => {
    run.disabled = refresh.disabled = select.disabled = startSelect.disabled = busy;
    clear.disabled = busy || context.viewer.state === "unknown";
    cancel.disabled = !busy; cancel.hidden = !busy;
  };
  setBusy(false);
  if (context.viewer.state === "unknown") status.textContent = "访问者身份未识别，本次不会读取或写入缓存；仍可联网获取贡献数据。";

  const close = () => {
    controller?.abort();
    disposeCity();
    host.remove();
    window.removeEventListener("pagehide", close);
    document.removeEventListener("turbo:before-cache", close);
    document.removeEventListener("turbo:before-render", close);
    document.removeEventListener("visibilitychange", visibility);
  };
  const visibility = () => {
    if (!document.hidden) return;
    controller?.abort();
    resetResult();
    loadingProgress.hidden = true;
    status.textContent = "页面进入后台，结果已清除；返回后重新读取时会核对当前身份。";
  };
  shadow.querySelector("#close")!.addEventListener("click", close);
  window.addEventListener("pagehide", close);
  document.addEventListener("turbo:before-cache", close);
  document.addEventListener("turbo:before-render", close);
  document.addEventListener("visibilitychange", visibility);
  cancel.addEventListener("click", () => controller?.abort());
  const load = async (forceRefresh: boolean) => {
    const start = Number(startSelect.value), end = Number(select.value);
    if (start > end) { status.textContent = "起始年份不能晚于结束年份。"; return; }
    const windowStart = isoYearStart(start), windowEnd = isoYearStart(end + 1);
    const firstNeeded = new Date(windowStart).getUTCFullYear();
    const lastNeeded = new Date(windowEnd - 86400000).getUTCFullYear();
    const now = new Date(), calendarYear = now.getFullYear();
    const firstSource = Math.max(firstNeeded, years.at(-1)!);
    const lastSource = Math.min(lastNeeded, years[0], calendarYear);
    const requestedYears = Array.from({ length: lastSource - firstSource + 1 }, (_, index) => firstSource + index);
    const firstDate = new Date(windowStart).toISOString().slice(0, 10);
    const endDate = new Date(windowEnd).toISOString().slice(0, 10);
    const range = `${start === end ? start : `${start}–${end}`} ISO 周年`;
    const request = new AbortController();
    controller = request;
    setBusy(true);
    resetResult();
    loadingProgress.max = requestedYears.length; loadingProgress.value = 0; loadingProgress.hidden = false;
    status.textContent = "正在确认身份并读取所需公历年度…";
    let completedYears = 0;
    const warnings = new Set<string>();
    if (firstSource > firstNeeded || (lastSource < lastNeeded && lastNeeded <= calendarYear)) {
      warnings.add("可用公历年度不足，所选周年边界不完整；仅保留已提供的真实日期。");
    }
    if (windowEnd > Date.UTC(calendarYear, now.getMonth(), now.getDate()) + 86400000) {
      warnings.add("所选 ISO 周年尚未结束，仅显示已提供的真实日期，不补未来零值。");
    }
    try {
      const history = await loadContributionHistory(context, requestedYears, forceRefresh, request.signal, currentContext, progress => {
        completedYears = progress.history.providedYears.length;
        if (progress.warning) warnings.add(progress.warning);
        loadingProgress.value = progress.history.providedYears.length;
        status.textContent = `正在读取 ${range} · ${completedYears} / ${requestedYears.length} 个公历源年${warnings.size ? `\n${[...warnings].join(" ")}` : ""}`;
      });
      request.signal.throwIfAborted();
      if (!host.isConnected) throw new Error("页面已离开，请重新打开 CodeYears。");
      visibleDays = history.days.filter(day => firstDate <= day.date && day.date < endDate);
      if (!visibleDays.length) {
        status.textContent = `所选 ISO 周年尚无已提供的日期。${warnings.size ? `\n${[...warnings].join(" ")}` : ""}`;
        return;
      }
      const total = visibleDays.reduce((sum, day) => sum + day.count, 0);
      status.textContent = [...warnings].join(" ");
      details.hidden = false;
      {
        const module = await import(/* @vite-ignore */ chrome.runtime.getURL("landscape.js")) as typeof import("../renderers/landscape");
        request.signal.throwIfAborted();
        if (!host.isConnected) throw new Error("页面已离开，请重新打开 CodeYears。");
        cityBox.hidden = false;
        shadow.querySelector("#city-title")!.textContent = `${range} · 贡献之城`;
        shadow.querySelector("#city-summary")!.textContent = `${total.toLocaleString()} 次贡献 · 拖动平移，滚轮缩放`;
        try {
          city = module.createLandscape(cityHost, visibleDays, (state, error) => {
            if (error) status.textContent = error;
            timelineState = state;
            progress.textContent = cityHost.querySelector("canvas")
              ? `城市生长 · ${Math.round(state.revealedDays / state.totalDays * 100)}%` : "正在准备城市…";
            pause.textContent = state.status === "paused" ? "继续" : "暂停";
            pause.disabled = state.status === "completed";
          }, "city");
        } catch (error) { disposeCity(); throw error; }
      }
    } catch (error) {
      if (!document.hidden) status.textContent = `${request.signal.aborted ? "请求已取消。" : error instanceof Error ? error.message : "请求失败，请重新打开 CodeYears。"}\n已读取 ${completedYears} / ${requestedYears.length} 个公历源年，本次未生成风景；下次会重新确认身份并复用可用的年度缓存。`;
    } finally {
      loadingProgress.hidden = true; setBusy(false); controller = undefined;
    }
  };
  form.addEventListener("submit", event => { event.preventDefault(); void load(false); });
  refresh.addEventListener("click", () => { void load(true); });
  pause.addEventListener("click", () => timelineState?.status === "paused" ? city?.resume() : city?.pause());
  shadow.querySelector("#skip")!.addEventListener("click", () => city?.skip());
  shadow.querySelector("#replay")!.addEventListener("click", () => city?.replay());
  shadow.querySelector("#zoom-out")!.addEventListener("click", () => city?.zoomBy(0.8));
  shadow.querySelector("#zoom-in")!.addEventListener("click", () => city?.zoomBy(1.25));
  shadow.querySelector("#close-city")!.addEventListener("click", disposeCity);
  clear.addEventListener("click", async () => {
    const request = new AbortController();
    controller = request;
    setBusy(true); cancel.disabled = true; resetResult();
    status.textContent = "正在确认身份并清除此主页缓存…";
    try {
      await clearContributionCache(context, request.signal, currentContext);
      if (!document.hidden && host.isConnected) status.textContent = "已清除此访问者在当前主页的年度缓存。";
    } catch (error) {
      if (!document.hidden) status.textContent = error instanceof Error ? error.message : "缓存清除失败。";
    } finally { setBusy(false); controller = undefined; }
  });
  document.querySelector(".js-yearly-contributions")!.prepend(host);
  host.scrollIntoView({ block: "center" });
})();
