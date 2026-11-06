import { assembleContributionHistory, type ContributionHistory } from "../../data/history";
import type { ContributionYear } from "../../data/types";
import { loadContributionYear } from "./load-year";
import { yearCacheExpiresAt } from "../../cache/year-cache";
import type { GitHubPageContext } from "./types";

export interface HistoryLoadProgress {
  readonly year: number;
  readonly source: "cache" | "network";
  readonly warning: string;
  readonly history: ContributionHistory;
  readonly expiresAt: number;
}

/**
 * 显式调用后最多同时读取两个年度；身份确认、缓存和请求均复用年度路径。
 * 每个已验证年度同步报告冻结快照及来源/警告，不驱动播放。
 * 失败或取消直接拒绝，调用方可保留此前进度；本模块不另存数据。
 */
export async function loadContributionHistory(
  context: GitHubPageContext,
  expectedYears: readonly number[],
  forceRefresh: boolean,
  signal: AbortSignal,
  currentContext: () => GitHubPageContext,
  onProgress?: (progress: HistoryLoadProgress) => void,
): Promise<ContributionHistory> {
  signal.throwIfAborted();
  const years = [...expectedYears].sort((a, b) => a - b);
  const records: ContributionYear[] = [];
  // 同时在任何请求前由现有组装边界拒绝重复期望年度。
  let history = assembleContributionHistory(context.profileLogin, years, records);
  const stop = new AbortController(), pending = AbortSignal.any([signal, stop.signal]);
  let next = 0;
  const read = async () => {
    while (next < years.length) {
      pending.throwIfAborted();
      const year = years[next++];
      const result = await loadContributionYear(context, year, forceRefresh, pending, currentContext);
      pending.throwIfAborted();
      records.push(result.value);
      history = assembleContributionHistory(context.profileLogin, years, records);
      onProgress?.(Object.freeze({ year, source: result.source, warning: result.warning, history, expiresAt: yearCacheExpiresAt(result.value) }));
      pending.throwIfAborted();
    }
  };
  try { await Promise.all([read(), read()]); }
  catch (error) { stop.abort(); throw error; }
  return history;
}
