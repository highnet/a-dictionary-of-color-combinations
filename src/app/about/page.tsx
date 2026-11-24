import type { Metadata } from "next";
import Link from "next/link";
import { Crumbs } from "@/components/crumbs";

export const metadata: Metadata = {
  title: "About & sources",
  description:
    "Where Sanzo Wada's combinations come from, how this archive's data was verified against the book, and the licences behind it.",
  alternates: { canonical: "/about" },
};

const FACTS = [
  ["Author", "Sanzo Wada (1883–1967)"],
  ["Original", "Haishoku Sōkan, six volumes, 1933–34"],
  ["Reference edition", "A Dictionary of Color Combinations, Vol. 1, Seigensha (ISBN 978-4-86152-247-5)"],
  ["Combinations", "348 — 120 of two colours, 120 of three, 108 of four"],
  ["Colours", "159, in six families"],
] as const;

export default function AboutPage() {
  return (
    <div>
      <div className="shell pb-20">
        <Crumbs items={[{ href: "/about", label: "About" }]} className="pt-6" />
        <header className="grid grid-cols-1 gap-6 pt-10 pb-16 md:grid-cols-12 md:pt-16">
          <h1 className="font-display text-[clamp(2.6rem,6vw,5.2rem)] leading-[0.98] font-extrabold tracking-[-0.025em] md:col-span-7">
            Know the source.
          </h1>
          <p className="self-end text-lg leading-relaxed text-sumi-soft md:col-span-4 md:col-start-9">
            Then the colours will not deceive you.
          </p>
        </header>
        <dl className="grid border-t border-sumi md:grid-cols-2">
          {FACTS.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[9rem_1fr] gap-4 border-b border-rule py-4">
              <dt className="text-sm text-sumi-soft">{k}</dt>
              <dd className="text-[0.95rem]">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <section aria-labelledby="method" className="ground-deep">
        <div className="shell grid grid-cols-1 gap-12 py-20 md:grid-cols-12 md:py-28">
          <h2 id="method" className="font-display text-[clamp(1.8rem,3.4vw,3rem)] leading-tight font-bold md:col-span-4">
            Method
          </h2>
          <div className="space-y-4 md:col-span-7 md:col-start-6">
            <details className="group border-b border-rule pb-4" open>
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-lg">
                The data
                <span aria-hidden="true" className="font-data text-sm transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="space-y-3 pt-2 leading-relaxed text-sumi-soft">
                <p>
                  Names, CMYK and combination membership come from{" "}
                  <a className="link-quiet text-sumi" href="https://github.com/mattdesl/dictionary-of-colour-combinations">mattdesl/dictionary-of-colour-combinations</a>,
                  released under the MIT licence by Matt DesLauriers, which builds on Dain M. Blodorn Kim&rsquo;s{" "}
                  <a className="link-quiet text-sumi" href="https://github.com/dblodorn/sanzo-wada">sanzo-wada</a>.
                </p>
                <p>
                  CMYK values are those printed in the book. HEX and RGB are the dataset&rsquo;s perceptual conversion of that CMYK; screens and
                  paper differ, so treat them as close equivalents, not measurements.
                </p>
              </div>
            </details>
            <details className="group border-b border-rule pb-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-lg">
                Verification against the book
                <span aria-hidden="true" className="font-data text-sm transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="space-y-3 pt-2 leading-relaxed text-sumi-soft">
                <p>
                  All 348 combinations were checked against the Seigensha Volume 1 edition. Every combination&rsquo;s set of colours matches the
                  dataset. The dataset does not record the order of colours within a combination; that order was transcribed from the book and
                  is the order shown here.
                </p>
                <p>
                  Where the dataset misspells a name, the book&rsquo;s spelling is shown (for example Sulphur Yellow, Calamine Blue, Vernonia Purple,
                  Rosolane Purple, Kronbergs Green, Ocher Red, Pomegranate Purple). Two names, Eugenia Red and Grayish Lavender, are printed in
                  two different inks; they are kept apart as A and B.
                </p>
              </div>
            </details>
            <details className="group border-b border-rule pb-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-lg">
                What this site does not include
                <span aria-hidden="true" className="font-data text-sm transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="space-y-3 pt-2 leading-relaxed text-sumi-soft">
                <p>
                  No scans, page layouts, essays or editorial text from any edition are reproduced. Every combination is drawn independently
                  in HTML and CSS from the data. Japanese colour names added in later editions are not used.
                </p>
                <p>This is an independent project. It is not affiliated with or endorsed by Seigensha.</p>
              </div>
            </details>
            <details className="group border-b border-rule pb-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-lg">
                Your data
                <span aria-hidden="true" className="font-data text-sm transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="pt-2 leading-relaxed text-sumi-soft">
                Saved combinations and the sidebar&rsquo;s folded state are kept in your browser only. Nothing is sent anywhere.
              </p>
            </details>
          </div>
        </div>
      </section>

      <section className="shell grid grid-cols-1 gap-8 py-20 md:grid-cols-12 md:py-28">
        <p className="font-display text-[clamp(1.6rem,3vw,2.4rem)] leading-snug font-bold md:col-span-7">
          Credit the general, Sanzo Wada, whenever his orders are used.
        </p>
        <div className="flex flex-wrap items-end gap-3 md:col-span-4 md:col-start-9">
          <Link href="/combinations" className="inline-flex min-h-12 items-center bg-sumi px-6 text-washi hover:bg-ai">
            Open the archive
          </Link>
        </div>
      </section>
    </div>
  );
}
