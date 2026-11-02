import type { Language } from './language';
import { viewGroup as enViewGroup, city as enCity, contributions as enContributions, retry as enRetry, prepareCity as enPrepareCity, cityOpenError as enCityOpenError } from '../../public/_locales/en/messages.json';
import { viewGroup as zhViewGroup, city as zhCity, contributions as zhContributions, retry as zhRetry, prepareCity as zhPrepareCity, cityOpenError as zhCityOpenError } from '../../public/_locales/zh_CN/messages.json';
const phrases = {
  'en': {viewGroup: enViewGroup.message, city: enCity.message, contributions: enContributions.message, retry: enRetry.message, prepareCity: enPrepareCity.message, cityOpenError: enCityOpenError.message},
  'zh-CN': {viewGroup: zhViewGroup.message, city: zhCity.message, contributions: zhContributions.message, retry: zhRetry.message, prepareCity: zhPrepareCity.message, cityOpenError: zhCityOpenError.message},
};
/** 入口只打包6条标题/失败文案，完整词库留给按需面板。 */
export const entryText = (language: Language, key: keyof typeof phrases.en) => phrases[language][key];
