import { localize, text, type Language } from './i18n';
import type { CityRoadControl, CityReturnControl } from '../renderers/landscape';
import type { GitHubPageContext } from '../platform/github/types';
import { readCityJourney, rememberCityJourney } from './city-travel';

interface RoadOptions {
  currentContext(): GitHubPageContext;
  language(): Language;
  changed(controls: readonly CityRoadControl[], returnPost?: CityReturnControl): void;
}

/** 出口由主页 Bio 的顺序决定，返程由本标签页的访问路径决定。 */
export function createCityRoads(host: HTMLElement, options: RoadOptions) {
  let controls: CityRoadControl[] = [], returnPost: CityReturnControl | undefined;
  let opener: HTMLAnchorElement | undefined;
  const lifetime = new AbortController();
  const { signal } = lifetime;
  host.hidden = true;
  host.innerHTML = `<section role="dialog" aria-labelledby="road-return-title">
    <header><h3 id="road-return-title" data-i18n="returnRoadHeading"></h3><button type="button" data-i18n-label="closeReturnRoad">×</button></header>
    <ul></ul><p class="note" data-i18n="returnRoadLocal"></p>
  </section>`;
  const closeButton = host.querySelector('button')!, list = host.querySelector('ul')!;
  function close(restoreFocus = false) {
    host.hidden = true;
    if (restoreFocus) opener?.focus();
    opener = undefined;
  }
  function journey() {
    try { return readCityJourney(options.currentContext()); }
    catch { return []; } // Session storage can be unavailable while native navigation still works.
  }
  function cityLink(login: string, returning: boolean) {
    const link = document.createElement('a');
    link.href = `https://github.com/${login}#codeyears-city`;
    link.dataset.turbo = 'false';
    link.textContent = text(options.language(), returning ? 'returnToCity' : 'cityName', [login]);
    link.onclick = event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      try { rememberCityJourney(options.currentContext(), login.toLowerCase()); } catch { /* Keep the native link usable. */ }
    };
    return link;
  }
  function showReturns(anchor: HTMLAnchorElement) {
    const stops = journey();
    if (!stops.length) return;
    opener = anchor;
    list.replaceChildren(...[...stops].reverse().map(stop => {
      const row = document.createElement('li');
      row.append(cityLink(stop.login, true));
      return row;
    }));
    host.hidden = false;
    const area = host.parentElement!.getBoundingClientRect(), point = anchor.getBoundingClientRect();
    const below = point.bottom - area.top + 8;
    const top = below + host.offsetHeight <= area.height - 8 ? below : point.top - area.top - host.offsetHeight - 8;
    host.style.left = `${Math.max(8, Math.min(area.width - host.offsetWidth - 8, point.left - area.left))}px`;
    host.style.top = `${Math.max(8, top)}px`;
    closeButton.focus();
  }
  function makeExit(login: string, returning: boolean, hasTrail: boolean) {
    const sign = cityLink(login, returning), surface = cityLink(login, returning);
    sign.className = 'city-road-sign';
    surface.className = 'city-road-surface';
    sign.title = surface.title = sign.textContent!;
    sign.setAttribute('aria-label', sign.title);
    sign.textContent = surface.textContent = '';
    sign.dataset.destination = login;
    surface.tabIndex = -1;
    surface.setAttribute('aria-hidden', 'true');
    if (hasTrail) {
      sign.title += ` · ${text(options.language(), 'roadReturnHint')}`;
      sign.oncontextmenu = event => { event.preventDefault(); showReturns(sign); };
      sign.onkeydown = event => {
        if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return;
        event.preventDefault(); event.stopPropagation(); showReturns(sign);
      };
    }
    return { sign, surface, label: login, returning };
  }
  function refresh(people: readonly string[]) {
    const focusedLogin = opener?.dataset.destination ?? controls.find(({sign}) => sign.matches(':focus'))?.label
      ?? (returnPost?.sign.matches(':focus') ? returnPost.label : undefined);
    close();
    localize(host, options.language());
    const trail = journey().map(stop => stop.login), previous = trail.at(-1);
    controls = people.map((login, slot) => {
      const exit = makeExit(login, login.toLowerCase() === previous, trail.includes(login.toLowerCase()));
      exit.sign.dataset.roadSlot = String(slot);
      return exit;
    });
    returnPost = undefined;
    if (previous && !people.some(login => login.toLowerCase() === previous)) {
      returnPost = makeExit(previous, true, true);
      returnPost.sign.classList.add('city-return-post');
      returnPost.surface.classList.add('city-return-surface');
    }
    options.changed(controls, returnPost);
    if (focusedLogin) {
      const next = controls.find(({label}) => label.toLowerCase() === focusedLogin.toLowerCase()) ?? returnPost;
      if (next?.label.toLowerCase() === focusedLogin.toLowerCase()) next.sign.focus({ preventScroll: true });
    }
  }
  closeButton.onclick = () => close(true);
  document.addEventListener('pointerdown', event => { if (!host.hidden && !event.composedPath().includes(host)) close(); }, { capture: true, signal });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || event.isComposing || host.hidden) return;
    event.preventDefault(); event.stopPropagation(); close(true);
  }, { capture: true, signal });
  host.parentElement!.addEventListener('wheel', event => { if (!host.hidden && !event.composedPath().includes(host)) close(); }, { passive: true, signal });
  window.addEventListener('resize', () => close(), { signal });
  return { controls: () => controls, returnPost: () => returnPost, close, refresh, dispose() { lifetime.abort(); host.replaceChildren(); } };
}
