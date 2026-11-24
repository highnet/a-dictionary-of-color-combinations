"use client";

import { useState, useSyncExternalStore } from "react";
import { Braces, Download, FileCode2, ImageDown, Link2, Palette as PaletteIcon } from "lucide-react";
import { toast } from "sonner";
import { ActionButton, copyText } from "./copy-button";
import { getPalette } from "@/lib/dictionary";
import { downloadBlob, paletteCss, paletteHexList, paletteJson, paletteSvg, svgToPngBlob } from "@/lib/export";

const noop = () => () => {};

export function ExportPanel({ id }: { id: number }) {
  const p = getPalette(id)!;
  const [tab, setTab] = useState<"css" | "json">("css");
  const url = useSyncExternalStore(
    noop,
    () => window.location.href.split("#")[0],
    () => `/combinations/${p.code}`,
  );
  const css = paletteCss(p);
  const json = paletteJson(p, url);
  const file = `wada-${p.code}`;
  const icon = "size-4 shrink-0";

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="flex flex-wrap content-start gap-2 lg:col-span-5">
        <ActionButton icon={<PaletteIcon className={icon} strokeWidth={1.6} />} onClick={() => copyText(paletteHexList(p), "all HEX values")}>
          Copy all HEX
        </ActionButton>
        <ActionButton icon={<FileCode2 className={icon} strokeWidth={1.6} />} onClick={() => copyText(css, "CSS variables")}>
          Copy CSS variables
        </ActionButton>
        <ActionButton icon={<Braces className={icon} strokeWidth={1.6} />} onClick={() => copyText(json, "JSON")}>
          Copy JSON
        </ActionButton>
        <ActionButton icon={<Link2 className={icon} strokeWidth={1.6} />} onClick={() => copyText(url, "link")}>
          Copy link
        </ActionButton>
        <ActionButton
          icon={<Download className={icon} strokeWidth={1.6} />}
          onClick={() => downloadBlob(new Blob([json], { type: "application/json" }), `${file}.json`)}
        >
          JSON
        </ActionButton>
        <ActionButton
          icon={<Download className={icon} strokeWidth={1.6} />}
          onClick={() => downloadBlob(new Blob([paletteSvg(p)], { type: "image/svg+xml" }), `${file}.svg`)}
        >
          SVG
        </ActionButton>
        <ActionButton
          icon={<ImageDown className={icon} strokeWidth={1.6} />}
          onClick={async () => {
            try {
              downloadBlob(await svgToPngBlob(paletteSvg(p)), `${file}.png`);
            } catch (e) {
              toast((e as Error).message);
            }
          }}
        >
          PNG
        </ActionButton>
      </div>
      <div className="min-w-0 lg:col-span-7">
        <div role="tablist" aria-label="Code format" className="flex gap-5 text-sm">
          {(["css", "json"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              type="button"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`min-h-10 border-b-2 ${tab === t ? "border-current" : "border-transparent text-sumi-soft"}`}
            >
              {t === "css" ? "CSS variables" : "JSON"}
            </button>
          ))}
        </div>
        <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap bg-sumi p-5 font-data text-[0.75rem] leading-relaxed text-washi" tabIndex={0}>
          {tab === "css" ? css : json}
        </pre>
      </div>
    </div>
  );
}
