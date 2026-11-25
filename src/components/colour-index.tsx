import Link from "@/i18n/link";
import { getT } from "@/i18n/server";
import { COLOURS, GROUPS } from "@/lib/dictionary";
import { Koma } from "./koma";

/** All 159 colours by family, each a shogi piece (駒) linking to its page. */
export async function ColourIndex() {
  const { t } = await getT();
  return (
    <div className="space-y-14">
      {GROUPS.map((g, gi) => (
        <section key={g} aria-labelledby={`g-${gi}`}>
          <h3 id={`g-${gi}`} className="border-b border-rule pb-3 text-sm text-sumi-soft">
            {t(`groups.${gi}` as "groups.0")} <span className="font-data text-xs">· {COLOURS.filter((c) => c.group === gi).length}</span>
          </h3>
          <ul className="mt-6 grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-5 lg:grid-cols-7 2xl:grid-cols-9">
            {COLOURS.filter((c) => c.group === gi).map((c) => (
              <li key={c.id}>
                <Link href={`/colours/${c.id}`} className="group block">
                  <Koma colour={c} showEnglish={false} className="transition-transform duration-300 group-hover:-translate-y-1" />
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
