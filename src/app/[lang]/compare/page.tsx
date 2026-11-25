import type { Metadata } from "next";
import { Suspense } from "react";
import { Crumbs } from "@/components/crumbs";
import { alternates } from "@/i18n/config";
import { getT } from "@/i18n/server";
import { CompareView } from "./compare-view";

export async function generateMetadata(): Promise<Metadata> {
  const { t, lang } = await getT("compare");
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: alternates("/compare", lang),
  };
}

export default async function ComparePage() {
  const { t } = await getT("compare");
  const { t: tc } = await getT();
  return (
    <div className="shell pb-28">
      <Crumbs items={[{ href: "/explore", label: tc("nav.explore") }, { href: "/compare", label: tc("nav.compare") }]} className="pt-6" />
      <header className="grid grid-cols-1 gap-6 pt-10 pb-12 md:grid-cols-12 md:pt-16">
        <h1 className="font-display text-[clamp(2.6rem,6vw,5.2rem)] leading-[0.98] font-extrabold tracking-[-0.025em] md:col-span-7">
          {t("title")}
        </h1>
        <p className="self-end text-lg leading-relaxed text-sumi-soft md:col-span-4 md:col-start-9">
          {t("lede")}
        </p>
      </header>
      <Suspense fallback={<div className="h-64" />}>
        <CompareView />
      </Suspense>
    </div>
  );
}
