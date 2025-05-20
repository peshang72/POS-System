import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";

// Import translations directly for fallback
import enTranslation from "../locales/en.json";
import kuTranslation from "../locales/ku.json";

// Default resources (bundled locales)
const defaultResources = {
  en: {
    translation: enTranslation,
  },
  ku: {
    translation: kuTranslation,
  },
};

// Initialize i18next with default locales and add HTTP backend
i18n
  .use(Backend) // Add HTTP backend
  .use(initReactI18next)
  .init({
    resources: defaultResources,
    lng: localStorage.getItem("i18nextLng") || "en", // Get saved language or default to English
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    // Backend configuration
    backend: {
      // Path where resources get loaded from
      loadPath: "/locales/{{lng}}/{{ns}}.json",
      // Allow cross-domain requests
      crossDomain: true,
    },
    // Debug only in development
    debug: process.env.NODE_ENV === "development",
  });

// Function to load locales from Electron if available
const loadElectronLocales = async () => {
  if (window.api && window.api.locales && window.api.locales.getLocales) {
    try {
      console.log("Attempting to load locales from Electron...");
      const electronLocales = await window.api.locales.getLocales();

      if (electronLocales && Object.keys(electronLocales).length > 0) {
        console.log(
          "Successfully loaded locales from Electron:",
          Object.keys(electronLocales)
        );

        // Update i18n with the retrieved resources
        Object.keys(electronLocales).forEach((lang) => {
          i18n.addResourceBundle(
            lang,
            "translation",
            electronLocales[lang].translation,
            true,
            true
          );
        });

        // Force reload translations
        i18n.reloadResources();

        return true;
      }
    } catch (error) {
      console.error("Failed to load locales from Electron:", error);
    }
  }

  console.log("Using bundled locales as fallback");
  return false;
};

// Try to load Electron locales when this module is imported
loadElectronLocales();

export default i18n;
