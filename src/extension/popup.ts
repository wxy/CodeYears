export {};

const root = document.querySelector<HTMLDivElement>('#app')!;
const shadow = root.attachShadow({ mode: 'open' });
shadow.innerHTML = `
  <style>
    :host { display:block; width:280px; padding:20px; color:#202923; background:#f7f8f5; font:13px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    h1 { margin:0 0 6px; font-size:18px; letter-spacing:-.02em; } output { display:block; }
  </style>
  <h1>CodeYears</h1><output role="status" aria-live="polite">正在打开贡献之城…</output>`;
const status = shadow.querySelector<HTMLOutputElement>('output')!;

async function openCity() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id || !tab.url || new URL(tab.url).origin !== 'https://github.com') throw new Error('请先打开 GitHub 个人主页，再点击扩展。');
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['entry.js'] });
    const [result] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => window.__codeyearsOpenCity?.() ?? false });
    if (!result.result) throw new Error('请在 GitHub 个人主页的贡献日历加载完成后重试。');
    status.textContent = '已打开城市。';
    window.close();
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : '无法打开城市，请刷新 GitHub 主页后重试。';
  }
}
void openCity();
