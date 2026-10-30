const root = document.querySelector<HTMLDivElement>("#app")!;
const shadow = root.attachShadow({ mode: "open" });

// 只有固定的本地文案；后续外部内容必须在边界校验并以 textContent 呈现。
shadow.innerHTML = `
  <style>
    :host { display: block; color: #202923; background: #f7f8f5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    main { width: 336px; padding: 28px; }
    .eyebrow { margin: 0 0 10px; color: #68746c; font-size: 11px;
      letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 0; font-size: 30px; font-weight: 600; letter-spacing: -.04em; }
    .tagline { margin: 8px 0 24px; font-size: 14px; color: #59665e; }
    .views { display: flex; gap: 8px; margin-bottom: 24px; }
    .views span { padding: 7px 12px; border: 1px solid #dce3dc;
      border-radius: 20px; font-size: 12px; background: #fff; }
    .status { border-top: 1px solid #dce3dc; padding-top: 18px; }
    h2 { margin: 0 0 8px; font-size: 14px; font-weight: 600; }
    p { margin: 0; font-size: 12px; line-height: 1.7; color: #59665e; }
    button { width:100%; margin-top:14px; padding:10px; border:0; border-radius:10px; background:#245b3c; color:white; font:inherit; cursor:pointer; }
    button:disabled { opacity:.5; } output { display:block; margin-top:10px; font-size:12px; line-height:1.6; }
  </style>
  <main>
    <p class="eyebrow">GitHub contribution history</p>
    <h1>CodeYears</h1>
    <p class="tagline">代码岁月，自成风景。</p>
    <div class="views" aria-label="计划支持的两种视图">
      <span>City · 贡献之城</span><span>Terrain · 时光山脉</span>
    </div>
    <section class="status" aria-labelledby="status-title">
      <h2 id="status-title">P1-A · 年度数据诊断</h2>
      <p>在 GitHub 个人主页主动获取一个年份，检查真实数量与年度合计。City / Terrain 尚未实现。</p>
      <button type="button">打开数据诊断</button>
      <output role="status" aria-live="polite"></output>
    </section>
  </main>
`;

const button = shadow.querySelector("button")!;
const popupStatus = shadow.querySelector("output")!;
button.addEventListener("click", async () => {
  button.disabled = true;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id || !tab.url || new URL(tab.url).origin !== "https://github.com") throw new Error("请先打开 GitHub 个人主页，再点击扩展。");
    const [page] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => /^\/[a-zA-Z0-9-]{1,39}\/?$/.test(location.pathname) && Boolean(document.querySelector("table.ContributionCalendar-grid")) && Boolean(document.querySelector('a[id^="year-link-"]')) });
    if (page.result !== true) throw new Error("请在 GitHub 个人主页的贡献日历加载完成后重试。");
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
    popupStatus.textContent = "诊断面板已打开，请回到 GitHub 页面选择年份。";
  } catch (error) {
    popupStatus.textContent = error instanceof Error ? error.message : "无法打开诊断，请重新加载扩展。";
  } finally { button.disabled = false; }
});
