import type { Metadata } from "next";
import Link from "@/i18n/link";
import { ArrowRight } from "lucide-react";
import { Crumbs } from "@/components/crumbs";
import { JsonLd } from "@/components/json-ld";
import { Strip } from "@/components/plate";
import { Cite, Kanji, WorksCited } from "@/components/mla";
import { getPalette } from "@/lib/dictionary";
import { SITE } from "@/lib/site";
import { alternates } from "@/i18n/config";
import { rich } from "@/i18n/rich";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t, lang } = await getT("wada");
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: alternates("/wada", lang),
  };
}

/** Dated events, written for this page from the sources listed below. */
const LIFE = [
  { year: "1883", key: "born" },
  { year: "1896", key: "fukuoka" },
  { year: "1899", key: "tokyo" },
  { year: "1904", key: "graduates" },
  { year: "1907", key: "southWind" },
  { year: "1907–15", key: "europe" },
  { year: "1927", key: "association" },
  { year: "1932–44", key: "professor" },
  { year: "1933–34", key: "haishoku" },
  { year: "1936", key: "olympics" },
  { year: "1945", key: "institute" },
  { year: "1951", key: "standards" },
  { year: "1953", key: "gateOfHell" },
  { year: "1955", key: "oscar" },
  { year: "1958", key: "merit" },
  { year: "1967", key: "dies" },
  { year: "2010", key: "seigensha" },
] as const;

/**
 * Wada in his own words. Short quotations from the 1934 booklet that came with
 * Haishoku Sōkan, each with our translation and a summary in our own words.
 * Only passages Wada signed or wrote as the book's sole editor are used; the
 * preface by Wada Eisaku is not. Quotations are kept brief (see /about).
 */
const WORDS: {
  n: string;
  kanji: string;
  /** Key for the title and gloss in the wada namespace. */
  key: "why" | "nature" | "equal";
  ja: string;
  /** Our English translation; shown on the English page only. */
  en: string;
  page: string;
}[] = [
  {
    n: "一",
    kanji: "發刊",
    key: "why",
    ja: "一般日常の手輕な色彩の相談對手ともなり、又は幾分決定的の指導機關たらしむるも可と信じ",
    en: "believing that it might serve as a handy counsel on colour in everyday life, or even as a somewhat decisive guide",
    page: "2",
  },
  {
    n: "二",
    kanji: "構成",
    key: "nature",
    ja: "必ず自然と云ふ大いなる配色構成に準じ、又或はそのハーモニーを學ぶことによつて完成される",
    en: "is always completed by following the great colour composition that is nature, or by learning its harmony",
    page: "22",
  },
  {
    n: "三",
    kanji: "色量",
    key: "equal",
    ja: "この配色表の如く同量同形の色を用ふることは極めて稀れで、寧ろ此の如きことは避くべきことが普通である",
    en: "to use colours in equal amounts and of equal shape, as in these tables, is extremely rare; indeed, it is usually something to avoid",
    page: "28",
  },
];


export default async function WadaPage() {
  const { t, lang, href } = await getT("wada");
  const { t: tc } = await getT();
  return (
    <div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: "Sanzo Wada",
          alternateName: "和田三造",
          birthDate: "1883-03-03",
          deathDate: "1967-08-22",
          birthPlace: t("jsonLd.birthPlace"),
          deathPlace: t("jsonLd.deathPlace"),
          jobTitle: t("jsonLd.jobTitle"),
          award: [t("jsonLd.awardOscar"), t("jsonLd.awardMerit")],
          sameAs: ["https://en.wikipedia.org/wiki/Sanzo_Wada"],
          url: `${SITE.url}${href("/wada")}`,
        }}
      />
      <div className="shell">
        <Crumbs items={[{ href: "/wada", label: tc("nav.wada") }]} className="pt-6" />
        <header className="grid grid-cols-1 gap-8 pt-10 pb-16 md:grid-cols-12 md:pt-16 md:pb-24">
          <div className="md:col-span-8">
            <h1 className="font-display text-[clamp(3rem,8vw,7rem)] leading-[0.95] font-extrabold tracking-[-0.03em]">{t("name")}</h1>
            <p className="mt-4 font-display text-2xl text-sumi-soft" lang="ja">
              {t("nameAlt")} <span className="font-data text-base">1883–1967</span>
            </p>
          </div>
          <p className="self-end text-lg leading-relaxed md:col-span-4">
            {t("intro")}
          </p>
        </header>
      </div>

      {/* Three fields of work. */}
      <section aria-labelledby="work" className="ground-sumi">
        <div className="shell py-20 md:py-28">
          <h2 id="work" className="sr-only">{t("work.heading")}</h2>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-10">
            {/* Decorative strips only: these combinations illustrate, they are not tied to the events. */}
            {[
              {
                title: t("work.painter.title"),
                text: t("work.painter.text"),
                plate: 22,
              },
              {
                title: t("work.researcher.title"),
                text: t("work.researcher.text"),
                plate: 295,
              },
              {
                title: t("work.designer.title"),
                text: t("work.designer.text"),
                plate: 154,
              },
            ].map((f) => (
              <div key={f.title}>
                <Strip palette={getPalette(f.plate)!} className="h-3 w-full" />
                <h3 className="mt-6 font-display text-2xl font-bold">{f.title}</h3>
                <p className="mt-3 leading-relaxed text-sumi-soft">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* A life, by the year. */}
      <section aria-labelledby="life" className="shell py-20 md:py-28">
        <h2 id="life" className="max-w-2xl font-display text-[clamp(1.8rem,3.4vw,3rem)] leading-tight font-bold">
          {t("lifeHeading")}
        </h2>
        <ol className="mt-12 border-t border-sumi">
          {LIFE.map((e) => (
            <li key={e.year} className="grid grid-cols-[5.5rem_1fr] items-baseline gap-4 border-b border-rule py-4 md:grid-cols-[9rem_1fr] md:gap-8">
              <span className="font-data text-sm">{e.year}</span>
              <span className="leading-relaxed">{rich(t(`life.${e.key}`))}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* In his own words: short quotations, our translations, cited in MLA. */}
      <section aria-labelledby="words" className="border-t border-rule">
        <div className="shell py-20 md:py-28">
          <div className="flex items-baseline gap-4">
            <h2 id="words" className="max-w-2xl font-display text-[clamp(1.8rem,3.4vw,3rem)] leading-tight font-bold">
              {t("words.heading")}
            </h2>
            <Kanji className="text-2xl">原文</Kanji>
          </div>
          <p className="mt-4 max-w-2xl leading-relaxed text-sumi-soft">
            {rich(t("words.intro"))}
          </p>
          <ol className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-10">
            {WORDS.map((w) => (
              <li key={w.n} className="border-t border-sumi pt-6">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-2xl font-bold">{t(`words.${w.key}.title`)}</h3>
                  <Kanji className="text-lg">{w.kanji}</Kanji>
                </div>
                <blockquote className="mt-5">
                  <p lang="ja" className="font-display text-[1.05rem] leading-loose">
                    「{w.ja}」{lang === "ja" && <Cite work="gaisetsu" page={w.page} />}
                  </p>
                  {lang !== "ja" && (
                    <p className="mt-3 leading-relaxed">
                      &ldquo;{w.en}&rdquo; <Cite work="gaisetsu" page={w.page} />
                    </p>
                  )}
                </blockquote>
                <p className="mt-4 text-sm leading-relaxed text-sumi-soft">{t(`words.${w.key}.gloss`)}</p>
              </li>
            ))}
          </ol>
          <p className="mt-12 max-w-2xl text-sm leading-relaxed text-sumi-soft">
            {t("words.note")}
          </p>
        </div>
      </section>

      <section aria-labelledby="dictionary" className="ground-deep">
        <div className="shell grid grid-cols-1 gap-8 py-20 md:grid-cols-12 md:py-28">
          <h2 id="dictionary" className="font-display text-[clamp(1.8rem,3.4vw,3rem)] leading-tight font-bold md:col-span-6">
            {t("orders.heading")}
          </h2>
          <div className="space-y-5 text-lg leading-relaxed md:col-span-5 md:col-start-8">
            <p>{rich(t("orders.text"))}</p>
            <Link href="/combinations" className="inline-flex min-h-12 items-center gap-2 bg-sumi px-6 text-base text-washi hover:bg-sumi-soft">
              {t("orders.cta")} <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="sources" className="shell py-16">
        <div className="flex items-baseline gap-3">
          <h2 id="sources" className="text-sm text-sumi-soft">{tc("cite.worksCited")}</h2>
          <Kanji className="text-sm">出典</Kanji>
        </div>
        <WorksCited ids={["gaisetsu", "haishoku", "seigensha", "southWind", "wikipedia"]} className="mt-4 max-w-3xl" />
        <p className="mt-6 max-w-2xl text-sm text-sumi-soft">
          {t("sourcesNote")}
        </p>
      </section>
    </div>
  );
}
