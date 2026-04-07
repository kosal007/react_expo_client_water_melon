import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';

const en = require('./translations/en.json');
const km = require('./translations/km.json');

export type AppLanguage = 'en' | 'km';

const supportedLanguages: AppLanguage[] = ['en', 'km'];

export const i18n = new I18n({ en, km });

i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export const isAppLanguage = (value: unknown): value is AppLanguage =>
  typeof value === 'string' && supportedLanguages.includes(value as AppLanguage);

export const getDeviceLanguage = (): AppLanguage => {
  const locales = Localization.getLocales();
  const primaryLanguageCode = locales[0]?.languageCode?.toLowerCase();

  if (isAppLanguage(primaryLanguageCode)) {
    return primaryLanguageCode;
  }

  return 'en';
};

export const setI18nLanguage = (language: AppLanguage) => {
  i18n.locale = language;
};
