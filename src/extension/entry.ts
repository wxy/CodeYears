export {};

declare global {
  interface Window { __codeyearsOpenCity?: () => boolean }
}

interface CityPanel {
  activate(): Promise<void>;
  deactivate(): void;
  dispose(): void;
}

(() => {
  if (window.__codeyearsOpenCity) return;

  let mounted: { root: HTMLElement; native: HTMLElement; host: HTMLElement; profile: string; open(): void; deactivate(): void; dispose(): void } | undefined;
  let navigating = false, queued = false;

  function mount(root: HTMLElement, native: HTMLElement, profile: string) {
    const host = document.createElement('section');
    host.id = 'codeyears-profile-tabs';
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { display:block; margin:0 0 12px; color:var(--fgColor-default,#1f2328); font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
        * { box-sizing:border-box; } [hidden] { display:none!important; }
        .tabs { display:flex; gap:4px; padding:0 0 8px; margin-bottom:12px; border-bottom:1px solid var(--borderColor-default,#d1d9e0); }
        button { font:inherit; color:inherit; cursor:pointer; }
        .tabs button { padding:6px 12px; border:0; border-radius:7px; background:transparent; }
        .tabs button[aria-pressed="true"] { background:var(--bgColor-muted,#f6f8fa); font-weight:600; box-shadow:inset 0 -2px #398466; }
        button:focus-visible { outline:2px solid #268f80; outline-offset:2px; }
        #entry-status { display:block; margin:10px 0; white-space:pre-line; font-size:13px; }
        #retry { padding:5px 12px; border:1px solid var(--borderColor-default,#d1d9e0); border-radius:7px; background:var(--bgColor-default,#fff); }
      </style>
      <div class="tabs" role="group" aria-label="贡献展示方式">
        <button id="tab-native" type="button" aria-pressed="true">贡献图</button>
        <button id="tab-city" type="button" aria-pressed="false">城市 · CodeYears</button>
      </div>
      <output id="entry-status" role="status" aria-live="polite" hidden></output>
      <button id="retry" type="button" hidden>重试</button>
      <div id="city-panel" hidden></div>`;
    const nativeButton = shadow.querySelector<HTMLButtonElement>('#tab-native')!;
    const cityButton = shadow.querySelector<HTMLButtonElement>('#tab-city')!;
    const panelHost = shadow.querySelector<HTMLElement>('#city-panel')!;
    const status = shadow.querySelector<HTMLOutputElement>('#entry-status')!;
    const retry = shadow.querySelector<HTMLButtonElement>('#retry')!;
    const display = native.style.getPropertyValue('display'), priority = native.style.getPropertyPriority('display');
    let active = false, disposed = false, selection = 0, panel: CityPanel | undefined;
    let modulePromise: Promise<{ mountCityPanel(host: HTMLElement): CityPanel }> | undefined;

    const restoreNative = () => {
      if (display) native.style.setProperty('display', display, priority);
      else native.style.removeProperty('display');
    };
    const selectNative = () => {
      active = false; selection++; panel?.deactivate(); restoreNative();
      nativeButton.setAttribute('aria-pressed', 'true'); cityButton.setAttribute('aria-pressed', 'false');
      panelHost.hidden = status.hidden = retry.hidden = true;
      host.dataset.view = 'native';
    };
    const selectCity = async () => {
      if (active || disposed || document.hidden) return;
      active = true; const token = ++selection;
      native.style.setProperty('display', 'none', 'important');
      nativeButton.setAttribute('aria-pressed', 'false'); cityButton.setAttribute('aria-pressed', 'true');
      host.dataset.view = 'city'; panelHost.hidden = false; retry.hidden = true;
      status.hidden = false; status.textContent = '正在准备城市…';
      try {
        modulePromise ??= import(/* @vite-ignore */ chrome.runtime.getURL('content.js'));
        const module = await modulePromise;
        if (disposed || token !== selection || !active) return;
        panel ??= module.mountCityPanel(panelHost);
        status.hidden = true;
        await panel.activate();
      } catch {
        if (disposed || token !== selection || !active) return;
        modulePromise = undefined; panel?.deactivate(); panelHost.hidden = true;
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
    root.insertBefore(host, native); host.dataset.view = 'native';
    return {
      root, native, host, profile,
      open() { host.scrollIntoView({ block: 'nearest' }); void selectCity(); },
      deactivate: selectNative,
      dispose() { disposed = true; selection++; panel?.dispose(); restoreNative(); host.remove(); },
    };
  }

  function reconcile() {
    const profile = location.origin === 'https://github.com' ? location.pathname.match(/^\/([a-zA-Z0-9-]{1,39})\/?$/)?.[1].toLowerCase() : undefined;
    if (mounted && (profile !== mounted.profile || !mounted.native.isConnected || !mounted.host.isConnected)) {
      mounted.dispose(); mounted = undefined;
    }
    if (mounted || navigating || !profile) return;
    const root = document.querySelector<HTMLElement>('.js-yearly-contributions');
    const grid = root?.querySelector<HTMLElement>('table.ContributionCalendar-grid');
    if (!root || !grid || !document.querySelector('a[id^="year-link-"]')) return;
    let native = grid;
    while (native.parentElement !== root) native = native.parentElement!;
    mounted = mount(root, native, profile);
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
