export interface RepositoryCreation {
  name: string;
  date: string;
}

/** Public metadata for the profile being viewed, independent of the visitor's GitHub session. */
export async function loadRepositoryCreations(login: string, signal: AbortSignal): Promise<readonly RepositoryCreation[]> {
  const url = new URL(`https://api.github.com/users/${encodeURIComponent(login)}/repos`);
  url.search = 'type=owner&sort=created&direction=desc&per_page=100';
  const creations = new Map<string, RepositoryCreation>();
  for (let page = 1; ; page++) {
    url.searchParams.set('page', String(page));
    const response = await fetch(url, {
      credentials: 'omit', signal, headers: { Accept: 'application/vnd.github+json' },
    });
    if (!response.ok) throw new Error(`Repository metadata: HTTP ${response.status}`);
    const entries: unknown = await response.json();
    if (!Array.isArray(entries)) throw new Error('Repository metadata: invalid list');
    for (const repo of entries) {
      if (typeof repo?.name !== 'string' || typeof repo.created_at !== 'string') continue;
      const created = Date.parse(repo.created_at);
      if (!Number.isFinite(created)) continue;
      creations.set(repo.name.toLowerCase(), { name: repo.name, date: new Date(created).toISOString().slice(0, 10) });
    }
    if (!response.headers.get('link')?.includes('rel="next"')) break;
  }
  return [...creations.values()];
}
