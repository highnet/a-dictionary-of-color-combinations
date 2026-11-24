import { SOURCE, colourJson, json, paletteJson } from "@/lib/api";
import { COLOURS, getColour, palettesWithColour } from "@/lib/dictionary";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return COLOURS.map((c) => ({ slug: c.id }));
}

export async function GET(_req: Request, { params }: RouteContext<"/api/colours/[slug]">) {
  const { slug } = await params;
  const c = getColour(slug)!;
  return json({ source: SOURCE, ...colourJson(c), combinationsDetail: palettesWithColour(c).map(paletteJson) });
}
