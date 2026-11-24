import type { Metadata, Viewport } from "next";
import { Martian_Mono, Shippori_Mincho_B1, Zen_Kaku_Gothic_New } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { SiteFooter } from "@/components/site-footer";
import { sidebarBootScript } from "@/components/sidebar-toggle";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SITE } from "@/lib/site";
import "./globals.css";

const mincho = Shippori_Mincho_B1({
  variable: "--font-mincho",
  weight: ["500", "700", "800"],
  subsets: ["latin"],
  display: "swap",
});

const gothic = Zen_Kaku_Gothic_New({
  variable: "--font-gothic",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

const data = Martian_Mono({
  variable: "--font-data",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — Sanzo Wada`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: "Sanzo Wada (combinations)" }],
  keywords: [
    "Sanzo Wada",
    "A Dictionary of Color Combinations",
    "colour palettes",
    "color palettes",
    "Japanese colour",
    "Haishoku Sokan",
    "CMYK",
    "HEX",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — Sanzo Wada`,
    description: SITE.description,
    url: "/",
    locale: "en_GB",
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#efece4",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${mincho.variable} ${gothic.variable} ${data.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: sidebarBootScript }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only z-50 bg-sumi px-4 py-2 text-washi focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
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
        <Toaster />
      </body>
    </html>
  );
}
