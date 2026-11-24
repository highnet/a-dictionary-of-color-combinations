import type { NextRequest } from "next/server";
import { SOURCE, json, searchJson } from "@/lib/api";

/**
 * GET /api/search?q=<number | hex | colour name>&limit=<1-348>
 * Numbers resolve a combination; HEX returns the nearest of Wada's colours by
 * CIEDE2000 and the combinations that use them; words match colour names.
 */
export function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? req.nextUrl.searchParams.get("hex") ?? "";
  const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get("limit")) || 24, 1), 348);
  if (!q.trim()) {
    return json(
      { error: "Add ?q= with a combination number (1–348), a HEX value (#1c4286) or part of a colour name." },
      { status: 400 },
    );
  }
  return json({ source: SOURCE, ...searchJson(q, limit) });
}
