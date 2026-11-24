import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WaveHero, type WavePlate } from "@/components/wave/wave-hero";
import { QuickFind } from "@/components/quick-find";
import { PlateTile, Strip } from "@/components/plate";
import { JsonLd } from "@/components/json-ld";
import { COLOURS, FEATURED, GROUPS, PALETTES, getPalette } from "@/lib/dictionary";
import { SITE } from "@/lib/site";

const CHAPTERS = [
  { n: 2, title: "Two colours", line: "Two colours: a statement.", range: "001–120", sample: [2, 22, 62] },
  { n: 3, title: "Three colours", line: "Three: a position held.", range: "121–240", sample: [154, 151, 240] },
  { n: 4, title: "Four colours", line: "Four: an order of battle.", range: "241–348", sample: [295, 313, 289] },
] as const;

export default function Home() {
  const plates: WavePlate[] = FEATURED.map((id) => {
    const p = getPalette(id)!;
    return { code: p.code, colors: p.colors.map((c) => ({ name: c.name, hex: c.hex })) };
  });
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
      <section className="shell grid gap-8 pt-0 pb-14 lg:min-h-dvh lg:grid-cols-12 lg:gap-12 lg:py-14">
        <div className="@container flex flex-col justify-between gap-10 lg:col-span-5">
          <div>
            <p className="font-data text-xs text-sumi-soft">1933–34 · 348 combinations · 159 colours</p>
            <h1 className="mt-6 font-display text-[clamp(2.5rem,14cqi,6rem)] leading-[0.98] font-extrabold tracking-[-0.03em]">
              A Dictionary of Color Combinations
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed">
              Compiled by Sanzo Wada. Every combination, in his order, ready to take into the field.
            </p>
          </div>
          <div className="max-w-md space-y-6">
            <QuickFind />
            <Link
              href="/combinations"
              className="group inline-flex min-h-12 items-center gap-3 bg-sumi px-6 text-washi transition-colors hover:bg-ai"
            >
              Open the archive
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="order-first -mx-[var(--gutter)] h-[min(46svh,26rem)] lg:order-none lg:col-span-7 lg:mx-0 lg:h-auto">
          <WaveHero plates={plates} />
        </div>
      </section>

      {/* Chapters: the structure of the work is its only ornament. */}
      <section aria-labelledby="chapters" className="hairline">
        <div className="shell py-24 md:py-32">
          <h2 id="chapters" className="max-w-3xl font-display text-[clamp(2rem,4.2vw,3.6rem)] leading-[1.05] font-bold">
            Know the number of colours, and you know the shape of the battle.
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
                    {c.title}
                    <span className="font-data text-xs font-normal text-sumi-soft">{c.range}</span>
                  </h3>
                  <p className="mt-1 text-sumi-soft">{c.line}</p>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* A wall of plates, on the indigo of the night prints. */}
      <section aria-labelledby="selection" className="ground-ai">
        <div className="shell py-24 md:py-32">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 id="selection" className="max-w-2xl font-display text-[clamp(2rem,4.2vw,3.6rem)] leading-[1.05] font-bold">
              Study the strongest orders first.
            </h2>
            <Link href="/combinations" className="link-quiet inline-flex min-h-11 items-center gap-2">
              All 348 <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {wall.slice(0, 8).map((p) => (
              <PlateTile key={p.id} palette={p} />
            ))}
          </div>
        </div>
      </section>

      {/* The key block: all 159 colours in Wada's index order. */}
      <section aria-labelledby="index" className="ground-deep">
        <div className="shell py-24 md:py-32">
          <div className="grid gap-8 md:grid-cols-12">
            <h2 id="index" className="font-display text-[clamp(2rem,4.2vw,3.6rem)] leading-[1.05] font-bold md:col-span-7">
              Know every colour, and no combination will surprise you.
            </h2>
            <p className="self-end text-sumi-soft md:col-span-4 md:col-start-9">
              159 colours in six families. Choose one to see every combination it serves.
            </p>
          </div>
          <div className="mt-14 space-y-6">
            {GROUPS.map((g, gi) => {
              const cols = COLOURS.filter((c) => c.group === gi);
              return (
                <div key={g} className="grid gap-2 md:grid-cols-[11rem_1fr] md:items-center md:gap-6">
                  <p className="text-sm text-sumi-soft">{g}</p>
                  <ul className="flex h-16 md:h-20">
                    {cols.map((c) => (
                      <li key={c.id} className="min-w-0 flex-1">
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
            Colour search <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* The author. */}
      <section aria-labelledby="wada">
        <div className="shell grid gap-10 py-24 md:grid-cols-12 md:py-32">
          <h2 id="wada" className="font-display text-[clamp(2rem,4.2vw,3.6rem)] leading-[1.05] font-bold md:col-span-6">
            Sanzo Wada, 1883–1967.
          </h2>
          <div className="space-y-5 text-lg leading-relaxed md:col-span-5 md:col-start-8">
            <p>Painter. Costume designer. Teacher. Founder of the Japan Standard Color Association, 1927.</p>
            <p>He set down these {PALETTES.length} combinations in six volumes, 1933–34. They are still in service.</p>
            <Link href="/about" className="link-quiet inline-flex min-h-11 items-center gap-2 text-base">
              Sources &amp; method <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
