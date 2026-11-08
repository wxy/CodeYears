import { text, externalText, localize, numberText, type Language, type LanguagePreference, type LanguageSettings, type MessageKey } from "./i18n";
import { cityLegendStyles, createCityLegend } from "./city-legend";
import { createCityHover } from './city-hover';
import { readPageContext } from "../platform/github/probe";
import { clearContributionCache, confirmViewer, sameContext } from "../platform/github/load-year";
import { loadContributionHistory } from "../platform/github/load-history";
import { isoYearStart } from "../data/iso-week";
import type { ContributionLandscape } from "../renderers/landscape";
import type { DailyContribution } from "../data/types";

export interface CityPanel {
  activate(): Promise<void>;
  setLanguage(language: Language, preference: LanguagePreference): void;
  deactivate(): void;
  dispose(): void;
}

/** 用户选择城市后才加载；入口负责原图切换、后台与导航生命周期。 */
export function mountCityPanel(host: HTMLElement, toolbarHost: HTMLElement, settings: LanguageSettings): CityPanel {
  let language = settings.language, preference = settings.preference;
  const t = (key: MessageKey, values: readonly (string | number)[] = []) => text(language, key, values);
  let context = readPageContext(document, new URL(location.href));
  const years = [...new Set(Array.from(document.querySelectorAll<HTMLAnchorElement>('a[id^="year-link-"]'))
    .map(link => Number(link.id.slice("year-link-".length)))
    .filter(year => Number.isInteger(year) && year >= 2008 && year <= new Date().getFullYear()))].sort((a, b) => b - a);
  if (!years.length) throw new Error("当前页面没有可识别的年度入口。");
  const shadow = host.attachShadow({ mode: "open" });
  const controls = toolbarHost.attachShadow({ mode: "open" });
  const toolbarHome = toolbarHost.parentElement!;
  const styles = `
      ${cityLegendStyles}
      :host { display:block; color:var(--fgColor-default,#1f2328); font:13px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
      * { box-sizing:border-box; } [hidden] { display:none !important; }
      .panel { background:var(--bgColor-default,#fff); }
      .bar { position:relative; display:flex; align-items:center; flex-wrap:wrap; gap:8px; padding:10px 12px; }
      form { display:flex; align-items:center; flex-wrap:wrap; min-width:0; gap:6px; margin-right:auto; }
      select,button,summary { font:inherit; color:inherit; } select,button { border:1px solid var(--borderColor-default,#d1d9e0); border-radius:7px; background:var(--bgColor-default,#fff); padding:4px 9px; }
      button,summary { cursor:pointer; } button:disabled { cursor:default; opacity:.45; }
      button:active { transform:scale(.97); } button:focus-visible,select:focus-visible,summary:focus-visible { outline:2px solid #268f80; outline-offset:3px; }
      .summary,.note { color:var(--fgColor-muted,#59636e); font-size:12px; } .summary { margin:0; min-width:min(24ch,100%); white-space:nowrap; }
      #expanded-controls { padding:12px 16px; } #expanded-controls:empty { display:none; }
      .status { position:absolute; z-index:2; top:12px; left:12px; right:12px; width:fit-content; max-width:calc(100% - 24px); display:flex; flex-wrap:wrap; align-items:center; gap:8px; padding:8px 10px; border:1px solid var(--borderColor-default,#d1d9e0); border-radius:8px; background:color-mix(in srgb,var(--bgColor-default,#fff) 75%,transparent); box-shadow:0 2px 8px #0002; } output { white-space:pre-line; } output:empty { display:none; }
      .scene-wrap { position:relative; height:340px; min-height:260px; }
      #scene { width:100%; height:100%; background:transparent; }
      #scene:focus-visible { outline:3px solid #268f80; outline-offset:-3px; border-radius:6px; }
      .building-hover { position:absolute; z-index:4; pointer-events:none; width:max-content; max-width:min(340px,calc(100% - 16px)); margin:0; padding:11px 13px; border:1px solid var(--borderColor-default,#d1d9e0); border-radius:10px; background:color-mix(in srgb,var(--bgColor-default,#fff) 94%,transparent); box-shadow:0 6px 24px #0002; font-size:12px; line-height:1.65; overflow-wrap:anywhere; opacity:0; transition:opacity 90ms ease-out; }
      .building-hover[data-open] { opacity:1; transition-duration:120ms; }
      .building-hover-note { color:var(--fgColor-muted,#59636e); font-size:11px; }
      @media (prefers-reduced-motion:reduce) { .building-hover { transition:none; } }
      .building-hover-time { margin-bottom:5px; color:var(--fgColor-muted,#59636e); font-size:11px; }
      .building-hover p { margin:4px 0 0; }
      .view-tools { position:absolute; right:10px; bottom:10px; display:flex; align-items:center; padding:3px; border:1px solid var(--borderColor-default,#d1d9e0); border-radius:9px; background:color-mix(in srgb,var(--bgColor-default,#fff) 75%,transparent); }
      .status button { background:transparent; }
      .view-tools button { display:grid; place-items:center; width:30px; height:30px; padding:6px; border:0; background:transparent; }
      .view-tools button:hover { background:color-mix(in srgb,var(--bgColor-muted,#f6f8fa) 70%,transparent); }
      .view-tools svg { width:16px; height:16px; fill:none; stroke:currentColor; stroke-width:1.7; stroke-linecap:round; stroke-linejoin:round; }
      .zoom-level { min-width:6ch; padding:0 6px; border-inline:1px solid var(--borderColor-muted,#d1d9e0b3); font-size:12px; font-variant-numeric:tabular-nums; text-align:center; white-space:nowrap; }
      details { position:relative; } summary { list-style:none; border-radius:7px; padding:4px 9px; } summary::-webkit-details-marker { display:none; }
      #more { position:static; }
      .more-panel { position:absolute; z-index:3; right:0; top:100%; width:390px; max-width:100%; max-height:min(55vh,460px); overflow:auto; padding:14px; border:1px solid var(--borderColor-default,#d1d9e0); border-radius:10px; background:var(--bgColor-default,#fff); box-shadow:0 8px 24px #0002; }
      .language { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid var(--borderColor-default,#d1d9e0); }
      .more-panel h3 { margin:0 0 8px; font-size:12px; font-weight:600; }
      .more-section + .more-section { margin-top:12px; padding-top:12px; border-top:1px solid var(--borderColor-default,#d1d9e0); }
      .more-section > details { margin-top:6px; padding:0 8px; border:1px solid var(--borderColor-default,#d1d9e0); border-radius:6px; }
      .more-section > details[open] { padding-bottom:8px; }
      .more-section > details > summary { padding:6px 0; list-style:disclosure-closed inside; }
      .more-section > details[open] > summary { list-style:disclosure-open inside; }
      .more-section > details > summary::-webkit-details-marker { display:inline; }
      .more-section .city-legend { margin:0; padding:4px 0 0; border-top:0; }
      .more-panel p { margin:0 0 10px; } .data-actions { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px; }
      .data-actions button { max-width:100%; white-space:normal; overflow-wrap:anywhere; text-align:left; }
      dialog { color:inherit; background:var(--bgColor-default,#fff); width:min(1400px,calc(100vw - 40px)); height:calc(100dvh - 40px); max-width:none; max-height:none; padding:0; border:1px solid var(--borderColor-default,#d1d9e0); border-radius:14px; }
      dialog::backdrop { background:#0d111799; }
      .panel.expanded { height:100%; border:0; display:flex; flex-direction:column; }
      .expanded .scene-wrap { flex:1; height:auto; } .expanded .bar { padding:12px 16px; }
      @media(max-width:500px) { .scene-wrap { height:300px; } .bar { gap:4px; } select,button { padding:4px 6px; } dialog { width:calc(100vw - 16px); height:calc(100dvh - 16px); } }
  `;
  shadow.innerHTML = `<style>${styles}</style>
    <section class="panel" data-i18n-label="cityRegion">
      <div id="expanded-controls"></div>
      <div class="scene-wrap"><div id="scene" tabindex="0" role="region" data-i18n-label="canvasKeyboardLabel"></div>
        <div class="status" hidden><output id="status" role="status" aria-live="polite"></output><button id="retry" type="button" data-i18n="retry" hidden></button><button id="cancel" type="button" data-i18n="cancel" hidden></button></div>
        <div class="view-tools" hidden>
          <button id="reset-view" type="button" data-i18n-label="fitView"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 3v5H3m18 0h-5V3M3 16h5v5m8 0v-5h5M8 8 3 3m13 5 5-5M8 16l-5 5m13-5 5 5"/></svg></button>
          <span id="zoom-level" class="zoom-level">100%</span>
          <button id="max-zoom" type="button" data-i18n-label="maxZoom"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 5.5 5.5M7 10h6m-3-3v6"/></svg></button>
        </div>
      </div>
    </section><dialog closedby="any" data-i18n-label="expandedCity"></dialog>`;
  controls.innerHTML = `<style>${styles}
    :host { display:block; width:100%; min-width:0; }
    .bar { padding:0; gap:6px; }
  </style>
    <div class="bar">
        <form data-i18n-label="yearRange"><select id="start-year" data-i18n-label="startYear"></select><span>—</span><select id="year" data-i18n-label="endYear"></select><button id="run" type="submit" data-i18n="apply"></button></form>
        <span id="city-summary" class="summary"></span>
        <button id="expand" type="button" aria-expanded="false" disabled></button>
        <details id="more"><summary data-i18n-label="moreLabel" data-i18n="more"></summary><div class="more-panel">
          <label class="language"><span data-i18n="language"></span><select id="language"><option value="auto" data-i18n="followBrowser"></option><option value="en" lang="en">English</option><option value="zh-CN" lang="zh-CN">简体中文</option></select></label>
          <section class="more-section" aria-labelledby="profile-section">
            <h3 id="profile-section" data-i18n="moreProfileSection"></h3>
            <p id="identity" class="note"></p>
            <div class="data-actions"><button id="refresh" type="button" data-i18n="refreshData"></button><button id="clear" type="button" data-i18n="clearCache"></button></div>
          </section>
          <section class="more-section" aria-labelledby="help-section">
            <h3 id="help-section" data-i18n="moreHelpSection"></h3>
            <details id="help"><summary data-i18n="help"></summary><p class="note" data-i18n="viewHelp"></p><p class="note" data-i18n="keyboardControls"></p><p class="note" data-i18n="dataHelp"></p></details>
            <details id="legend-section"><summary data-i18n="legendLabel"></summary><div id="legend"></div></details>
          </section>
        </div></details>
      </div>`;
  controls.querySelector("#legend")!.append(createCityLegend(language));
  const get = <T extends Element>(selector: string) => (shadow.querySelector<T>(selector) ?? controls.querySelector<T>(selector))!;
  const panel = get<HTMLElement>(".panel"), dialog = get<HTMLDialogElement>("dialog");
  const startSelect = get<HTMLSelectElement>("#start-year"), select = get<HTMLSelectElement>("#year");
  for (const year of years) { select.add(new Option(String(year), String(year))); startSelect.add(new Option(String(year), String(year))); }
  startSelect.value = String(years[Math.min(2, years.length - 1)]);
  const run = get<HTMLButtonElement>("#run"), refresh = get<HTMLButtonElement>("#refresh"), clear = get<HTMLButtonElement>("#clear");
  const cancel = get<HTMLButtonElement>("#cancel"), retry = get<HTMLButtonElement>("#retry"), expand = get<HTMLButtonElement>("#expand");
  const status = get<HTMLOutputElement>("#status"), summary = get<HTMLElement>("#city-summary");
  const more = get<HTMLDetailsElement>("#more");
  const cityHost = get<HTMLElement>("#scene"), tools = get<HTMLElement>(".view-tools"), feedback = get<HTMLElement>(".status");
  const zoomLevel = get<HTMLElement>("#zoom-level"), fitView = get<HTMLButtonElement>("#reset-view"), maxZoom = get<HTMLButtonElement>("#max-zoom");
  let currentZoom = 1;
  const showZoom = (zoom: number) => {
    currentZoom = zoom;
    const percent = numberText(language, Math.round(zoom * 100));
    zoomLevel.textContent = `${percent}%`;
    zoomLevel.setAttribute("aria-label", t("zoomLevel", [percent]));
  };
  const languageSelect = get<HTMLSelectElement>("#language");
  let active = false, disposed = false, busy = false;
  let controller: AbortController | undefined, city: ContributionLandscape | undefined;
  let reusable: { context: typeof context; range: string; expiresAt: number; status: () => string; summary: () => string } | undefined;
  let statusMessage = () => "", summaryMessage = () => "";
  const updateFeedback = () => { feedback.hidden = !status.textContent && cancel.hidden && retry.hidden; };
  const setStatus = (message: () => string) => { statusMessage = message; status.textContent = message(); updateFeedback(); };
  const setSummary = (message: () => string) => { summaryMessage = message; summary.textContent = message(); };
  const showIdentity = () => {
    const identity = context.viewer.state === "unknown" ? t("identityUnknown") : context.viewer.identity.kind === "signed-out" ? t("signedOut") : t("visitor", [context.viewer.identity.login]);
    get<HTMLElement>("#identity").textContent = active ? t("profileIdentity", [context.profileLogin, identity]) : "";
  };
  const moreTrigger = more.querySelector<HTMLElement>("summary")!;
  const closeMore = (restoreFocus = false) => {
    if (!more.open) return;
    more.open = false;
    if (restoreFocus) moreTrigger.focus();
  };
  // composedPath crosses both our shadow roots, including when controls move into the dialog.
  const outsidePointer = (event: PointerEvent) => {
    if (active && !event.composedPath().includes(more)) closeMore();
  };
  const escapeMenu = (event: KeyboardEvent) => {
    if (!active || event.key !== "Escape" || !more.open) return;
    event.preventDefault(); event.stopPropagation(); closeMore(true);
  };
  document.addEventListener("pointerdown", outsidePointer, true);
  document.addEventListener("keydown", escapeMenu, true);
  const currentContext = () => readPageContext(document, new URL(location.href));
  const hover=createCityHover(cityHost,{
    pick:(x,y)=>active&&!busy?city?.buildingAt(x,y):undefined,
    context:()=>context,currentContext,language:()=>language,
    invalidate(){resetResult();retry.hidden=false;setStatus(()=>language==='zh-CN'?'GitHub 会话已改变或暂时无法确认，请重新载入城市。':'The GitHub session changed or could not be confirmed. Reload the city.')},
  });
  const selectedRange = () => startSelect.value === select.value ? select.value : `${startSelect.value}–${select.value}`;
  const collapse = (restoreFocus = true) => {
    if (!dialog.open) return;
    dialog.close(); dialog.before(panel); toolbarHome.append(toolbarHost); panel.classList.remove("expanded");
    expand.textContent = t("expand"); expand.setAttribute("aria-expanded", "false");
    updateControls();
    if (restoreFocus) expand.focus();
  };
  expand.onclick = () => {
    if (dialog.open) { collapse(); return; }
    more.open = false; get<HTMLElement>("#expanded-controls").append(toolbarHost); panel.classList.add("expanded"); dialog.append(panel); dialog.showModal();
    expand.textContent = t("collapse"); expand.setAttribute("aria-expanded", "true"); expand.focus();
  };
  dialog.addEventListener("cancel", event => { event.preventDefault(); if (more.open) closeMore(true); else collapse(); });
  const updateControls = () => {
    const ready = Boolean(cityHost.querySelector("canvas"));
    expand.disabled = !ready && !dialog.open; tools.hidden = !ready;
    cancel.hidden = !busy;
    cityHost.querySelector("canvas")?.setAttribute("aria-label", t("canvasLabel"));
    updateFeedback();
  };
  const setBusy = (value: boolean) => {
    if(value)hover.hide();
    busy = value; run.disabled = refresh.disabled = select.disabled = startSelect.disabled = busy;
    clear.disabled = busy || context.viewer.state === "unknown"; updateControls();
  };
  const resetResult = () => {
    hover.clear();
    reusable = undefined;
    city?.dispose(); city = undefined; cityHost.replaceChildren();
    showZoom(1);
    setSummary(() => "");
    updateControls();
  };
  const load = async (forceRefresh: boolean) => {
    if (!active || disposed || busy) return;
    const start = Number(startSelect.value), end = Number(select.value);
    if (start > end) { setStatus(() => t("invalidRange")); return; }
    const windowStart = isoYearStart(start), windowEnd = isoYearStart(end + 1);
    const firstNeeded = new Date(windowStart).getUTCFullYear(), lastNeeded = new Date(windowEnd - 86400000).getUTCFullYear();
    const calendarYear = new Date().getFullYear();
    const firstSource = Math.max(firstNeeded, years.at(-1)!), lastSource = Math.min(lastNeeded, years[0], calendarYear);
    const requestedYears = Array.from({ length: lastSource - firstSource + 1 }, (_, index) => firstSource + index);
    const firstDate = new Date(windowStart).toISOString().slice(0, 10), endDate = new Date(windowEnd).toISOString().slice(0, 10);
    const range = selectedRange();
    const request = new AbortController(); controller = request;
    resetResult(); cityHost.hidden = false; setBusy(true); more.open = false; retry.hidden = true;
    setStatus(() => t("readingData"));
    const reservedYears = Array.from({ length: end - start + 1 }, (_, index) => start + index);
    let renderer: typeof import("../renderers/landscape") | undefined;
    let renderFailure: Error | undefined;
    let fieldCreated = false;
    let painting: Promise<void> | undefined;
    let pendingDays: readonly DailyContribution[] | undefined;
    let expiresAt = Infinity;
    const mountEmptyField = () => {
      city = renderer!.createLandscape(cityHost, [], (_state, error) => {
        if (!active || controller !== request) return;
        if (error) { renderFailure = new Error(error); request.abort(); }
        updateControls();
      }, "city", undefined, true, reservedYears, showZoom, years.at(-1)!);
      fieldCreated = true;
      return city;
    };
    const warnings = new Set<string>();
    try {
      context = currentContext();
      showIdentity();
      if (context.viewer.state === "unknown") warnings.add("访问者身份未识别，本次不读取或写入缓存。");
      renderer = await import(/* @vite-ignore */ chrome.runtime.getURL("landscape.js")) as typeof import("../renderers/landscape");
      request.signal.throwIfAborted();
      if (!active || !host.isConnected) return;
      const field = mountEmptyField();
      request.signal.addEventListener("abort", () => field.dispose(), { once: true });
      const paint = async () => {
        try {
          while (pendingDays && active && controller === request && !request.signal.aborted) {
            const latest = pendingDays; pendingDays = undefined;
            await field.updateDays(latest);
          }
        } catch (error) {
          if (request.signal.aborted) return;
          renderFailure = error instanceof Error ? error : new Error("城市素材加载失败，请重试。");
          request.abort();
        } finally { painting = undefined; }
      };
      const history = await loadContributionHistory(context, requestedYears, forceRefresh, request.signal, currentContext, result => {
        if (request.signal.aborted) return;
        if (result.warning) warnings.add(result.warning);
        expiresAt = Math.min(expiresAt, result.expiresAt);
        pendingDays = result.history.days.filter(day => firstDate <= day.date && day.date < endDate);
        setStatus(() => t("readingRange", [range]));
        painting ??= paint();
      });
      await painting;
      if (renderFailure) throw renderFailure;
      request.signal.throwIfAborted();
      if (!active || !host.isConnected) return;
      const visibleDays = history.days.filter(day => firstDate <= day.date && day.date < endDate);
      if (!visibleDays.length) { setStatus(() => t("noDates")); return; }
      const total = visibleDays.reduce((sum, day) => sum + day.count, 0);
      setStatus(() => [...warnings].map(message => externalText(language, message)).join(" "));
      setSummary(() => t("totalContributions", [numberText(language, total)]));
      if (context.viewer.state === "known") reusable = { context, range, expiresAt, status: statusMessage, summary: summaryMessage };
    } catch (error) {
      if (!active || controller !== request) return;
      const cancelled = request.signal.aborted && !renderFailure;
      request.abort();
      resetResult();
      if (renderer && fieldCreated) mountEmptyField();
      const failure = renderFailure ?? error;
      retry.hidden = false;
      setStatus(() => cancelled ? t("cancelledDetail") : failure instanceof Error ? externalText(language, failure.message) : t("readFailedDetail"));
    } finally {
      // 切回城市会开始新请求，旧请求不能撤销新一轮的忙碌状态。
      if (controller === request) { controller = undefined; setBusy(false); }
    }
  };
  get<HTMLFormElement>("form").addEventListener("submit", event => { event.preventDefault(); void load(false); });
  refresh.onclick = () => { void load(true); };
  retry.onclick = () => { void load(false); };
  cancel.onclick = () => controller?.abort();
  fitView.onclick = () => city?.resetView();
  maxZoom.onclick = () => city?.zoomToMax();
  clear.onclick = async () => {
    if (!active || busy) return;
    const request = new AbortController(); controller = request;
    resetResult(); setBusy(true); cancel.hidden = true; more.open = false; retry.hidden = true;
    setStatus(() => t("confirmingClear"));
    try {
      await clearContributionCache(context, request.signal, currentContext);
      if (active && !request.signal.aborted) { retry.hidden = false; setStatus(() => t("cacheClearedDetail")); }
    } catch (error) {
      if (active && controller === request) { retry.hidden = false; setStatus(() => error instanceof Error ? externalText(language, error.message) : t("clearFailedDetail")); }
    } finally { if (controller === request) { controller = undefined; setBusy(false); } }
  };
  const deactivate = () => {
    hover.hide();
    active = false; controller?.abort(); controller = undefined; collapse(false);
    cityHost.hidden = true;
    if (reusable && city) { city.setVisible(false); city.skip(); }
    else resetResult();
    setSummary(() => "");
    more.open = false; retry.hidden = true; setStatus(() => "");
    get<HTMLElement>("#identity").textContent = ""; setBusy(false);
  };
  const setLanguage = (next: Language, selected: LanguagePreference) => {
    hover.hide();
    language = next; preference = selected; host.lang = toolbarHost.lang = language;
    localize(shadow, language); localize(controls, language);
    fitView.title = t("fitView"); maxZoom.title = t("maxZoom"); zoomLevel.title = t("zoomFitHelp"); showZoom(currentZoom);
    cityHost.setAttribute("aria-description", t("keyboardControls"));
    expand.textContent = t(dialog.open ? "collapse" : "expand");
    languageSelect.value = preference; languageSelect.setAttribute("aria-label", t("language"));
    setStatus(statusMessage); setSummary(summaryMessage); showIdentity(); updateControls();
  };
  languageSelect.onchange = async () => {
    try { await settings.change(languageSelect.value as LanguagePreference); }
    catch { languageSelect.value = preference; setStatus(() => t("languageSaveError")); }
  };
  setLanguage(language, preference);
  return {
    setLanguage,
    async activate() {
      if (disposed || active) return;
      active = true;
      const nextContext = currentContext(), cached = reusable, field = city;
      if (!cached || !field || cached.range !== selectedRange() || Date.now() >= cached.expiresAt ||
          nextContext.viewer.state === "unknown" || !sameContext(cached.context, nextContext)) {
        await load(false); return;
      }
      const request = new AbortController(); controller = request; setBusy(true); retry.hidden = true;
      setStatus(() => t("readingData"));
      try {
        await confirmViewer(nextContext, request.signal);
        request.signal.throwIfAborted();
        if (!active || disposed || controller !== request) return;
        if (!sameContext(nextContext, currentContext())) throw new Error("当前 GitHub 会话身份无法确认或已经改变；未使用旧缓存，请刷新页面后重试。");
        context = nextContext; cityHost.hidden = false; field.setVisible(true); showIdentity(); setStatus(cached.status); setSummary(cached.summary);
      } catch (error) {
        if (!active || controller !== request) return;
        resetResult(); cityHost.hidden = false; retry.hidden = false;
        setStatus(() => error instanceof Error ? externalText(language, error.message) : t("readFailedDetail"));
      } finally { if (controller === request) { controller = undefined; setBusy(false); } }
    },
    deactivate,
    dispose() { if (disposed) return; deactivate(); resetResult(); hover.dispose(); disposed = true; document.removeEventListener("pointerdown", outsidePointer, true); document.removeEventListener("keydown", escapeMenu, true); shadow.replaceChildren(); controls.replaceChildren(); },
  };
}
