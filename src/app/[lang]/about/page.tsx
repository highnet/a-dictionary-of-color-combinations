import type { Metadata } from "next";
import Link from "@/i18n/link";
import { Crumbs } from "@/components/crumbs";
import { Cite, Kanji, WorksCited } from "@/components/mla";
import { alternates } from "@/i18n/config";
import { rich } from "@/i18n/rich";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t, lang } = await getT("about");
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: alternates("/about", lang),
  };
}

const FACTS = ["author", "original", "edition", "combinations", "colours"] as const;

export default async function AboutPage() {
  const { t, lang } = await getT("about");
  const { t: tc } = await getT();
  const cite = (work: "mattdesl" | "dblodorn" | "plates1935") =>
    function CiteTag(_: unknown, k: number) {
      return <Cite key={k} work={work} />;
    };
  return (
    <div>
      <div className="shell pb-20">
        <Crumbs items={[{ href: "/about", label: tc("nav.about") }]} className="pt-6" />
        <header className="grid grid-cols-1 gap-6 pt-10 pb-16 md:grid-cols-12 md:pt-16">
          <h1 className="font-display text-[clamp(2.6rem,6vw,5.2rem)] leading-[0.98] font-extrabold tracking-[-0.025em] md:col-span-7">
            {t("title")}
          </h1>
          <p className="self-end text-lg leading-relaxed text-sumi-soft md:col-span-4 md:col-start-9">
            {t("tagline")}
          </p>
        </header>
        <dl className="grid border-t border-sumi md:grid-cols-2">
          {FACTS.map((k) => (
            <div key={k} className="grid grid-cols-[9rem_1fr] gap-4 border-b border-rule py-4">
              <dt className="text-sm text-sumi-soft">{t(`facts.${k}.label`)}</dt>
              <dd className="text-[0.95rem]">{rich(t(`facts.${k}.value`))}</dd>
            </div>
          ))}
        </dl>
      </div>

      <section aria-labelledby="method" className="ground-deep">
        <div className="shell grid grid-cols-1 gap-12 py-20 md:grid-cols-12 md:py-28">
          <h2 id="method" className="font-display text-[clamp(1.8rem,3.4vw,3rem)] leading-tight font-bold md:col-span-4">
            {t("method.heading")}{" "}
            {lang !== "ja" && <Kanji className="ml-2 text-[0.5em]">{t("method.kanji")}</Kanji>}
          </h2>
          <div className="space-y-4 md:col-span-7 md:col-start-6">
            <details className="group border-b border-rule pb-4" open>
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-lg">
                {t("method.data.summary")}
                <span aria-hidden="true" className="font-data text-sm transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="space-y-3 pt-2 leading-relaxed text-sumi-soft">
                <p>{rich(t("method.data.p1"), { mattdesl: cite("mattdesl"), dblodorn: cite("dblodorn") })}</p>
                <p>{t("method.data.p2")}</p>
              </div>
            </details>
            <details className="group border-b border-rule pb-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-lg">
                {t("method.verification.summary")}
                <span aria-hidden="true" className="font-data text-sm transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="space-y-3 pt-2 leading-relaxed text-sumi-soft">
                <p>{t("method.verification.p1")}</p>
                <p>{rich(t("method.verification.p2"), { plates1935: cite("plates1935") })}</p>
                <p>{t("method.verification.p3")}</p>
              </div>
            </details>
            <details className="group border-b border-rule pb-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-lg">
                {t("method.excludes.summary")}
                <span aria-hidden="true" className="font-data text-sm transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="space-y-3 pt-2 leading-relaxed text-sumi-soft">
                <p>{t("method.excludes.p1")}</p>
                <p>{t("method.excludes.p2")}</p>
                <p>{t("method.excludes.p3")}</p>
              </div>
            </details>
            <details className="group border-b border-rule pb-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-lg">
                {t("method.yourData.summary")}
                <span aria-hidden="true" className="font-data text-sm transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="pt-2 leading-relaxed text-sumi-soft">
                {t("method.yourData.p1")}
              </p>
            </details>
          </div>
        </div>
      </section>

      <section aria-labelledby="works-cited" className="shell py-20 md:py-28">
        <div className="flex items-baseline gap-4">
          <h2 id="works-cited" className="font-display text-[clamp(1.8rem,3.4vw,3rem)] leading-tight font-bold">{tc("cite.worksCited")}</h2>
          <Kanji className="text-2xl">出典</Kanji>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-sumi-soft">{tc("cite.mlaLong")}</p>
        <WorksCited
          ids={["haishoku", "gaisetsu", "plates1935", "seigensha", "mattdesl", "dblodorn", "wikipedia", "southWind"]}
          className="mt-8 max-w-3xl border-t border-sumi pt-6 text-[0.95rem]"
        />
        <h3 className="mt-12 text-sm text-sumi-soft">{t("citeCombination")}</h3>
        <p lang="en" className="mt-3 max-w-3xl pl-8 -indent-8 text-[0.95rem]">
          Wada, Sanzō. &ldquo;Combination 211.&rdquo; <i>A Dictionary of Color Combinations</i>, vol. 1, Seigensha, 2010, no. 211.
        </p>
      </section>

      <section className="border-t border-rule shell grid grid-cols-1 gap-8 py-20 md:grid-cols-12 md:py-28">
        <p className="font-display text-[clamp(1.6rem,3vw,2.4rem)] leading-snug font-bold md:col-span-7">
          {t("credit")}
        </p>
        <div className="flex flex-wrap items-end gap-3 md:col-span-4 md:col-start-9">
          <Link href="/combinations" className="inline-flex min-h-12 items-center bg-sumi px-6 text-washi hover:bg-sumi-soft">
            {t("openArchive")}
          </Link>
        </div>
      </section>
    </div>
  );
}
