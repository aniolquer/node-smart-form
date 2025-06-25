"use client";

import React, { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";

interface I18nProviderProps {
  children: React.ReactNode;
}

/**
 * I18n Provider Component
 * Wraps the application with i18next provider and handles client-side initialization
 */
export default function I18nProvider({ children }: I18nProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeI18n = async () => {
      try {
        // Wait for i18n to be ready
        if (!i18n.isInitialized) {
          await i18n.init();
        }

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
  }, []);

  // Show loading state while i18n is initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
