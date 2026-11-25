/**
 * Locales and locale-aware paths. English keeps the site's original,
 * unprefixed URLs (/combinations); Japanese lives under /ja (/ja/combinations).
 * proxy.ts rewrites unprefixed requests to /en internally.
 */
export const LOCALES = ["en", "ja"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABEL: Record<Locale, string> = { en: "English", ja: "日本語" };
/** BCP 47 tags for <html lang>, Open Graph and hreflang. */
export const LOCALE_TAG: Record<Locale, string> = { en: "en-GB", ja: "ja-JP" };

export function isLocale(value: string | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}

/** Split a pathname into its locale and the path without it. */
export function stripLocale(pathname: string): { lang: Locale; path: string } {
  const m = pathname.match(/^\/(en|ja)(?=\/|$|\?|#)(.*)$/);
  if (!m) return { lang: DEFAULT_LOCALE, path: pathname || "/" };
  return { lang: m[1] as Locale, path: m[2] || "/" };
}

/** "/combinations" → "/ja/combinations" for Japanese; unchanged for English and non-site links. */
export function localize(href: string, lang: Locale): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const { path } = stripLocale(href);
  if (lang === DEFAULT_LOCALE) return path;
  if (path === "/") return `/${lang}`;
  if (/^\/[?#]/.test(path)) return `/${lang}${path.slice(1)}`;
  return `/${lang}${path}`;
}

/** metadata.alternates for a page: canonical in `lang`, plus hreflang for every locale. */
export function alternates(path: string, lang: Locale) {
  return {
    canonical: localize(path, lang),
    languages: {
      "en-GB": localize(path, "en"),
      "ja-JP": localize(path, "ja"),
      "x-default": localize(path, "en"),
    },
  };
}
