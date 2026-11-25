import type { Metadata } from "next";
import Link from "@/i18n/link";
import { notFound } from "next/navigation";
import { Crumbs } from "@/components/crumbs";
import { CopyValue } from "@/components/copy-button";
import { PlateTile } from "@/components/plate";
import { formatCmyk, formatRgb } from "@/lib/color";
import { COLOURS, GROUPS, getColour, nearestColours, palettesWithColour } from "@/lib/dictionary";

export const dynamicParams = false;

export function generateStaticParams() {
  return COLOURS.map((c) => ({ slug: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/colours/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = getColour(slug);
  if (!c) return {};
  return {
    title: `${c.name} ${c.hex.toUpperCase()}`,
    description: `${c.name} (${c.hex}, ${formatCmyk(c.cmyk)}) from Sanzo Wada's Dictionary of Color Combinations, and the ${c.combinations.length} combinations it appears in.`,
    alternates: { canonical: `/colours/${c.id}` },
  };
}

export default async function ColourPage({ params }: PageProps<"/[lang]/colours/[slug]">) {
  const { slug } = await params;
  const c = getColour(slug);
  if (!c) notFound();
  const plates = palettesWithColour(c);
  const kin = nearestColours(c.lab, 7).slice(1);
  const fg = c.ink === "ink" ? "#1f1c19" : "#f6f3ec";

  return (
    <div>
      <div className="shell">
        <Crumbs
          className="pt-6"
          items={[
            { href: "/colours", label: "Colour search" },
            { href: `/colours/${c.id}`, label: c.name },
          ]}
        />
      </div>
      <section className="shell pt-8 pb-16">
        <div className="kento flex min-h-[min(56vh,34rem)] flex-col justify-end p-6 md:p-10" style={{ backgroundColor: c.hex, color: fg }}>
          <p className="w-fit bg-washi px-2.5 py-1.5 font-data text-xs text-sumi">No. {String(c.index).padStart(3, "0")} of 159 · {GROUPS[c.group]}</p>
          <h1 className="mt-3 font-display text-[clamp(2.4rem,6vw,5rem)] leading-none font-extrabold">
            {c.name}
            {c.variant ? <span className="ml-3 align-middle font-data text-base font-normal">({c.variant})</span> : null}
          </h1>
        </div>
        <dl className="mt-8 grid grid-cols-2 gap-6 border-b border-rule pb-8 md:grid-cols-4">
          <div>
            <dt className="text-xs text-sumi-soft">HEX</dt>
            <dd><CopyValue value={c.hex} display={c.hex.toUpperCase()} label="HEX" /></dd>
          </div>
          <div>
            <dt className="text-xs text-sumi-soft">RGB</dt>
            <dd><CopyValue value={formatRgb(c.rgb)} display={c.rgb.join(" ")} label="RGB" /></dd>
          </div>
          <div>
            <dt className="text-xs text-sumi-soft">CMYK (as printed)</dt>
            <dd><CopyValue value={formatCmyk(c.cmyk)} label="CMYK" /></dd>
          </div>
          <div>
            <dt className="text-xs text-sumi-soft">CSS</dt>
            <dd><CopyValue value={`--${c.id}: ${c.hex};`} display={`--${c.id}`} label="CSS variable" /></dd>
          </div>
        </dl>
        {c.variant ? (
          <p className="mt-4 max-w-2xl text-sm text-sumi-soft">
            The book prints two different inks under this name. This is printing {c.variant}.
          </p>
        ) : null}
      </section>

      <section aria-labelledby="serves" className="shell border-t border-rule py-16 md:py-24">
        <h2 id="serves" className="font-display text-[clamp(1.8rem,3.4vw,3rem)] leading-tight font-bold">
          Serves in {plates.length} {plates.length === 1 ? "combination" : "combinations"}.
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {plates.map((p) => (
            <PlateTile key={p.id} palette={p} />
          ))}
        </div>
      </section>

      <section aria-labelledby="kin" className="ground-deep">
        <div className="shell py-16 md:py-24">
          <h2 id="kin" className="font-display text-[clamp(1.6rem,3vw,2.4rem)] leading-tight font-bold">Nearest kin</h2>
          <ul className="mt-10 grid grid-cols-3 gap-4 sm:grid-cols-6">
            {kin.map(({ colour, distance }) => (
              <li key={colour.id}>
                <Link href={`/colours/${colour.id}`} className="group block">
                  <span className="block aspect-[4/3] transition-transform group-hover:-translate-y-1" style={{ backgroundColor: colour.hex }} />
                  <span className="mt-2 block text-[0.78rem] leading-snug">{colour.name}</span>
                  <span className="block font-data text-xs text-sumi-soft">ΔE {distance.toFixed(1)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
