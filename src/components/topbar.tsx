"use client";

import Link from "@/i18n/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LogoMark } from "./logo";
import { NavLink } from "./nav-link";
import { NAV } from "@/lib/site";
import { useFavourites } from "@/lib/favourites";
import { EyedropperIconToggle } from "./eyedropper";
import { LanguageIconSwitch } from "./language-switch";
import { useTranslation } from "@/i18n/client";
import { ThemeIconToggle } from "./theme-toggle";

/** Mobile/tablet bar with a hamburger drawer. Hidden on desktop. */
export function Topbar() {
  const [open, setOpen] = useState(false);
  const { ids } = useFavourites();
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-40 flex h-[var(--topbar-h)] items-center justify-between border-b border-rule bg-washi/95 px-[var(--gutter)] backdrop-blur-[2px] lg:hidden">
      <Link href="/" className="flex items-center gap-2.5" aria-label={t("site.homeLabel")}>
        <LogoMark className="size-8" />
        <span className="font-display text-[0.95rem] font-semibold">{t("site.short")}</span>
      </Link>
      <div className="flex items-center">
      <LanguageIconSwitch />
      <ThemeIconToggle />
      <EyedropperIconToggle />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className="-mr-2 grid size-11 place-items-center"
          aria-label={t("shell.openMenu")}
        >
          <Menu className="size-6" strokeWidth={1.5} aria-hidden="true" />
        </SheetTrigger>
        <SheetContent side="right" className="w-full max-w-none border-l-0 px-[var(--gutter)] pt-16 pb-8 sm:max-w-md sm:border-l">
          <SheetTitle className="sr-only">{t("shell.menu")}</SheetTitle>
          <nav aria-label={t("nav.primary")} className="flex flex-col">
            <NavLink href="/" label={t("nav.home")} size="drawer" onNavigate={() => setOpen(false)} />
            {NAV.map((item) => (
              <NavLink key={item.href} href={item.href} label={t(`nav.${item.key}`)} size="drawer" onNavigate={() => setOpen(false)} />
            ))}
          </nav>
          <div className="mt-8 grid grid-cols-3 gap-2 text-sm">
            {[2, 3, 4].map((n) => (
              <SheetClose key={n} render={<Link href={`/combinations?n=${n}`} />} className="border border-rule px-3 py-3 text-center">
                {t("shell.nColours", { count: n })}
              </SheetClose>
            ))}
          </div>
          <SheetClose render={<Link href="/combinations?saved=1" />} className="mt-auto flex justify-between border-t border-rule pt-4 text-sm">
            {t("shell.savedCombinations")} <span className="font-data">{ids.length}</span>
          </SheetClose>
        </SheetContent>
      </Sheet>
      </div>
    </header>
  );
}
