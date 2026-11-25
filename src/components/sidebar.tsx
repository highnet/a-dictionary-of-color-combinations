import Link from "@/i18n/link";
import { Bot, Brush, Compass, Grid3x3, Info, PanelLeftClose, Search } from "lucide-react";
import { LogoMark } from "./logo";
import { NavLink } from "./nav-link";
import { SidebarToggle } from "./sidebar-toggle";
import { SavedCount } from "./saved-count";
import { EyedropperToggle } from "./eyedropper";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitch } from "./language-switch";
import { NAV } from "@/lib/site";
import { getT } from "@/i18n/server";

const ICONS = { compass: Compass, grid: Grid3x3, pipette: Search, info: Info, bot: Bot, brush: Brush } as const;

const CHAPTERS = [
  { n: 2, range: "001–120" },
  { n: 3, range: "121–240" },
  { n: 4, range: "241–348" },
] as const;

/** Desktop sidebar. Collapses to a rail; state lives on <html data-sidebar>. */
export async function Sidebar() {
  const { t } = await getT();
  return (
    <aside id="sidebar" className="sticky top-0 hidden h-dvh flex-col overflow-x-hidden overflow-y-auto overscroll-contain border-r border-rule lg:flex">
      <div className="flex h-16 items-center gap-3 px-3.5">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label={t("site.homeLabel")}>
          <LogoMark className="size-9 shrink-0" />
          <span className="sb-label font-display text-[0.95rem] leading-tight font-semibold">
            {t("site.titleLine1")}
            <br />
            {t("site.titleLine2")}
          </span>
        </Link>
      </div>

      <nav aria-label={t("nav.primary")} className="sb-nav mt-6 flex flex-col">
        {NAV.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <NavLink key={item.href} href={item.href} label={t(`nav.${item.key}`)}>
              <Icon className="size-[1.15rem] shrink-0" strokeWidth={1.5} aria-hidden="true" />
            </NavLink>
          );
        })}
      </nav>

      <div className="sb-hide sb-chapters mt-10 px-5">
        <p className="text-xs tracking-wide text-sumi-soft">{t("shell.chapters")}</p>
        <ul className="mt-3 space-y-2.5">
          {CHAPTERS.map((c) => (
            <li key={c.n}>
              <Link href={`/combinations?n=${c.n}`} className="group flex items-baseline justify-between gap-3 text-sm">
                <span className="link-quiet">{t(`chapter.${c.n}`)}</span>
                <span className="font-data text-xs text-sumi-soft">{c.range}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="sb-tools mt-auto flex flex-col gap-0.5 border-t border-rule p-2 pt-3">
        <EyedropperToggle />
        <ThemeToggle />
        <LanguageSwitch />
        <SavedCount />
        <SidebarToggle>
          <PanelLeftClose className="sb-collapse-icon size-[1.15rem] shrink-0 transition-transform" strokeWidth={1.5} aria-hidden="true" />
        </SidebarToggle>
      </div>
    </aside>
  );
}
