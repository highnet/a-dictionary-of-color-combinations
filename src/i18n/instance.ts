import { createInstance, type i18n, type Resource } from "i18next";
import { DEFAULT_LOCALE, type Locale } from "./config";

/** A synchronously initialised i18next instance for one locale, English as fallback. */
export function createI18n(lang: Locale, resources: Resource, plugins: Parameters<i18n["use"]>[0][] = []): i18n {
  const instance = createInstance();
  for (const p of plugins) instance.use(p);
  instance.init({
    lng: lang,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: ["en", "ja"],
    ns: Object.keys(resources[DEFAULT_LOCALE] ?? {}),
    defaultNS: "common",
    resources,
    initAsync: false,
    interpolation: { escapeValue: false }, // React escapes
    returnNull: false,
  });
  return instance;
}
