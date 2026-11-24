import { text } from "@/lib/api";
import { PALETTES, getPaletteByCode } from "@/lib/dictionary";
import { paletteCss } from "@/lib/export";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return PALETTES.map((p) => ({ code: p.code }));
}

export async function GET(_req: Request, { params }: RouteContext<"/api/combinations/[code]/css">) {
  const { code } = await params;
  const p = getPaletteByCode(code)!;
  return text(paletteCss(p), "text/css");
}
