import Link from "next/link";
import type { Palette } from "@/lib/dictionary";

type Density = "compact" | "expanded";

/**
 * One combination pulled as a proof: flat blocks in book order, registered by
 * kentō marks, numbered with the vermilion cartouche.
 */
export function PlateTile({
  palette,
  density = "expanded",
  href = `/combinations/${palette.code}`,
  headingLevel = 3,
}: {
  palette: Palette;
  density?: Density;
  href?: string;
  headingLevel?: 2 | 3;
}) {
  const H = headingLevel === 2 ? "h2" : "h3";
  const names = palette.colors.map((c) => c.name).join(", ");
  if (density === "compact") {
    return (
      <Link
        href={href}
        className="plate-tile group block focus-visible:outline-offset-4"
        aria-label={`Combination ${palette.code}: ${names}`}
      >
        <div className="kento flex aspect-[5/3] transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:-translate-y-0.5">
          {palette.colors.map((c) => (
            <span key={c.id} className="flex-1" style={{ backgroundColor: c.hex }} />
          ))}
        </div>
        <p className="mt-3 font-data text-xs text-sumi-soft group-hover:text-sumi">{palette.code}</p>
      </Link>
    );
  }
  return (
    <article className="plate-tile group relative @container">
      <Link href={href} className="block focus-visible:outline-offset-4" aria-label={`Combination ${palette.code}: ${names}`}>
        <div className="flex gap-3">
          <span className="cartouche self-start text-[0.8rem]" aria-hidden="true">
            {palette.code}
          </span>
          <div className="kento flex aspect-[4/3] flex-1 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:-translate-y-1">
            {palette.colors.map((c) => (
              <span key={c.id} className="flex-1" style={{ backgroundColor: c.hex }} />
            ))}
          </div>
        </div>
      </Link>
      <H className="sr-only">Combination {palette.code}</H>
      <dl className="mt-5 ml-[2.35rem] grid gap-x-3 gap-y-1.5" style={{ gridTemplateColumns: `repeat(${palette.size}, minmax(0,1fr))` }}>
        {palette.colors.map((c) => (
          <div key={c.id} className="min-w-0">
            <dt
              title={c.name}
              className={`line-clamp-3 text-[0.78rem] leading-snug text-balance ${
                palette.size === 4 ? "@max-[24rem]:sr-only" : palette.size === 3 ? "@max-[17rem]:sr-only" : ""
              }`}
            >
              {c.name}
            </dt>
            <dd className="font-data-narrow text-xs text-sumi-soft uppercase">{c.hex}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

/** Bare colour strip, used in small places (related lists, maps). */
export function Strip({ palette, className = "" }: { palette: Palette; className?: string }) {
  return (
    <span className={`flex ${className}`} aria-hidden="true">
      {palette.colors.map((c) => (
        <span key={c.id} className="flex-1" style={{ backgroundColor: c.hex }} />
      ))}
    </span>
  );
}
