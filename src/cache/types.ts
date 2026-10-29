import type { ContributionYear } from "../data/types";

/** 身份不明时不得构造缓存作用域；识别方法和运行时校验留待 P1 验证。 */
export type ViewerIdentity =
  | { readonly kind: "authenticated"; readonly login: string }
  | { readonly kind: "signed-out" };

export interface YearCacheScope {
  readonly viewer: ViewerIdentity;
  readonly profileLogin: string;
  readonly year: number;
}

export interface YearCacheRecord {
  readonly schemaVersion: number;
  readonly scope: YearCacheScope;
  readonly value: ContributionYear;
}
