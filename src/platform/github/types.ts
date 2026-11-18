import type { ViewerIdentity } from "../../cache/types";

/** 主页所有者与登录访问者是两个独立身份。 */
export interface GitHubPageContext {
  readonly profileLogin: string;
  readonly viewer:
    | { readonly state: "known"; readonly identity: ViewerIdentity }
    | { readonly state: "unknown" };
}

export function isProfileOwner(context: GitHubPageContext): boolean {
  return context.viewer.state === 'known' && context.viewer.identity.kind === 'authenticated' &&
    context.viewer.identity.login.toLowerCase() === context.profileLogin.toLowerCase();
}
