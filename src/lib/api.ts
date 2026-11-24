import { formatCmyk, hexToLab, parseHex } from "./color";
import {
  COLOURS,
  GROUPS,
  PALETTES,
  nearestColours,
  type Colour,
  type Palette,
} from "./dictionary";
import { searchPalettes } from "./search";
import { SITE } from "./site";

/** Public JSON shapes for agents. Stable field names; documented in /skills.md. */

export function colourJson(c: Colour) {
  return {
    id: c.id,
    index: c.index,
    name: c.name,
    variant: c.variant,
    family: GROUPS[c.group],
    hex: c.hex,
    rgb: c.rgb,
    cmyk: c.cmyk,
    cmykLabel: formatCmyk(c.cmyk),
    lab: c.lab.map((v) => Math.round(v * 100) / 100),
    combinations: c.combinations.map((n) => String(n).padStart(3, "0")),
    url: `${SITE.url}/colours/${c.id}`,
    api: `${SITE.url}/api/colours/${c.id}`,
  };
}

export function paletteJson(p: Palette) {
  return {
    code: p.code,
    number: p.id,
    size: p.size,
    colors: p.colors.map((c) => ({
      id: c.id,
      name: c.name,
      hex: c.hex,
      rgb: c.rgb,
      cmyk: c.cmyk,
    })),
    metrics: {
      meanLightness: Math.round(p.metrics.lightness * 10) / 10,
      lightnessRange: Math.round(p.metrics.lightnessRange * 10) / 10,
      meanChroma: Math.round(p.metrics.chroma * 10) / 10,
      meanHue: p.metrics.hue === null ? null : Math.round(p.metrics.hue),
      temperature: p.metrics.temperature,
    },
    url: `${SITE.url}/combinations/${p.code}`,
    api: `${SITE.url}/api/combinations/${p.code}`,
    credit: `Colour combination No. ${p.code} by Sanzo Wada, A Dictionary of Color Combinations (1933–34)`,
  };
}

export const SOURCE = {
  title: "A Dictionary of Color Combinations",
  author: "Sanzo Wada (1883–1967)",
  data: "mattdesl/dictionary-of-colour-combinations (MIT), after Dain M. Blodorn Kim; within-palette order verified against the Seigensha edition",
  note: "CMYK is as printed in the book. HEX/RGB/Lab are a perceptual conversion of that CMYK.",
  site: SITE.url,
  skill: `${SITE.url}/skills.md`,
};

export function searchJson(query: string, limit: number) {
  const q = query.trim();
  const hex = parseHex(q.replace(/^#/, ""));
  const result = searchPalettes(q);
  const nearest =
    hex && !/^\d{1,3}$/.test(q)
      ? nearestColours(hexToLab(hex), 8).map(({ colour, distance }) => ({
          deltaE2000: Math.round(distance * 100) / 100,
          colour: colourJson(colour),
        }))
      : undefined;
  return {
    query: q,
    kind: result.kind,
    nearest,
    matchedColours: result.kind === "name" ? result.matched.map((m) => m.colour.name) : undefined,
    total: result.palettes.length,
    combinations: result.palettes.slice(0, limit).map(paletteJson),
  };
}

export const ALL_PALETTES = () => PALETTES.map(paletteJson);
export const ALL_COLOURS = () => COLOURS.map(colourJson);

export function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "cache-control": "public, max-age=3600, s-maxage=86400",
      ...init?.headers,
    },
  });
}

export function text(body: string, type: string, init?: ResponseInit) {
  return new Response(body, {
    ...init,
    headers: {
      "content-type": `${type}; charset=utf-8`,
      "access-control-allow-origin": "*",
      "cache-control": "public, max-age=3600, s-maxage=86400",
      ...init?.headers,
    },
  });
}
