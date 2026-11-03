import { localize, text } from './i18n';
import { languagePreference, readLanguagePreference, resolveLanguage, saveLanguagePreference, type LanguagePreference } from './language';

const main = document.querySelector<HTMLElement>('main')!;
const select = document.querySelector<HTMLSelectElement>('#language')!;
const status = document.querySelector<HTMLOutputElement>('#save-status')!;
const version = chrome.runtime.getManifest().version;
let preference: LanguagePreference = 'auto';

function render() {
  const language = resolveLanguage(preference);
  document.documentElement.lang = language;
  document.title = text(language, 'settingsTitle');
  localize(main, language);
  document.querySelector<HTMLElement>('#version')!.textContent = text(language, 'version', [version]);
  select.value = preference;
}

async function initialize() {
  preference = await readLanguagePreference();
  render();
  main.hidden = false;
  select.disabled = false;
}

select.addEventListener('change', async () => {
  const next = languagePreference(select.value);
  select.disabled = true;
  status.textContent = '';
  delete status.dataset.error;
  try {
    await saveLanguagePreference(next);
    preference = next;
    render();
    status.textContent = text(resolveLanguage(preference), 'settingsSaved');
  } catch {
    render();
    status.dataset.error = '';
    status.textContent = text(resolveLanguage(preference), 'languageSaveError');
  } finally {
    select.disabled = false;
    select.focus();
  }
});

void initialize();
