import { localize, text, type Language } from './i18n';
import type { CityRoadControl, CityReturnControl } from '../renderers/landscape';
import { isProfileOwner, type GitHubPageContext } from '../platform/github/types';
import { readCityJourney, rememberCityJourney } from './city-travel';

interface RoadOptions {
  currentContext(): GitHubPageContext;
  language(): Language;
  changed(controls: readonly CityRoadControl[], returnPost?: CityReturnControl): void;
}

/** 出口由主页 Bio 的顺序决定，返程由本标签页的访问路径决定。 */
export function createCityRoads(host: HTMLElement, options: RoadOptions) {
  let controls: CityRoadControl[] = [], returnPost: CityReturnControl | undefined;
  let mentions:readonly string[] = [], exitCount = 4;
  let opener: HTMLElement | undefined;
  const lifetime = new AbortController();
  const { signal } = lifetime;
  host.hidden = true;
  host.innerHTML = `<section id="road-info-dialog" role="dialog" aria-labelledby="road-info-title" aria-describedby="road-info-note">
    <header><h3 id="road-info-title"></h3><button type="button" data-i18n-label="closeRoadInfo">×</button></header>
    <ul></ul><p id="road-info-note"></p>
    <div class="bio-examples" hidden>
      <p class="note" data-i18n="bioExamplesHint"></p>
      <ul></ul><p class="note copy-status" role="status"></p>
    </div>
  </section>`;
  const closeButton = host.querySelector('button')!, list = host.querySelector('ul')!;
  const heading = host.querySelector('h3')!, note = host.querySelector('p')!;
  const examples = host.querySelector<HTMLElement>('.bio-examples')!;
  const exampleList = examples.querySelector('ul')!, copyStatus = examples.querySelector<HTMLElement>('.copy-status')!;
  let copyTimeout: number | undefined;
  function clearCopyStatus() {
    window.clearTimeout(copyTimeout);
    copyStatus.textContent = '';
  }
  function close(restoreFocus = false) {
    host.hidden = true;
    clearCopyStatus();
    if (restoreFocus) opener?.focus({ preventScroll: true });
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
  function showPanel(anchor: HTMLElement, title: string, description: string) {
    opener = anchor;
    heading.textContent = title;
    note.textContent = description;
    list.hidden = !list.childElementCount;
    note.classList.toggle('note', !list.hidden);
    host.hidden = false;
    const area = host.parentElement!.getBoundingClientRect(), point = anchor.getBoundingClientRect();
    const below = point.bottom - area.top + 8;
    const top = below + host.offsetHeight <= area.height - 8 ? below : point.top - area.top - host.offsetHeight - 8;
    host.style.left = `${Math.max(8, Math.min(area.width - host.offsetWidth - 8, point.left - area.left))}px`;
    host.style.top = `${Math.max(8, top)}px`;
    closeButton.focus({ preventScroll: true });
  }
  function showReturns(anchor: HTMLAnchorElement) {
    const stops = journey();
    if (!stops.length) return;
    list.replaceChildren(...[...stops].reverse().map(stop => {
      const row = document.createElement('li');
      row.append(cityLink(stop.login, true));
      return row;
    }));
    const language = options.language();
    examples.hidden = true;
    showPanel(anchor, text(language, 'returnRoadHeading'), text(language, 'returnRoadLocal'));
  }
  async function copyBioExample(value: string) {
    clearCopyStatus();
    try {
      await navigator.clipboard.writeText(value);
      copyStatus.textContent = text(options.language(), 'bioExampleCopied');
    } catch {
      copyStatus.textContent = text(options.language(), 'bioExampleCopyFailed');
    }
    copyTimeout = window.setTimeout(clearCopyStatus, 3000);
  }
  exampleList.addEventListener('command', event => {
    if ((event as CommandEvent).command === '--copy') void copyBioExample((event.target as HTMLElement).textContent!);
  }, { capture: true, signal });

  function emptyExit(slot: number): CityRoadControl {
    const sign = document.createElement('button');
    sign.type = 'button';
    sign.className = 'city-road-sign';
    sign.title = text(options.language(), 'emptyExitLabel', [slot + 1]);
    sign.setAttribute('aria-label', sign.title);
    sign.setAttribute('aria-haspopup', 'dialog');
    sign.setAttribute('aria-controls', 'road-info-dialog');
    sign.onclick = () => {
      const context = options.currentContext(), language = options.language();
      const hint = isProfileOwner(context) ? 'emptyExitOwner' : 'emptyExitVisitor';
      list.replaceChildren();
      const phrases = [
        'I also like what @username is building',
        'I’ve worked on open source with @username',
        'I’ve had help from @username with my projects',
      ];
      exampleList.replaceChildren(...phrases.map((phrase, index) => {
        const row = document.createElement('li');
        const example = document.createElement('span');
        example.id = `road-bio-example-${index}`;
        example.lang = 'en';
        example.textContent = phrase;
        const copy = document.createElement('button');
        copy.type = 'button';
        copy.textContent = text(language, 'copyBioExample');
        copy.setAttribute('aria-describedby', example.id);
        copy.setAttribute('command', '--copy');
        copy.setAttribute('commandfor', example.id);
        if (!('CommandEvent' in window)) copy.onclick = () => { void copyBioExample(example.textContent!); };
        row.append(example, copy);
        return row;
      }));
      examples.hidden = false;
      showPanel(sign, text(language, 'emptyExitHeading'), text(language, hint, [context.profileLogin]));
    };
    return { sign, label: '', returning: false };
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
    mentions = people;
    const focused = opener ?? controls.find(({sign}) => sign.matches(':focus'))?.sign
      ?? (returnPost?.sign.matches(':focus') ? returnPost.sign : undefined);
    const focusedSlot = controls.findIndex(({sign}) => sign === focused);
    close();
    localize(host, options.language());
    const trail = journey().map(stop => stop.login), previous = trail.at(-1);
    const destinations = people.slice(0,exitCount);
    controls = Array.from({length: exitCount}, (_, slot) => {
      const login = destinations[slot];
      const exit = login ? makeExit(login, login.toLowerCase() === previous, trail.includes(login.toLowerCase())) : emptyExit(slot);
      exit.sign.dataset.roadSlot = String(slot);
      return exit;
    });
    returnPost = undefined;
    if (previous && !destinations.some(login => login.toLowerCase() === previous)) {
      returnPost = makeExit(previous, true, true);
      returnPost.sign.classList.add('city-return-post');
      returnPost.surface.classList.add('city-return-surface');
    }
    options.changed(controls, returnPost);
    if (focused) {
      const login = focused.dataset.destination?.toLowerCase();
      const destinations = returnPost ? [...controls, returnPost] : controls;
      const sameCity = login ? destinations.find(({label}) => label.toLowerCase() === login) : undefined;
      const slot = controls[focusedSlot];
      const next = sameCity ?? (slot?.sign.hidden ? returnPost : slot);
      next?.sign.focus({ preventScroll: true });
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
  return { controls: () => controls, returnPost: () => returnPost, close, refresh,
    setExitCount(count:number) {
      if (exitCount === count) return;
      exitCount = count;
      refresh(mentions);
    },
    dispose() { clearCopyStatus(); lifetime.abort(); host.replaceChildren(); } };
}
