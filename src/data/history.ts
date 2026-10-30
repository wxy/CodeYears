import type { ContributionYear, DailyContribution } from "./types";

export interface ContributionHistory {
  readonly profileLogin: string;
  readonly days: readonly DailyContribution[];
  readonly providedYears: readonly number[];
  readonly missingYears: readonly number[];
  /** 仅表示所需年度记录齐全，不表示全年覆盖或播放进度。 */
  readonly status: "complete" | "partial";
}

/**
 * 组合同一主页已校验的年度记录，不请求、不填补日期，也不驱动播放。
 * 调用方须先保证记录属于同一有效访问者作用域；主页名不是访问者身份。
 * 日期与数量由年度解析边界校验，此处只拒绝组装范围的歧义。
 * 返回冻结的独立快照，不排序或冻结调用方输入。
 */
export function assembleContributionHistory(
  profileLogin: string,
  expectedYears: readonly number[],
  records: readonly ContributionYear[],
): ContributionHistory {
  const requested = new Set(expectedYears);
  if (requested.size !== expectedYears.length) throw new Error("Duplicate requested year.");

  const provided = new Set<number>();
  const days: DailyContribution[] = [];
  const normalizedLogin = profileLogin.toLowerCase();
  for (const record of records) {
    if (record.profileLogin.toLowerCase() !== normalizedLogin) throw new Error("Contribution profile does not match requested profile.");
    if (!requested.has(record.year)) throw new Error("Contribution year was not requested.");
    if (provided.has(record.year)) throw new Error("Duplicate contribution year.");
    provided.add(record.year);
    for (const day of record.days) days.push(Object.freeze({ date: day.date, count: day.count }));
  }

  days.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
  const providedYears = [...provided].sort((a, b) => a - b);
  const missingYears = expectedYears.filter(year => !provided.has(year)).sort((a, b) => a - b);
  return Object.freeze({
    profileLogin: normalizedLogin,
    days: Object.freeze(days),
    providedYears: Object.freeze(providedYears),
    missingYears: Object.freeze(missingYears),
    status: missingYears.length === 0 ? "complete" : "partial",
  });
}
