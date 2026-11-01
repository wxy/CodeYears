import { cityLegendStyles, createCityLegend } from "./city-legend";
import { readPageContext } from "../platform/github/probe";
import { clearContributionCache } from "../platform/github/load-year";
import { loadContributionHistory } from "../platform/github/load-history";
import { isoYearStart } from "../data/iso-week";
import type { DailyContribution } from "../data/types";
import type { ContributionLandscape } from "../renderers/landscape";
import type { TimelineState } from "../timeline/types";

export interface CityPanel {
  activate(): Promise<void>;
  deactivate(): void;
  dispose(): void;
}

/** 用户选择城市后才加载；入口负责原图切换、后台与导航生命周期。 */
export function mountCityPanel(host: HTMLElement): CityPanel {
  let context = readPageContext(document, new URL(location.href));
  const years = [...new Set(Array.from(document.querySelectorAll<HTMLAnchorElement>('a[id^="year-link-"]'))
    .map(link => Number(link.id.slice("year-link-".length)))
    .filter(year => Number.isInteger(year) && year >= 2008 && year <= new Date().getFullYear()))].sort((a, b) => b - a);
  if (!years.length) throw new Error("当前页面没有可识别的年度入口。");
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      ${cityLegendStyles}
      :host { display:block; color:var(--fgColor-default,#1f2328); font:13px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
      * { box-sizing:border-box; } [hidden] { display:none !important; }
      .panel { background:var(--bgColor-default,#fff); }
      .bar { display:flex; align-items:center; flex-wrap:wrap; gap:8px; padding:10px 12px; }
      form { display:flex; align-items:center; gap:6px; margin-right:auto; }
      select,button,summary { font:inherit; color:inherit; } select,button { border:1px solid var(--borderColor-default,#d1d9e0); border-radius:7px; background:var(--bgColor-default,#fff); padding:4px 9px; }
      button,summary { cursor:pointer; } button:disabled { cursor:default; opacity:.45; }
      button:active { transform:scale(.97); } button:focus-visible,select:focus-visible,summary:focus-visible { outline:2px solid #268f80; outline-offset:3px; }
      .summary,.note { color:var(--fgColor-muted,#59636e); font-size:12px; } .summary { display:none; margin:0 12px; } .expanded .summary { display:block; }
      .status { display:flex; align-items:center; gap:8px; padding:0 12px; } output { white-space:pre-line; } output:empty { display:none; }
      #loading-progress { width:100%; accent-color:#268f80; } .loading { padding:0 12px; }
      .scene-wrap { position:relative; height:340px; min-height:260px; }
      #scene { width:100%; height:100%; background:transparent; }
      #preparing { position:absolute; inset:0; display:grid; place-items:center; color:var(--fgColor-muted,#59636e); pointer-events:none; }
      .view-tools { position:absolute; right:10px; bottom:10px; display:flex; gap:4px; padding:4px; border:1px solid var(--borderColor-default,#d1d9e0); border-radius:9px; background:var(--bgColor-default,#fff); }
      .view-tools button { border:0; min-width:30px; }
      .playback { display:flex; align-items:center; gap:8px; padding:4px 12px 10px; min-height:40px; }
      #progress { color:var(--fgColor-muted,#59636e); font-size:12px; margin-right:auto; }
      details { position:relative; } summary { list-style:none; border-radius:7px; padding:4px 9px; } summary::-webkit-details-marker { display:none; }
      .more-panel { position:absolute; z-index:3; right:0; top:100%; width:min(390px,calc(100vw - 64px)); max-height:min(55vh,460px); overflow:auto; padding:14px; border:1px solid var(--borderColor-default,#d1d9e0); border-radius:10px; background:var(--bgColor-default,#fff); box-shadow:0 8px 24px #0002; }
      .more-panel p { margin:0 0 10px; } .data-actions { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px; }
      #details summary { padding:6px 0; } .days { max-height:220px; overflow:auto; } table { width:100%; border-collapse:collapse; font-variant-numeric:tabular-nums; } td,th { padding:3px 6px; text-align:left; border-bottom:1px solid var(--borderColor-default,#d1d9e0); }
      dialog { color:inherit; background:var(--bgColor-default,#fff); width:min(1400px,calc(100vw - 40px)); height:calc(100dvh - 40px); max-width:none; max-height:none; padding:0; border:1px solid var(--borderColor-default,#d1d9e0); border-radius:14px; }
      dialog::backdrop { background:#0d111799; }
      .panel.expanded { height:100%; border:0; display:flex; flex-direction:column; }
      .expanded .scene-wrap { flex:1; height:auto; } .expanded .bar { padding:12px 16px; }
      @media(max-width:500px) { .scene-wrap { height:300px; } .bar { gap:4px; } select,button { padding:4px 6px; } dialog { width:calc(100vw - 16px); height:calc(100dvh - 16px); } }
    </style>
    <section class="panel" aria-label="贡献之城">
      <div class="bar">
        <form aria-label="城市年份范围"><select id="start-year" aria-label="起始年份"></select><span>—</span><select id="year" aria-label="结束年份"></select><button id="run" type="submit">应用</button></form>
        <button id="expand" type="button" aria-expanded="false" disabled>展开</button>
        <details id="more"><summary aria-label="更多与数据说明">更多</summary><div class="more-panel">
          <p class="note">拖动平移，滚轮缩放。“全景”恢复完整取景，不改变数据或生长进度。调整好画面后，在图上右键选择“图片存储为…”或“复制图片”。</p>
          <p id="identity" class="note"></p>
          <p class="note">数据只缓存在本机，按访问者与主页隔离。年份按完整周划分（ISO 周规则）：周一至周日归周四所在年；边界会读取相邻公历年，因此合计可能与 GitHub 公历年度不同。缺失或未来日期不会补零。</p>
          <div class="data-actions"><button id="refresh" type="button">刷新所选年份</button><button id="clear" type="button">清除此主页缓存</button></div>
          <details id="details" hidden><summary>数据明细</summary><div class="days"><table><thead><tr><th>日期</th><th>贡献数量</th></tr></thead><tbody></tbody></table></div></details>
          <div id="legend"></div>
        </div></details>
      </div>
      <p id="city-summary" class="summary"></p>
      <div class="status"><output id="status" role="status" aria-live="polite"></output><button id="retry" type="button" hidden>重试</button></div>
      <div class="loading" hidden><progress id="loading-progress" value="0" max="1" aria-label="年度加载进度"></progress></div>
      <div class="scene-wrap"><div id="scene"></div><span id="preparing">正在准备城市…</span><div class="view-tools" hidden><button id="zoom-out" type="button" aria-label="缩小城市">−</button><button id="zoom-in" type="button" aria-label="放大城市">＋</button><button id="reset-view" type="button">全景</button></div></div>
      <div class="playback"><span id="progress" role="status"></span><button id="cancel" type="button" hidden>取消</button><button id="pause" type="button" hidden>暂停</button><button id="skip" type="button" hidden>直接查看</button><button id="replay" type="button" hidden>重播生长</button></div>
    </section><dialog aria-label="展开的贡献之城"></dialog>`;
  shadow.querySelector("#legend")!.append(createCityLegend());
  const get = <T extends Element>(selector: string) => shadow.querySelector<T>(selector)!;
  const panel = get<HTMLElement>(".panel"), dialog = get<HTMLDialogElement>("dialog");
  const startSelect = get<HTMLSelectElement>("#start-year"), select = get<HTMLSelectElement>("#year");
  for (const year of years) { select.add(new Option(String(year), String(year))); startSelect.add(new Option(String(year), String(year))); }
  startSelect.value = String(years[Math.min(2, years.length - 1)]);
  const run = get<HTMLButtonElement>("#run"), refresh = get<HTMLButtonElement>("#refresh"), clear = get<HTMLButtonElement>("#clear");
  const cancel = get<HTMLButtonElement>("#cancel"), retry = get<HTMLButtonElement>("#retry"), expand = get<HTMLButtonElement>("#expand");
  const pause = get<HTMLButtonElement>("#pause"), skip = get<HTMLButtonElement>("#skip"), replay = get<HTMLButtonElement>("#replay");
  const status = get<HTMLOutputElement>("#status"), summary = get<HTMLElement>("#city-summary"), progress = get<HTMLElement>("#progress");
  const loading = get<HTMLElement>(".loading"), loadingProgress = get<HTMLProgressElement>("#loading-progress");
  const more = get<HTMLDetailsElement>("#more"), details = get<HTMLDetailsElement>("#details"), body = get<HTMLTableSectionElement>("tbody");
  const cityHost = get<HTMLElement>("#scene"), tools = get<HTMLElement>(".view-tools"), preparing = get<HTMLElement>("#preparing");
  let active = false, disposed = false, busy = false, hasPresented = false;
  let controller: AbortController | undefined, city: ContributionLandscape | undefined, timelineState: TimelineState | undefined;
  let visibleDays: readonly DailyContribution[] = [];
  const currentContext = () => readPageContext(document, new URL(location.href));
  const selectedRange = () => startSelect.value === select.value ? select.value : `${startSelect.value}–${select.value}`;
  const collapse = (restoreFocus = true) => {
    if (!dialog.open) return;
    dialog.close(); dialog.before(panel); panel.classList.remove("expanded");
    expand.textContent = "展开"; expand.setAttribute("aria-expanded", "false");
    updateControls();
    if (restoreFocus) expand.focus();
  };
  expand.onclick = () => {
    if (dialog.open) { collapse(); return; }
    more.open = false; panel.classList.add("expanded"); dialog.append(panel); dialog.showModal();
    expand.textContent = "收起"; expand.setAttribute("aria-expanded", "true"); expand.focus();
  };
  dialog.addEventListener("cancel", event => { event.preventDefault(); collapse(); });
  const updateControls = () => {
    const ready = Boolean(cityHost.querySelector("canvas"));
    const growing = ready && timelineState?.status !== "completed";
    expand.disabled = !ready && !dialog.open; tools.hidden = !ready;
    cancel.hidden = !busy; pause.hidden = skip.hidden = !growing;
    replay.hidden = !ready || growing;
    pause.textContent = timelineState?.status === "paused" ? "继续" : "暂停";
    preparing.hidden = ready;
    progress.textContent = growing ? timelineState?.status === "paused" ? "生长已暂停" : "城市生长中" : "";
  };
  const setBusy = (value: boolean) => {
    busy = value; run.disabled = refresh.disabled = select.disabled = startSelect.disabled = busy;
    clear.disabled = busy || context.viewer.state === "unknown"; updateControls();
  };
  const resetResult = () => {
    city?.dispose(); city = undefined; timelineState = undefined; cityHost.replaceChildren();
    visibleDays = []; body.replaceChildren(); details.open = false; details.hidden = true; summary.textContent = "";
    updateControls();
  };
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
  const load = async (forceRefresh: boolean, showCompleted = false) => {
    if (!active || disposed || busy) return;
    const start = Number(startSelect.value), end = Number(select.value);
    if (start > end) { status.textContent = "起始年份不能晚于结束年份。"; return; }
    const windowStart = isoYearStart(start), windowEnd = isoYearStart(end + 1);
    const firstNeeded = new Date(windowStart).getUTCFullYear(), lastNeeded = new Date(windowEnd - 86400000).getUTCFullYear();
    const now = new Date(), calendarYear = now.getFullYear();
    const firstSource = Math.max(firstNeeded, years.at(-1)!), lastSource = Math.min(lastNeeded, years[0], calendarYear);
    const requestedYears = Array.from({ length: lastSource - firstSource + 1 }, (_, index) => firstSource + index);
    const firstDate = new Date(windowStart).toISOString().slice(0, 10), endDate = new Date(windowEnd).toISOString().slice(0, 10);
    const range = selectedRange();
    const request = new AbortController(); controller = request;
    resetResult(); summary.textContent = `${range} · 正在读取…`; setBusy(true); more.open = false; retry.hidden = true;
    loadingProgress.max = requestedYears.length; loadingProgress.value = 0; loading.hidden = false;
    preparing.textContent = "正在读取贡献数据…"; status.textContent = "正在确认身份…";
    let completedYears = 0;
    const warnings = new Set<string>();
    if (firstSource > firstNeeded || (lastSource < lastNeeded && lastNeeded <= calendarYear)) warnings.add("可用年度不足，年份边界不完整；仅显示已提供的日期。");
    if (windowEnd > Date.UTC(calendarYear, now.getMonth(), now.getDate()) + 86400000) warnings.add("所选年份尚未结束，仅显示已提供的日期。");
    try {
      context = currentContext();
      const identity = context.viewer.state === "unknown" ? "身份未识别，本次不读写缓存" : context.viewer.identity.kind === "signed-out" ? "未登录访问者" : `访问者 ${context.viewer.identity.login}`;
      get<HTMLElement>("#identity").textContent = `主页 ${context.profileLogin} · ${identity}`;
      if (context.viewer.state === "unknown") warnings.add("访问者身份未识别，本次不读取或写入缓存。");
      const history = await loadContributionHistory(context, requestedYears, forceRefresh, request.signal, currentContext, result => {
        if (request.signal.aborted) return;
        completedYears = result.history.providedYears.length;
        if (result.warning) warnings.add(result.warning);
        loadingProgress.value = completedYears;
        status.textContent = `正在读取 ${range} · ${completedYears} / ${requestedYears.length} 个源年`;
      });
      request.signal.throwIfAborted();
      if (!active || !host.isConnected) return;
      visibleDays = history.days.filter(day => firstDate <= day.date && day.date < endDate);
      if (!visibleDays.length) { summary.textContent = `${range} · 暂无数据`; status.textContent = "所选年份尚无已提供的日期。"; preparing.textContent = "暂无可展示的数据"; return; }
      const total = visibleDays.reduce((sum, day) => sum + day.count, 0);
      status.textContent = [...warnings].join(" "); details.hidden = false;
      summary.textContent = `${range} · ${total.toLocaleString()} 次贡献`;
      preparing.textContent = "正在准备城市素材…";
      const module = await import(/* @vite-ignore */ chrome.runtime.getURL("landscape.js")) as typeof import("../renderers/landscape");
      request.signal.throwIfAborted();
      if (!active || !host.isConnected) return;
      city = module.createLandscape(cityHost, visibleDays, (state, error) => {
        if (!active) return;
        timelineState = state;
        if (error) { summary.textContent = `${range} · 城市未能加载`; status.textContent = error; preparing.textContent = "城市未能加载"; retry.hidden = false; }
        if (cityHost.querySelector("canvas")) hasPresented = true;
        updateControls();
      }, "city");
      if (showCompleted) city.skip();
    } catch (error) {
      if (!active || controller !== request) return;
      resetResult();
      summary.textContent = `${range} · ${request.signal.aborted ? "已取消读取" : "读取失败"}`;
      status.textContent = request.signal.aborted ? "请求已取消。" : error instanceof Error ? error.message : "读取失败，请重试。";
      preparing.textContent = request.signal.aborted ? "已取消读取" : "城市未能加载"; retry.hidden = false;
    } finally {
      // 切回城市会开始新请求，旧请求不能撤销新一轮的忙碌状态。
      if (controller === request) { loading.hidden = true; controller = undefined; setBusy(false); }
    }
  };
  get<HTMLFormElement>("form").addEventListener("submit", event => { event.preventDefault(); void load(false); });
  refresh.onclick = () => { void load(true, true); };
  retry.onclick = () => { void load(false, hasPresented); };
  cancel.onclick = () => controller?.abort();
  pause.onclick = () => timelineState?.status === "paused" ? city?.resume() : city?.pause();
  skip.onclick = () => city?.skip(); replay.onclick = () => city?.replay();
  get<HTMLButtonElement>("#zoom-out").onclick = () => city?.zoomBy(.8);
  get<HTMLButtonElement>("#zoom-in").onclick = () => city?.zoomBy(1.25);
  get<HTMLButtonElement>("#reset-view").onclick = () => city?.resetView();
  clear.onclick = async () => {
    if (!active || busy) return;
    const request = new AbortController(); controller = request;
    resetResult(); summary.textContent = `${selectedRange()} · 正在清除缓存…`; setBusy(true); cancel.hidden = true; more.open = false; retry.hidden = true;
    status.textContent = "正在确认身份并清除此主页缓存…";
    try {
      await clearContributionCache(context, request.signal, currentContext);
      if (active && !request.signal.aborted) { summary.textContent = `${selectedRange()} · 缓存已清除`; status.textContent = "已清除此访问者在当前主页的年度缓存。"; preparing.textContent = "重新读取后可查看城市"; retry.hidden = false; }
    } catch (error) {
      if (active && controller === request) { summary.textContent = `${selectedRange()} · 缓存清除失败`; status.textContent = error instanceof Error ? error.message : "缓存清除失败。"; retry.hidden = false; }
    } finally { if (controller === request) { controller = undefined; setBusy(false); } }
  };
  const deactivate = () => {
    active = false; controller?.abort(); controller = undefined; collapse(false);
    resetResult(); loading.hidden = true; more.open = false; status.textContent = ""; retry.hidden = true;
    get<HTMLElement>("#identity").textContent = ""; setBusy(false);
  };
  return {
    async activate() { if (disposed || active) return; active = true; await load(false, hasPresented); },
    deactivate,
    dispose() { if (disposed) return; deactivate(); disposed = true; shadow.replaceChildren(); },
  };
}
