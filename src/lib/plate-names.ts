import data from "../../data/source/plate-names-ja.json";

/**
 * Japanese colour names as printed on Wada's own plates (Haishoku Sōkan,
 * Hakubisha, 1935 printing, scanned by the National Diet Library). Each plate
 * prints a traditional Japanese name, its kana reading and an English name
 * under every swatch; entries are keyed by our colour id and record the plate
 * and scan page they were read from.
 */
export interface PlateNameJa {
  /** As printed, in the plate's own (pre-war) characters. */
  name: string;
  /** The kana reading printed above the name. */
  kana: string;
  /** Plate number it was read from. */
  plate: number;
  /** Volume of the 1935 printing, e.g. "A.VIII". */
  volume: string;
  /** NDL persistent id and page (frame) of the scan. */
  pid: string;
  frame: number;
}

const NAMES = data as unknown as Record<string, PlateNameJa>;

export function plateNameJa(colourId: string): PlateNameJa | undefined {
  return NAMES[colourId];
}

/** Link to the exact scan page at the National Diet Library. */
export function plateNameSource(n: PlateNameJa) {
  return `https://dl.ndl.go.jp/pid/${n.pid}/1/${n.frame}`;
}
