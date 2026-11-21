import { appearancePreference, readAppearanceSettings, saveAppearance, saveCityVisibility, type Appearance } from './appearance';
import { localize, text, type MessageKey } from './i18n';
import { languagePreference, readLanguagePreference, resolveLanguage, saveLanguagePreference, type LanguagePreference } from './language';

const main = document.querySelector<HTMLElement>('main')!;
const settings = document.querySelector<HTMLElement>('#settings')!;
const about = document.querySelector<HTMLElement>('#about')!;
const backToSettings = document.querySelector<HTMLAnchorElement>('#back-to-settings')!;
const authorLink = document.querySelector<HTMLAnchorElement>('#about-author-link')!;
const modes = document.querySelector<HTMLFieldSetElement>('#appearance')!;
const citySettings = document.querySelector<HTMLFieldSetElement>('#city-settings')!;
const cityVisibility = document.querySelector<HTMLInputElement>('#show-city')!;
const languageSelect = document.querySelector<HTMLSelectElement>('#language')!;
const openButton = document.querySelector<HTMLButtonElement>('#open-city')!;
const profileHint = document.querySelector<HTMLElement>('#profile-required')!;
const status = document.querySelector<HTMLOutputElement>('#save-status')!;
const productSite = document.querySelector<HTMLAnchorElement>('#product-site')!;
const englishProductUrl = productSite.href;
const versionLabel = document.querySelector<HTMLElement>('#version')!;
const version = chrome.runtime.getManifest().version;
let appearance: Appearance = 'native';
let showCity = true;
let preference: LanguagePreference = 'auto';
let profileTarget: chrome.scripting.InjectionTarget | undefined;

async function findActiveProfile() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id === undefined || !tab.url || new URL(tab.url).origin !== 'https://github.com') return;
    const target = { tabId: tab.id };
    const hasProfileCalendar = async () => {
      const [probe] = await chrome.scripting.executeScript({
        target, func: () => window.__codeyearsHasProfileCalendar?.() ?? null,
      });
      return probe?.result;
    };
    let profile = await hasProfileCalendar();
    if (profile == null) {
      await chrome.scripting.executeScript({ target, files: ['entry.js'] });
      profile = await hasProfileCalendar();
    }
    if (profile) return target;
  } catch {
    // Chrome can restrict script access to the active page.
  }
}

function render() {
  const language = resolveLanguage(preference);
  document.documentElement.lang = language;
  localize(main, language);
  productSite.href = language === 'zh-CN' ? productSite.dataset.zhHref! : englishProductUrl;
  for (const link of main.querySelectorAll<HTMLAnchorElement>('a[href]')) link.title = link.href;
  versionLabel.textContent = `v${version}`;
  versionLabel.title = text(language, 'version', [version]);
  languageSelect.value = preference;
  cityVisibility.checked = showCity;
  openButton.hidden = !showCity;
  for (const input of modes.querySelectorAll('input')) input.checked = input.value === appearance;
  renderPane();
}

function renderPane(focus = false) {
  const showAbout = location.hash === '#about';
  settings.hidden = showAbout;
  about.hidden = !showAbout;
  document.title = text(resolveLanguage(preference), showAbout ? 'aboutAuthor' : 'settingsTitle');
  if (focus) (showAbout ? backToSettings : authorLink).focus({ preventScroll: true });
}
window.addEventListener('hashchange', () => renderPane(true));

function show(key: MessageKey, control: HTMLElement, error = false) {
  const group = control.closest('fieldset, .language')!;
  if (status.previousElementSibling !== group) group.after(status);
  status.toggleAttribute('data-error', error);
  status.textContent = text(resolveLanguage(preference), key);
}

function setBusy(busy: boolean) {
  citySettings.disabled = modes.disabled = languageSelect.disabled = busy || !profileTarget;
}

async function save(change: () => Promise<void>, control: HTMLElement, error: MessageKey) {
  setBusy(true);
  try {
    await change();
    render();
    show('settingsSaved', control);
  } catch {
    render();
    show(error, control, true);
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
  if (!profileTarget) return;
  setBusy(true);
  show('popupOpening', openButton);
  try {
    const [result] = await chrome.scripting.executeScript({ target: profileTarget, func: () => window.__codeyearsOpenCity?.() ?? false });
    if (result.result === 'already-mounted') { show('popupAlreadyMounted', openButton, true); return; }
    if (!result.result) { show('popupNotReady', openButton); return; }
    show('popupOpened', openButton);
    window.close();
  } catch {
    show('popupFailed', openButton, true);
  } finally {
    setBusy(false);
  }
});

void Promise.all([readAppearanceSettings(), readLanguagePreference(), findActiveProfile()]).then(([stored, savedLanguage, target]) => {
  appearance = stored.appearance;
  showCity = stored.showCity;
  preference = savedLanguage;
  profileTarget = target;
  render();
  profileHint.hidden = Boolean(profileTarget);
  settings.toggleAttribute('data-locked', !profileTarget);
  main.hidden = false;
  setBusy(false);
});
