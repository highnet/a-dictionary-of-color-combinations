import type { Metadata } from "next";
import { Suspense } from "react";
import { Crumbs } from "@/components/crumbs";
import { ColourIndex } from "@/components/colour-index";
import { alternates } from "@/i18n/config";
import { getT } from "@/i18n/server";
import { ColourSearch } from "./colour-search";

export async function generateMetadata(): Promise<Metadata> {
  const { t, lang } = await getT("colours");
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: alternates("/colours", lang),
  };
}

export default async function ColoursPage() {
  const { t } = await getT("colours");
  return (
    <div>
      <div className="shell pb-24">
        <Crumbs items={[{ href: "/colours", label: t("title") }]} className="pt-6" />
        <header className="grid grid-cols-1 gap-6 pt-10 pb-14 md:grid-cols-12 md:pt-16">
          <h1 className="font-display text-[clamp(2.6rem,6vw,5.2rem)] leading-[0.98] font-extrabold tracking-[-0.025em] md:col-span-7">
            {t("title")}
          </h1>
          <p className="self-end text-lg leading-relaxed text-sumi-soft md:col-span-4 md:col-start-9">
            {t("lede")}
          </p>
        </header>
        <Suspense fallback={<div className="h-64" />}>
          <ColourSearch />
        </Suspense>
      </div>
      <section aria-labelledby="all-colours" className="ground-deep">
        <div className="shell py-24">
          <h2 id="all-colours" className="font-display text-[clamp(1.8rem,3.4vw,3rem)] leading-tight font-bold">
            {t("allColours")}
          </h2>
          <div className="mt-12">
            <ColourIndex />
          </div>
        </div>
      </section>
    </div>
  );
}
