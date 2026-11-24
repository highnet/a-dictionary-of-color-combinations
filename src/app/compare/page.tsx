import type { Metadata } from "next";
import { Suspense } from "react";
import { Crumbs } from "@/components/crumbs";
import { CompareView } from "./compare-view";

export const metadata: Metadata = {
  title: "Compare combinations",
  description: "Set up to four of Sanzo Wada's colour combinations side by side and see which colours they share.",
  alternates: { canonical: "/compare" },
};

export default function ComparePage() {
  return (
    <div className="shell pb-28">
      <Crumbs items={[{ href: "/explore", label: "Explore" }, { href: "/compare", label: "Compare" }]} className="pt-6" />
      <header className="grid grid-cols-1 gap-6 pt-10 pb-12 md:grid-cols-12 md:pt-16">
        <h1 className="font-display text-[clamp(2.6rem,6vw,5.2rem)] leading-[0.98] font-extrabold tracking-[-0.025em] md:col-span-7">
          Compare
        </h1>
        <p className="self-end text-lg leading-relaxed text-sumi-soft md:col-span-4 md:col-start-9">
          Set the orders side by side. What they share is their strength.
        </p>
      </header>
      <Suspense fallback={<div className="h-64" />}>
        <CompareView />
      </Suspense>
    </div>
  );
}
