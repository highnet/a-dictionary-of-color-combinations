/**
 * Works cited across the site, in MLA (9th edition) style.
 * Each entry renders as: author. title. container, publisher, date, location.
 * Titles that MLA italicises are marked with *asterisks* and rendered by
 * <MlaEntry>; nothing else in the string is treated as markup.
 */

export interface Work {
  id: string;
  /** Full Works Cited entry, *italics* marked. */
  mla: string;
  /** Short form for parenthetical citations, *italics* marked: (Wada, *Gaisetsu* 28). */
  short: string;
  href?: string;
}

export const WORKS = {
  haishoku: {
    id: "haishoku",
    mla: "Wada, Sanzō, editor. *Haishoku sōkan* 配色總鑑. Hakubisha, 1933–34. 6 vols.",
    short: "Wada, *Haishoku sōkan*",
  },
  gaisetsu: {
    id: "gaisetsu",
    mla: "Wada, Sanzō, editor. *Haishoku sōkan gaisetsu to sono katsuyō* 配色總鑑概説と其活用. Hakubisha, 1934. *National Diet Library Digital Collections*, https://doi.org/10.11501/1911912.",
    short: "Wada, *Gaisetsu*",
    href: "https://doi.org/10.11501/1911912",
  },
  plates1935: {
    id: "plates1935",
    mla: "Wada, Sanzō, editor. *Haishoku sōkan A* 配色総鑑 A. Hakubisha, 1934–35. 12 vols. *National Diet Library Digital Collections*, https://doi.org/10.11501/1903656.",
    short: "Wada, *Haishoku sōkan A*",
    href: "https://doi.org/10.11501/1903656",
  },
  seigensha: {
    id: "seigensha",
    mla: "Wada, Sanzō. *A Dictionary of Color Combinations*. Vol. 1, Seigensha, 2010.",
    short: "Wada, *Dictionary*",
  },
  mattdesl: {
    id: "mattdesl",
    mla: "DesLauriers, Matt. “dictionary-of-colour-combinations.” *GitHub*, github.com/mattdesl/dictionary-of-colour-combinations. Accessed 25 Nov. 2026.",
    short: "DesLauriers",
    href: "https://github.com/mattdesl/dictionary-of-colour-combinations",
  },
  dblodorn: {
    id: "dblodorn",
    mla: "Kim, Dain M. Blodorn. “sanzo-wada.” *GitHub*, github.com/dblodorn/sanzo-wada. Accessed 25 Nov. 2026.",
    short: "Kim",
    href: "https://github.com/dblodorn/sanzo-wada",
  },
  wikipedia: {
    id: "wikipedia",
    mla: "“Sanzo Wada.” *Wikipedia*, Wikimedia Foundation, en.wikipedia.org/wiki/Sanzo_Wada. Accessed Nov. 2026.",
    short: "“Sanzo Wada”",
    href: "https://en.wikipedia.org/wiki/Sanzo_Wada",
  },
  southWind: {
    id: "southWind",
    mla: "Wada, Sanzō. *South Wind*. 1907. National Museum of Modern Art, Tokyo.",
    short: "Wada, *South Wind*",
    href: "https://www.momat.go.jp/en/",
  },
} as const satisfies Record<string, Work>;

export type WorkId = keyof typeof WORKS;

/** Splits "Author, role. Title…" into the author and the rest. Entries without an author start with the title. */
function split(mla: string) {
  if (/^[“"*]/.test(mla)) return { author: "", rest: mla };
  const at = mla.indexOf(". ");
  return { author: mla.slice(0, at), rest: mla.slice(at + 2) };
}

const sortKey = (text: string) =>
  text
    .replace(/[“”"*]/g, "")
    .replace(/^(a|an|the) /i, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/**
 * Works Cited the MLA way: alphabetical by author, then by title (ignoring
 * A/An/The); an author's later entries replace the name with three hyphens.
 */
export function worksCited(ids: WorkId[]): (Work & { display: string })[] {
  const rows = ids.map((id) => {
    const w = WORKS[id] as Work;
    const { author, rest } = split(w.mla);
    const name = author.replace(/, (editor|translator)$/, "");
    const title = rest.match(/^\*([^*]+)\*|^“([^”]+)”/)?.slice(1).find(Boolean) ?? rest;
    return { w, author, name, rest, key: sortKey(name || title) + "\u0000" + sortKey(title) };
  });
  rows.sort((a, b) => a.key.localeCompare(b.key));
  return rows.map((r, i) => {
    const repeat = i > 0 && r.name && rows[i - 1].name === r.name;
    const display = repeat ? `---${r.author.slice(r.name.length)}. ${r.rest}` : r.w.mla;
    return { ...r.w, display };
  });
}

/** MLA citation for one combination, as in the reference edition. */
export function plateCitation(code: string) {
  return `Wada, Sanzō. “Combination ${code}.” *A Dictionary of Color Combinations*, vol. 1, Seigensha, 2010, no. ${Number(code)}.`;
}
