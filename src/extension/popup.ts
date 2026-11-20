import { appearancePreference, readAppearanceSettings, saveAppearance, saveCityVisibility, type Appearance } from './appearance';
import { localize, text, type MessageKey } from './i18n';
import { languagePreference, readLanguagePreference, resolveLanguage, saveLanguagePreference, type LanguagePreference } from './language';

const main = document.querySelector<HTMLElement>('main')!;
const modes = document.querySelector<HTMLFieldSetElement>('#appearance')!;
const cityVisibility = document.querySelector<HTMLInputElement>('#show-city')!;
const languageSelect = document.querySelector<HTMLSelectElement>('#language')!;
const openButton = document.querySelector<HTMLButtonElement>('#open-city')!;
const status = document.querySelector<HTMLOutputElement>('#save-status')!;
const version = chrome.runtime.getManifest().version;
let appearance: Appearance = 'native';
let showCity = true;
let preference: LanguagePreference = 'auto';

function render() {
  const language = resolveLanguage(preference);
  document.documentElement.lang = language;
  document.title = text(language, 'settingsTitle');
  localize(main, language);
  document.querySelector<HTMLElement>('#version')!.textContent = text(language, 'version', [version]);
  languageSelect.value = preference;
  cityVisibility.checked = showCity;
  openButton.hidden = !showCity;
  for (const input of modes.querySelectorAll('input')) input.checked = input.value === appearance;
}

function show(key: MessageKey, error = false) {
  status.toggleAttribute('data-error', error);
  status.textContent = text(resolveLanguage(preference), key);
}

function setBusy(busy: boolean) {
  modes.disabled = cityVisibility.disabled = languageSelect.disabled = openButton.disabled = busy;
}

async function save(change: () => Promise<void>, control: HTMLElement, error: MessageKey) {
  setBusy(true);
  try {
    await change();
    render();
    show('settingsSaved');
  } catch {
    render();
    show(error, true);
  } finally {
    setBusy(false);
    control.focus();
  }
}

modes.addEventListener('change', event => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || !input.checked) return;
  void save(async () => {
    const next = appearancePreference(input.value);
    await saveAppearance(next);
    appearance = next;
  }, input, 'appearanceSaveError');
});

cityVisibility.addEventListener('change', () => {
  void save(async () => {
    const next = cityVisibility.checked;
    await saveCityVisibility(next);
    showCity = next;
  }, cityVisibility, 'cityVisibilitySaveError');
});

languageSelect.addEventListener('change', () => {
  void save(async () => {
    const next = languagePreference(languageSelect.value);
    await saveLanguagePreference(next);
    preference = next;
  }, languageSelect, 'languageSaveError');
});

openButton.addEventListener('click', async () => {
  setBusy(true);
  show('popupOpening');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url || new URL(tab.url).origin !== 'https://github.com') {
      show('popupWrongPage');
      return;
    }
    const target = { tabId: tab.id };
    await chrome.scripting.executeScript({ target, files: ['entry.js'] });
    const [result] = await chrome.scripting.executeScript({ target, func: () => window.__codeyearsOpenCity?.() ?? false });
    if (!result.result) { show('popupNotReady'); return; }
    show('popupOpened');
    window.close();
  } catch {
    show('popupFailed', true);
  } finally {
    setBusy(false);
  }
});

void Promise.all([readAppearanceSettings(), readLanguagePreference()]).then(([settings, savedLanguage]) => {
  appearance = settings.appearance;
  showCity = settings.showCity;
  preference = savedLanguage;
  render();
  main.hidden = false;
  setBusy(false);
});
