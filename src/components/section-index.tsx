"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/client";

/** Sticky in-page index. The current section is marked by a sumi tick. */
export function SectionIndex({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id);
  const { t } = useTranslation("plate");
  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);
  return (
    <nav aria-label={t("sections.label")} className="overflow-x-auto">
      <ol className="flex gap-6 whitespace-nowrap lg:flex-col lg:gap-1">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              aria-current={active === s.id ? "location" : undefined}
              className="group flex min-h-10 items-center gap-3 text-sm"
            >
              <span
                aria-hidden="true"
                className={`h-px bg-current transition-all duration-300 ${active === s.id ? "w-6" : "w-2 opacity-40"}`}
              />
              <span className={active === s.id ? "" : "text-sumi-soft group-hover:text-sumi"}>{s.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
