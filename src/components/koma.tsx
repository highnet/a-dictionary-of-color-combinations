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
  const ink = colour.ink === "ink" ? "#1f1c19" : "#f6f3ec";
  const width = { sm: "3.4rem", md: "5.6rem", lg: "9rem" }[size];
  const style = { "--koma-w": width, "--koma-face": colour.hex, "--koma-ink": ink } as CSSProperties;
  return (
    <span className={`koma koma-${size} ${className}`} style={style}>
      <span className="koma-face">
        {ja ? (
          <span lang="ja" className="koma-kanji">
            {ja.name}
          </span>
        ) : null}
        {showEnglish || !ja ? <span className="koma-en">{colour.name}</span> : null}
      </span>
    </span>
  );
}
