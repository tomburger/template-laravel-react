import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const LANGUAGE_KEY = 'language';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'cs', label: 'Čeština' },
] as const;

export const DEFAULT_LANGUAGE = 'en';

export const isSupportedLanguage = (code: string | null | undefined): code is string =>
  SUPPORTED_LANGUAGES.some((l) => l.code === code);

const stored = localStorage.getItem(LANGUAGE_KEY);

i18n.use(initReactI18next).init({
  lng: isSupportedLanguage(stored) ? stored : DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false },
  resources: {
    en: {
      translation: {
        header: { welcome: 'Welcome, {{name}}!', admin: 'Admin', logout: 'Logout', language: 'Language' },
      },
    },
    cs: {
      translation: {
        header: { welcome: 'Vítejte, {{name}}!', admin: 'Administrace', logout: 'Odhlásit se', language: 'Jazyk' },
      },
    },
  },
});

export default i18n;
