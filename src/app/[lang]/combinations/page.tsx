import type { Metadata } from "next";
import { Suspense } from "react";
import { Crumbs } from "@/components/crumbs";
import { PlateTile } from "@/components/plate";
import { PALETTES } from "@/lib/dictionary";
import { alternates } from "@/i18n/config";
import { getT } from "@/i18n/server";
import { ArchiveBrowser } from "./archive-browser";

export async function generateMetadata(): Promise<Metadata> {
  const { t, lang } = await getT("combinations");
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: alternates("/combinations", lang),
  };
}

export default async function CombinationsPage() {
  const { t } = await getT("combinations");
  const { t: tc } = await getT();
  return (
    <div className="shell pb-28">
      <Crumbs items={[{ href: "/combinations", label: tc("nav.combinations") }]} className="pt-6" />
      <header className="grid grid-cols-1 gap-6 pt-10 pb-12 md:grid-cols-12 md:pt-16">
        <h1 className="font-display text-[clamp(2.6rem,6vw,5.2rem)] leading-[0.98] font-extrabold tracking-[-0.025em] md:col-span-7">
          {t("title")}
        </h1>
        <p className="self-end text-lg leading-relaxed text-sumi-soft md:col-span-4 md:col-start-9">
          {t("lede")}
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
