import i18n from 'i18next';
import detector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// eslint-disable-next-line import/extensions
import translationEN from './locales/en.json';
// eslint-disable-next-line import/extensions
import translationHU from './locales/hu.json';

// the translations
const resources = {
  en: {
    translation: translationEN,
  },
  hu: {
    translation: translationHU,
  },
};

i18n
  .use(detector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    fallbackLng: 'en',
    lng: 'hu',
    keySeparator: '.',

    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;