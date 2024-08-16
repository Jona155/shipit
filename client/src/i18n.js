import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import heTranslations from './locales/he.json';

const resources = {
  en: { translation: enTranslations },
  he: { translation: heTranslations },
};

export const initI18n = () => {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: 'he', // Default language
      fallbackLng: 'he',
      interpolation: {
        escapeValue: false,
      },
    });

  return i18n;
};

export default i18n;