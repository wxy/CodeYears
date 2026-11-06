import type { CityPanel } from './content';
import { entryText } from './entry-text';
import { LANGUAGE_KEY, languagePreference, readLanguagePreference, resolveLanguage, saveLanguagePreference, type LanguagePreference } from './language';

declare global {
  interface Window { __codeyearsOpenCity?: () => boolean }
}

(() => {
  if (window.__codeyearsOpenCity) return;

  let mounted: ReturnType<typeof mount> | undefined;
  let navigating = false, queued = false;
  let preference: LanguagePreference = 'auto';
  const languageSettings = () => ({ language: resolveLanguage(preference), preference, change: async (next: LanguagePreference) => { await saveLanguagePreference(next); updateLanguage(next); } });
  const updateLanguage = (next: LanguagePreference) => { preference = next; mounted?.localize(); };
  void readLanguagePreference().then(updateLanguage);
  chrome.storage.onChanged.addListener((changes, area) => { if (area === 'local' && changes[LANGUAGE_KEY]) updateLanguage(languagePreference(changes[LANGUAGE_KEY].newValue)); });

  function mount(root: HTMLElement, native: HTMLElement, grid: HTMLElement, heading: HTMLElement, profile: string) {
    const host = document.createElement('span');
    host.id = 'codeyears-profile-tabs';
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { display:block; width:100%; color:var(--fgColor-default,#1f2328); font:13px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
        * { box-sizing:border-box; } [hidden] { display:none!important; }
        .tabs { display:flex; align-items:stretch; gap:4px; border-bottom:1px solid var(--borderColor-default,#d1d9e0); }
        .tab { display:flex; align-items:center; gap:8px; min-width:0; padding:5px 7px; border:1px solid var(--borderColor-default,#d1d9e0); border-radius:8px 8px 0 0; position:relative; }
        .tab[data-active="true"] { flex:1; flex-wrap:wrap; z-index:2; margin-bottom:-1px; background:var(--bgColor-default,#fff); border-bottom-color:var(--bgColor-default,#fff); }
        .tab[data-active="false"] { align-items:flex-start; z-index:0; margin-top:5px; border-bottom:0; background:var(--bgColor-muted,#f6f8fa); color:var(--fgColor-muted,#59636e); }
        .controls { display:flex; align-items:center; flex:1 1 240px; min-width:0; gap:8px; }
        #native-controls { flex-wrap:wrap; }
        button { flex:none; white-space:nowrap; font:inherit; color:inherit; cursor:pointer; padding:4px 7px; border:0; border-radius:4px; background:transparent; }
        button[aria-pressed="true"] { font-weight:600; }
        button:focus-visible { outline:2px solid #268f80; outline-offset:2px; }
        slot[name="native-stat"] { flex:1 1 180px; }
        ::slotted(#codeyears-native-stat) { flex:1 1 180px; min-width:0; font-size:14px; }
        ::slotted(.js-contribution-settings-menu) { float:none!important; margin:0!important; }
        ::slotted([slot="city-controls"]) { display:block; width:100%; min-width:0; }
      </style>
      <div class="tabs" role="group">
        <div class="tab" data-active="false"><button id="tab-city" type="button" aria-pressed="false"></button><div id="city-controls" class="controls" hidden><slot name="city-controls"></slot></div></div>
        <div class="tab" data-active="true"><button id="tab-native" type="button" aria-pressed="true"></button><div id="native-controls" class="controls"><slot name="native-stat"></slot><slot name="native-settings"></slot></div></div>
      </div>`;
    const bodyHost = document.createElement('div');
    bodyHost.id = 'codeyears-city-content'; bodyHost.hidden = true;
    const bodyShadow = bodyHost.attachShadow({ mode: 'open' });
    bodyShadow.innerHTML = `
      <style>
        :host { display:block; position:relative; min-height:340px; border:1px solid var(--borderColor-default,#d1d9e0); border-top:0; border-radius:0 0 8px 8px; color:var(--fgColor-default,#1f2328); font:13px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
        :host([hidden]),[hidden] { display:none!important; }
        #city-panel { min-height:340px; }
        @media(max-width:500px) { :host, #city-panel { min-height:300px; } }
        .feedback { position:absolute; z-index:3; top:12px; left:12px; right:12px; width:fit-content; max-width:calc(100% - 24px); display:flex; flex-wrap:wrap; align-items:center; gap:8px; padding:8px 10px; border:1px solid var(--borderColor-default,#d1d9e0); border-radius:8px; background:var(--bgColor-default,#fff); box-shadow:0 2px 8px #0002; }
        #entry-status { white-space:pre-line; }
        button { font:inherit; color:inherit; cursor:pointer; padding:5px 12px; border:1px solid var(--borderColor-default,#d1d9e0); border-radius:7px; background:var(--bgColor-default,#fff); }
        button:focus-visible { outline:2px solid #268f80; outline-offset:2px; }
      </style>
      <div class="feedback" hidden><output id="entry-status" role="status" aria-live="polite" hidden></output><button id="retry" type="button" hidden></button></div>
      <div id="city-panel" hidden></div>`;
    const nativeButton = shadow.querySelector<HTMLButtonElement>('#tab-native')!;
    const cityButton = shadow.querySelector<HTMLButtonElement>('#tab-city')!;
    const nativeControls = shadow.querySelector<HTMLElement>('#native-controls')!;
    const cityControls = shadow.querySelector<HTMLElement>('#city-controls')!;
    const toolbarHost = document.createElement('div'); toolbarHost.slot = 'city-controls';
    const panelHost = bodyShadow.querySelector<HTMLElement>('#city-panel')!;
    const status = bodyShadow.querySelector<HTMLOutputElement>('#entry-status')!;
    const retry = bodyShadow.querySelector<HTMLButtonElement>('#retry')!;
    const feedback = bodyShadow.querySelector<HTMLElement>('.feedback')!;
    const headingStyle = heading.getAttribute('style');
    heading.style.setProperty('margin-bottom', '0', 'important');
    const graph = grid.closest<HTMLElement>('.graph-before-activity-overview');
    const graphStyle = graph?.getAttribute('style');
    graph?.style.setProperty('border-top-width', '0', 'important');
    graph?.style.setProperty('border-top-left-radius', '0', 'important');
    graph?.style.setProperty('border-top-right-radius', '0', 'important');
    const nativeStats = document.createElement('span');
    nativeStats.id = 'codeyears-native-stat'; nativeStats.slot = 'native-stat';
    nativeStats.append(...heading.childNodes);
    const nativeSettings = native.querySelector<HTMLElement>('.js-contribution-settings-menu');
    const settingsSlot = nativeSettings?.getAttribute('slot');
    const settingsHome = document.createComment('CodeYears contribution settings');
    if (nativeSettings) { nativeSettings.replaceWith(settingsHome); nativeSettings.slot = 'native-settings'; }
    host.append(nativeStats, toolbarHost); if (nativeSettings) host.append(nativeSettings);
    heading.append(host); heading.after(bodyHost);
    const hiddenNative = new Map<HTMLElement, { display: string; priority: string }>();
    let active = false, disposed = false, selection = 0, panel: CityPanel | undefined;
    let modulePromise: Promise<typeof import('./content')> | undefined;
    let entryState: 'preparing' | 'error' = 'preparing';
    const localize = () => {
      const language = resolveLanguage(preference); host.lang = bodyHost.lang = language;
      shadow.querySelector('.tabs')!.setAttribute('aria-label', entryText(language, 'viewGroup'));
      cityButton.textContent = entryText(language, 'city'); nativeButton.textContent = entryText(language, 'contributions');
      retry.textContent = entryText(language, 'retry');
      status.textContent = entryText(language, entryState === 'error' ? 'cityOpenError' : 'prepareCity');
      panel?.setLanguage(language, preference);
    };
    localize();

    const sync = () => {
      if (!active) return;
      // 原生标题保留；日历、设置和活动概览（含蜘蛛图）一起切换，流水在 root 外。
      const blocks = [...native.children, root.querySelector('#user-activity-overview')];
      for (const block of blocks) {
        if (!(block instanceof HTMLElement) || block === heading || block === bodyHost) continue;
        if (!hiddenNative.has(block)) hiddenNative.set(block, { display: block.style.getPropertyValue('display'), priority: block.style.getPropertyPriority('display') });
        if (block.style.getPropertyValue('display') !== 'none' || block.style.getPropertyPriority('display') !== 'important') block.style.setProperty('display', 'none', 'important');
      }
    };
    const restoreNative = () => {
      for (const [block, { display, priority }] of hiddenNative) {
        if (display) block.style.setProperty('display', display, priority);
        else block.style.removeProperty('display');
      }
      hiddenNative.clear();
    };
    const selectNative = () => {
      active = false; selection++; panel?.deactivate(); restoreNative();
      nativeControls.hidden = false; cityControls.hidden = true;
      nativeButton.parentElement!.dataset.active = 'true'; cityButton.parentElement!.dataset.active = 'false';
      nativeButton.setAttribute('aria-pressed', 'true'); cityButton.setAttribute('aria-pressed', 'false');
      bodyHost.hidden = panelHost.hidden = status.hidden = retry.hidden = true;
      feedback.hidden = true;
      host.dataset.view = 'native';
    };
    const selectCity = async () => {
      if (active || disposed || document.hidden) return;
      active = true; const token = ++selection;
      sync(); nativeControls.hidden = true; cityControls.hidden = false;
      nativeButton.parentElement!.dataset.active = 'false'; cityButton.parentElement!.dataset.active = 'true';
      nativeButton.setAttribute('aria-pressed', 'false'); cityButton.setAttribute('aria-pressed', 'true');
      host.dataset.view = 'city'; bodyHost.hidden = panelHost.hidden = false; retry.hidden = true;
      status.hidden = feedback.hidden = false; entryState = 'preparing'; localize();
      try {
        modulePromise ??= import(/* @vite-ignore */ chrome.runtime.getURL('content.js'));
        const module = await modulePromise;
        if (disposed || token !== selection || !active) return;
        panel ??= module.mountCityPanel(panelHost, toolbarHost, languageSettings());
        status.hidden = feedback.hidden = true;
        if (!document.hidden) await panel.activate();
      } catch {
        if (disposed || token !== selection || !active) return;
        modulePromise = undefined; panel?.deactivate(); panelHost.hidden = true;
        entryState = 'error'; localize();
        status.hidden = feedback.hidden = false; retry.hidden = false;
      }
    };
    nativeButton.addEventListener('click', selectNative);
    cityButton.addEventListener('click', () => { void selectCity(); });
    retry.addEventListener('click', () => { active = false; void selectCity(); });
    shadow.querySelector('.tabs')!.addEventListener('keydown', event => {
      if (event.target !== cityButton && event.target !== nativeButton) return;
      const key = (event as KeyboardEvent).key;
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return;
      event.preventDefault();
      const button = key === 'ArrowLeft' || key === 'Home' ? cityButton : nativeButton;
      button.focus(); button.click();
    });
    host.dataset.view = 'native';
    return {
      root, native, grid, heading, nativeStats, host, bodyHost, profile, sync, localize,
      open() { host.scrollIntoView({ block: 'nearest' }); void selectCity(); },
      deactivate: selectNative,
      visibility(hidden: boolean) {
        if (!active || disposed) return;
        if (hidden) panel?.deactivate(); else void panel?.activate();
      },
      dispose() {
        disposed = true; selection++; panel?.dispose(); restoreNative();
        if (nativeSettings) {
          if (settingsSlot == null) nativeSettings.removeAttribute('slot'); else nativeSettings.setAttribute('slot', settingsSlot);
          settingsHome.replaceWith(nativeSettings);
        }
        host.replaceWith(...nativeStats.childNodes); bodyHost.remove();
        if (graph) { if (graphStyle == null) graph.removeAttribute('style'); else graph.setAttribute('style', graphStyle); }
        if (headingStyle === null) heading.removeAttribute('style'); else heading.setAttribute('style', headingStyle);
      },
    };
  }

  function reconcile() {
    const profile = location.origin === 'https://github.com' ? location.pathname.match(/^\/([a-zA-Z0-9-]{1,39})\/?$/)?.[1].toLowerCase() : undefined;
    if (mounted && (profile !== mounted.profile || !mounted.grid.isConnected || !mounted.heading.isConnected || !mounted.bodyHost.isConnected || !mounted.heading.contains(mounted.nativeStats) || !mounted.heading.contains(mounted.host))) {
      mounted.dispose(); mounted = undefined;
    }
    if (mounted) { mounted.sync(); return; }
    if (navigating || !profile) return;
    const root = document.querySelector<HTMLElement>('.js-yearly-contributions');
    const grid = root?.querySelector<HTMLElement>('table.ContributionCalendar-grid');
    const heading = root?.querySelector<HTMLElement>('#js-contribution-activity-description');
    if (!root || !grid || !heading || !document.querySelector('a[id^="year-link-"]')) return;
    let native = grid;
    while (native.parentElement !== root) native = native.parentElement!;
    if (!native.contains(heading)) return;
    mounted = mount(root, native, grid, heading, profile);
  }
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; reconcile(); });
  });
  const observe = () => observer.observe(document.documentElement, { childList: true, subtree: true });
  const beforeNavigate = () => { navigating = true; mounted?.dispose(); mounted = undefined; };
  const afterNavigate = () => { navigating = false; reconcile(); };
  document.addEventListener('turbo:before-cache', beforeNavigate);
  document.addEventListener('turbo:before-render', beforeNavigate);
  document.addEventListener('turbo:render', afterNavigate);
  document.addEventListener('turbo:load', afterNavigate);
  document.addEventListener('visibilitychange', () => { mounted?.visibility(document.hidden); });
  window.addEventListener('popstate', reconcile);
  window.addEventListener('pagehide', () => { beforeNavigate(); observer.disconnect(); });
  window.addEventListener('pageshow', () => { observe(); afterNavigate(); });
  window.__codeyearsOpenCity = () => { reconcile(); if (!mounted) return false; mounted.open(); return true; };
  observe(); reconcile();
})();
