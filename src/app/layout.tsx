import type { Metadata } from "next";
import { Inter, Sarabun } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { I18nProvider } from "@/shared/lib/i18n/client";
import { getBrandLabels } from "@/i18n/server";
import { UI_MESSAGES } from "@/i18n";
import { getLocaleCookie } from "@/shared/lib/i18n/server";
import { DEFAULT_LOCALE } from "@/shared/lib/i18n/config";
import { auth, resolveAppearance, resolveBrandText } from "@/features/identity/server";
import { BrandingProvider } from "@/components/providers/branding-provider";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });
const sarabun = Sarabun({ variable: "--font-sarabun", subsets: ["thai", "latin"], weight: ["300", "400", "500", "600", "700", "800"], display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandLabels();
  return { title: brand.name, description: brand.tagline };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [cookieLocale, appearance, session, brand] = await Promise.all([getLocaleCookie(), resolveAppearance(), auth().catch(() => null), resolveBrandText()]);
  const locale = cookieLocale ?? session?.locale ?? DEFAULT_LOCALE; // spec B7: login จากเครื่องใหม่ได้ภาษาที่ผู้ใช้เคยเลือก
  return (
    <html lang={locale} data-palette={appearance.palette} data-theme={appearance.theme} data-font={appearance.fontFamily} data-font-size={appearance.fontSize} suppressHydrationWarning>
      <body className={`${inter.variable} ${sarabun.variable} font-sans antialiased`} suppressHydrationWarning>
        <div className="bg" aria-hidden="true" />
        <I18nProvider locale={locale} messages={UI_MESSAGES}>
          <BrandingProvider brand={brand}>
          <SessionProvider>
            <ThemeProvider attribute={["class", "data-theme"]} defaultTheme="light" enableSystem={false}>
              {children}
              <Toaster />
            </ThemeProvider>
          </SessionProvider>
          </BrandingProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
