/** 仅工程探针；网页结构是观察值，不是稳定 API。无存储、无每日数量写回。 */
export interface Detail {
  date: string;
  kind: 'commits' | 'pull-request' | 'review';
  repository: string;
  url: string;
  count?: number;
}
export interface DayDetails {
  date: string;
  source: string;
  state: 'visible' | 'no-visible-activity';
  details: Detail[];
  categorySummaries: string[];
  pagination: string[];
  limitations: string[];
}
export function validDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
}
/** 对应 CityParcel.indices → 规划时输入 days，而不是 min/max 区间。 */
export function memberDates(days: readonly { date: string }[], indices: readonly number[]): string[] {
  return [...new Set(indices.map(index => {
    if (!Number.isInteger(index) || index < 0 || !days[index] || !validDate(days[index].date)) throw new Error('建筑成员索引或日期无效');
    return days[index].date;
  }))].sort();
}
export function activityURL(login: string, date: string): URL {
  if (!/^[a-zA-Z0-9-]{1,39}$/.test(login) || !validDate(date)) throw new Error('用户名或日期无效');
  const url = new URL(`/${login}`, 'https://github.com');
  url.search = new URLSearchParams({ tab: 'overview', from: date, to: date }).toString();
  return url;
}
const clean = (node: Element) => node.textContent?.replace(/\s+/g, ' ').trim() ?? '';
function githubURL(raw: string): URL {
  const url = new URL(raw, 'https://github.com');
  if (url.origin !== 'https://github.com') throw new Error('活动链接来源不支持');
  return url;
}
export function parseDetails(doc: Document, login: string, date: string): DayDetails {
  const source = activityURL(login, date).href;
  const listing = doc.querySelectorAll('.contribution-activity-listing');
  if (listing.length !== 1) throw new Error('活动区域缺失或重复；未视为零贡献');
  const area = listing[0];
  const heading = clean(area.querySelector('h3') ?? area);
  const expected = new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  if (heading !== expected) throw new Error('返回日期范围不符；未把其他日期归到建筑');
  const details: Detail[] = [], categorySummaries: string[] = [], limitations: string[] = [];
  for (const item of area.querySelectorAll('.TimelineItem')) {
    // 精选活动没有顶层 summary；不重复计为一次 PR。
    const summary = item.querySelector('.TimelineItem-body > details-toggle > details > summary');
    if (!summary) { limitations.push('存在精选或未支持的活动，未计入详情数量'); continue; }
    const text = clean(summary);
    categorySummaries.push(text);
    const kind = /^Created [\d,]+ commits? in /.test(text) ? 'commits' : /^Opened [\d,]+ (?:other )?pull requests? in /.test(text) ? 'pull-request' : /^Reviewed [\d,]+ pull requests? in /.test(text) ? 'review' : undefined;
    if (!kind) { limitations.push('存在未支持的活动类型'); continue; }
    const selector = kind === 'commits' ? 'a[href*="/commits?"]' : 'a[data-hovercard-type="pull_request"]';
    const before = details.length;
    for (const anchor of item.querySelectorAll<HTMLAnchorElement>(selector)) {
      const url = githubURL(anchor.getAttribute('href') ?? '');
      const match = url.pathname.match(/^\/([^/]+\/[^/]+)\/(commits|pull\/\d+)$/);
      if (!match) throw new Error('活动链接格式变化');
      let count: number | undefined;
      if (kind === 'commits') {
        const quantity = clean(anchor).match(/^([\d,]+) commits?$/);
        if (!quantity || url.searchParams.get('since') !== date || url.searchParams.get('until') !== new Date(Date.parse(date) + 86400000).toISOString().slice(0, 10)) throw new Error('提交数量或日期窗口无法确认');
        count = Number(quantity[1].replaceAll(',', ''));
        if (!Number.isSafeInteger(count)) throw new Error('提交数量无效');
      }
      if (!details.some(detail => detail.kind === kind && detail.url === url.href)) details.push({ date, kind, repository: match[1], url: url.href, ...(count === undefined ? {} : { count }) });
    }
    const total = Number(text.match(/^[A-Za-z]+ ([\d,]+)/)?.[1].replaceAll(',', ''));
    const observed = details.slice(before).reduce((sum, detail) => sum + (detail.count ?? 1), 0);
    if (observed !== total) limitations.push('类别汇总与可见链接数量不一致，可能截断或延迟加载');
  }
  const noActivity = clean(area).includes(`${login} had no activity during this period.`);
  if (!categorySummaries.length && !noActivity && !area.querySelector('.TimelineItem')) throw new Error('无法识别活动或无可见活动提示');
  const pagination = [...doc.querySelectorAll<HTMLFormElement>('form.js-show-more-timeline-form')].map(form => githubURL(form.getAttribute('action') ?? '').href);
  if (pagination.length) limitations.push('页面有 Show more；仅记录链接，不自动追踪到其他日期');
  if (area.querySelector('include-fragment, .ajax-pagination-btn')) limitations.push('活动内部有延迟加载或分页，详情不完整');
  limitations.push('仅可见的相关项目；详情不保证覆盖每日合计，不承诺主要项目排名');
  return { date, source, state: details.length ? 'visible' : 'no-visible-activity', details, categorySummaries, pagination, limitations: [...new Set(limitations)] };
}
export async function fetchDetails(login: string, date: string, signal: AbortSignal): Promise<DayDetails> {
  if (location.origin !== 'https://github.com') throw new Error('公开取数请在 github.com 同源运行构建后的探针；本地页只支持合成验证');
  const url = activityURL(login, date);
  const response = await fetch(url, { credentials: 'omit', cache: 'no-store', redirect: 'error', headers: { Accept: 'text/html', 'X-Requested-With': 'XMLHttpRequest' }, signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}；详情失败不改变每日贡献数`);
  if (response.url !== url.href || !response.headers.get('content-type')?.includes('text/html')) throw new Error('来源或响应格式不符');
  const html = await response.text();
  signal.throwIfAborted();
  return parseDetails(new DOMParser().parseFromString(html, 'text/html'), login, date);
}
