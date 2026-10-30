import { clearProfileCache, readYearCache, writeYearCache } from "../../cache/year-cache";
import type { YearCacheScope } from "../../cache/types";
import type { ContributionYear } from "../../data/types";
import type { GitHubPageContext } from "./types";
import { fetchContributionYear, readLivePageContext } from "./probe";

interface LoadedYear {
  readonly value: ContributionYear;
  readonly source: "cache" | "network";
  readonly displayedTotal?: number;
  readonly warning: string;
}

function sameContext(left: GitHubPageContext, right: GitHubPageContext): boolean {
  const identity = (context: GitHubPageContext) => context.viewer.state === "unknown" ? "unknown" :
    context.viewer.identity.kind === "signed-out" ? "signed-out" : `user:${context.viewer.identity.login.toLowerCase()}`;
  return left.profileLogin.toLowerCase() === right.profileLogin.toLowerCase() && identity(left) === identity(right);
}

function ensureCurrent(context: GitHubPageContext, signal: AbortSignal, currentContext: () => GitHubPageContext): void {
  signal.throwIfAborted();
  if (!sameContext(context, currentContext())) throw new Error("主页或访问者身份已改变，请刷新页面后重新打开诊断。");
}

async function confirmViewer(context: GitHubPageContext, signal: AbortSignal): Promise<void> {
  const live = await readLivePageContext(context.profileLogin, signal);
  if (live.viewer.state === "unknown" || !sameContext(context, live)) throw new Error("当前 GitHub 会话身份无法确认或已经改变；未使用旧缓存，请刷新页面后重试。");
}

export async function loadContributionYear(context: GitHubPageContext, year: number, forceRefresh: boolean,
  signal: AbortSignal, currentContext: () => GitHubPageContext): Promise<LoadedYear> {
  ensureCurrent(context, signal, currentContext);
  const scope: YearCacheScope | undefined = context.viewer.state === "known" ?
    { viewer: context.viewer.identity, profileLogin: context.profileLogin, year } : undefined;
  const warnings: string[] = [];
  if (scope) {
    await confirmViewer(context, signal);
    ensureCurrent(context, signal, currentContext);
    if (!forceRefresh) {
      let cached: ContributionYear | undefined;
      try { cached = await readYearCache(scope); }
      catch { warnings.push("缓存读取失败，本次改为联网获取。"); }
      ensureCurrent(context, signal, currentContext);
      if (cached) {
        await confirmViewer(context, signal);
        ensureCurrent(context, signal, currentContext);
        return { value: cached, source: "cache", warning: warnings.join(" ") };
      }
    }
  } else warnings.push("访问者身份未识别，本次不读取或写入缓存。");

  const result = await fetchContributionYear(context, year, signal);
  if (scope) {
    await confirmViewer(context, signal);
    ensureCurrent(context, signal, currentContext);
    try { await writeYearCache(scope, result.value); }
    catch { warnings.push("已取得真实数据，但缓存写入失败；本次结果仅保留在页面中。"); }
  }
  ensureCurrent(context, signal, currentContext);
  return { value: result.value, displayedTotal: result.displayedTotal, source: "network", warning: warnings.join(" ") };
}

export async function clearContributionCache(context: GitHubPageContext, signal: AbortSignal,
  currentContext: () => GitHubPageContext): Promise<void> {
  ensureCurrent(context, signal, currentContext);
  if (context.viewer.state !== "known") throw new Error("身份未识别，无法选择要清除的缓存作用域。");
  await confirmViewer(context, signal);
  ensureCurrent(context, signal, currentContext);
  await clearProfileCache(context.viewer.identity, context.profileLogin);
}
