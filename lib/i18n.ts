import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files
import es from "./i18n/es.json";
import en from "./i18n/en.json";

const resources = {
  en: {
    translation: en,
  },
  es: {
    translation: es,
  },
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n down to react-i18next
  .init({
    resources,
    fallbackLng: "es", // Default to Spanish if language is not detected or not supported

    // Language detection configuration
    detection: {
      // Order of language detection methods
      order: ["localStorage", "navigator", "htmlTag"],

      // Cache the language selection in localStorage
      caches: ["localStorage"],
    },

    // Whitelist of supported languages
    supportedLngs: ["en", "es"],

    // Don't load languages that look like English but aren't English
    nonExplicitSupportedLngs: true,

    interpolation: {
      escapeValue: false, // React already does escaping
    },

    // Enable debug mode in development
    debug: process.env.NODE_ENV === "development",
  });

export default i18n;
