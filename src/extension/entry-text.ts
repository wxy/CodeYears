import type { Language } from './language';
import { viewGroup as enViewGroup, city as enCity, contributions as enContributions, retry as enRetry, prepareCity as enPrepareCity, cityOpenError as enCityOpenError } from '../../public/_locales/en/messages.json';
import { viewGroup as zhViewGroup, city as zhCity, contributions as zhContributions, retry as zhRetry, prepareCity as zhPrepareCity, cityOpenError as zhCityOpenError } from '../../public/_locales/zh_CN/messages.json';
import { appearanceMiniature as enAppearanceMiniature, appearanceSaveError as enAppearanceSaveError } from '../../public/_locales/en/messages.json';
import { appearanceMiniature as zhAppearanceMiniature, appearanceSaveError as zhAppearanceSaveError } from '../../public/_locales/zh_CN/messages.json';
const phrases = {
  'en': {
    viewGroup: enViewGroup.message, city: enCity.message, contributions: enContributions.message,
    retry: enRetry.message, prepareCity: enPrepareCity.message, cityOpenError: enCityOpenError.message,
    appearanceMiniature: enAppearanceMiniature.message, appearanceSaveError: enAppearanceSaveError.message,
  },
  'zh-CN': {
    viewGroup: zhViewGroup.message, city: zhCity.message, contributions: zhContributions.message,
    retry: zhRetry.message, prepareCity: zhPrepareCity.message, cityOpenError: zhCityOpenError.message,
    appearanceMiniature: zhAppearanceMiniature.message, appearanceSaveError: zhAppearanceSaveError.message,
  },
};
/** 入口只打包页签和切换文案，完整词库留给按需面板。 */
export const entryText = (language: Language, key: keyof typeof phrases.en) => phrases[language][key];
