"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";
import { useFavourites } from "@/lib/favourites";

export function SavedCount() {
  const { ids } = useFavourites();
  return (
    <Link
      href="/combinations?saved=1"
      title="Saved combinations"
      className="flex h-11 items-center gap-3.5 px-[1.15rem] text-sm text-sumi-soft transition-colors hover:bg-washi-deep hover:text-sumi"
    >
      <Bookmark className="size-[1.15rem] shrink-0" strokeWidth={1.5} aria-hidden="true" />
      <span className="sb-label flex flex-1 justify-between">
        Saved <span className="font-data">{ids.length}</span>
      </span>
    </Link>
  );
}
