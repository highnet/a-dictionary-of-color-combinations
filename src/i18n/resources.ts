/**
 * Every translation file, loaded statically. English is the reference: its
 * keys type t() (see i18next.d.ts) and Japanese falls back to it per key.
 */
import enCommon from "@/locales/en/common.json";
import enHome from "@/locales/en/home.json";
import enAbout from "@/locales/en/about.json";
import enWada from "@/locales/en/wada.json";
import enCombinations from "@/locales/en/combinations.json";
import enPlate from "@/locales/en/plate.json";
import enColours from "@/locales/en/colours.json";
import enCompare from "@/locales/en/compare.json";
import enExplore from "@/locales/en/explore.json";
import jaCommon from "@/locales/ja/common.json";
import jaHome from "@/locales/ja/home.json";
import jaAbout from "@/locales/ja/about.json";
import jaWada from "@/locales/ja/wada.json";
import jaCombinations from "@/locales/ja/combinations.json";
import jaPlate from "@/locales/ja/plate.json";
import jaColours from "@/locales/ja/colours.json";
import jaCompare from "@/locales/ja/compare.json";
import jaExplore from "@/locales/ja/explore.json";
import type { Resource } from "i18next";
import type { Locale } from "./config";

export const en = {
  common: enCommon,
  home: enHome,
  about: enAbout,
  wada: enWada,
  combinations: enCombinations,
  plate: enPlate,
  colours: enColours,
  compare: enCompare,
  explore: enExplore,
};

export type Resources = typeof en;
export type Namespace = keyof Resources;
export const NAMESPACES = Object.keys(en) as Namespace[];

// Japanese files may lag English while being written; missing keys fall back.
const ja: Record<Namespace, object> = {
  common: jaCommon,
  home: jaHome,
  about: jaAbout,
  wada: jaWada,
  combinations: jaCombinations,
  plate: jaPlate,
  colours: jaColours,
  compare: jaCompare,
  explore: jaExplore,
};

export const RESOURCES: Record<Locale, Record<Namespace, object>> = { en, ja };

/** Namespaces read by Client Components. about and wada render on the server only. */
const CLIENT_NAMESPACES: Namespace[] = ["common", "home", "combinations", "plate", "colours", "compare", "explore"];

function pick(all: Record<Namespace, object>) {
  return Object.fromEntries(CLIENT_NAMESPACES.map((ns) => [ns, all[ns]]));
}

/** What the browser needs in `lang`: client namespaces, plus English to fall back on. */
export function resourcesFor(lang: Locale): Resource {
  return (lang === "en" ? { en: pick(RESOURCES.en) } : { [lang]: pick(RESOURCES[lang]), en: pick(RESOURCES.en) }) as Resource;
}

/** Everything in `lang` plus English: for the server, where every page renders. */
export function allResourcesFor(lang: Locale): Resource {
  return (lang === "en" ? { en: RESOURCES.en } : { [lang]: RESOURCES[lang], en: RESOURCES.en }) as Resource;
}
