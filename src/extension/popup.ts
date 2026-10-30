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
  </style>
  <main>
    <p class="eyebrow">GitHub contribution history</p>
    <h1>CodeYears</h1>
    <p class="tagline">代码岁月，自成风景。</p>
    <div class="views" aria-label="计划支持的两种视图">
      <span>City · 贡献之城</span><span>Terrain · 时光山脉</span>
    </div>
    <section class="status" aria-labelledby="status-title">
      <h2 id="status-title">项目初始化 · 功能尚未实现</h2>
      <p>下一步验证无 Token 数据获取、身份隔离与缓存，以及 20 年数据的 3D 性能。</p>
    </section>
  </main>
`;
