import { parseContributionYear, type ParsedYear } from "../../data/parse-year";
import type { GitHubPageContext } from "./types";
import { browserCalendarDate } from "../../data/calendar-date";

export function readPageContext(doc: Document, url: URL): GitHubPageContext {
  const match = url.pathname.match(/^\/([a-zA-Z0-9-]{1,39})\/?$/);
  if (url.origin !== "https://github.com" || !match || !doc.querySelector("table.ContributionCalendar-grid")) throw new Error("请在 GitHub 个人主页的贡献日历加载完成后打开诊断。");
  return { profileLogin: match[1], viewer: readViewer(doc) };
}

function readViewer(doc: Document): GitHubPageContext["viewer"] {
  const login = doc.querySelector<HTMLMetaElement>('meta[name="user-login"]')?.content.trim();
  return login && /^[a-zA-Z0-9-]{1,39}$/.test(login)
    ? { state: "known", identity: { kind: "authenticated", login } }
    : doc.body?.classList.contains("logged-out")
      ? { state: "known", identity: { kind: "signed-out" } }
      : { state: "unknown" };
}

/** 来自本轮页面中 include-fragment 的实际请求形式，不是公开 API 合同。 */
export async function fetchContributionYear(context: GitHubPageContext, year: number, signal: AbortSignal): Promise<ParsedYear> {
  const now = new Date();
  if (!Number.isInteger(year) || year < 2008 || year > now.getFullYear()) throw new Error("请选择有效历史年份。");
  const url = new URL(`/${context.profileLogin}`, "https://github.com");
  url.search = new URLSearchParams({ action: "show", controller: "profiles", from: `${year}-01-01`, tab: "contributions", to: year === now.getFullYear() ? browserCalendarDate(now) : `${year}-12-31`, user_id: context.profileLogin }).toString();
  const doc = await requestHTML(url, signal, true);
  return parseContributionYear(doc, context.profileLogin, year, now);
}

/** 不从当前标签页的旧 meta 推断其他标签页登录后的身份。 */
export async function readLivePageContext(profileLogin: string, signal: AbortSignal): Promise<GitHubPageContext> {
  const url = new URL(`/${profileLogin}`, "https://github.com");
  // 完整主页的日历会延迟加载；身份确认只依赖会话标识，不要求日历已存在。
  return { profileLogin, viewer: readViewer(await requestHTML(url, signal, false)) };
}

async function requestHTML(url: URL, signal: AbortSignal, fragment: boolean): Promise<Document> {
  const headers: Record<string, string> = { Accept: "text/html" };
  if (fragment) headers["X-Requested-With"] = "XMLHttpRequest";
  const response = await fetch(url, { credentials: "same-origin", cache: "no-store", headers, signal });
  if (!response.ok) throw new Error(`GitHub 请求失败（HTTP ${response.status}），没有将失败响应当作空数据。`);
  if (response.redirected || new URL(response.url).origin !== url.origin) throw new Error("请求发生重定向，请检查当前 GitHub 会话后重试。");
  if (!response.headers.get("content-type")?.includes("text/html")) throw new Error("GitHub 返回了不支持的响应格式。");
  const html = await response.text();
  signal.throwIfAborted();
  return new DOMParser().parseFromString(html, "text/html");
}
