import { text } from "@/lib/api";
import { PALETTES, getPaletteByCode } from "@/lib/dictionary";
import { paletteSvg } from "@/lib/export";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return PALETTES.map((p) => ({ code: p.code }));
}

export async function GET(_req: Request, { params }: RouteContext<"/api/combinations/[code]/svg">) {
  const { code } = await params;
  return text(paletteSvg(getPaletteByCode(code)!), "image/svg+xml");
}
