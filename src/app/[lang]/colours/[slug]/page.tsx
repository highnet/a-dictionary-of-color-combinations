import type { Metadata } from "next";
import Link from "@/i18n/link";
import { notFound } from "next/navigation";
import { alternates } from "@/i18n/config";
import { getT } from "@/i18n/server";
import { Crumbs } from "@/components/crumbs";
import { CopyValue } from "@/components/copy-button";
import { PlateTile } from "@/components/plate";
import { JaName, Koma } from "@/components/koma";
import { plateNameJa, plateNameSource } from "@/lib/plate-names";
import { formatCmyk, formatRgb } from "@/lib/color";
import { COLOURS, getColour, nearestColours, palettesWithColour } from "@/lib/dictionary";

export const dynamicParams = false;

export function generateStaticParams() {
  return COLOURS.map((c) => ({ slug: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/colours/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = getColour(slug);
  if (!c) return {};
  const { t, lang } = await getT("colours");
  return {
    title: t("detail.metaTitle", { name: c.name, hex: c.hex.toUpperCase() }),
    description: t("detail.metaDescription", { name: c.name, hex: c.hex, cmyk: formatCmyk(c.cmyk), n: c.combinations.length }),
    alternates: alternates(`/colours/${c.id}`, lang),
  };
}

export default async function ColourPage({ params }: PageProps<"/[lang]/colours/[slug]">) {
  const { slug } = await params;
  const c = getColour(slug);
  if (!c) notFound();
  const { t } = await getT("colours");
  const { t: tc } = await getT();
  const plates = palettesWithColour(c);
  const kin = nearestColours(c.lab, 7).slice(1);
  const fg = c.ink === "ink" ? "#1f1c19" : "#f6f3ec";
  const ja = plateNameJa(c.id);

  return (
    <div>
      <div className="shell">
        <Crumbs
          className="pt-6"
          items={[
            { href: "/colours", label: t("title") },
            { href: `/colours/${c.id}`, label: c.name },
          ]}
        />
      </div>
      <section className="shell pt-8 pb-16">
        <div className="kento relative flex min-h-[min(56vh,34rem)] flex-col justify-end p-6 md:p-10" style={{ backgroundColor: c.hex, color: fg }}>
          {/* The colour as a shogi piece, its plate name in ink. */}
          <Koma colour={c} size="lg" showEnglish={false} className="absolute top-6 right-6 hidden sm:inline-block md:top-10 md:right-10" />
          <p className="w-fit bg-washi px-2.5 py-1.5 font-data text-xs text-sumi">{t("detail.number", { no: String(c.index).padStart(3, "0"), group: tc(`groups.${c.group}` as "groups.0") })}</p>
          <h1 className="mt-3 font-display text-[clamp(2.4rem,6vw,5rem)] leading-none font-extrabold">
            {c.name}
            {c.variant ? <span className="ml-3 align-middle font-data text-base font-normal">({c.variant})</span> : null}
          </h1>
        </div>
        {ja ? (
          <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-rule pb-6">
            <p className="text-xs text-sumi-soft">{t("detail.jaName")}</p>
            <p className="font-display text-3xl leading-[1.6] font-bold">
              <JaName colourId={c.id} />
            </p>
            <p className="text-sm text-sumi-soft">
              {t("detail.jaSource", { plate: ja.plate, volume: ja.volume })}{" "}
              <a className="link-quiet text-sumi" href={plateNameSource(ja)}>
                {t("detail.jaSourceLink")}
              </a>
            </p>
          </div>
        ) : null}
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
            <dt className="text-xs text-sumi-soft">{t("detail.cmyk")}</dt>
            <dd><CopyValue value={formatCmyk(c.cmyk)} label="CMYK" /></dd>
          </div>
          <div>
            <dt className="text-xs text-sumi-soft">CSS</dt>
            <dd><CopyValue value={`--${c.id}: ${c.hex};`} display={`--${c.id}`} label={t("detail.cssVariable")} /></dd>
          </div>
        </dl>
        {c.variant ? (
          <p className="mt-4 max-w-2xl text-sm text-sumi-soft">
            {t("detail.variant", { variant: c.variant })}
          </p>
        ) : null}
      </section>

      <section aria-labelledby="serves" className="shell border-t border-rule py-16 md:py-24">
        <h2 id="serves" className="font-display text-[clamp(1.8rem,3.4vw,3rem)] leading-tight font-bold">
          {t("detail.serves", { count: plates.length })}
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {plates.map((p) => (
            <PlateTile key={p.id} palette={p} />
          ))}
        </div>
      </section>

      <section aria-labelledby="kin" className="ground-deep">
        <div className="shell py-16 md:py-24">
          <h2 id="kin" className="font-display text-[clamp(1.6rem,3vw,2.4rem)] leading-tight font-bold">{t("detail.kin")}</h2>
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
