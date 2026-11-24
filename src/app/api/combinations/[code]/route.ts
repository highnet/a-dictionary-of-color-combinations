import { SOURCE, json, paletteJson } from "@/lib/api";
import { PALETTES, getPaletteByCode } from "@/lib/dictionary";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return PALETTES.map((p) => ({ code: p.code }));
}

export async function GET(_req: Request, { params }: RouteContext<"/api/combinations/[code]">) {
  const { code } = await params;
  const p = getPaletteByCode(code);
  if (!p) return json({ error: "Unknown combination. Use 001–348." }, { status: 404 });
  return json({ source: SOURCE, ...paletteJson(p) });
}
