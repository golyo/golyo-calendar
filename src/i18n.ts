import i18n from 'i18next';
import detector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';

import translationEN from './locales/en.json';
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
  .use(resourcesToBackend((language, namespace, callback) => {
    import(`./locales/${namespace}/names_${language}.json`)
      .then((res) => {
        callback(null, res);
      })
      .catch((error) => {
        callback(error, null);
      });
  }))
  .init({
    resources,
    partialBundledLanguages: true,
    fallbackLng: 'en',
    lng: 'hu',
    keySeparator: '.',
    react: {
      useSuspense: false, //   <---- this will do the magic
    },
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;