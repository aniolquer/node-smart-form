"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

/**
 * Language Selector Component
 * Provides a dropdown to switch between Spanish and English
 * Saves the language preference to localStorage
 */
export default function LanguageSelector() {
  const { t, i18n } = useTranslation();

  /**
   * Changes the current language and saves preference to localStorage
   * @param language - The language code ('es' or 'en')
   */
  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem("i18nextLng", language);
  };

  /**
   * Gets the display name for the current language
   * @returns The display name in the current language
   */
  const getCurrentLanguageDisplay = () => {
    return i18n.language === "es"
      ? t("language.spanish")
      : t("language.english");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 text-sm font-medium"
          aria-label={t("language.change_language")}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {getCurrentLanguageDisplay()}
          </span>
          <span className="sm:hidden">
            {i18n.language === "es" ? "ES" : "EN"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        <DropdownMenuItem
          onClick={() => changeLanguage("es")}
          className={`cursor-pointer ${
            i18n.language === "es" ? "bg-accent" : ""
          }`}
        >
          <span className="flex items-center gap-2">
            🇪🇸 {t("language.spanish")}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeLanguage("en")}
          className={`cursor-pointer ${
            i18n.language === "en" ? "bg-accent" : ""
          }`}
        >
          <span className="flex items-center gap-2">
            🇬🇧 {t("language.english")}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
