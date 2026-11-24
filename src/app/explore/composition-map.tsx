"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { PALETTES, type Palette } from "@/lib/dictionary";

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
    // x: mean hue (neutrals gather in a lane at the right); y: mean lightness.
    const x = p.metrics.hue === null ? 96 : (p.metrics.hue / 360) * 90 + 2;
    const y = 100 - Math.min(Math.max(p.metrics.lightness, 8), 96);
    // Deterministic jitter so equal positions don't stack exactly.
    const j = ((p.id * 9301 + 49297) % 233280) / 233280 - 0.5;
    return { left: `${x + j * 1.6}%`, top: `${Math.min(Math.max(y + j * 3, 1), 96)}%` };
  }

  function activate(p: Palette) {
    if (!selecting) {
      router.push(`/combinations/${p.code}`);
      return;
    }
    setPicked((cur) => (cur.includes(p.id) ? cur.filter((x) => x !== p.id) : cur.length >= 4 ? cur : [...cur, p.id]));
  }

  return (
    <div>
      <div className="grid gap-6 border-y border-rule py-6 md:grid-cols-[repeat(3,auto)_1fr] md:gap-10">
        <Chips<Count>
          label="Colours"
          value={count}
          onChange={setCount}
          options={[{ value: "all", label: "All" }, { value: 2, label: "2" }, { value: 3, label: "3" }, { value: 4, label: "4" }]}
        />
        <Chips<Temp>
          label="Temperature"
          value={temp}
          onChange={setTemp}
          options={[
            { value: "all", label: "All" },
            { value: "warm", label: "Warm" },
            { value: "cool", label: "Cool" },
            { value: "mixed", label: "Warm + cool" },
            { value: "neutral", label: "Neutral" },
          ]}
        />
        <Chips<Contrast>
          label="Value contrast"
          value={contrast}
          onChange={setContrast}
          options={[
            { value: "all", label: "All" },
            { value: "soft", label: "Soft" },
            { value: "medium", label: "Medium" },
            { value: "strong", label: "Strong" },
          ]}
        />
        <div className="flex items-end justify-start md:justify-end">
          <button
            type="button"
            aria-pressed={selecting}
            onClick={() => setSelecting((s) => !s)}
            className={`min-h-9 border px-3 text-sm ${selecting ? "border-sumi bg-sumi text-washi" : "border-rule hover:bg-washi-deep"}`}
          >
            {selecting ? "Picking to compare" : "Pick to compare"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex min-h-11 flex-wrap items-center justify-between gap-3 text-sm" aria-live="polite">
        <p>
          <span className="font-data">{on.size}</span> <span className="text-sumi-soft">combinations shown</span>
          {hover ? (
            <span className="ml-4 hidden text-sumi-soft md:inline">
              <span className="font-data text-sumi">{hover.code}</span> · {hover.colors.map((c) => c.name).join(", ")}
            </span>
          ) : null}
        </p>
        {selecting ? (
          <div className="flex items-center gap-3">
            <span className="text-sumi-soft">{picked.length}/4 picked</span>
            {picked.length >= 2 ? (
              <Link href={`/compare?ids=${picked.join(",")}`} className="inline-flex min-h-10 items-center gap-2 bg-sumi px-4 text-washi">
                Compare <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="relative mt-4 h-[min(78vh,46rem)] min-h-[32rem] border-l border-b border-sumi/40">
        <span className="absolute -top-1 -left-px -translate-y-full pb-2 text-xs text-sumi-soft">Light</span>
        <span className="absolute bottom-2 left-2 text-xs text-sumi-soft">Dark</span>
        <span className="absolute right-0 -bottom-7 text-xs text-sumi-soft">Neutral</span>
        <div className="absolute inset-x-0 -bottom-7 flex justify-between pr-20 text-xs text-sumi-soft" aria-hidden="true">
          <span>Red</span><span>Yellow</span><span>Green</span><span>Blue</span><span>Purple</span>
        </div>
        <ul aria-label="Combinations by hue and lightness">
          {PALETTES.map((p) => {
            const visible = on.has(p.id);
            const isPicked = picked.includes(p.id);
            return (
              <li key={p.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={place(p)}>
                <button
                  type="button"
                  disabled={!visible}
                  onClick={() => activate(p)}
                  onMouseEnter={() => setHover(p)}
                  onFocus={() => setHover(p)}
                  aria-label={`${p.code}: ${p.colors.map((c) => c.name).join(", ")}${selecting ? (isPicked ? ", picked" : "") : ""}`}
                  aria-pressed={selecting ? isPicked : undefined}
                  className={`flex h-2.5 w-7 transition-[opacity,transform] duration-300 hover:z-10 hover:scale-[2.2] focus-visible:z-10 focus-visible:scale-[2.2] md:h-3 md:w-10 ${visible ? "opacity-100" : "pointer-events-none opacity-[0.07]"} ${isPicked ? "scale-[1.8] outline-2 outline-offset-2 outline-sumi" : ""}`}
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
  );
}
