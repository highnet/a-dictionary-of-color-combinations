import { ogCard, OG_SIZE } from "@/lib/og";
import { getPalette } from "@/lib/dictionary";

export const alt = "A Dictionary of Color Combinations — Sanzo Wada";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  const p = getPalette(295)!;
  return ogCard({ colors: p.colors.map((c) => c.hex), title: "A Dictionary of Color Combinations", kicker: "348 combinations · 1933–34" });
}
