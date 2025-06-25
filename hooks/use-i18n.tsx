"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Custom hook to handle i18n initialization on the client side
 * Prevents hydration mismatches by only initializing after mount
 */
export function useI18n() {
  const [isInitialized, setIsInitialized] = useState(false);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    // Initialize i18n only on client side
    const initializeI18n = async () => {
      try {
        // Import i18n configuration on client side only
        await import("@/lib/i18n");

        // Check for saved language preference
        const savedLanguage = localStorage.getItem("i18nextLng");

        if (
          savedLanguage &&
          (savedLanguage === "es" || savedLanguage === "en")
        ) {
          await i18n.changeLanguage(savedLanguage);
        } else {
          // Detect browser language if no saved preference
          const browserLang = navigator.language.toLowerCase();
          const targetLang = browserLang.startsWith("en") ? "en" : "es";
          await i18n.changeLanguage(targetLang);
          localStorage.setItem("i18nextLng", targetLang);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing i18n:", error);
        setIsInitialized(true); // Set to true anyway to prevent loading forever
      }
    };

    initializeI18n();
  }, [i18n]);

  return {
    t,
    i18n,
    isInitialized,
  };
}
