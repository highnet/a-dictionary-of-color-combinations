# A Dictionary of Color Combinations

An independent digital archive of the 348 colour combinations compiled by **Sanzo Wada** (1883–1967), first published as *Haishoku Sōkan* (1933–34).

Every combination is rendered from data in HTML, CSS and WebGL. No scans, layouts or editorial text from any printed edition are reproduced.

## Data & credit

- Colour names, CMYK values and combination membership: [mattdesl/dictionary-of-colour-combinations](https://github.com/mattdesl/dictionary-of-colour-combinations) (MIT, © 2020 Matt DesLauriers), after [Dain M. Blodorn Kim](https://github.com/dblodorn/sanzo-wada). Licence: `data/source/LICENSE-dataset.md`.
- Order of colours within each combination: transcribed from *A Dictionary of Color Combinations* Vol. 1 (Seigensha, ISBN 9784861522475) and checked against the dataset's membership lists. All 348 sets match. See `data/source/book-order.json`.
- CMYK is as printed; HEX/RGB are the dataset's perceptual conversion.
- Not affiliated with Seigensha.

`src/data/dictionary.json` is the merged, verified dataset the site reads.

## Develop

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # static generation of all 348 combination + 159 colour pages
```

Next.js (App Router) · TypeScript · Tailwind CSS · customised shadcn/ui · three.js for the hero (a 2D animated print after Hokusai, inked in Wada's colours). Agents: `curl -s <site>/skills.md`. Deployed on Vercel from `main`; preview deployments for other branches are disabled in `vercel.json`.
