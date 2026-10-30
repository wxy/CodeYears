import type { ViewerIdentity } from "../../cache/types";

/** 主页所有者与登录访问者是两个独立身份。此文件不实现识别或请求。 */
export interface GitHubPageContext {
  readonly profileLogin: string;
  readonly viewer:
    | { readonly state: "known"; readonly identity: ViewerIdentity }
    | { readonly state: "unknown" };
}
