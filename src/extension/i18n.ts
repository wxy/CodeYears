import english from '../../public/_locales/en/messages.json';
import chinese from '../../public/_locales/zh_CN/messages.json';
import externalMessages from './error-messages.json';

import type { Language } from './language';
export type { Language, LanguagePreference, LanguageSettings } from './language';
export type MessageKey = keyof typeof english;
const catalogs: Record<Language, Record<MessageKey, { message: string }>> = { en: english, 'zh-CN': chinese };

export function text(language: Language, key: MessageKey, substitutions: readonly (string | number)[] = []): string {
  return catalogs[language][key].message.replace(/\$([1-9])/g, (_, index: string) => String(substitutions[Number(index) - 1] ?? ''));
}
export const numberText = (language: Language, value: number) => new Intl.NumberFormat(language).format(value);

/** 仅更新本扩展拥有的文案节点，不翻译或重建GitHub原生节点。 */
export function localize(root: ParentNode, language: Language): void {
  for (const element of root.querySelectorAll<HTMLElement>('[data-i18n]')) element.textContent = text(language, element.dataset.i18n as MessageKey);
  for (const element of root.querySelectorAll<HTMLElement>('[data-i18n-label]')) element.setAttribute('aria-label', text(language, element.dataset.i18nLabel as MessageKey));
}

/** 下层保留既有错误合同；只在展示边界转换已知消息，未知服务错误原样保留。 */
export function externalText(language: Language, message: string): string {
  const key = (externalMessages as Record<string, MessageKey>)[message];
  if (key) return text(language, key);
  const patterns: readonly [RegExp, MessageKey][] = [
    [/^GitHub 请求失败（HTTP (\d+)），没有将失败响应当作空数据。$/, 'errHTTP'],
    [/^无法准确解析 (\d{4}-\d{2}-\d{2}) 的数量或日期文本；未使用颜色等级估算。$/, 'errParseDay'],
    [/^(\d{4}-\d{2}-\d{2}) 的数量不是有效非负整数。$/, 'errDayCount'],
    [/^年度日期覆盖不完整：收到 (\d+) 天，预期 (\d+) 天；缺失日期未填零。$/, 'errCoverage'],
    [/^逐日合计 (\d+) 与页面年度总数 (\d+) 不一致，尚不能确认为准确数据。$/, 'errTotalMismatch'],
    [/^未找到城市素材：(.+)$/, 'errMissingAsset'],
    [/^素材读取失败：(.+)$/, 'errAssetRequest'],
  ];
  for (const [pattern, id] of patterns) { const match = message.match(pattern); if (match) return text(language, id, match.slice(1)); }
  return message;
}
