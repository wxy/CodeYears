import type { ContributionYear, DailyContribution } from "./types";

export interface ParsedYear {
  readonly value: ContributionYear;
  readonly total: number;
  readonly displayedTotal: number;
}

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** 仅支持本轮真实页面观察到的英文 tooltip 格式；变化时明确失败。 */
export function parseContributionYear(doc: Document, profileLogin: string, year: number, fetchedAt: Date): ParsedYear {
  const grids = doc.querySelectorAll("table.ContributionCalendar-grid");
  if (grids.length !== 1) throw new Error("页面没有唯一贡献日历，可能为会话跳转或页面结构变化。");

  const headings = Array.from(doc.querySelectorAll("h2"))
    .map(e => e.textContent?.replace(/\s+/g, " ").trim() ?? "")
    .map(text => text.match(/^(\d+|\d{1,3}(?:,\d{3})+) contributions? in (\d{4})$/))
    .filter((match): match is RegExpMatchArray => match !== null);
  if (headings.length !== 1 || Number(headings[0][2]) !== year) throw new Error("年度标题无法识别；当前解析器仅验证了英文年度格式。");
  const displayedTotal = Number(headings[0][1].replaceAll(",", ""));
  if (!Number.isSafeInteger(displayedTotal)) throw new Error("年度总数不是有效整数。");

  const tooltips = new Map<string, string>();
  for (const tooltip of doc.querySelectorAll("tool-tip[for]")) {
    const target = tooltip.getAttribute("for")!;
    if (tooltips.has(target)) throw new Error("日期 tooltip 绑定重复。");
    tooltips.set(target, tooltip.textContent?.trim() ?? "");
  }

  const start = `${year}-01-01`;
  const today = fetchedAt.toISOString().slice(0, 10);
  const end = year === fetchedAt.getUTCFullYear() ? today : `${year}-12-31`;
  const byDate = new Map<string, DailyContribution>();
  for (const cell of grids[0].querySelectorAll("[data-date]")) {
    const date = cell.getAttribute("data-date")!;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("贡献日期格式不支持。");
    const parsedDate = new Date(`${date}T00:00:00Z`);
    if (!Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) throw new Error("贡献日期不存在。");
    if (date < start || date > `${year}-12-31` || byDate.has(date)) throw new Error("日历存在越界或重复日期。");
    // 当年片段实际返回整年格子；未来格不是已经发生的零贡献日期。
    if (date > end) continue;
    const text = tooltips.get(cell.id) ?? "";
    const match = text.match(/^(No|\d+|\d{1,3}(?:,\d{3})+) contributions? on ([A-Za-z]+) (\d{1,2})(?:st|nd|rd|th)\.$/);
    if (!match || months[parsedDate.getUTCMonth()] !== match[2] || parsedDate.getUTCDate() !== Number(match[3])) throw new Error(`无法准确解析 ${date} 的数量或日期文本；未使用颜色等级估算。`);
    const count = match[1] === "No" ? 0 : Number(match[1].replaceAll(",", ""));
    if (!Number.isSafeInteger(count) || count < 0) throw new Error(`${date} 的数量不是有效非负整数。`);
    byDate.set(date, { date, count });
  }

  const days = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  const expectedDays = Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000) + 1;
  if (days.length !== expectedDays || days[0]?.date !== start || days.at(-1)?.date !== end) throw new Error(`年度日期覆盖不完整：收到 ${days.length} 天，预期 ${expectedDays} 天；缺失日期未填零。`);
  const total = days.reduce((sum, day) => sum + day.count, 0);
  if (total !== displayedTotal) throw new Error(`逐日合计 ${total} 与页面年度总数 ${displayedTotal} 不一致，尚不能确认为准确数据。`);

  return { value: { profileLogin, year, days, fetchedAt: fetchedAt.toISOString(), parserVersion: 1 }, total, displayedTotal };
}
