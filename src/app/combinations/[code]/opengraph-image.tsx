import { ogCard, OG_SIZE } from "@/lib/og";
import { PALETTES, getPaletteByCode } from "@/lib/dictionary";

export const alt = "A colour combination by Sanzo Wada";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return PALETTES.map((p) => ({ code: p.code }));
}

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const p = getPaletteByCode(code)!;
  return ogCard({
    colors: p.colors.map((c) => c.hex),
    title: `No. ${p.code}`,
    kicker: p.colors.map((c) => c.name).join(" · "),
  });
}
