import type { Metadata } from "next";
import { Suspense } from "react";
import { Crumbs } from "@/components/crumbs";
import { ColourIndex } from "@/components/colour-index";
import { ColourSearch } from "./colour-search";

export const metadata: Metadata = {
  title: "Colour search",
  description:
    "Enter any HEX value to find the nearest of Sanzo Wada's 159 colours and every combination they appear in.",
  alternates: { canonical: "/colours" },
};

export default function ColoursPage() {
  return (
    <div>
      <div className="shell pb-24">
        <Crumbs items={[{ href: "/colours", label: "Colour search" }]} className="pt-6" />
        <header className="grid grid-cols-1 gap-6 pt-10 pb-14 md:grid-cols-12 md:pt-16">
          <h1 className="font-display text-[clamp(2.6rem,6vw,5.2rem)] leading-[0.98] font-extrabold tracking-[-0.025em] md:col-span-7">
            Colour search
          </h1>
          <p className="self-end text-lg leading-relaxed text-sumi-soft md:col-span-4 md:col-start-9">
            Name the colour you hold. The archive will show its nearest kin and every order it serves.
          </p>
        </header>
        <Suspense fallback={<div className="h-64" />}>
          <ColourSearch />
        </Suspense>
      </div>
      <section aria-labelledby="all-colours" className="ground-deep">
        <div className="shell py-24">
          <h2 id="all-colours" className="font-display text-[clamp(1.8rem,3.4vw,3rem)] leading-tight font-bold">
            All 159 colours
          </h2>
          <div className="mt-12">
            <ColourIndex />
          </div>
        </div>
      </section>
    </div>
  );
}
