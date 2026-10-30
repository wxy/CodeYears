import { browserCalendarDate } from "../data/calendar-date";
import { PARSER_VERSION } from "../data/parse-year";
import type { ContributionYear } from "../data/types";
import type { ViewerIdentity, YearCacheRecord, YearCacheScope } from "./types";

const SCHEMA_VERSION = 1;
const DAY_MS = 86_400_000;

function profilePrefix(viewer: ViewerIdentity, profileLogin: string): string {
  const identity = viewer.kind === "authenticated" ? `user:${viewer.login.toLowerCase()}` : "signed-out";
  return `codeyears:year:${SCHEMA_VERSION}:${identity}:${profileLogin.toLowerCase()}:`;
}

function key(scope: YearCacheScope): string {
  return `${profilePrefix(scope.viewer, scope.profileLogin)}${scope.year}`;
}

/** 持久化数据只在读取边界校验；缺失、旧版本、损坏或过期均视为未命中。 */
function decode(raw: unknown, scope: YearCacheScope, now: Date): ContributionYear | undefined {
  if (!raw || typeof raw !== "object") return;
  const record = raw as YearCacheRecord;
  const savedScope = record.scope;
  const value = record.value;
  if (record.schemaVersion !== SCHEMA_VERSION || !savedScope || typeof savedScope !== "object" ||
      typeof savedScope.profileLogin !== "string" || savedScope.year !== scope.year ||
      !savedScope.viewer || typeof savedScope.viewer !== "object") return;
  if (savedScope.viewer.kind !== "signed-out" &&
      (savedScope.viewer.kind !== "authenticated" || typeof savedScope.viewer.login !== "string")) return;
  if (key(savedScope) !== key(scope) || !value || typeof value !== "object" ||
      typeof value.profileLogin !== "string" || value.profileLogin.toLowerCase() !== scope.profileLogin.toLowerCase() ||
      value.year !== scope.year || value.parserVersion !== PARSER_VERSION || typeof value.fetchedAt !== "string" ||
      !Array.isArray(value.days) || value.days.length < 1 || value.days.length > 366) return;

  const fetchedAt = new Date(value.fetchedAt);
  const age = now.getTime() - fetchedAt.getTime();
  const fetchedDuringYear = value.year === fetchedAt.getFullYear();
  if (!Number.isFinite(age) || age < 0 || age > (fetchedDuringYear ? 3_600_000 : 30 * DAY_MS) ||
      (fetchedDuringYear && browserCalendarDate(fetchedAt) !== browserCalendarDate(now))) return;
  const start = Date.UTC(value.year, 0, 1);
  for (let index = 0; index < value.days.length; index++) {
    const day = value.days[index];
    if (!day || typeof day !== "object" || day.date !== new Date(start + index * DAY_MS).toISOString().slice(0, 10) ||
        !Number.isSafeInteger(day.count) || day.count < 0) return;
  }
  const end = value.days.at(-1)!.date;
  const minimumEnd = fetchedDuringYear ? browserCalendarDate(fetchedAt) : `${value.year}-12-31`;
  if (end < minimumEnd || end > `${value.year}-12-31`) return;
  return value;
}

export async function readYearCache(scope: YearCacheScope): Promise<ContributionYear | undefined> {
  const name = key(scope);
  const stored = await chrome.storage.local.get(name);
  return decode(stored[name], scope, new Date());
}

export async function writeYearCache(scope: YearCacheScope, value: ContributionYear): Promise<void> {
  const record: YearCacheRecord = { schemaVersion: SCHEMA_VERSION, scope, value };
  await chrome.storage.local.set({ [key(scope)]: record });
}

export async function clearProfileCache(viewer: ViewerIdentity, profileLogin: string): Promise<void> {
  const prefix = profilePrefix(viewer, profileLogin);
  const stored = await chrome.storage.local.get(null);
  const names = Object.keys(stored).filter(name => name.startsWith(prefix));
  if (names.length) await chrome.storage.local.remove(names);
}
