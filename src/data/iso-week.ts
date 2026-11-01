const DAY = 86400000;
const WEEK = DAY * 7;

/** ISO周年第1周的周一：该周包含1月4日（也即当年第一个周四）。UTC仅用于日历运算。 */
export function isoYearStart(year: number): number {
  const january4 = Date.UTC(year, 0, 4);
  return january4 - (new Date(january4).getUTCDay() + 6) % 7 * DAY;
}

/** 输入为边界已校验的YYYY-MM-DD，不改变GitHub提供的日期或贡献数量。 */
export function isoWeekDate(date: string): { year: number; week: number; weekday: number } {
  const timestamp = Date.parse(`${date}T00:00:00Z`);
  const weekday = (new Date(timestamp).getUTCDay() + 6) % 7;
  const year = new Date(timestamp + (3 - weekday) * DAY).getUTCFullYear();
  return { year, week: Math.floor((timestamp - isoYearStart(year)) / WEEK) + 1, weekday: weekday + 1 };
}

export function isoYearWeeks(year: number): number {
  return (isoYearStart(year + 1) - isoYearStart(year)) / WEEK;
}
