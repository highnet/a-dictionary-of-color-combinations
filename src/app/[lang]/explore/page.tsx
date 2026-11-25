import type { Metadata } from "next";
import { Crumbs } from "@/components/crumbs";
import { CompositionMap } from "./composition-map";

export const metadata: Metadata = {
  title: "Explore",
  description:
    "See all 348 of Sanzo Wada's combinations at once, placed by hue and lightness. Filter by temperature, value contrast and number of colours; pick several to compare.",
  alternates: { canonical: "/explore" },
};

export default function ExplorePage() {
  return (
    <div className="shell pb-28">
      <Crumbs items={[{ href: "/explore", label: "Explore" }]} className="pt-6" />
      <header className="grid grid-cols-1 gap-6 pt-10 pb-12 md:grid-cols-12 md:pt-16">
        <h1 className="font-display text-[clamp(2.6rem,6vw,5.2rem)] leading-[0.98] font-extrabold tracking-[-0.025em] md:col-span-7">
          Survey the field.
        </h1>
        <p className="self-end text-lg leading-relaxed text-sumi-soft md:col-span-4 md:col-start-9">
          Every combination, placed by its average hue and value. Narrow the ground, then engage.
        </p>
      </header>
      <CompositionMap />
    </div>
  );
}
