import { PlateLink, PlateName } from "./plate-link";
import type { Palette } from "@/lib/dictionary";

type Density = "compact" | "expanded";

// One HEX code is ~4.5rem wide in the data face. Below these tile widths the
// codes can't sit one per block, so they wrap into two columns with chips.
const COLS = { 2: "grid-cols-2", 3: "grid-cols-3 @max-[16rem]:grid-cols-2", 4: "grid-cols-4 @max-[21rem]:grid-cols-2" } as const;
const CHIP = { 2: "hidden", 3: "hidden @max-[16rem]:block", 4: "hidden @max-[21rem]:block" } as const;
// Names need more room than codes; narrower tiles keep them for screen readers only.
const NAME = { 2: "", 3: "@max-[17rem]:sr-only", 4: "@max-[24rem]:sr-only" } as const;

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
      <PlateLink href={href} code={palette.code} names={names} className="plate-tile group block focus-visible:outline-offset-4">
        <div className="kento flex aspect-[5/3] transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:-translate-y-0.5">
          {palette.colors.map((c) => (
            <span key={c.id} className="flex-1" style={{ backgroundColor: c.hex }} />
          ))}
        </div>
        <p className="mt-3 font-data text-xs text-sumi-soft group-hover:text-sumi">{palette.code}</p>
      </PlateLink>
    );
  }
  return (
    <article className="plate-tile group relative @container">
      <PlateLink href={href} code={palette.code} names={names} className="block focus-visible:outline-offset-4">
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
      </PlateLink>
      <H className="sr-only">
        <PlateName code={palette.code} />
      </H>
      {/* Values sit under their blocks. When the tile is too narrow for one code per
          block, they re-flow into two columns and each code carries its own chip. */}
      <dl className={`mt-5 ml-[2.35rem] grid gap-x-3 gap-y-1.5 ${COLS[palette.size]}`}>
        {palette.colors.map((c) => (
          <div key={c.id} className="min-w-0">
            <dt
              title={c.name}
              className={`line-clamp-3 text-[0.78rem] leading-snug text-balance ${NAME[palette.size]}`}
            >
              {c.name}
            </dt>
            <dd className="flex items-center gap-1.5 font-data text-xs whitespace-nowrap text-sumi-soft uppercase">
              <span aria-hidden="true" className={`size-2.5 shrink-0 ${CHIP[palette.size]}`} style={{ backgroundColor: c.hex }} />
              {c.hex}
            </dd>
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
