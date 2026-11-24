import { ALL_PALETTES, SOURCE, json } from "@/lib/api";

export const dynamic = "force-static";

export function GET() {
  return json({ source: SOURCE, count: 348, combinations: ALL_PALETTES() });
}
