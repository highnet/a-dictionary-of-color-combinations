import type { CSSProperties } from "react";
import type { Colour } from "@/lib/dictionary";
import { plateNameJa } from "@/lib/plate-names";

/**
 * A colour as a shogi piece (駒): the five-sided tile, its face the colour,
 * Wada's Japanese name from the original plates set vertically in ink like a
 * piece's kanji, the English name small at its foot. Server-safe, no hooks.
 */
export function Koma({
  colour,
  size = "md",
  showEnglish = true,
  className = "",
}: {
  colour: Colour;
  size?: "sm" | "md" | "lg";
  showEnglish?: boolean;
  className?: string;
}) {
  const ja = plateNameJa(colour.id);
  // A piece carries one name in one column: the first of any alternatives,
  // without notes such as （純色）. The full printed text is on the colour page.
  const face = ja?.name.split(/[、，,（(]/)[0];
  const ink = colour.ink === "ink" ? "#1f1c19" : "#f6f3ec";
  const width = { sm: "3.4rem", md: "5.6rem", lg: "9rem" }[size];
  const style = {
    "--koma-w": width,
    "--koma-face": colour.hex,
    "--koma-ink": ink,
    "--koma-chars": face ? [...face].length : 2,
  } as CSSProperties;
  return (
    <span className={`koma koma-${size} ${className}`} style={style}>
      <span className="koma-face">
        {face ? (
          <span lang="ja" className="koma-kanji" title={ja?.name}>
            {face}
          </span>
        ) : null}
        {showEnglish || !ja ? <span className="koma-en">{colour.name}</span> : null}
      </span>
    </span>
  );
}

/** A Japanese colour name as printed on the plates, with its kana reading as ruby. */
export function JaName({ colourId, className = "" }: { colourId: string; className?: string }) {
  const ja = plateNameJa(colourId);
  if (!ja) return null;
  return (
    <ruby lang="ja" className={className}>
      {ja.name}
      <rp>（</rp>
      <rt className="font-sans text-[0.55em] font-normal tracking-wide text-current/70">{ja.kana}</rt>
      <rp>）</rp>
    </ruby>
  );
}
