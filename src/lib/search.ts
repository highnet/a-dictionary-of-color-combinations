import { hexToLab, parseHex } from "./color";
import { COLOURS, PALETTES, nearestColours, type Colour, type Palette } from "./dictionary";

export type SortKey = "order" | "hue" | "value";

export interface SearchResult {
  palettes: Palette[];
  /** Colours the query resolved to (HEX or name search). */
  matched: { colour: Colour; distance?: number }[];
  kind: "all" | "number" | "hex" | "name" | "none";
}

/** Resolve a free-text query against the archive. */
export function searchPalettes(query: string): SearchResult {
  const q = query.trim();
  if (!q) return { palettes: [...PALETTES], matched: [], kind: "all" };

  if (/^\d{1,3}$/.test(q)) {
    const p = PALETTES[Number(q) - 1];
    return { palettes: p ? [p] : [], matched: [], kind: "number" };
  }

  const hex = /^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(q) ? parseHex(q) : null;
  if (hex) {
    const near = nearestColours(hexToLab(hex), 12);
    // Always keep the closest; then everything within a clearly-similar ΔE.
    const keep = near.filter((n, i) => i === 0 || n.distance <= 8);
    const rank = new Map<number, number>();
    for (const { colour, distance } of keep) {
      for (const id of colour.combinations) {
        rank.set(id, Math.min(rank.get(id) ?? Infinity, distance));
      }
    }
    const palettes = [...rank.entries()]
      .sort((a, b) => a[1] - b[1] || a[0] - b[0])
      .map(([id]) => PALETTES[id - 1]);
    return { palettes, matched: keep, kind: "hex" };
  }

  const needle = q.toLowerCase();
  const colours = COLOURS.filter((c) => c.name.toLowerCase().includes(needle));
  if (!colours.length) return { palettes: [], matched: [], kind: "none" };
  const ids = new Set(colours.flatMap((c) => c.combinations));
  return {
    palettes: PALETTES.filter((p) => ids.has(p.id)),
    matched: colours.map((colour) => ({ colour })),
    kind: "name",
  };
}

export function sortPalettes(list: Palette[], key: SortKey): Palette[] {
  if (key === "order") return list;
  const copy = [...list];
  if (key === "hue") {
    copy.sort((a, b) => (a.metrics.hue ?? 999) - (b.metrics.hue ?? 999) || a.id - b.id);
  } else {
    copy.sort((a, b) => b.metrics.lightness - a.metrics.lightness || a.id - b.id);
  }
  return copy;
}
