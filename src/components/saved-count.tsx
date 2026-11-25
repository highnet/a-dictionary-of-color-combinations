"use client";

import Link from "@/i18n/link";
import { useTranslation } from "@/i18n/client";
import { Bookmark } from "lucide-react";
import { useFavourites } from "@/lib/favourites";

export function SavedCount() {
  const { ids } = useFavourites();
  const { t } = useTranslation();
  return (
    <Link
      href="/combinations?saved=1"
      title={t("shell.savedCombinations")}
      className="sb-row flex items-center gap-3.5 px-[0.9rem] text-sm text-sumi-soft transition-colors hover:bg-washi-deep hover:text-sumi"
    >
      <Bookmark className="size-[1.15rem] shrink-0" strokeWidth={1.5} aria-hidden="true" />
      <span className="sb-label flex flex-1 justify-between">
        {t("shell.saved")} <span className="font-data">{ids.length}</span>
      </span>
    </Link>
  );
}
