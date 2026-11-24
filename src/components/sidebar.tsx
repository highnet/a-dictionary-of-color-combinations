import Link from "next/link";
import { Compass, Grid3x3, Info, PanelLeftClose, Pipette } from "lucide-react";
import { LogoMark } from "./logo";
import { NavLink } from "./nav-link";
import { SidebarToggle } from "./sidebar-toggle";
import { SavedCount } from "./saved-count";
import { NAV } from "@/lib/site";

const ICONS = { compass: Compass, grid: Grid3x3, pipette: Pipette, info: Info } as const;

const CHAPTERS = [
  { n: 2, label: "Two colours", range: "001–120" },
  { n: 3, label: "Three colours", range: "121–240" },
  { n: 4, label: "Four colours", range: "241–348" },
];

/** Desktop sidebar. Collapses to a rail; state lives on <html data-sidebar>. */
export function Sidebar() {
  return (
    <aside id="sidebar" className="sticky top-0 hidden h-dvh flex-col border-r border-rule lg:flex">
      <div className="flex h-16 items-center gap-3 px-3.5">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Home — A Dictionary of Color Combinations">
          <LogoMark className="size-9 shrink-0" />
          <span className="sb-label font-display text-[0.95rem] leading-tight font-semibold">
            A Dictionary of
            <br />
            Color Combinations
          </span>
        </Link>
      </div>

      <nav aria-label="Primary" className="mt-6 flex flex-col">
        {NAV.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <NavLink key={item.href} href={item.href} label={item.label}>
              <Icon className="size-[1.15rem] shrink-0" strokeWidth={1.5} aria-hidden="true" />
            </NavLink>
          );
        })}
      </nav>

      <div className="sb-hide mt-10 px-5">
        <p className="text-xs tracking-wide text-sumi-soft">Chapters</p>
        <ul className="mt-3 space-y-2.5">
          {CHAPTERS.map((c) => (
            <li key={c.n}>
              <Link
                href={`/combinations?n=${c.n}`}
                className="group flex items-baseline justify-between gap-3 text-sm"
              >
                <span className="link-quiet">{c.label}</span>
                <span className="font-data text-xs text-sumi-soft">{c.range}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto flex flex-col gap-1 border-t border-rule p-2">
        <SavedCount />
        <SidebarToggle>
          <PanelLeftClose className="sb-collapse-icon size-[1.15rem] shrink-0 transition-transform" strokeWidth={1.5} aria-hidden="true" />
        </SidebarToggle>
      </div>
    </aside>
  );
}
