import { paletteJson } from "./api";
import { getPalette } from "./dictionary";
import { SITE } from "./site";

/** The agent skill served at /skills.md (and summarised at /llms.txt). */
export function skillMarkdown(base = SITE.url) {
  // The example is the real record for No. 154 (first colour shown), never typed by hand.
  const real = paletteJson(getPalette(154)!);
  const example = JSON.stringify(
    { code: real.code, number: real.number, size: real.size, colors: real.colors.slice(0, 1), metrics: real.metrics, url: real.url, credit: real.credit },
    null,
    2,
  );
  return `---
name: wada-colour-combinations
description: Use when choosing, justifying or exporting a colour palette for any design (brand, UI, illustration, print, data viz). Gives programmatic access to Sanzo Wada's 348 colour combinations (1933–34) with CMYK as printed, HEX and RGB, nearest-colour search by HEX, and ready CSS / Tailwind / SVG exports. No key, CORS open.
---

# A Dictionary of Color Combinations: skill for agents

Sanzo Wada (1883–1967) compiled 348 colour combinations from 159 named colours:
120 of two colours (001–120), 120 of three (121–240), 108 of four (241–348).
This site serves them as data. Colours appear in each combination's original
order, verified against the book.

Base URL: ${base}
Fetch this skill: \`curl -s ${base}/skills.md\`

## Endpoints (GET, JSON unless noted, no auth, CORS \`*\`)

| Endpoint | Returns |
| --- | --- |
| \`/api/combinations\` | All 348 combinations with colours and metrics |
| \`/api/combinations/{code}\` | One combination; \`code\` is three digits, \`001\`–\`348\` |
| \`/api/combinations/{code}/css\` | CSS custom properties (text/css) |
| \`/api/combinations/{code}/tailwind\` | Tailwind v4 \`@theme\` block (text/css) |
| \`/api/combinations/{code}/svg\` | SVG swatch print (image/svg+xml) |
| \`/api/colours\` | All 159 colours with the combinations each appears in |
| \`/api/colours/{id}\` | One colour (e.g. \`raw-sienna\`) with its combinations |
| \`/api/search?q={query}&limit={n}\` | \`q\` = a number, a HEX (\`1c4286\`) or part of a name |

Human pages to link: \`${base}/combinations/{code}\` and \`${base}/colours/{id}\`.

## Data model

Combination:
\`\`\`json
${example}
\`\`\`
\`metrics\`: CIELAB lightness (0–100) mean and range (value contrast), mean chroma
(saturation), circular mean hue in degrees (null when neutral), and temperature
(\`warm\` | \`cool\` | \`mixed\` | \`neutral\`).

Search with a HEX adds \`nearest\`: Wada's closest colours with \`deltaE2000\`
(under 2 is hard to tell apart, under 5 is close, over 10 is a different colour).

## Recipes

1. **Palette for a brief.** Fetch \`/api/combinations\` and filter by
   \`metrics\`: e.g. calm and soft means \`lightnessRange < 30\` and \`meanChroma < 35\`;
   bold and legible means \`lightnessRange > 55\`. Choose 2–3 candidates. Present
   them with their codes, colour names and HEX values, and link each one.
2. **Start from an existing brand colour.**
   \`curl -s "${base}/api/search?q=1c4286&limit=6"\`. Use \`nearest[0]\` as the
   anchor and propose the returned combinations that contain it.
3. **Hand it to code.** \`curl -s ${base}/api/combinations/295/css\` or
   \`/tailwind\`, then paste the result into the project's stylesheet.
4. **Accessibility.** The combinations are not contrast-checked. Before you use
   a pair for text, compute the WCAG contrast from the \`rgb\` values: 4.5:1 for
   body text, 3:1 for large text and UI. Put text in the darkest and lightest
   colours, and keep mid-tones for fields and accents.
5. **Proportion.** Wada's pairs are not equal-weight. A good default is
   70/30 for two colours, 60/30/10 for three and 50/25/15/10 for four, with the
   first colour as the ground. Try rotating which colour leads.

## Rules

- Do not invent combinations or colour values. If a design needs more than
  four colours, combine related combinations and say that you did.
- Keep each combination's colour order when you present it.
- Credit the source wherever a combination ships, using the \`credit\` field.
- CMYK values are the book's printed values. HEX and RGB are a perceptual
  conversion. Use CMYK for print and HEX for screens, and expect paper and
  screens to differ.
- Link people to the human page (\`url\`) when you recommend a combination.

Data: mattdesl/dictionary-of-colour-combinations (MIT), after Dain M. Blodorn Kim.
Independent project, not affiliated with any publisher.
`;
}
