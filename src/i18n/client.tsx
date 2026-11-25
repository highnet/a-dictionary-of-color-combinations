"use client";

import type { Resource } from "i18next";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { localize, type Locale } from "./config";
import { createI18n } from "./instance";

const LangContext = createContext<Locale>("en");

/** The live instance, for plain functions outside React (toasts). Set by the provider. */
let active: { t: (key: string, options?: Record<string, unknown>) => string } | null = null;

/** t() outside components, e.g. in copyText(). Falls back to the key before the provider mounts. */
export function tOutside(key: string, options?: Record<string, unknown>): string {
  return active ? active.t(key, options) : key;
}

/** Wraps the app so Client Components can call useTranslation() and useLang(). */
export function I18nProvider({ lang, resources, children }: { lang: Locale; resources: Resource; children: ReactNode }) {
  const [i18n] = useState(() => createI18n(lang, resources, [initReactI18next]));
  useEffect(() => {
    active = i18n as unknown as typeof active;
  }, [i18n]);
  return (
    <LangContext value={lang}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </LangContext>
  );
}

export function useLang(): Locale {
  return useContext(LangContext);
}

/** `const href = useHref(); router.push(href("/combinations"))` */
export function useHref() {
  const lang = useLang();
  return (path: string) => localize(path, lang);
}

export { useTranslation } from "react-i18next";
