"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useFavourites } from "@/lib/favourites";

export function SaveButton({ id, code }: { id: number; code: string }) {
  const { has, toggle } = useFavourites();
  const saved = has(id);
  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      aria-pressed={saved}
      className="inline-flex min-h-11 items-center gap-2.5 border border-current/30 px-4 text-sm transition-colors hover:border-current"
      aria-label={saved ? `Remove ${code} from saved` : `Save ${code}`}
    >
      {saved ? (
        <BookmarkCheck className="size-4" strokeWidth={1.6} aria-hidden="true" />
      ) : (
        <Bookmark className="size-4" strokeWidth={1.6} aria-hidden="true" />
      )}
      {saved ? "Saved" : "Save"}
    </button>
  );
}
