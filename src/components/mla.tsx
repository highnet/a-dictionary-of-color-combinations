import { Fragment } from "react";
import { WORKS, worksCited, type WorkId } from "@/lib/citations";

/** Renders *italic* spans and links bare URLs; everything else is plain text. */
export function MlaText({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*|https?:\/\/\S+?(?=\.?(?:\s|$)))/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("*") && p.endsWith("*") ? (
          <i key={i}>{p.slice(1, -1)}</i>
        ) : /^https?:\/\//.test(p) ? (
          <a key={i} href={p} className="link-quiet break-all">
            {p}
          </a>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

/** Parenthetical in-text citation: (Wada, *Gaisetsu* 28). Links to the full entry on /about. */
export function Cite({ work, page }: { work: WorkId; page?: string | number }) {
  return (
    <span className="whitespace-nowrap">
      (<a href={`/about#cite-${work}`} className="link-quiet">
        <MlaText text={WORKS[work].short} />
      </a>
      {page != null ? ` ${page}` : ""})
    </span>
  );
}

/** A Works Cited list with hanging indents, the MLA way. */
export function WorksCited({ ids, className = "" }: { ids: WorkId[]; className?: string }) {
  return (
    <ul className={`space-y-3 text-sm leading-relaxed ${className}`}>
      {worksCited(ids).map((w) => (
        <li key={w.id} id={`cite-${w.id}`} className="scroll-mt-24 pl-8 -indent-8">
          <MlaText text={w.display} />
        </li>
      ))}
    </ul>
  );
}

/** A small kanji label, decorative: the English beside it carries the meaning. */
export function Kanji({ children, className = "" }: { children: string; className?: string }) {
  return (
    <span lang="ja" aria-hidden="true" className={`font-display font-bold text-sumi-soft/60 ${className}`}>
      {children}
    </span>
  );
}
