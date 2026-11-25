"use client";

import type { ReactNode } from "react";
import Link from "@/i18n/link";
import { useTranslation } from "@/i18n/client";

/**
 * The translated bits of PlateTile. PlateTile renders in Server and Client
 * Components alike, so it passes plain strings here rather than whole palettes.
 */
export function PlateLink({
  href,
  code,
  names,
  className,
  children,
}: {
  href: string;
  code: string;
  names: string;
  className?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation("plate");
  return (
    <Link href={href} className={className} aria-label={t("tile.aria", { code, names })}>
      {children}
    </Link>
  );
}

export function PlateName({ code }: { code: string }) {
  const { t } = useTranslation("plate");
  return t("tile.heading", { code });
}
