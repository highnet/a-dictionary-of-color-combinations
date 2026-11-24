import { ALL_COLOURS, SOURCE, json } from "@/lib/api";
import { GROUPS } from "@/lib/dictionary";

export const dynamic = "force-static";

export function GET() {
  return json({ source: SOURCE, count: 159, families: GROUPS, colours: ALL_COLOURS() });
}
