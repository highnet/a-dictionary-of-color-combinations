import type { MetadataRoute } from "next";
import { COLOURS, PALETTES } from "@/lib/dictionary";
import { SITE } from "@/lib/site";
import { localize } from "@/i18n/config";

/** Every page in English, with its Japanese twin as an hreflang alternate (and listed in its own right). */
function both(path: string, rest: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">): MetadataRoute.Sitemap {
  const languages = { "en-GB": `${SITE.url}${localize(path, "en")}`, "ja-JP": `${SITE.url}${localize(path, "ja")}` };
  return [
    { url: languages["en-GB"], alternates: { languages }, ...rest },
    { url: languages["ja-JP"], alternates: { languages }, ...rest },
  ];
}

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/combinations", "/colours", "/explore", "/compare", "/wada", "/about"].flatMap((p) =>
    both(p, { changeFrequency: "monthly", priority: p === "/" ? 1 : 0.8 }),
  );
  return [
    ...pages,
    { url: `${SITE.url}/skills.md`, changeFrequency: "monthly" as const, priority: 0.7 },
    ...PALETTES.flatMap((p) => both(`/combinations/${p.code}`, { changeFrequency: "yearly", priority: 0.6 })),
    ...COLOURS.flatMap((c) => both(`/colours/${c.id}`, { changeFrequency: "yearly", priority: 0.5 })),
  ];
}
