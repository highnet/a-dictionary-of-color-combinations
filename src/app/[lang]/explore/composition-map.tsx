"use client";

import Link from "@/i18n/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useHref, useTranslation } from "@/i18n/client";
import { rich } from "@/i18n/rich";
import { PALETTES, type Palette } from "@/lib/dictionary";

// Layout: hue by rank (Wada's palette leans warm, so an angle axis would pile
// half the archive into the reds), lightness by value. Each plate then snaps to
// the nearest free cell so no two overlap and every one stays clickable.
const COLS = 34;
const ROWS = 22;

const LAYOUT: Map<number, { col: number; row: number }> = (() => {
  const chromatic = PALETTES.filter((p) => p.metrics.hue !== null).sort(
    (a, b) => a.metrics.hue! - b.metrics.hue!,
  );
  const rank = new Map(chromatic.map((p, i) => [p.id, i / (chromatic.length - 1)]));
  const taken = new Set<string>();
  const out = new Map<number, { col: number; row: number }>();
  const order = [...PALETTES].sort((a, b) => a.metrics.chroma - b.metrics.chroma).reverse();
  for (const p of order) {
    const wantCol = p.metrics.hue === null ? COLS - 1 : Math.round((rank.get(p.id) ?? 0) * (COLS - 3));
    const wantRow = Math.round(((100 - Math.min(Math.max(p.metrics.lightness, 5), 97)) / 100) * (ROWS - 1));
    let best: { col: number; row: number } | null = null;
    for (let r = 0; r < Math.max(COLS, ROWS) && !best; r++) {
      let bestD = Infinity;
      for (let dc = -r; dc <= r; dc++) {
        for (let dr = -r; dr <= r; dr++) {
          if (Math.max(Math.abs(dc), Math.abs(dr)) !== r) continue;
          const col = wantCol + dc;
          const row = wantRow + dr;
          if (col < 0 || row < 0 || col >= COLS || row >= ROWS) continue;
          if (p.metrics.hue !== null && col >= COLS - 2) continue; // neutral lane
          if (taken.has(`${col}:${row}`)) continue;
          const d = dc * dc * 1.6 + dr * dr;
          if (d < bestD) {
            bestD = d;
            best = { col, row };
          }
        }
      }
    }
    if (best) {
      taken.add(`${best.col}:${best.row}`);
      out.set(p.id, best);
    }
  }
  return out;
})();

type Temp = "all" | "warm" | "cool" | "mixed" | "neutral";
type Contrast = "all" | "soft" | "medium" | "strong";
type Count = "all" | 2 | 3 | 4;

function contrastOf(p: Palette): Exclude<Contrast, "all"> {
  const r = p.metrics.lightnessRange;
  return r < 30 ? "soft" : r < 60 ? "medium" : "strong";
}

function Chips<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-xs text-sumi-soft">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={o.value === value}
            onClick={() => onChange(o.value)}
            className={`min-h-9 border px-3 text-sm transition-colors ${o.value === value ? "border-sumi bg-sumi text-washi" : "border-rule hover:bg-washi-deep"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function CompositionMap() {
  const { t } = useTranslation("explore");
  const href = useHref();
  const router = useRouter();
  const [temp, setTemp] = useState<Temp>("all");
  const [contrast, setContrast] = useState<Contrast>("all");
  const [count, setCount] = useState<Count>("all");
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<number[]>([]);
  const [hover, setHover] = useState<Palette | null>(null);

  const on = useMemo(() => {
    const s = new Set<number>();
    for (const p of PALETTES) {
      if (temp !== "all" && p.metrics.temperature !== temp) continue;
      if (contrast !== "all" && contrastOf(p) !== contrast) continue;
      if (count !== "all" && p.size !== count) continue;
      s.add(p.id);
    }
    return s;
  }, [temp, contrast, count]);

  function place(p: Palette) {
    const cell = LAYOUT.get(p.id)!;
    return {
      left: `${(cell.col / COLS) * 100}%`,
      top: `${(cell.row / ROWS) * 100}%`,
      width: `${100 / COLS}%`,
      height: `${100 / ROWS}%`,
    };
  }

  function activate(p: Palette) {
    if (!selecting) {
      router.push(href(`/combinations/${p.code}`));
      return;
    }
    setPicked((cur) => (cur.includes(p.id) ? cur.filter((x) => x !== p.id) : cur.length >= 4 ? cur : [...cur, p.id]));
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 border-y border-rule py-6 md:grid-cols-[repeat(3,auto)_1fr] md:gap-10">
        <Chips<Count>
          label={t("filters.colours")}
          value={count}
          onChange={setCount}
          options={[{ value: "all", label: t("filters.all") }, { value: 2, label: "2" }, { value: 3, label: "3" }, { value: 4, label: "4" }]}
        />
        <Chips<Temp>
          label={t("filters.temperature")}
          value={temp}
          onChange={setTemp}
          options={[
            { value: "all", label: t("filters.all") },
            { value: "warm", label: t("filters.warm") },
            { value: "cool", label: t("filters.cool") },
            { value: "mixed", label: t("filters.mixed") },
            { value: "neutral", label: t("filters.neutral") },
          ]}
        />
        <Chips<Contrast>
          label={t("filters.contrast")}
          value={contrast}
          onChange={setContrast}
          options={[
            { value: "all", label: t("filters.all") },
            { value: "soft", label: t("filters.soft") },
            { value: "medium", label: t("filters.medium") },
            { value: "strong", label: t("filters.strong") },
          ]}
        />
        <div className="flex items-end justify-start md:justify-end">
          <button
            type="button"
            aria-pressed={selecting}
            onClick={() => setSelecting((s) => !s)}
            className={`min-h-9 border px-3 text-sm ${selecting ? "border-sumi bg-sumi text-washi" : "border-rule hover:bg-washi-deep"}`}
          >
            {selecting ? t("picking") : t("pick")}
          </button>
        </div>
      </div>

      <div className="mt-4 flex min-h-11 flex-wrap items-center justify-between gap-3 text-sm" aria-live="polite">
        <p>
          {rich(t("shown", { n: on.size }), {
            n: (c, k) => (
              <span key={k} className="font-data">
                {c}
              </span>
            ),
            s: (c, k) => (
              <span key={k} className="text-sumi-soft">
                {c}
              </span>
            ),
          })}
          {hover ? (
            <span className="ml-4 hidden text-sumi-soft md:inline">
              <span className="font-data text-sumi">{hover.code}</span> · {hover.colors.map((c) => c.name).join(", ")}
            </span>
          ) : null}
        </p>
        {selecting ? (
          <div className="flex items-center gap-3">
            <span className="text-sumi-soft">{t("picked", { n: picked.length })}</span>
            {picked.length >= 2 ? (
              <Link href={`/compare?ids=${picked.join(",")}`} className="inline-flex min-h-10 items-center gap-2 bg-sumi px-4 text-washi">
                {t("compare")} <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="-mx-[var(--gutter)] overflow-x-auto px-[var(--gutter)] pb-10">
      <div className="relative mt-8 h-[min(76vh,44rem)] min-h-[30rem] min-w-[46rem] border-l border-b border-sumi/40">
        <span className="absolute -top-1 left-1 -translate-y-full pb-1 text-xs text-sumi-soft">{t("axis.light")}</span>
        <span className="absolute bottom-2 left-2 text-xs text-sumi-soft">{t("axis.dark")}</span>
        <span className="absolute right-0 -bottom-7 text-xs text-sumi-soft">{t("axis.neutral")}</span>
        <div className="absolute inset-x-0 -bottom-7 flex justify-between pr-20 text-xs text-sumi-soft" aria-hidden="true">
          {(["red", "orange", "yellow", "green", "blue", "purple"] as const).map((h) => (
            <span key={h}>{t(`axis.${h}`)}</span>
          ))}
        </div>
        <ul aria-label={t("mapLabel")}>
          {PALETTES.map((p) => {
            const visible = on.has(p.id);
            const isPicked = picked.includes(p.id);
            return (
              <li key={p.id} className="absolute grid place-items-center hover:z-10 focus-within:z-10" style={place(p)}>
                <button
                  type="button"
                  disabled={!visible}
                  onClick={() => activate(p)}
                  onMouseEnter={() => setHover(p)}
                  onFocus={() => setHover(p)}
                  aria-label={`${p.code}: ${p.colors.map((c) => c.name).join(", ")}${selecting && isPicked ? t("pickedSuffix") : ""}`}
                  aria-pressed={selecting ? isPicked : undefined}
                  className={`relative flex h-[46%] w-[86%] transition-[opacity,transform] duration-300 hover:z-10 hover:scale-[1.9] focus-visible:z-10 focus-visible:scale-[1.9] ${visible ? "opacity-100" : "pointer-events-none opacity-[0.07]"} ${isPicked ? "scale-[1.8] outline-2 outline-offset-2 outline-sumi" : ""}`}
                >
                  {p.colors.map((c) => (
                    <span key={c.id} className="flex-1" style={{ backgroundColor: c.hex }} />
                  ))}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      </div>
    </div>
  );
}
