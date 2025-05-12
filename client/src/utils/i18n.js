import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import translations
import enTranslation from "../locales/en.json";
import kuTranslation from "../locales/ku.json";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: enTranslation,
    },
    ku: {
      translation: kuTranslation,
    },
  },
  lng: "en", // Default language
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

export default i18n;
