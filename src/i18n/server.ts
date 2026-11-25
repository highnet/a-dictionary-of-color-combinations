import { lang as rootLang } from "next/root-params";
import type { i18n } from "i18next";
import { DEFAULT_LOCALE, isLocale, localize, type Locale } from "./config";
import { createI18n } from "./instance";
import { resourcesFor, type Namespace } from "./resources";

const instances = new Map<Locale, i18n>();

/** The current locale, from the [lang] root segment. Server Components only. */
export async function getLang(): Promise<Locale> {
  const l = await rootLang();
  return isLocale(l) ? l : DEFAULT_LOCALE;
}

/**
 * t() for Server Components: `const { t, lang, href } = await getT("about")`.
 * `href("/combinations")` gives the path in the current locale.
 */
export async function getT<N extends Namespace>(ns?: N) {
  const lang = await getLang();
  let instance = instances.get(lang);
  if (!instance) {
    instance = createI18n(lang, resourcesFor(lang));
    instances.set(lang, instance);
  }
  const t = instance.getFixedT<N>(lang, ns ?? ("common" as N));
  return { t, lang, href: (path: string) => localize(path, lang) };
}
