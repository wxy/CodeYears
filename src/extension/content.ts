import { readPageContext } from "../platform/github/probe";
import { clearContributionCache, loadContributionYear } from "../platform/github/load-year";

(() => {
  const existing = document.getElementById("codeyears-data-probe");
  if (existing?.shadowRoot?.querySelector("form")) { existing.scrollIntoView({ block: "center" }); return; }
  existing?.remove();

  const context = readPageContext(document, new URL(location.href));
  const years = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[id^="year-link-"]'))
    .map(link => Number(link.id.slice("year-link-".length)))
    .filter(year => Number.isInteger(year) && year >= 2008 && year <= new Date().getFullYear());
  if (!years.length) throw new Error("当前页面没有可识别的年度入口。");

  const host = document.createElement("section");
  host.id = "codeyears-data-probe";
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      :host { display:block; margin:16px 0; font:14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#22312a; }
      * { box-sizing:border-box; } .panel { padding:20px; border:1px solid #cbd9cf; border-radius:16px; background:#f6f9f5; }
      header, form { display:flex; align-items:center; flex-wrap:wrap; gap:10px; } header { justify-content:space-between; }
      h2 { margin:0; font-size:18px; } p { margin:8px 0; } .note { color:#586b5d; font-size:12px; }
      select, button { font:inherit; padding:6px 12px; border-radius:8px; border:1px solid #bdcdbf; background:white; color:#22312a; }
      button { cursor:pointer; } button:disabled { cursor:default; opacity:.5; } button.primary { background:#245b3c; color:white; }
      output { display:block; margin:12px 0; white-space:pre-line; } table { width:100%; border-collapse:collapse; font-variant-numeric:tabular-nums; }
      td,th { padding:3px 10px; text-align:left; border-bottom:1px solid #dce6de; } .days { max-height:280px; overflow:auto; }
    </style>
    <div class="panel">
      <header><h2>CodeYears · 年度数据与缓存诊断</h2><button id="close" type="button">关闭诊断</button></header>
      <p id="identity"></p>
      <p class="note">选择年份后才读取数据。缓存按访问者与主页隔离，使用前会联网确认身份；当前验证英文页面，不启用 3D。</p>
      <form><label>年份 <select id="year" aria-label="诊断年份"></select></label><button class="primary" id="run" type="submit">读取年度数据</button><button id="refresh" type="button">强制刷新</button><button id="clear" type="button">清除此主页缓存</button><button id="cancel" type="button" disabled>取消请求</button></form>
      <output id="status" role="status" aria-live="polite">请选择年份，开始同源数据验证。</output>
      <details id="details" hidden><summary>查看真实每日数量</summary><div class="days"><table><thead><tr><th>日期</th><th>贡献数量</th></tr></thead><tbody></tbody></table></div></details>
    </div>`;
  const select = shadow.querySelector<HTMLSelectElement>("#year")!;
  for (const year of years) select.add(new Option(String(year), String(year)));
  const identity = context.viewer.state === "unknown" ? "身份未识别" : context.viewer.identity.kind === "signed-out" ? "未登录" : `已登录访问者 ${context.viewer.identity.login}`;
  shadow.querySelector("#identity")!.textContent = `主页 ${context.profileLogin} · ${identity}`;
  const form = shadow.querySelector("form")!;
  const run = shadow.querySelector<HTMLButtonElement>("#run")!;
  const refresh = shadow.querySelector<HTMLButtonElement>("#refresh")!;
  const clear = shadow.querySelector<HTMLButtonElement>("#clear")!;
  const cancel = shadow.querySelector<HTMLButtonElement>("#cancel")!;
  const status = shadow.querySelector<HTMLOutputElement>("#status")!;
  const details = shadow.querySelector<HTMLDetailsElement>("#details")!;
  const body = shadow.querySelector("tbody")!;
  let controller: AbortController | undefined;
  const currentContext = () => readPageContext(document, new URL(location.href));
  const resetResult = () => { details.hidden = true; body.replaceChildren(); };
  const setBusy = (busy: boolean) => {
    run.disabled = refresh.disabled = select.disabled = busy;
    clear.disabled = busy || context.viewer.state === "unknown";
    cancel.disabled = !busy;
  };
  setBusy(false);

  const close = () => {
    controller?.abort();
    host.remove();
    window.removeEventListener("pagehide", close);
    document.removeEventListener("turbo:before-cache", close);
    document.removeEventListener("turbo:before-render", close);
    document.removeEventListener("visibilitychange", visibility);
  };
  const visibility = () => {
    if (!document.hidden) return;
    controller?.abort();
    resetResult();
    status.textContent = "页面进入后台，结果已清除；返回后重新读取时会核对当前身份。";
  };
  shadow.querySelector("#close")!.addEventListener("click", close);
  window.addEventListener("pagehide", close);
  document.addEventListener("turbo:before-cache", close);
  document.addEventListener("turbo:before-render", close);
  document.addEventListener("visibilitychange", visibility);
  cancel.addEventListener("click", () => controller?.abort());
  const load = async (forceRefresh: boolean) => {
    const request = new AbortController();
    controller = request;
    setBusy(true);
    resetResult();
    status.textContent = "正在确认身份并读取所选年度…";
    try {
      const result = await loadContributionYear(context, Number(select.value), forceRefresh, request.signal, currentContext);
      for (const day of result.value.days) {
        const row = document.createElement("tr");
        for (const value of [day.date, String(day.count)]) { const cell = document.createElement("td"); cell.textContent = value; row.append(cell); }
        body.append(row);
      }
      const total = result.value.days.reduce((sum, day) => sum + day.count, 0);
      const source = result.source === "cache" ? "来源：本地缓存；本次未重新核对年度标题。" : `来源：网络；逐日合计与页面年度总数 ${result.displayedTotal} 一致。`;
      status.textContent = `${result.value.year} 年 · ${result.value.days.length} 天\n${result.value.days[0].date} 至 ${result.value.days.at(-1)!.date}\n逐日合计 ${total}。${source}\n抓取时间：${new Date(result.value.fetchedAt).toLocaleString()}\n${result.warning}`.trim();
      details.hidden = false;
    } catch (error) {
      if (!document.hidden) status.textContent = request.signal.aborted ? "请求已取消，本次不显示结果。" : error instanceof Error ? error.message : "请求失败，请重新打开诊断。";
    } finally {
      setBusy(false); controller = undefined;
    }
  };
  form.addEventListener("submit", event => { event.preventDefault(); void load(false); });
  refresh.addEventListener("click", () => { void load(true); });
  clear.addEventListener("click", async () => {
    const request = new AbortController();
    controller = request;
    setBusy(true); cancel.disabled = true; resetResult();
    status.textContent = "正在确认身份并清除此主页缓存…";
    try {
      await clearContributionCache(context, request.signal, currentContext);
      if (!document.hidden && host.isConnected) status.textContent = "已清除此访问者在当前主页的年度缓存。";
    } catch (error) {
      if (!document.hidden) status.textContent = error instanceof Error ? error.message : "缓存清除失败。";
    } finally { setBusy(false); controller = undefined; }
  });
  document.querySelector(".js-yearly-contributions")!.prepend(host);
  host.scrollIntoView({ block: "center" });
})();
