/**
 * The print is inked only in Sanzo Wada's colours, chosen as the nearest
 * entries in the dictionary to the inks of Hokusai's Great Wave (c. 1831).
 */
export const INKS = {
  body: { id: "dark-tyrian-blue", name: "Dark Tyrian Blue", hex: "#12354e" }, // Prussian body
  ink: { id: "deep-indigo", name: "Deep Indigo", hex: "#051230" }, // key-lines
  mid: { id: "antwarp-blue", name: "Antwarp Blue", hex: "#007190" }, // inner water
  pale: { id: "light-glaucous-blue", name: "Light Glaucous Blue", hex: "#a5c8d1" }, // engraving
  foam: { id: "sulphur-yellow", name: "Sulphur Yellow", hex: "#f5ecc2" }, // foam, snow
  sky: { id: "ivory-buff", name: "Ivory Buff", hex: "#ebd3a2" }, // sky, hulls
} as const;

export type InkKey = keyof typeof INKS;

export function rgb(hex: string): [number, number, number] {
  const v = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255) as [number, number, number];
}
