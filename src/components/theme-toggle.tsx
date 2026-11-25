"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

import { THEME_KEY } from "@/lib/boot";
import { useTranslation } from "@/i18n/client";

const listeners = new Set<() => void>();

function isDark() {
  const t = document.documentElement.dataset.theme;
  if (t) return t === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function subscribe(l: () => void) {
  listeners.add(l);
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", l);
  return () => {
    listeners.delete(l);
    mq.removeEventListener("change", l);
  };
}

function useDark() {
  return useSyncExternalStore(subscribe, isDark, () => false);
}

/** Flip to the other theme and remember the choice. */
function toggleTheme() {
  const next = isDark() ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {}
  listeners.forEach((l) => l());
}

/** Sidebar row, matching the Saved / Fold rows. */
export function ThemeToggle() {
  const dark = useDark();
  const { t } = useTranslation();
  const Icon = dark ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={toggleTheme}
      data-eyedropper-ignore
      aria-label={dark ? t("theme.toLight") : t("theme.toDark")}
      title={dark ? t("theme.lightTitle") : t("theme.darkTitle")}
      className="sb-row flex items-center gap-3.5 px-[0.9rem] text-left text-sm text-sumi-soft transition-colors hover:bg-washi-deep hover:text-sumi"
    >
      <Icon className="size-[1.15rem] shrink-0" strokeWidth={1.5} aria-hidden="true" />
      <span className="sb-label">{dark ? t("theme.light") : t("theme.dark")}</span>
    </button>
  );
}

/** Icon-only button for the mobile top bar. */
export function ThemeIconToggle() {
  const dark = useDark();
  const { t } = useTranslation();
  const Icon = dark ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={toggleTheme}
      data-eyedropper-ignore
      aria-label={dark ? t("theme.toLight") : t("theme.toDark")}
      className="grid size-11 place-items-center"
    >
      <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}
