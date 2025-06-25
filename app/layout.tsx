import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import I18nProvider from "@/components/i18n-provider";

export const metadata: Metadata = {
  title: "Node Properties - Premium Accommodation",
  description:
    "Encuentra tu hogar perfecto con Node Properties. Alojamiento premium en las mejores ubicaciones con estancias flexibles.",
  keywords: "alojamiento, apartamentos, estudios, reservas, node properties",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <main className="min-h-screen">{children}</main>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
