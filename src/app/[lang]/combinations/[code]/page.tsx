import type { Metadata } from "next";
import Link from "@/i18n/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Columns3 } from "lucide-react";
import { Crumbs } from "@/components/crumbs";
import { CopyValue } from "@/components/copy-button";
import { ExportPanel } from "@/components/export-panel";
import { JsonLd } from "@/components/json-ld";
import { PlateTile } from "@/components/plate";
import { Proportions } from "@/components/proportions";
import { Cite, Kanji, MlaText } from "@/components/mla";
import { plateCitation } from "@/lib/citations";
import { SaveButton } from "@/components/save-button";
import { SectionIndex } from "@/components/section-index";
import { formatCmyk, formatRgb } from "@/lib/color";
import { PALETTES, getPalette, getPaletteByCode, relatedPalettes } from "@/lib/dictionary";
import { SITE } from "@/lib/site";
import { alternates, localize } from "@/i18n/config";
import { getT } from "@/i18n/server";
import { rich } from "@/i18n/rich";

export const dynamicParams = false;

export function generateStaticParams() {
  return PALETTES.map((p) => ({ code: p.code }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/combinations/[code]">): Promise<Metadata> {
  const { code } = await params;
  const p = getPaletteByCode(code);
  if (!p) return {};
  const { t, lang } = await getT("plate");
  const names = p.colors.map((c) => c.name).join(", ");
  const title = t("meta.title", { code: p.code, names });
  const list = p.colors.map((c) => `${c.name} ${c.hex}`).join(", ");
  return {
    title,
    description: t("meta.description", { code: p.code, list }),
    alternates: alternates(`/combinations/${p.code}`, lang),
    openGraph: { url: localize(`/combinations/${p.code}`, lang), title },
  };
}

const SECTIONS = ["plate", "values", "proportion", "export", "allies"] as const;

export default async function CombinationPage({ params }: PageProps<"/[lang]/combinations/[code]">) {
  const { code } = await params;
  const p = getPaletteByCode(code);
  if (!p) notFound();
  const prev = getPalette(p.id === 1 ? PALETTES.length : p.id - 1)!;
  const next = getPalette(p.id === PALETTES.length ? 1 : p.id + 1)!;
  const related = relatedPalettes(p, 9);
  const { t, href } = await getT("plate");
  const { t: tc } = await getT();
  const chapter = tc(`chapter.${p.size}`);
  const sections = SECTIONS.map((id) => ({ id, label: t(`sections.${id}`) }));

  return (
    <article>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: t("jsonld.name", { code: p.code }),
          creator: { "@type": "Person", name: t("jsonld.creator") },
          isPartOf: { "@type": "Book", name: tc("site.name") },
          url: `${SITE.url}${href(`/combinations/${p.code}`)}`,
          keywords: p.colors.map((c) => c.name).join(", "),
        }}
      />
      <div className="shell">
        <Crumbs
          className="pt-6"
          items={[
            { href: "/combinations", label: tc("nav.combinations") },
            { href: `/combinations?n=${p.size}`, label: chapter },
            { href: `/combinations/${p.code}`, label: t("code", { code: p.code }) },
          ]}
        />
      </div>

      {/* The plate: full strength, full width. */}
      <section id="plate" aria-labelledby="plate-title" className="shell pt-8 pb-16 md:pt-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h1 id="plate-title" className="flex items-end gap-5">
            <span className="cartouche text-3xl md:text-4xl">{p.code}</span>
            <span className="pb-1">
              <span className="block font-display text-[clamp(1.6rem,3vw,2.6rem)] leading-tight font-bold">
                {p.colors.map((c) => c.name).join(" · ")}
              </span>
              <span className="text-sm text-sumi-soft">{t("subtitle", { chapter, id: p.id })}</span>
            </span>
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <SaveButton id={p.id} code={p.code} />
            <Link
              href={`/compare?ids=${p.id}`}
              className="inline-flex min-h-11 items-center gap-2.5 border border-current/30 px-4 text-sm hover:border-current"
            >
              <Columns3 className="size-4" strokeWidth={1.6} aria-hidden="true" />
              {tc("nav.compare")}
            </Link>
          </div>
        </div>

        <div className="kento mt-10 flex h-[min(62vh,40rem)] min-h-[22rem] flex-col sm:flex-row">
          {p.colors.map((c) => (
            <div key={c.id} className="flex flex-1 items-end p-3 md:p-5" style={{ backgroundColor: c.hex }}>
              <p className="bg-washi px-3 py-2 text-sumi shadow-[0_1px_2px_rgb(0_0_0/0.12)]">
                <span className="block font-display text-base leading-tight font-semibold md:text-lg">{c.name}</span>
                <span className="block font-data text-xs uppercase">{c.hex}</span>
              </p>
            </div>
          ))}
        </div>

        <nav aria-label={t("neighbours")} className="mt-10 flex items-center justify-between gap-4 text-sm">
          <Link href={`/combinations/${prev.code}`} className="group inline-flex min-h-11 items-center gap-3" rel="prev">
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            <span className="font-data">{prev.code}</span>
            <span className="hidden h-3 w-16 sm:flex" aria-hidden="true">
              {prev.colors.map((c) => <span key={c.id} className="flex-1" style={{ backgroundColor: c.hex }} />)}
            </span>
          </Link>
          <Link href={`/combinations/${next.code}`} className="group inline-flex min-h-11 items-center gap-3" rel="next">
            <span className="hidden h-3 w-16 sm:flex" aria-hidden="true">
              {next.colors.map((c) => <span key={c.id} className="flex-1" style={{ backgroundColor: c.hex }} />)}
            </span>
            <span className="font-data">{next.code}</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </nav>
      </section>

      <div className="shell grid grid-cols-1 gap-x-12 border-t border-rule lg:grid-cols-[11rem_minmax(0,1fr)]">
        <aside className="sticky top-[var(--topbar-h)] z-20 -mx-[var(--gutter)] border-b border-rule bg-washi/95 px-[var(--gutter)] py-2 backdrop-blur-[2px] lg:top-0 lg:mx-0 lg:self-start lg:border-0 lg:bg-transparent lg:px-0 lg:py-16">
          <SectionIndex sections={sections} />
        </aside>

        <div className="min-w-0">
          <section id="values" aria-labelledby="values-title" className="py-16 md:py-24">
            <h2 id="values-title" className="font-display text-[clamp(1.8rem,3.4vw,3rem)] leading-tight font-bold">
              {t("values.title")}
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-sumi-soft">
              {t("values.note")}
            </p>
            <div className="mt-10 overflow-x-auto">
              <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-sumi text-xs text-sumi-soft">
                    <th scope="col" className="w-14 py-3 font-normal"><span className="sr-only">{t("values.swatch")}</span></th>
                    <th scope="col" className="py-3 pr-6 font-normal">{t("values.colour")}</th>
                    <th scope="col" className="py-3 pr-6 font-normal">HEX</th>
                    <th scope="col" className="py-3 pr-6 font-normal">RGB</th>
                    <th scope="col" className="py-3 pr-6 font-normal">CMYK</th>
                    <th scope="col" className="py-3 text-right font-normal">{t("values.usedIn")}</th>
                  </tr>
                </thead>
                <tbody>
                  {p.colors.map((c) => (
                    <tr key={c.id} className="border-b border-rule">
                      <td className="w-14 py-3"><span className="block size-10 shrink-0" style={{ backgroundColor: c.hex }} /></td>
                      <th scope="row" className="py-3 pr-6 font-normal">
                        <Link href={`/colours/${c.id}`} className="link-quiet text-[0.95rem]">{c.name}</Link>
                      </th>
                      <td className="py-1 pr-6 whitespace-nowrap"><CopyValue value={c.hex} display={c.hex.toUpperCase()} label={t("values.copyLabel", { name: c.name, format: "HEX" })} /></td>
                      <td className="py-1 pr-6 whitespace-nowrap"><CopyValue value={formatRgb(c.rgb)} display={c.rgb.join(" ")} label={t("values.copyLabel", { name: c.name, format: "RGB" })} /></td>
                      <td className="py-1 pr-6 whitespace-nowrap"><CopyValue value={formatCmyk(c.cmyk)} label={t("values.copyLabel", { name: c.name, format: "CMYK" })} /></td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <Link href={`/colours/${c.id}`} className="link-quiet inline-block py-2 font-data text-xs">{t("values.usedCount", { n: c.combinations.length })}</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="proportion" aria-labelledby="proportion-title" className="border-t border-rule py-16 md:py-24">
            <h2 id="proportion-title" className="font-display text-[clamp(1.8rem,3.4vw,3rem)] leading-tight font-bold">
              {t("proportion.title")}
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-sumi-soft">
              <Kanji className="mr-2">色量</Kanji>
              {rich(t("proportion.body"), { cite: (_, k) => <Cite key={k} work="gaisetsu" page={28} /> })}
            </p>
            <div className="mt-10">
              <Proportions colors={p.colors.map(({ id, name, hex }) => ({ id, name, hex }))} />
            </div>
          </section>

          <section id="export" aria-labelledby="export-title" className="border-t border-rule py-16 md:py-24">
            <h2 id="export-title" className="font-display text-[clamp(1.8rem,3.4vw,3rem)] leading-tight font-bold">
              {t("export.title")}
            </h2>
            <div className="mt-10">
              <ExportPanel id={p.id} />
            </div>
          </section>

          <section id="cite" aria-labelledby="cite-title" className="border-t border-rule py-16 md:py-24">
            <h2 id="cite-title" className="font-display text-[clamp(1.8rem,3.4vw,3rem)] leading-tight font-bold">
              {t("cite.title")} <Kanji className="ml-2 text-[0.5em]">出典</Kanji>
            </h2>
            <p className="mt-3 text-sm text-sumi-soft">{tc("cite.mla")}</p>
            <div className="mt-6 flex flex-wrap items-start gap-x-6 gap-y-2">
              <p lang="en" className="max-w-2xl pl-8 -indent-8 text-[0.95rem] leading-relaxed">
                <MlaText text={plateCitation(p.code)} />
              </p>
              <CopyValue value={plateCitation(p.code).replace(/\*/g, "")} display={tc("copy.action")} label={t("cite.copyLabel")} />
            </div>
          </section>

          <section id="allies" aria-labelledby="allies-title" className="border-t border-rule py-16 md:py-24">
            <h2 id="allies-title" className="font-display text-[clamp(1.8rem,3.4vw,3rem)] leading-tight font-bold">
              {t("allies.title")}
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
              {related.map((r) => (
                <PlateTile key={r.id} palette={r} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </article>
  );
}
