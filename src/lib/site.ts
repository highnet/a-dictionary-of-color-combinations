export const SITE = {
  name: "A Dictionary of Color Combinations",
  short: "Wada Colour",
  description:
    "All 348 colour combinations compiled by Sanzo Wada (1933–34), in their original order, with HEX, RGB and CMYK values to copy and export.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_ENV === "production"
      ? "https://a-dictionary-of-color-combinations-three.vercel.app"
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000")
  ).replace(/\/$/, ""),
} as const;

/** Primary navigation. Labels are translation keys under common:nav. */
export const NAV = [
  { href: "/explore", key: "explore", icon: "compass" },
  { href: "/combinations", key: "combinations", icon: "grid" },
  { href: "/colours", key: "colours", icon: "pipette" },
  { href: "/wada", key: "wada", icon: "brush" },
  { href: "/about", key: "about", icon: "info" },
  { href: "/#agents", key: "agents", icon: "bot" },
] as const;
