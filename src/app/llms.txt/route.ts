import { text } from "@/lib/api";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  return text(
    `# A Dictionary of Color Combinations

> Sanzo Wada's 348 colour combinations (1933–34) as data: CMYK as printed, HEX, RGB, nearest-colour search, CSS/Tailwind/SVG exports.

## For agents
- [Skill: how to design with this archive](${SITE.url}/skills.md): read this first (curl -s ${SITE.url}/skills.md)
- [All combinations (JSON)](${SITE.url}/api/combinations)
- [All colours (JSON)](${SITE.url}/api/colours)
- [Search](${SITE.url}/api/search?q=1c4286): number, HEX or colour name

## For people
- [All combinations](${SITE.url}/combinations)
- [Colour search](${SITE.url}/colours)
- [About & sources](${SITE.url}/about)
`,
    "text/plain",
  );
}
