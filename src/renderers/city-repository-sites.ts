import type { CityRepositorySite, LandscapeViewport } from './types';

export function createRepositorySites(host: HTMLElement) {
  const layer = document.createElement('div');
  layer.className = 'repository-sites';
  host.append(layer);
  const controls = new Map<string, ReturnType<typeof createSite>>();
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
    root.dataset.repositoryYears = String(site.year);
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
    card.id = `codeyears-repository-${site.entry.name}`;
    card.tabIndex = 0;
    card.hidden = true;
    const title = document.createElement('strong');
    title.id = `${card.id}-title`;
    card.setAttribute('aria-labelledby', title.id);
    button.setAttribute('aria-controls', card.id);
    const list = document.createElement('ul');
    const row = document.createElement('li'), name = document.createElement('span'), time = document.createElement('time');
    name.textContent = site.entry.name;
    time.dateTime = time.textContent = site.entry.date;
    row.append(name, time);
    list.append(row);
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
      const present = new Set(sites.map(site => site.entry.name));
      for (const [name, control] of controls) if (!present.has(name)) {
        if (openSite === control) close();
        control.root.remove();
        controls.delete(name);
      }
      for (const site of sites) {
        let control = controls.get(site.entry.name);
        if (!control) { control = createSite(site); controls.set(site.entry.name, control); }
        const { root, button, card, title, hits } = control;
        const left = Math.min(...site.buildings.map(building => building.left));
        const top = Math.min(...site.buildings.map(building => building.top));
        const width = Math.max(...site.buildings.map(building => building.left + building.width)) - left;
        const height = Math.max(...site.buildings.map(building => building.top + building.height)) - top;
        root.hidden = left + width <= 0 || top + height <= 0 || left >= viewport.width || top >= viewport.height;
        if (root.hidden && openSite === control) close();
        if (root.hidden) continue;
        const caption = `${label} · ${site.year}`;
        if (title.textContent !== caption) {
          title.textContent = caption;
          button.setAttribute('aria-label', `${caption} · ${site.entry.name}`);
        }
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
