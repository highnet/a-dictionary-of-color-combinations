"use client";

import Link from "@/i18n/link";
import { stripLocale } from "@/i18n/config";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Compares paths without their locale, so /ja/about and /about match /about. */
export function isActive(pathname: string, href: string) {
  const path = stripLocale(pathname).path;
  const target = stripLocale(href).path;
  return path === target || path.startsWith(`${target}/`);
}

/** Sidebar entry. Active state is a mark (a sumi bar under the icon), not a hue. */
export function NavLink({
  href,
  label,
  children,
  onNavigate,
  size = "rail",
}: {
  href: string;
  label: string;
  children?: ReactNode;
  onNavigate?: () => void;
  size?: "rail" | "drawer";
}) {
  const pathname = usePathname() || "/";
  const active = isActive(pathname, href);
  if (size === "drawer") {
    return (
      <Link
        href={href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className="flex items-baseline justify-between border-b border-rule py-4 font-display text-3xl"
      >
        {label}
        {active ? <span className="h-px w-8 translate-y-[-0.35em] bg-current" aria-hidden="true" /> : null}
      </Link>
    );
  }
  return (
    <Link
      href={href}
      title={label}
      aria-current={active ? "page" : undefined}
      className="sb-row group relative flex items-center gap-3.5 px-[1.4rem] text-[0.95rem] transition-colors hover:bg-washi-deep"
    >
      {children}
      <span className="sb-label truncate">{label}</span>
      <span
        aria-hidden="true"
        className={`absolute top-2 bottom-2 left-0 w-[3px] bg-sumi transition-opacity ${active ? "opacity-100" : "opacity-0"}`}
      />
    </Link>
  );
}
