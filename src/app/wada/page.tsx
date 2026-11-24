import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Crumbs } from "@/components/crumbs";
import { JsonLd } from "@/components/json-ld";
import { Strip } from "@/components/plate";
import { getPalette } from "@/lib/dictionary";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sanzo Wada",
  description:
    "Sanzo Wada (1883–1967): painter, colour researcher and Academy Award-winning costume designer, who compiled the combinations in A Dictionary of Color Combinations.",
  alternates: { canonical: "/wada" },
};

/** Dated events, written for this page from the sources listed below. */
const LIFE: { year: string; text: string }[] = [
  { year: "1883", text: "Born on 3 March in Ikuno, Hyōgo Prefecture." },
  { year: "1896", text: "The family moves to Fukuoka." },
  { year: "1899", text: "Moves to Tokyo to become a painter and begins study under Kuroda Seiki." },
  { year: "1904", text: "Graduates from the Tokyo School of Fine Arts, today Tokyo University of the Arts." },
  { year: "1907", text: "Paints South Wind, now in the National Museum of Modern Art, Tokyo. Leaves for Europe on a Ministry of Education scholarship." },
  { year: "1907–15", text: "Studies Western painting and design, mainly in France." },
  { year: "1927", text: "Founds the Japan Standard Color Association." },
  { year: "1932–44", text: "Professor of design at the Tokyo School of Fine Arts." },
  { year: "1933–34", text: "Publishes Haishoku Sōkan, his colour combinations, in six volumes." },
  { year: "1936", text: "Designs the poster for the 1940 Tokyo Olympic Games, which were later cancelled." },
  { year: "1945", text: "Reorganises the association as the Japan Color Research Institute and leads it." },
  { year: "1951", text: "Completes Color Standards, Japan's first comprehensive standard colour chart." },
  { year: "1953", text: "Directs colour and costume for Daiei's Gate of Hell, which wins the Palme d'Or at Cannes in 1954." },
  { year: "1955", text: "Receives the Academy Award for Best Costume Design (Color) for Gate of Hell, at the 27th Academy Awards." },
  { year: "1958", text: "Named a Person of Cultural Merit." },
  { year: "1967", text: "Dies in Tokyo on 22 August, aged 84." },
  { year: "2011", text: "Seigensha publishes A Dictionary of Color Combinations, presenting 348 combinations from the work." },
];

const SOURCES = [
  { href: "https://en.wikipedia.org/wiki/Sanzo_Wada", label: "“Sanzo Wada”, Wikipedia (CC BY-SA 4.0), read November 2026" },
  { href: "https://www.momat.go.jp/en/", label: "National Museum of Modern Art, Tokyo: South Wind (1907)" },
];

export default function WadaPage() {
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
          birthPlace: "Ikuno, Hyōgo, Japan",
          deathPlace: "Tokyo, Japan",
          jobTitle: "Painter, colour researcher, costume designer",
          award: ["Academy Award for Best Costume Design (Color), 1955", "Person of Cultural Merit, 1958"],
          sameAs: ["https://en.wikipedia.org/wiki/Sanzo_Wada"],
          url: `${SITE.url}/wada`,
        }}
      />
      <div className="shell">
        <Crumbs items={[{ href: "/wada", label: "Sanzo Wada" }]} className="pt-6" />
        <header className="grid grid-cols-1 gap-8 pt-10 pb-16 md:grid-cols-12 md:pt-16 md:pb-24">
          <div className="md:col-span-8">
            <h1 className="font-display text-[clamp(3rem,8vw,7rem)] leading-[0.95] font-extrabold tracking-[-0.03em]">Sanzo Wada</h1>
            <p className="mt-4 font-display text-2xl text-sumi-soft" lang="ja">
              和田三造 <span className="font-data text-base">1883–1967</span>
            </p>
          </div>
          <p className="self-end text-lg leading-relaxed md:col-span-4">
            Painter. Teacher. Costume designer. A general of colour, who mapped its ground before anyone asked him to.
          </p>
        </header>
      </div>

      {/* Three fields of work. */}
      <section aria-labelledby="work" className="ground-sumi">
        <div className="shell py-20 md:py-28">
          <h2 id="work" className="sr-only">His work</h2>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-10">
            {/* Decorative strips only: these combinations illustrate, they are not tied to the events. */}
            {[
              {
                title: "The painter",
                text: "Trained in Western oil painting under Kuroda Seiki, he made his name young with South Wind (1907), then spent eight years in Europe.",
                plate: 22,
              },
              {
                title: "The researcher",
                text: "He founded the Japan Standard Color Association in 1927, led its successor institute from 1945, and set down Japan's first standard colour chart in 1951.",
                plate: 295,
              },
              {
                title: "The designer",
                text: "Posters, costume and film. His colour and costume for Gate of Hell won an Academy Award, and the film took the Palme d'Or.",
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
          A life, set down in order.
        </h2>
        <ol className="mt-12 border-t border-sumi">
          {LIFE.map((e) => (
            <li key={e.year} className="grid grid-cols-[5.5rem_1fr] items-baseline gap-4 border-b border-rule py-4 md:grid-cols-[9rem_1fr] md:gap-8">
              <span className="font-data text-sm">{e.year}</span>
              <span className="leading-relaxed">{e.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="dictionary" className="ground-deep">
        <div className="shell grid grid-cols-1 gap-8 py-20 md:grid-cols-12 md:py-28">
          <h2 id="dictionary" className="font-display text-[clamp(1.8rem,3.4vw,3rem)] leading-tight font-bold md:col-span-6">
            The orders he left behind.
          </h2>
          <div className="space-y-5 text-lg leading-relaxed md:col-span-5 md:col-start-8">
            <p>
              <i>Haishoku Sōkan</i> set Japanese colour sense down in combinations, plate by plate. A century later designers still work
              from them.
            </p>
            <Link href="/combinations" className="inline-flex min-h-12 items-center gap-2 bg-sumi px-6 text-base text-washi hover:bg-sumi-soft">
              Open the archive <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="sources" className="shell py-16">
        <h2 id="sources" className="text-sm text-sumi-soft">Sources</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {SOURCES.map((s) => (
            <li key={s.href}>
              <a className="link-quiet" href={s.href}>
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm">A Dictionary of Color Combinations, Vol. 1, Seigensha (ISBN 978-4-86152-247-5).</p>
        <p className="mt-4 max-w-2xl text-sm text-sumi-soft">
          Facts are summarised in our own words. The 1927 founding of the Japan Standard Color Association is also recorded in the
          Seigensha edition&rsquo;s introduction.
        </p>
      </section>
    </div>
  );
}
