"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { localize } from "./config";
import { useLang } from "./client";

/** next/link that keeps the reader in their language: "/about" → "/ja/about". */
export default function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const lang = useLang();
  const localized =
    typeof href === "string"
      ? localize(href, lang)
      : href.pathname
        ? { ...href, pathname: localize(href.pathname, lang) }
        : href;
  return <NextLink href={localized} {...props} />;
}
