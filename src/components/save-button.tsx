"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useFavourites } from "@/lib/favourites";
import { useTranslation } from "@/i18n/client";

export function SaveButton({ id, code }: { id: number; code: string }) {
  const { has, toggle } = useFavourites();
  const saved = has(id);
  const { t } = useTranslation("plate");
  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      aria-pressed={saved}
      className="inline-flex min-h-11 items-center gap-2.5 border border-current/30 px-4 text-sm transition-colors hover:border-current"
      aria-label={saved ? t("save.ariaRemove", { code }) : t("save.ariaSave", { code })}
    >
      {saved ? (
        <BookmarkCheck className="size-4" strokeWidth={1.6} aria-hidden="true" />
      ) : (
        <Bookmark className="size-4" strokeWidth={1.6} aria-hidden="true" />
      )}
      {saved ? t("save.saved") : t("save.save")}
    </button>
  );
}
