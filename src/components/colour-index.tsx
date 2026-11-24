import Link from "next/link";
import { COLOURS, GROUPS } from "@/lib/dictionary";

/** All 159 colours by family, each linking to its page. */
export function ColourIndex() {
  return (
    <div className="space-y-14">
      {GROUPS.map((g, gi) => (
        <section key={g} aria-labelledby={`g-${gi}`}>
          <h3 id={`g-${gi}`} className="border-b border-rule pb-3 text-sm text-sumi-soft">
            {g} <span className="font-data text-xs">· {COLOURS.filter((c) => c.group === gi).length}</span>
          </h3>
          <ul className="mt-6 grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-5 lg:grid-cols-7 2xl:grid-cols-9">
            {COLOURS.filter((c) => c.group === gi).map((c) => (
              <li key={c.id}>
                <Link href={`/colours/${c.id}`} className="group block">
                  <span className="block aspect-[4/3] transition-transform duration-300 group-hover:-translate-y-1" style={{ backgroundColor: c.hex }} />
                  <span className="mt-2 block text-[0.78rem] leading-snug">{c.name}{c.variant ? ` (${c.variant})` : ""}</span>
                  <span className="block font-data text-xs text-sumi-soft uppercase">{c.hex}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
