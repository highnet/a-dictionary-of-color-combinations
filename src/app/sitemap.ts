import type { MetadataRoute } from "next";
import { COLOURS, PALETTES } from "@/lib/dictionary";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/combinations", "/colours", "/explore", "/compare", "/about"].map((p) => ({
    url: `${SITE.url}${p}`,
    changeFrequency: "monthly" as const,
    priority: p === "" ? 1 : 0.8,
  }));
  return [
    ...pages,
    { url: `${SITE.url}/skills.md`, changeFrequency: "monthly" as const, priority: 0.7 },
    ...PALETTES.map((p) => ({ url: `${SITE.url}/combinations/${p.code}`, changeFrequency: "yearly" as const, priority: 0.6 })),
    ...COLOURS.map((c) => ({ url: `${SITE.url}/colours/${c.id}`, changeFrequency: "yearly" as const, priority: 0.5 })),
  ];
}
