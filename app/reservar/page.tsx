"use client";

import SolicitudReservaForm from "@/components/solicitud-reserva-form";
import LanguageSelector from "@/components/language-selector";
import { MapPin } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

export default function ReservaPage() {
  const { t, isInitialized } = useI18n();

  // Show loading state while i18n initializes
  if (!isInitialized) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-gray-600">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="bg-white" style={{ minHeight: "1800px" }}>
      <main className="py-8 px-4 md:px-8 lg:px-16">
        <div className="max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-start">
              <MapPin className="h-7 w-7 text-orange-600 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-1">
                  {t("form.title")}
                </h2>
                <p className="text-gray-600">
                  {t("form_sections.personal_info_description")}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <LanguageSelector />
            </div>
          </div>
          <SolicitudReservaForm />
        </div>
      </main>
    </div>
  );
}
