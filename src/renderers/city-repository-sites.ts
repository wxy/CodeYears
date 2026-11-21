import type { CityRepositorySite, LandscapeViewport } from './types';

export function createRepositorySites(host: HTMLElement) {
  const layer = document.createElement('div');
  layer.className = 'repository-sites';
  host.append(layer);
  const controls = new Map<number, ReturnType<typeof createSite>>();
  let openSite: ReturnType<typeof createSite> | undefined;
  let label = 'Public repository creations';
  const events = new AbortController();
  const close = () => {
    if (!openSite) return;
    openSite.root.removeAttribute('data-open');
    openSite.card.hidden = true;
    openSite.button.setAttribute('aria-expanded', 'false');
    openSite = undefined;
  };

  function createSite(site: CityRepositorySite) {
    const root = document.createElement('div');
    root.className = 'repository-site';
    root.dataset.repositoryYears = site.years;
    const button = document.createElement('button');
    button.type = 'button';
    const hits = site.buildings.map(() => {
      const hit = document.createElement('span');
      hit.className = 'repository-house';
      hit.setAttribute('aria-hidden', 'true');
      button.append(hit);
      return hit;
    });
    button.setAttribute('aria-expanded', 'false');
    const card = document.createElement('section');
    card.className = 'repository-card';
    card.id = `codeyears-repositories-${site.band}`;
    card.tabIndex = 0;
    card.hidden = true;
    const title = document.createElement('strong');
    title.id = `${card.id}-title`;
    card.setAttribute('aria-labelledby', title.id);
    button.setAttribute('aria-controls', card.id);
    const list = document.createElement('ul');
    for (const entry of site.entries) {
      const row = document.createElement('li'), name = document.createElement('span'), time = document.createElement('time');
      name.textContent = entry.name;
      time.dateTime = time.textContent = entry.date;
      row.append(name, time);
      list.append(row);
    }
    card.append(title, list);
    root.append(button, card);
    layer.append(root);
    const control = { root, button, card, title, hits };
    const open = () => {
      if (openSite === control) return;
      close();
      openSite = control;
      root.setAttribute('data-open', '');
      card.hidden = false;
      button.setAttribute('aria-expanded', 'true');
    };
    root.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse' && !event.buttons) open(); });
    root.addEventListener('pointerleave', () => { if (openSite === control && !root.matches(':focus-within')) close(); });
    root.addEventListener('focusout', event => {
      if (openSite === control && !root.contains(event.relatedTarget as Node | null) && !root.matches(':hover')) close();
    });
    button.addEventListener('focus', open);
    button.addEventListener('click', open);
    return control;
  }

  host.addEventListener('pointerdown', event => {
    if (openSite && !event.composedPath().includes(openSite.root)) close();
  }, { signal: events.signal, capture: true });
  host.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !openSite) return;
    event.preventDefault();
    event.stopPropagation();
    const { button, card } = openSite;
    if (card.matches(':focus-within')) button.focus({ preventScroll: true });
    close();
  }, { signal: events.signal, capture: true });

  return {
    setLabel(next: string) { label = next; },
    position(sites: readonly CityRepositorySite[], viewport: LandscapeViewport) {
      const present = new Set(sites.map(site => site.band));
      for (const [band, control] of controls) if (!present.has(band)) {
        if (openSite === control) close();
        control.root.remove();
        controls.delete(band);
      }
      for (const site of sites) {
        let control = controls.get(site.band);
        if (!control) { control = createSite(site); controls.set(site.band, control); }
        const { root, button, card, title, hits } = control;
        const left = Math.min(...site.buildings.map(building => building.left));
        const top = Math.min(...site.buildings.map(building => building.top));
        const width = Math.max(...site.buildings.map(building => building.left + building.width)) - left;
        const height = Math.max(...site.buildings.map(building => building.top + building.height)) - top;
        root.hidden = left + width <= 0 || top + height <= 0 || left >= viewport.width || top >= viewport.height;
        if (root.hidden && openSite === control) close();
        if (root.hidden) continue;
        const caption = `${label} · ${site.years}`;
        if (title.textContent !== caption) { title.textContent = caption; button.setAttribute('aria-label', caption); }
        const panelWidth = Math.min(290, viewport.width - 16);
        const panelLeft = Math.min(viewport.width - panelWidth - 8, Math.max(8, left + (width - panelWidth) / 2));
        const below = viewport.height - top - height;
        const above = top > below;
        root.toggleAttribute('data-above', above);
        Object.assign(root.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` });
        site.buildings.forEach((building, index) => Object.assign(hits[index].style, {
          left: `${building.left - left}px`, top: `${building.top - top}px`, width: `${building.width}px`, height: `${building.height}px`,
        }));
        Object.assign(card.style, { left: `${panelLeft - left}px`, width: `${panelWidth}px`, maxHeight: `${Math.min(228, (above ? top : below) - 4)}px` });
      }
    },
    close,
    dispose() { events.abort(); layer.remove(); controls.clear(); },
  };
}
