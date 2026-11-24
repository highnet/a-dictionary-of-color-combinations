import { text } from "@/lib/api";
import { PALETTES, getPaletteByCode } from "@/lib/dictionary";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return PALETTES.map((p) => ({ code: p.code }));
}

/** Tailwind v4 theme block: utilities such as bg-wada-001-1 or text-wada-001-2. */
export async function GET(_req: Request, { params }: RouteContext<"/api/combinations/[code]/tailwind">) {
  const { code } = await params;
  const p = getPaletteByCode(code)!;
  const lines = p.colors.map((c, i) => `  --color-wada-${p.code}-${i + 1}: ${c.hex}; /* ${c.name} */`);
  return text(`/* Sanzo Wada — combination ${p.code} */\n@theme {\n${lines.join("\n")}\n}\n`, "text/css");
}
