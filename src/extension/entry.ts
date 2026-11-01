import type { CityPanel } from './content';

declare global {
  interface Window { __codeyearsOpenCity?: () => boolean }
}

(() => {
  if (window.__codeyearsOpenCity) return;

  let mounted: ReturnType<typeof mount> | undefined;
  let navigating = false, queued = false;

  function mount(root: HTMLElement, native: HTMLElement, grid: HTMLElement, heading: HTMLElement, profile: string) {
    const host = document.createElement('span');
    host.id = 'codeyears-profile-tabs';
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { display:inline-block; flex:none; color:var(--fgColor-default,#1f2328); font:13px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
        * { box-sizing:border-box; }
        .tabs { display:flex; gap:2px; }
        button { font:inherit; color:inherit; cursor:pointer; padding:4px 9px; border:0; border-radius:6px; background:transparent; }
        button[aria-pressed="true"] { background:var(--bgColor-muted,#f6f8fa); font-weight:600; box-shadow:inset 0 -2px #398466; }
        button:focus-visible { outline:2px solid #268f80; outline-offset:2px; }
      </style>
      <div class="tabs" role="group" aria-label="贡献展示方式">
        <button id="tab-native" type="button" aria-pressed="true">贡献图</button>
        <button id="tab-city" type="button" aria-pressed="false">城市 · CodeYears</button>
      </div>`;
    const bodyHost = document.createElement('div');
    bodyHost.id = 'codeyears-city-content'; bodyHost.hidden = true;
    const bodyShadow = bodyHost.attachShadow({ mode: 'open' });
    bodyShadow.innerHTML = `
      <style>
        :host { display:block; color:var(--fgColor-default,#1f2328); font:13px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
        :host([hidden]),[hidden] { display:none!important; }
        #entry-status { display:block; margin:10px 0; white-space:pre-line; }
        button { font:inherit; color:inherit; cursor:pointer; padding:5px 12px; border:1px solid var(--borderColor-default,#d1d9e0); border-radius:7px; background:var(--bgColor-default,#fff); }
        button:focus-visible { outline:2px solid #268f80; outline-offset:2px; }
      </style>
      <output id="entry-status" role="status" aria-live="polite" hidden></output>
      <button id="retry" type="button" hidden>重试</button>
      <div id="city-panel" hidden></div>`;
    const nativeButton = shadow.querySelector<HTMLButtonElement>('#tab-native')!;
    const cityButton = shadow.querySelector<HTMLButtonElement>('#tab-city')!;
    const panelHost = bodyShadow.querySelector<HTMLElement>('#city-panel')!;
    const status = bodyShadow.querySelector<HTMLOutputElement>('#entry-status')!;
    const retry = bodyShadow.querySelector<HTMLButtonElement>('#retry')!;
    const headingStyle = heading.getAttribute('style');
    const nativeStats = document.createElement('span'), cityStats = document.createElement('span');
    nativeStats.id = 'codeyears-native-stat'; cityStats.id = 'codeyears-city-stat';
    nativeStats.style.flex = cityStats.style.flex = '1 1 240px';
    cityStats.hidden = true; cityStats.setAttribute('aria-live', 'polite');
    nativeStats.append(...heading.childNodes);
    heading.style.cssText += ';display:flex;align-items:center;flex-wrap:wrap;gap:4px 12px;';
    heading.append(nativeStats, cityStats, host); heading.after(bodyHost);
    const hiddenNative = new Map<HTMLElement, { display: string; priority: string }>();
    let active = false, disposed = false, selection = 0, panel: CityPanel | undefined;
    let modulePromise: Promise<typeof import('./content')> | undefined;

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
      nativeStats.hidden = false; cityStats.hidden = true; cityStats.textContent = '';
      nativeButton.setAttribute('aria-pressed', 'true'); cityButton.setAttribute('aria-pressed', 'false');
      bodyHost.hidden = panelHost.hidden = status.hidden = retry.hidden = true;
      host.dataset.view = 'native';
    };
    const selectCity = async () => {
      if (active || disposed || document.hidden) return;
      active = true; const token = ++selection;
      sync(); nativeStats.hidden = true; cityStats.hidden = false; cityStats.textContent = '正在准备城市…';
      nativeButton.setAttribute('aria-pressed', 'false'); cityButton.setAttribute('aria-pressed', 'true');
      host.dataset.view = 'city'; bodyHost.hidden = panelHost.hidden = false; retry.hidden = true;
      status.hidden = false; status.textContent = '正在准备城市…';
      try {
        modulePromise ??= import(/* @vite-ignore */ chrome.runtime.getURL('content.js'));
        const module = await modulePromise;
        if (disposed || token !== selection || !active) return;
        panel ??= module.mountCityPanel(panelHost, summary => { if (active && !disposed) cityStats.textContent = summary; });
        status.hidden = true;
        await panel.activate();
      } catch {
        if (disposed || token !== selection || !active) return;
        modulePromise = undefined; panel?.deactivate(); panelHost.hidden = true;
        cityStats.textContent = '城市未能打开';
        status.textContent = '城市未能打开，请刷新页面或重新加载 CodeYears；也可返回贡献图。';
        status.hidden = false; retry.hidden = false;
      }
    };
    nativeButton.addEventListener('click', selectNative);
    cityButton.addEventListener('click', () => { void selectCity(); });
    retry.addEventListener('click', () => { active = false; void selectCity(); });
    shadow.querySelector('.tabs')!.addEventListener('keydown', event => {
      const key = (event as KeyboardEvent).key;
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return;
      event.preventDefault();
      const button = key === 'ArrowLeft' || key === 'Home' ? nativeButton : cityButton;
      button.focus(); button.click();
    });
    host.dataset.view = 'native';
    return {
      root, native, grid, heading, nativeStats, host, bodyHost, profile, sync,
      open() { host.scrollIntoView({ block: 'nearest' }); void selectCity(); },
      deactivate: selectNative,
      dispose() {
        disposed = true; selection++; panel?.dispose(); restoreNative(); host.remove(); bodyHost.remove(); cityStats.remove();
        if (nativeStats.parentElement === heading) nativeStats.replaceWith(...nativeStats.childNodes);
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
  document.addEventListener('visibilitychange', () => { if (document.hidden) mounted?.deactivate(); });
  window.addEventListener('popstate', reconcile);
  window.addEventListener('pagehide', () => { beforeNavigate(); observer.disconnect(); });
  window.addEventListener('pageshow', () => { observe(); afterNavigate(); });
  window.__codeyearsOpenCity = () => { reconcile(); if (!mounted) return false; mounted.open(); return true; };
  observe(); reconcile();
})();
