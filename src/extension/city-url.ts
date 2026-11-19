const cityFragment = '#codeyears-city';

export function isCityUrl(hash = location.hash): boolean {
  return hash === cityFragment || hash.startsWith(`${cityFragment}?`);
}

export function readCityYears(years: readonly number[]): readonly [number, number] | undefined {
  if (!isCityUrl() || location.hash === cityFragment) return;
  const params = new URLSearchParams(location.hash.slice(cityFragment.length + 1));
  const selected = (key: string) => {
    const value = params.get(key);
    return value && /^\d{4}$/.test(value) && years.includes(Number(value)) ? Number(value) : undefined;
  };
  const from = selected('from'), to = selected('to') ?? years[0];
  const start = from ?? Math.min(years[Math.min(2, years.length - 1)], to);
  return [Math.min(start, to), Math.max(start, to)];
}

export function writeCityYears(from: string, to: string): void {
  const hash = `${cityFragment}?${new URLSearchParams({ from, to })}`;
  if (location.hash === hash) return;
  const url = new URL(location.href);
  url.hash = hash;
  history.replaceState(history.state, '', url);
}
