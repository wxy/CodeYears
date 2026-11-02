export type Language = 'en' | 'zh-CN';
export type LanguagePreference = Language | 'auto';
export interface LanguageSettings {
  language: Language;
  preference: LanguagePreference;
  change(preference: LanguagePreference): Promise<void>;
}
export const LANGUAGE_KEY = 'codeyears:ui:language';

/** UI设置存储的唯一校验边界；不与贡献缓存或访问者作用域混用。 */
export function languagePreference(value: unknown): LanguagePreference {
  return value === 'en' || value === 'zh-CN' ? value : 'auto';
}
export function resolveLanguage(preference: LanguagePreference): Language {
  if (preference !== 'auto') return preference;
  const code = (typeof chrome !== 'undefined' && chrome.i18n ? chrome.i18n.getUILanguage() : navigator.language).toLowerCase().replace('_', '-');
  return code === 'zh' || code === 'zh-cn' || code === 'zh-sg' || code.startsWith('zh-hans') ? 'zh-CN' : 'en';
}
export async function readLanguagePreference(): Promise<LanguagePreference> {
  // 语言偏好读不到时使用浏览器语言；贡献数据仍遵循自己的失败策略。
  try { return languagePreference((await chrome.storage.local.get(LANGUAGE_KEY))[LANGUAGE_KEY]); }
  catch { return 'auto'; }
}
export const saveLanguagePreference = (preference: LanguagePreference) => chrome.storage.local.set({ [LANGUAGE_KEY]: preference });
