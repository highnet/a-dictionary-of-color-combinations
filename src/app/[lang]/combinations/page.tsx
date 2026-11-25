import type { Metadata } from "next";
import { Suspense } from "react";
import { Crumbs } from "@/components/crumbs";
import { PlateTile } from "@/components/plate";
import { PALETTES } from "@/lib/dictionary";
import { ArchiveBrowser } from "./archive-browser";

export const metadata: Metadata = {
  title: "All combinations",
  description:
    "Browse all 348 of Sanzo Wada's colour combinations in original order. Search by number, HEX or colour name; filter by two, three or four colours.",
  alternates: { canonical: "/combinations" },
};

export default function CombinationsPage() {
  return (
    <div className="shell pb-28">
      <Crumbs items={[{ href: "/combinations", label: "All combinations" }]} className="pt-6" />
      <header className="grid grid-cols-1 gap-6 pt-10 pb-12 md:grid-cols-12 md:pt-16">
        <h1 className="font-display text-[clamp(2.6rem,6vw,5.2rem)] leading-[0.98] font-extrabold tracking-[-0.025em] md:col-span-7">
          All combinations
        </h1>
        <p className="self-end text-lg leading-relaxed text-sumi-soft md:col-span-4 md:col-start-9">
          Three hundred and forty-eight orders. Choose by number, by colour, by strength.
        </p>
      </header>
      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-x-8 gap-y-14 border-t border-rule pt-24 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {PALETTES.map((p) => (
              <PlateTile key={p.id} palette={p} />
            ))}
          </div>
        }
      >
        <ArchiveBrowser />
      </Suspense>
    </div>
  );
}
