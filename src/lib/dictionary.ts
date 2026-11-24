import raw from "@/data/dictionary.json";
import { deltaE2000, hexToLab, inkOn, labToLch, type Lab, type RGB } from "./color";

/**
 * The dataset. Colour values: mattdesl/dictionary-of-colour-combinations (MIT).
 * Within-palette order: transcribed from A Dictionary of Color Combinations
 * Vol. 1 (Seigensha) and checked against the dataset's membership lists.
 * See /about and data/source/ for provenance.
 */

export type ColorId = string;
export type PaletteSize = 2 | 3 | 4;

export interface Colour {
  id: ColorId;
  /** Position in Wada's colour index (1–159). */
  index: number;
  name: string;
  /** "A"/"B" where the source distinguishes two printings of one name. */
  variant: "A" | "B" | null;
  /** Name exactly as spelled in the digitised dataset. */
  sourceName: string;
  group: number;
  hex: string;
  rgb: RGB;
  /** As printed in the book. */
  cmyk: readonly [number, number, number, number];
  combinations: number[];
  /** Derived: CIELAB of the sRGB value, and LCh. */
  lab: Lab;
  lch: readonly [number, number, number];
  ink: "ink" | "paper";
}

export interface Palette {
  id: number;
  /** "001" … "348" */
  code: string;
  size: PaletteSize;
  colors: Colour[];
  /** Derived composition metrics for exploration. */
  metrics: {
    lightness: number;
    lightnessRange: number;
    chroma: number;
    hue: number | null;
    temperature: "warm" | "cool" | "neutral" | "mixed";
  };
}

interface RawColour {
  id: string;
  index: number;
  name: string;
  variant: "A" | "B" | null;
  sourceName: string;
  group: number;
  hex: string;
  rgb: [number, number, number];
  cmyk: [number, number, number, number];
  combinations: number[];
}

const data = raw as unknown as {
  groups: string[];
  colors: RawColour[];
  combinations: { id: number; colors: string[] }[];
};

export const GROUPS: readonly string[] = data.groups;

export const COLOURS: readonly Colour[] = data.colors.map((c) => {
  const lab = hexToLab(c.hex);
  return {
    ...c,
    rgb: c.rgb as unknown as RGB,
    lab,
    lch: labToLch(lab),
    ink: inkOn(c.rgb as unknown as RGB),
  };
});

const colourById = new Map(COLOURS.map((c) => [c.id, c]));

function temperatureOf(hue: number): "warm" | "cool" {
  // LCh hue: reds/oranges/yellows ≈ 0–100 and magentas ≈ 330–360 read warm.
  return hue < 100 || hue >= 330 ? "warm" : "cool";
}

function paletteMetrics(colors: Colour[]): Palette["metrics"] {
  const Ls = colors.map((c) => c.lch[0]);
  const lightness = Ls.reduce((a, b) => a + b, 0) / Ls.length;
  const lightnessRange = Math.max(...Ls) - Math.min(...Ls);
  const chroma = colors.reduce((a, c) => a + c.lch[1], 0) / colors.length;
  const chromatic = colors.filter((c) => c.lch[1] > 12);
  let hue: number | null = null;
  let temperature: Palette["metrics"]["temperature"] = "neutral";
  if (chromatic.length) {
    let x = 0;
    let y = 0;
    for (const c of chromatic) {
      x += Math.cos((c.lch[2] * Math.PI) / 180) * c.lch[1];
      y += Math.sin((c.lch[2] * Math.PI) / 180) * c.lch[1];
    }
    hue = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
    const temps = new Set(chromatic.map((c) => temperatureOf(c.lch[2])));
    temperature = temps.size > 1 ? "mixed" : [...temps][0];
  }
  return { lightness, lightnessRange, chroma, hue, temperature };
}

export const PALETTES: readonly Palette[] = data.combinations.map((p) => {
  const colors = p.colors.map((id) => colourById.get(id)!);
  return {
    id: p.id,
    code: formatCode(p.id),
    size: colors.length as PaletteSize,
    colors,
    metrics: paletteMetrics(colors),
  };
});

export const PALETTE_COUNT = PALETTES.length;

export function formatCode(id: number): string {
  return String(id).padStart(3, "0");
}

export function getPalette(id: number): Palette | undefined {
  return PALETTES[id - 1];
}

export function getPaletteByCode(code: string): Palette | undefined {
  if (!/^\d{3}$/.test(code)) return undefined;
  return getPalette(Number(code));
}

export function getColour(id: string): Colour | undefined {
  return colourById.get(id);
}

export function palettesWithColour(colour: Colour): Palette[] {
  return colour.combinations.map((id) => PALETTES[id - 1]);
}

/** Combinations sharing colours with `palette`, most shared first. */
export function relatedPalettes(palette: Palette, limit = 8): Palette[] {
  const own = new Set(palette.colors.map((c) => c.id));
  const scores = new Map<number, number>();
  for (const c of palette.colors) {
    for (const id of c.combinations) {
      if (id === palette.id) continue;
      scores.set(id, (scores.get(id) ?? 0) + 1);
    }
  }
  return [...scores.entries()]
    .map(([id, shared]) => {
      const other = PALETTES[id - 1];
      // Tie-break on how close the unshared colours are.
      const rest = other.colors.filter((c) => !own.has(c.id));
      const closeness = rest.length
        ? rest.reduce(
            (sum, c) =>
              sum + Math.min(...palette.colors.map((p) => deltaE2000(p.lab, c.lab))),
            0,
          ) / rest.length
        : 0;
      return { other, shared, closeness };
    })
    .sort((a, b) => b.shared - a.shared || a.closeness - b.closeness || a.other.id - b.other.id)
    .slice(0, limit)
    .map((r) => r.other);
}

/** Nearest dictionary colours to an arbitrary Lab value. */
export function nearestColours(lab: Lab, limit = 8): { colour: Colour; distance: number }[] {
  return COLOURS.map((colour) => ({ colour, distance: deltaE2000(lab, colour.lab) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

/**
 * Plates for the opening wave and the home selection: the highest scores for
 * value range + peak chroma + hue spread in each chapter, interleaved.
 */
export const FEATURED: readonly number[] = [
  295, 22, 154, 313, 2, 151, 289, 62, 240, 265, 89, 141, 247, 61, 232, 251,
];
