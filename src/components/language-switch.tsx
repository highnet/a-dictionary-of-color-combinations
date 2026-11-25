"use client";

import NextLink from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Languages } from "lucide-react";
import { Suspense } from "react";
import { localize, stripLocale } from "@/i18n/config";
import { useLang, useTranslation } from "@/i18n/client";

function useOtherHref() {
  const lang = useLang();
  const other = lang === "en" ? "ja" : "en";
  const { path } = stripLocale(usePathname() || "/");
  const qs = useSearchParams()?.toString();
  return { other, href: localize(path, other) + (qs ? `?${qs}` : "") };
}

function Row() {
  const { t } = useTranslation();
  const { other, href } = useOtherHref();
  return (
    <NextLink
      href={href}
      hrefLang={other}
      lang={other}
      data-eyedropper-ignore
      title={t("shell.language")}
      className="flex h-11 items-center gap-3.5 px-[1.15rem] text-sm text-sumi-soft transition-colors hover:bg-washi-deep hover:text-sumi"
      onClick={() => {
        try {
          document.cookie = `dcc-lang=${other};path=/;max-age=31536000;samesite=lax`;
        } catch {}
      }}
    >
      <Languages className="size-[1.15rem] shrink-0" strokeWidth={1.5} aria-hidden="true" />
      <span className="sb-label">{t("shell.switchTo")}</span>
    </NextLink>
  );
}

function Icon() {
  const { t } = useTranslation();
  const { other, href } = useOtherHref();
  return (
    <NextLink
      href={href}
      hrefLang={other}
      lang={other}
      data-eyedropper-ignore
      aria-label={t("shell.switchTo")}
      className="grid size-11 place-items-center font-data text-xs"
    >
      {other === "ja" ? "日本" : "EN"}
    </NextLink>
  );
}

/** Same page, other language. Sidebar row. */
export function LanguageSwitch() {
  return (
    <Suspense>
      <Row />
    </Suspense>
  );
}

/** Same page, other language. Mobile top bar. */
export function LanguageIconSwitch() {
  return (
    <Suspense>
      <Icon />
    </Suspense>
  );
}
