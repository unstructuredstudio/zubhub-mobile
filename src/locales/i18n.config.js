import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import hi from './hi.json';
const { languageDetectorPlugin } = require('../utils/languageDetectorPlugin');

const resources = {
  en: {
    translation: en,
  },

  hi: {
    translation: hi,
  },
};

i18n
  .use(initReactI18next)
  .use(languageDetectorPlugin)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false, //in case you have any suspense related errors
    },
  });

export default i18n;
