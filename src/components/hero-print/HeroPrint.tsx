"use client";

import Link from "@/i18n/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, StepForward } from "lucide-react";
import { SKY, platePath } from "./print";

export interface PrintPlate {
  code: string;
  colors: { id: string; name: string; hex: string }[];
}

const HOLD_MS = 7000;
const REINK_MS = 260; // between plates when re-inking

/** Grain tile: soft paper noise, generated once. */
function grainTile() {
  const c = document.createElement("canvas");
  c.width = c.height = 160;
  const g = c.getContext("2d")!;
  const img = g.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random();
    img.data[i] = 5;
    img.data[i + 1] = 18;
    img.data[i + 2] = 48;
    img.data[i + 3] = Math.round(v * v * 46);
  }
  g.putImageData(img, 0, 0);
  return c;
}

export function HeroPrint({ plates }: { plates: PrintPlate[] }) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [live, setLive] = useState(false);
  // Colour currently inked on each plate, and when each was last re-inked.
  const inked = useRef<string[]>(plates[0].colors.map((c) => c.hex));
  const reinkAt = useRef<number[]>([-1e9, -1e9, -1e9, -1e9]);
  const indexRef = useRef(0);
  const current = plates[index];

  const go = useCallback(
    (next: number) => {
      const i = (next + plates.length) % plates.length;
      indexRef.current = i;
      setIndex(i);
      const now = performance.now();
      plates[i].colors.forEach((c, k) => {
        const at = now + k * REINK_MS;
        window.setTimeout(() => {
          inked.current[k] = c.hex;
        }, k * REINK_MS + 140);
        reinkAt.current[k] = at;
      });
    },
    [plates],
  );

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => !document.hidden && go(indexRef.current + 1), HOLD_MS);
    return () => clearInterval(id);
  }, [playing, go]);

  useEffect(() => {
    const el = host.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hold = Number(new URLSearchParams(window.location.search).get("t"));
    const grain = ctx.createPattern(grainTile(), "repeat");
    const start = performance.now();
    let raf = 0;
    let onScreen = true;
    let stopStill = () => {};

    const draw = (now: number) => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
        cv.width = Math.round(w * dpr);
        cv.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Sky: a graded bokashi, then paper grain (on the sky only).
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, SKY.top);
      sky.addColorStop(0.42, SKY.mid);
      sky.addColorStop(1, SKY.low);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      if (grain) {
        ctx.fillStyle = grain;
        ctx.fillRect(0, 0, w, h);
      }
      const t = hold > 0 ? hold : reduced ? 2 : (now - start) / 1000;
      const n = inked.current.length;
      for (let k = 0; k < n; k++) {
        // A plate being re-inked lifts off register and settles back.
        const dt = (now - reinkAt.current[k]) / 520;
        const lift = dt >= 0 && dt < 1 ? Math.sin(Math.PI * dt) : 0;
        ctx.fillStyle = inked.current[k];
        ctx.fill(new Path2D(platePath(k, n, w, h, t, lift)));
      }
    };
    const loop = (now: number) => {
      raf = 0;
      draw(now);
      if (onScreen && !document.hidden && !reduced && !(hold > 0)) raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      if (onScreen) kick();
    });
    io.observe(el);
    const ro = new ResizeObserver(() => draw(performance.now()));
    ro.observe(el);
    const onVis = () => !document.hidden && kick();
    document.addEventListener("visibilitychange", onVis);
    if (reduced) {
      // A still: redraw only when the combination changes.
      const id = setInterval(() => draw(performance.now()), 300);
      stopStill = () => clearInterval(id);
    }
    kick();
    const ready = requestAnimationFrame(() => setLive(true));
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(ready);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      stopStill();
    };
  }, []);

  return (
    <div className="relative flex h-full flex-col">
      <div className="kento relative min-h-0 flex-1">
        <div ref={host} className="absolute inset-0 overflow-hidden" style={{ background: `linear-gradient(${SKY.top}, ${SKY.mid} 42%, ${SKY.low})` }}>
          {!live ? (
            <svg aria-hidden="true" className="absolute inset-0 size-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
              {plates[0].colors.map((c, k) => (
                <path key={c.id} d={platePath(k, plates[0].colors.length, 1000, 1000, 0)} fill={c.hex} />
              ))}
            </svg>
          ) : null}
          <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 size-full" />
          <Link
            href={`/combinations/${current.code}`}
            className="cartouche absolute top-4 right-4 z-10 text-lg transition-transform hover:-translate-y-0.5 md:text-xl"
            aria-label={`Open combination ${current.code}`}
          >
            {current.code}
          </Link>
        </div>
      </div>
      <div className="mt-3 flex items-start justify-between gap-x-4 px-[var(--gutter)] lg:px-0">
        <ul className="flex min-w-0 flex-1 flex-wrap gap-x-4 gap-y-1.5 sm:gap-x-5 sm:gap-y-2" aria-live="polite" aria-label={`Colours of combination ${current.code}`}>
          {current.colors.map((c) => (
            <li key={c.id}>
              <Link href={`/colours/${c.id}`} className="group flex items-center gap-2.5">
                <span className="size-4 shrink-0 ring-1 ring-sumi/15" style={{ backgroundColor: c.hex }} aria-hidden="true" />
                <span className="text-[0.8rem] leading-tight group-hover:underline">
                  <span className="sr-only sm:not-sr-only">{c.name}</span>
                  <span className="font-data text-xs text-sumi-soft uppercase sm:ml-2">{c.hex}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="grid size-11 place-items-center hover:bg-washi-deep"
            aria-label={playing ? "Pause" : "Play"}
            aria-pressed={!playing}
          >
            {playing ? <Pause className="size-4" strokeWidth={1.6} /> : <Play className="size-4" strokeWidth={1.6} />}
          </button>
          <button type="button" onClick={() => go(index + 1)} className="grid size-11 place-items-center hover:bg-washi-deep" aria-label="Print the next combination">
            <StepForward className="size-4" strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </div>
  );
}
