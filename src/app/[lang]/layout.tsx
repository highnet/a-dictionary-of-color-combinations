import type { Metadata, Viewport } from "next";
import { Martian_Mono, Shippori_Mincho_B1, Zen_Kaku_Gothic_New } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { SiteFooter } from "@/components/site-footer";
import { bootScript } from "@/lib/boot";
import { DojoFloor } from "@/components/dojo-floor";
import { EyedropperLayer } from "@/components/eyedropper";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SITE } from "@/lib/site";
import { I18nProvider } from "@/i18n/client";
import { alternates, LOCALES, LOCALE_TAG } from "@/i18n/config";
import { resourcesFor } from "@/i18n/resources";
import { getT } from "@/i18n/server";
import "../globals.css";

const mincho = Shippori_Mincho_B1({
  variable: "--font-mincho",
  weight: ["500", "700", "800"],
  subsets: ["latin"],
  display: "swap",
  // CJK families ship hundreds of unicode-range slices; preloading would fetch
  // them all. Without preload the browser takes only the Latin slices it uses.
  preload: false,
});

const gothic = Zen_Kaku_Gothic_New({
  variable: "--font-gothic",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const data = Martian_Mono({
  variable: "--font-data",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { t, lang } = await getT();
  const name = t("site.name");
  const description = t("site.description");
  return {
    metadataBase: new URL(SITE.url),
    title: { default: t("site.titleDefault"), template: `%s · ${name}` },
    description,
    applicationName: name,
    authors: [{ name: "Sanzo Wada (combinations)" }],
    keywords: [
      "Sanzo Wada",
      "和田三造",
      "A Dictionary of Color Combinations",
      "配色総鑑",
      "配色事典",
      "colour palettes",
      "color palettes",
      "Japanese colour",
      "Haishoku Sokan",
      "CMYK",
      "HEX",
    ],
    alternates: alternates("/", lang),
    openGraph: {
      type: "website",
      siteName: name,
      title: t("site.titleDefault"),
      description,
      url: lang === "en" ? "/" : `/${lang}`,
      locale: LOCALE_TAG[lang].replace("-", "_"),
      alternateLocale: LOCALES.filter((l) => l !== lang).map((l) => LOCALE_TAG[l].replace("-", "_")),
    },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eceee8" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1a18" },
  ],
  colorScheme: "light dark",
};

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const { t, lang } = await getT();
  return (
    <html
      lang={lang}
      className={`${mincho.variable} ${gothic.variable} ${data.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only z-50 bg-sumi px-4 py-2 text-washi focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {t("shell.skip")}
        </a>
        <DojoFloor />
        <I18nProvider lang={lang} resources={resourcesFor(lang)}>
        <TooltipProvider>
          <div className="app-frame">
            <Sidebar />
            <div className="flex min-w-0 flex-col">
              <Topbar />
              <main id="main" className="flex-1">
                {children}
              </main>
              <SiteFooter />
            </div>
          </div>
        </TooltipProvider>
        <EyedropperLayer />
        <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}
