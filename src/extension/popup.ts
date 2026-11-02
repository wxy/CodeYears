import { text, type MessageKey } from './i18n';
import { readLanguagePreference, resolveLanguage } from './language';

const root = document.querySelector<HTMLDivElement>('#app')!;
const shadow = root.attachShadow({ mode: 'open' });
shadow.innerHTML = `
  <style>
    :host { display:block; width:280px; padding:20px; color:#202923; background:#f7f8f5; font:13px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    h1 { margin:0 0 6px; font-size:18px; letter-spacing:-.02em; } output { display:block; }
  </style>
  <h1>CodeYears</h1><output role="status" aria-live="polite"></output>`;
const status = shadow.querySelector<HTMLOutputElement>('output')!;

async function openCity() {
  const language = resolveLanguage(await readLanguagePreference());
  document.documentElement.lang = language;
  const show = (key: MessageKey) => { status.textContent = text(language, key); };
  show('popupOpening');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id || !tab.url || new URL(tab.url).origin !== 'https://github.com') { show('popupWrongPage'); return; }
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['entry.js'] });
    const [result] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => window.__codeyearsOpenCity?.() ?? false });
    if (!result.result) { show('popupNotReady'); return; }
    show('popupOpened');
    window.close();
  } catch {
    show('popupFailed');
  }
}
void openCity();
