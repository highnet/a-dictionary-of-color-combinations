"use client";

import NextLink from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Languages } from "lucide-react";
import { Suspense, type ReactNode } from "react";
import { localize, stripLocale, type Locale } from "@/i18n/config";
import { useLang, useTranslation } from "@/i18n/client";

/** Remember the choice: proxy.ts sends a reader who chose Japanese to /ja. */
function remember(lang: Locale) {
  try {
    document.cookie = `dcc-lang=${lang};path=/;max-age=31536000;samesite=lax`;
  } catch {}
}

function useOther() {
  const lang = useLang();
  const other: Locale = lang === "en" ? "ja" : "en";
  const { path } = stripLocale(usePathname() || "/");
  return { other, path };
}

/** The same page in the other language, keeping the query string when it can be read. */
function SwitchLink({ className, label, children }: { withQuery?: boolean; className: string; label?: string; children: ReactNode }) {
  const { t } = useTranslation();
  const { other, path } = useOther();
  return (
    <NextLink
      href={localize(path, other)}
      hrefLang={other}
      lang={other}
      data-eyedropper-ignore
      title={label ? undefined : t("shell.language")}
      aria-label={label}
      className={className}
      onClick={() => remember(other)}
    >
      {children}
    </NextLink>
  );
}

function WithQuery(props: Omit<Parameters<typeof SwitchLink>[0], "withQuery">) {
  const qs = useSearchParams()?.toString();
  const { other, path } = useOther();
  const { t } = useTranslation();
  return (
    <NextLink
      href={localize(path, other) + (qs ? `?${qs}` : "")}
      hrefLang={other}
      lang={other}
      data-eyedropper-ignore
      title={props.label ? undefined : t("shell.language")}
      aria-label={props.label}
      className={props.className}
      onClick={() => remember(other)}
    >
      {props.children}
    </NextLink>
  );
}

/**
 * Reading the query needs client rendering on static pages; the fallback is the
 * same link without it, so the switch is in the server HTML too.
 */
function Switch(props: Omit<Parameters<typeof SwitchLink>[0], "withQuery">) {
  return (
    <Suspense fallback={<SwitchLink withQuery={false} {...props} />}>
      <WithQuery {...props} />
    </Suspense>
  );
}

/** Same page, other language. Sidebar row. */
export function LanguageSwitch() {
  const { t } = useTranslation();
  return (
    <Switch className="flex h-11 items-center gap-3.5 px-[1.15rem] text-sm text-sumi-soft transition-colors hover:bg-washi-deep hover:text-sumi">
      <Languages className="size-[1.15rem] shrink-0" strokeWidth={1.5} aria-hidden="true" />
      <span className="sb-label">{t("shell.switchTo")}</span>
    </Switch>
  );
}

/** Same page, other language. Mobile top bar. */
export function LanguageIconSwitch() {
  const { t } = useTranslation();
  const lang = useLang();
  return (
    <Switch label={t("shell.switchTo")} className="grid size-11 place-items-center font-data text-xs">
      {lang === "en" ? "日本" : "EN"}
    </Switch>
  );
}
