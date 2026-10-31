import { readPageContext } from "../platform/github/probe";
import { clearContributionCache } from "../platform/github/load-year";
import { loadContributionHistory } from "../platform/github/load-history";
import type { DailyContribution } from "../data/types";
import type { ContributionLandscape } from "../renderers/landscape";
import type { ViewMode } from "../renderers/types";
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
      #year-summary { display:flex; flex-wrap:wrap; gap:6px 16px; padding:0 22px; color:var(--fgColor-muted,#59636e); font-size:12px; }
      #year-summary span { padding-left:8px; border-left:3px solid; }
      #scene { height:580px; min-height:340px; max-height:68vh; background:transparent; } .city-controls { display:flex; flex-wrap:wrap; align-items:center; gap:8px; padding:12px 18px 18px; }
      #progress { flex:1 1 190px; color:var(--fgColor-muted,#59636e); font-size:12px; font-variant-numeric:tabular-nums; }
    </style>
    <div class="panel">
      <header><div><h2>CodeYears</h2><p class="note">代码岁月，自成风景。</p></div><button id="close" type="button">关闭 CodeYears</button></header>
      <p id="identity"></p>
      <p class="note">从一片平地，长出你的城市与山脉。城市地块从平地、草木到建筑表达贡献强度；标定单元居中留距，年度街区按季度道路分段，同星期几横向相邻。五年景观带仅作装饰，山脉保持连续。</p>
      <form><label>从 <select id="start-year" aria-label="起始年份"></select></label><label>到 <select id="year" aria-label="结束年份"></select></label><label>视图 <select id="view" aria-label="贡献视图"><option value="city">City · 贡献之城</option><option value="terrain">Terrain · 时光山脉</option></select></label><button class="primary" id="run" type="submit">生成贡献之城</button><button id="inspect" type="button">仅查看每日数据</button><button id="refresh" type="button">强制刷新</button><button id="clear" type="button">清除此主页缓存</button><button id="cancel" type="button" disabled>取消请求</button></form>
      <output id="status" role="status" aria-live="polite">选择年份范围，开始呈现你的代码岁月。</output>
      <progress id="loading-progress" value="0" max="1" hidden aria-label="年度加载进度"></progress>
      <section class="city" id="city" hidden aria-label="贡献风景">
        <div class="city-head"><h3 id="city-title">贡献之城</h3><p class="note" id="city-summary"></p></div>
        <div id="year-summary" aria-label="各年贡献概览"></div>
        <p class="note" id="scene-detail" style="padding:0 22px"></p>
        <div id="scene"></div>
        <div class="city-controls"><span id="progress"></span><button id="zoom-out" type="button" aria-label="缩小景观">−</button><button id="zoom-in" type="button" aria-label="放大景观">＋</button><button id="reset-view" type="button">重置视图</button><button id="pause" type="button">暂停</button><button id="skip" type="button">跳过动画</button><button id="replay" type="button">重播</button><button id="close-city" type="button">关闭风景</button></div>
      </section>
      <details id="details" hidden><summary>查看真实每日数量</summary><div class="days"><table><thead><tr><th>日期</th><th>贡献数量</th></tr></thead><tbody></tbody></table></div></details>
    </div>`;
  const select = shadow.querySelector<HTMLSelectElement>("#year")!;
  const startSelect = shadow.querySelector<HTMLSelectElement>("#start-year")!;
  const viewSelect = shadow.querySelector<HTMLSelectElement>("#view")!;
  for (const year of years) {
    select.add(new Option(String(year), String(year)));
    startSelect.add(new Option(String(year), String(year)));
  }
  startSelect.value = String(years[Math.min(2, years.length - 1)]);
  const identity = context.viewer.state === "unknown" ? "身份未识别" : context.viewer.identity.kind === "signed-out" ? "未登录" : `已登录访问者 ${context.viewer.identity.login}`;
  shadow.querySelector("#identity")!.textContent = `主页 ${context.profileLogin} · ${identity}`;
  const form = shadow.querySelector("form")!;
  const run = shadow.querySelector<HTMLButtonElement>("#run")!;
  const refresh = shadow.querySelector<HTMLButtonElement>("#refresh")!;
  const inspect = shadow.querySelector<HTMLButtonElement>("#inspect")!;
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
  let displayedRange = "";
  const viewName = () => viewSelect.value === "city" ? "贡献之城" : "时光山脉";
  viewSelect.addEventListener("change", () => {
    run.textContent = `生成${viewName()}`;
    if (city) {
      city.setView(viewSelect.value as ViewMode);
      shadow.querySelector("#city-title")!.textContent = `${displayedRange} · ${viewName()}`;
    }
  });
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
    run.disabled = refresh.disabled = inspect.disabled = select.disabled = startSelect.disabled = busy;
    clear.disabled = busy || context.viewer.state === "unknown";
    cancel.disabled = !busy;
  };
  setBusy(false);

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
  const load = async (forceRefresh: boolean, showCity: boolean) => {
    const start = Number(startSelect.value), end = Number(select.value);
    if (start > end) { status.textContent = "起始年份不能晚于结束年份。"; return; }
    const requestedYears = Array.from({ length: end - start + 1 }, (_, index) => start + index);
    const range = start === end ? String(start) : `${start}–${end}`;
    const request = new AbortController();
    controller = request;
    setBusy(true);
    resetResult();
    loadingProgress.max = requestedYears.length; loadingProgress.value = 0; loadingProgress.hidden = false;
    status.textContent = "正在确认身份并读取所选年度…";
    let networkYears = 0, cacheYears = 0;
    const warnings = new Set<string>();
    try {
      const history = await loadContributionHistory(context, requestedYears, forceRefresh, request.signal, currentContext, progress => {
        if (progress.source === "network") networkYears++; else cacheYears++;
        if (progress.warning) warnings.add(progress.warning);
        loadingProgress.value = progress.history.providedYears.length;
        status.textContent = `${range} · 已读取 ${loadingProgress.value} / ${requestedYears.length} 年\n最近完成 ${progress.year} 年（${progress.source === "cache" ? "本地缓存" : "网络"}）；全部完成后生成风景。\n${[...warnings].join(" ")}`.trim();
      });
      request.signal.throwIfAborted();
      if (!host.isConnected) throw new Error("页面已离开，请重新打开 CodeYears。");
      visibleDays = history.days;
      const total = history.days.reduce((sum, day) => sum + day.count, 0);
      status.textContent = `${range} · ${requestedYears.length} 年 · ${history.days.length} 天\n${history.days[0].date} 至 ${history.days.at(-1)!.date}\n逐日合计 ${total}。年度来源：${networkYears} 年网络 / ${cacheYears} 年本地缓存。\n网络年度已核对逐日合计；缓存年度沿用快照，本次仍确认访问者身份。\n${[...warnings].join(" ")}`.trim();
      details.hidden = false;
      if (showCity) {
        const module = await import(/* @vite-ignore */ chrome.runtime.getURL("landscape.js")) as typeof import("../renderers/landscape");
        request.signal.throwIfAborted();
        if (!host.isConnected) throw new Error("页面已离开，请重新打开 CodeYears。");
        cityBox.hidden = false;
        displayedRange = range;
        shadow.querySelector("#city-title")!.textContent = `${range} · ${viewName()}`;
        shadow.querySelector("#city-summary")!.textContent = `${total.toLocaleString()} 次真实贡献 · ${requestedYears.length} 年 / ${history.days.length} 天 · 拖动平移，滚轮缩放`;
        const yearlyTotals = new Map<number, number>(requestedYears.map(year => [year, 0]));
        for (const day of history.days) { const year = Number(day.date.slice(0, 4)); yearlyTotals.set(year, yearlyTotals.get(year)! + day.count); }
        const summary = shadow.querySelector("#year-summary")!;
        summary.replaceChildren();
        for (const [year, count] of yearlyTotals) { const item = document.createElement("span"); item.textContent = `${year} · ${count.toLocaleString()} 次`; item.style.borderColor = "#809484"; summary.append(item); }
        try {
          city = module.createLandscape(cityHost, history.days, (state, error, detail) => {
            if (error) status.textContent = error;
            shadow.querySelector("#scene-detail")!.textContent = detail ?? "";
            timelineState = state;
            progress.textContent = `景观生长 · ${Math.round(state.revealedDays / state.totalDays * 100)}%`;
            pause.textContent = state.status === "paused" ? "继续" : "暂停";
            pause.disabled = state.status === "completed";
          }, viewSelect.value as ViewMode);
        } catch (error) { disposeCity(); throw error; }
      }
    } catch (error) {
      if (!document.hidden) status.textContent = `${request.signal.aborted ? "请求已取消。" : error instanceof Error ? error.message : "请求失败，请重新打开 CodeYears。"}\n已读取 ${networkYears + cacheYears} / ${requestedYears.length} 年，本次未生成风景；下次会重新确认身份并复用可用的年度缓存。`;
    } finally {
      loadingProgress.hidden = true; setBusy(false); controller = undefined;
    }
  };
  form.addEventListener("submit", event => { event.preventDefault(); void load(false, true); });
  inspect.addEventListener("click", () => { void load(false, false); });
  refresh.addEventListener("click", () => { void load(true, true); });
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
