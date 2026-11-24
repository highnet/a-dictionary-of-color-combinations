export const SITE = {
  name: "A Dictionary of Color Combinations",
  short: "Wada Colour",
  description:
    "All 348 colour combinations compiled by Sanzo Wada (1933–34), in their original order, with HEX, RGB and CMYK values to copy and export.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000")
  ).replace(/\/$/, ""),
} as const;

export const NAV = [
  { href: "/explore", label: "Explore", icon: "compass" },
  { href: "/combinations", label: "All combinations", icon: "grid" },
  { href: "/colours", label: "Colour search", icon: "pipette" },
  { href: "/about", label: "About", icon: "info" },
] as const;
