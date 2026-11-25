import Link from "@/i18n/link";
import { ArrowRight } from "lucide-react";
import { HeroPrint, type PrintPlate } from "@/components/hero-print/HeroPrint";
import { QuickFind } from "@/components/quick-find";
import { PlateTile, Strip } from "@/components/plate";
import { JsonLd } from "@/components/json-ld";
import { CopyValue } from "@/components/copy-button";
import { COLOURS, FEATURED, GROUPS, PALETTES, getPalette } from "@/lib/dictionary";
import { SITE } from "@/lib/site";
import { getT } from "@/i18n/server";

const CHAPTERS = [
  { n: 2, range: "001–120", sample: [2, 22, 62] },
  { n: 3, range: "121–240", sample: [154, 151, 240] },
  { n: 4, range: "241–348", sample: [295, 313, 289] },
] as const;

// Four-colour combinations with the widest value range, so every plate reads.
const PRINT_PLATES: PrintPlate[] = PALETTES.filter((p) => p.size === 4)
  .sort((a, b) => b.metrics.lightnessRange - a.metrics.lightnessRange)
  .slice(0, 16)
  .sort((a, b) => a.id - b.id)
  .map((p) => ({ code: p.code, colors: p.colors.map(({ id, name, hex }) => ({ id, name, hex })) }));

export default async function Home() {
  const { t } = await getT("home");
  const { t: tc } = await getT();
  const wall = FEATURED.map((id) => getPalette(id)!);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE.name,
          url: SITE.url,
          potentialAction: {
            "@type": "SearchAction",
            target: `${SITE.url}/combinations?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }}
      />

      {/* First viewport: the title, the way in, and a plate being printed. */}
      <section className="shell grid grid-cols-1 gap-6 pt-0 pb-14 lg:min-h-dvh lg:grid-cols-12 lg:gap-12 lg:py-14">
        <div className="@container flex flex-col justify-center gap-7 lg:col-span-5 lg:gap-14">
          <div>
            <h1 className="font-display text-[clamp(2.25rem,14cqi,6rem)] leading-[0.98] font-extrabold tracking-[-0.03em]">
              {tc("site.name")}
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed lg:mt-6 lg:text-lg">
              {t("hero.lede")}
            </p>
          </div>
          <div className="max-w-md space-y-6">
            <QuickFind />
            <Link
              href="/combinations"
              className="group inline-flex min-h-12 items-center gap-3 bg-sumi px-6 text-washi transition-colors hover:bg-sumi-soft"
            >
              {t("hero.openArchive")}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="order-first -mx-[var(--gutter)] h-[min(31svh,22rem)] overflow-x-clip lg:overflow-visible lg:order-none lg:col-span-7 lg:mx-0 lg:h-auto">
          <HeroPrint plates={PRINT_PLATES} />
        </div>
      </section>

      {/* The fork: people browse; agents read the skill and call the API. */}
      <section id="agents" aria-labelledby="fork" className="hairline">
        <h2 id="fork" className="sr-only">{t("fork.heading")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="shell flex flex-col justify-between gap-8 py-14 md:py-20 md:pr-12">
            <div>
              <p className="font-display text-[clamp(1.6rem,3vw,2.4rem)] leading-tight font-bold">{t("fork.people")}</p>
              <p className="mt-3 max-w-sm text-sumi-soft">{t("fork.peopleLine")}</p>
            </div>
            <Link href="/combinations" className="group inline-flex min-h-11 w-fit items-center gap-2 link-quiet">
              {t("hero.openArchive")} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
          <div className="ground-sumi">
            <div className="shell flex h-full flex-col justify-between gap-8 py-14 md:py-20 md:pl-12">
              <div>
                <p className="font-display text-[clamp(1.6rem,3vw,2.4rem)] leading-tight font-bold">{t("fork.agents")}</p>
                <p className="mt-3 max-w-sm text-sumi-soft">{t("fork.agentsLine")}</p>
              </div>
              <div className="space-y-4">
                <div className="flex min-w-0 items-center border border-washi/25 px-3">
                  <span aria-hidden="true" className="mr-2 font-data text-xs text-sumi-soft">$</span>
                  <CopyValue
                    value={`curl -s ${SITE.url}/skills.md`}
                    label={t("fork.skillCommand")}
                    className="min-w-0 flex-1 overflow-x-auto py-2 text-left whitespace-nowrap [scrollbar-width:none]"
                  />
                </div>
                {/* Raw API documents: plain anchors on purpose, so they load as files, not app routes. */}
                {/* eslint-disable @next/next/no-html-link-for-pages */}
                <ul className="grid gap-1.5 font-data text-xs text-sumi-soft">
                  <li><a className="link-quiet" href="/skills.md">/skills.md</a> · {t("fork.apiSkills")}</li>
                  <li><a className="link-quiet" href="/api/combinations">/api/combinations</a> · {t("fork.apiCombinations")}</li>
                  <li><a className="link-quiet" href="/api/search?q=1c4286">/api/search?q=1c4286</a> · {t("fork.apiSearch")}</li>
                </ul>
                {/* eslint-enable @next/next/no-html-link-for-pages */}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chapters: the structure of the work is its only ornament. */}
      <section aria-labelledby="chapters" className="hairline">
        <div className="shell py-24 md:py-32">
          <h2 id="chapters" className="max-w-3xl font-display text-[clamp(2rem,4.2vw,3.6rem)] leading-[1.05] font-bold">
            {t("chapters.heading")}
          </h2>
          <ol className="mt-16 grid gap-12 md:grid-cols-3 md:gap-8">
            {CHAPTERS.map((c) => (
              <li key={c.n}>
                <Link href={`/combinations?n=${c.n}`} className="group block">
                  <div className="space-y-1.5">
                    {c.sample.map((id) => (
                      <Strip key={id} palette={getPalette(id)!} className="h-10 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1" />
                    ))}
                  </div>
                  <h3 className="mt-6 flex items-baseline justify-between font-display text-2xl font-bold">
                    {tc(`chapter.${c.n}`)}
                    <span className="font-data text-xs font-normal text-sumi-soft">{c.range}</span>
                  </h3>
                  <p className="mt-1 text-sumi-soft">{t(`chapters.line${c.n}`)}</p>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* A wall of plates, on the sumi of the night band. */}
      <section aria-labelledby="selection" className="ground-sumi">
        {/* Bokashi: the washi grades into the sumi of the night band. */}
        <div aria-hidden="true" className="h-24 bg-[linear-gradient(to_bottom,var(--washi),var(--sumi))] md:h-32" />
        <div className="shell py-24 md:py-32">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 id="selection" className="max-w-2xl font-display text-[clamp(2rem,4.2vw,3.6rem)] leading-[1.05] font-bold">
              {t("selection.heading")}
            </h2>
            <Link href="/combinations" className="link-quiet inline-flex min-h-11 items-center gap-2">
              {t("selection.all")} <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-8 sm:hidden">
            {wall.map((p) => (
              <PlateTile key={p.id} palette={p} density="compact" />
            ))}
          </div>
          <div className="mt-16 hidden grid-cols-2 gap-x-8 gap-y-14 sm:grid lg:grid-cols-4">
            {wall.slice(0, 8).map((p) => (
              <PlateTile key={p.id} palette={p} />
            ))}
          </div>
        </div>
      </section>

      {/* The key block: all 159 colours in Wada's index order. */}
      <section aria-labelledby="index" className="ground-deep">
        <div className="shell py-24 md:py-32">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            <h2 id="index" className="font-display text-[clamp(2rem,4.2vw,3.6rem)] leading-[1.05] font-bold md:col-span-7">
              {t("index.heading")}
            </h2>
            <p className="self-end text-sumi-soft md:col-span-4 md:col-start-9">
              {t("index.body")}
            </p>
          </div>
          <div className="mt-14 space-y-6">
            {GROUPS.map((g, gi) => {
              const cols = COLOURS.filter((c) => c.group === gi);
              return (
                <div key={g} className="grid grid-cols-1 gap-2 md:grid-cols-[11rem_1fr] md:items-center md:gap-6">
                  <p className="text-sm text-sumi-soft">{tc(`groups.${gi as 0 | 1 | 2 | 3 | 4 | 5}`)}</p>
                  <ul className="grid grid-cols-[repeat(auto-fill,minmax(1.75rem,1fr))]">
                    {cols.map((c) => (
                      <li key={c.id} className="h-9 md:h-12">
                        <Link
                          href={`/colours/${c.id}`}
                          title={`${c.name} ${c.hex}`}
                          aria-label={`${c.name}, ${c.hex}`}
                          className="block h-full transition-[transform] duration-300 hover:-translate-y-1.5 focus-visible:-translate-y-1.5 focus-visible:outline-offset-2"
                          style={{ backgroundColor: c.hex }}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <Link href="/colours" className="mt-12 inline-flex min-h-11 items-center gap-2 link-quiet">
            {tc("nav.colours")} <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* The author. */}
      <section aria-labelledby="wada">
        <div className="shell grid grid-cols-1 gap-10 py-24 md:grid-cols-12 md:py-32">
          <h2 id="wada" className="font-display text-[clamp(2rem,4.2vw,3.6rem)] leading-[1.05] font-bold md:col-span-6">
            {t("wada.heading")}
          </h2>
          <div className="space-y-5 text-lg leading-relaxed md:col-span-5 md:col-start-8">
            <p>{t("wada.roles")}</p>
            <p>{t("wada.volumes", { n: PALETTES.length })}</p>
            <div className="flex flex-wrap gap-x-6">
              <Link href="/wada" className="link-quiet inline-flex min-h-11 items-center gap-2 text-base">
                {t("wada.life")} <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link href="/about" className="link-quiet inline-flex min-h-11 items-center gap-2 text-base">
                {t("wada.sources")} <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
