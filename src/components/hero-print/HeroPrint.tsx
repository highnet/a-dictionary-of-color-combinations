"use client";

import Link from "@/i18n/link";
import { useTranslation } from "@/i18n/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, StepForward } from "lucide-react";
import { SKY, plateCurve, plateDepth, platePath } from "./print";

export interface PrintPlate {
  code: string;
  colors: { id: string; name: string; hex: string }[];
}

const HOLD_MS = 7000;
const STAGGER_MS = 240; // between plates, back to front, when re-inking
const PASS_MS = 1100; // one plate's pass: lift, sweep of new ink, settle into register

/** One plate's ink: the colour it had, the colour it is taking, and when the pass starts. */
interface Ink {
  from: string;
  to: string;
  start: number;
}

const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

/** Where the new ink's leading edge is, as a fraction of the sheet's width, at pass progress p. */
const sweepFront = (p: number) => -0.12 + easeInOut(Math.min(1, Math.max(0, p) / 0.8)) * 1.3;

/** Lift through a pass: up as the ink goes on, then down into register with a small overshoot. */
function liftAt(p: number) {
  if (p <= 0 || p >= 1) return 0;
  if (p < 0.3) return Math.sin(((p / 0.3) * Math.PI) / 2);
  const x = (p - 0.3) / 0.7;
  return Math.exp(-5 * x) * Math.cos(2.6 * Math.PI * x);
}

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
  const { t } = useTranslation("home");
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [live, setLive] = useState(false);
  // Each plate's ink, and the pass that changes it.
  const inks = useRef<Ink[]>(plates[0].colors.map((c) => ({ from: c.hex, to: c.hex, start: -1e9 })));
  const indexRef = useRef(0);
  const current = plates[index];

  const go = useCallback(
    (next: number) => {
      const i = (next + plates.length) % plates.length;
      indexRef.current = i;
      setIndex(i);
      const now = performance.now();
      const colors = plates[i].colors;
      inks.current = colors.map((c, k) => {
        const prev = inks.current[k];
        // Start from whatever covers most of the plate now, even mid-pass: the new ink
        // once its leading edge has passed the crest (near the middle), else the old.
        const showing = !prev ? c.hex : sweepFront((now - prev.start) / PASS_MS) >= 0.5 ? prev.to : prev.from;
        return { from: showing, to: c.hex, start: now + k * STAGGER_MS };
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
    // Cursor parallax: the target follows the pointer, the shown value eases after it.
    const aim = { x: 0, y: 0 };
    const look = { x: 0, y: 0 };

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
      if (!reduced) {
        look.x += (aim.x - look.x) * 0.06;
        look.y += (aim.y - look.y) * 0.06;
      }
      const list = inks.current;
      const n = list.length;
      for (let k = 0; k < n; k++) {
        const ink = list[k];
        const p = reduced ? 1 : Math.min(1, Math.max(0, (now - ink.start) / PASS_MS));
        const pts = plateCurve(k, n, w, h, t, liftAt(p));
        const plate = new Path2D();
        plate.moveTo(pts[0][0], h * 1.1); // well below the sheet, so parallax never lifts it into view
        for (const [x, y] of pts) plate.lineTo(x, y);
        plate.lineTo(pts[pts.length - 1][0], h * 1.1);
        plate.closePath();

        const depth = plateDepth(k, n);
        ctx.save();
        ctx.translate(look.x * depth * w * 0.014, look.y * depth * h * 0.008);
        if (p <= 0 || p >= 1) {
          ctx.fillStyle = p >= 1 ? ink.to : ink.from;
          ctx.fill(plate);
        } else {
          // The new ink is laid in one pass across the sheet, with a ragged,
          // slightly wet leading edge, over the old ink.
          ctx.fillStyle = ink.from;
          ctx.fill(plate);
          const front = sweepFront(p) * w;
          const edge = new Path2D();
          edge.moveTo(-w, -h);
          for (let y = -h * 0.1; y <= h * 1.1; y += 6) {
            edge.lineTo(front + 9 * Math.sin(y * 0.045 + k * 1.7) + 5 * Math.sin(y * 0.13 + k * 3.1), y);
          }
          edge.lineTo(-w, h * 2);
          edge.closePath();
          ctx.save();
          ctx.clip(edge);
          ctx.fillStyle = ink.to;
          ctx.fill(plate);
          ctx.restore();
        }
        // The crest takes a little more ink, as a block print does at its edge.
        const crest = new Path2D();
        crest.moveTo(pts[0][0], pts[0][1]);
        for (const [x, y] of pts) crest.lineTo(x, y);
        ctx.strokeStyle = "rgb(24 18 10 / 0.14)";
        ctx.lineWidth = 1.1;
        ctx.stroke(crest);
        ctx.restore();
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
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      aim.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      aim.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    };
    const onLeave = () => {
      aim.x = 0;
      aim.y = 0;
    };
    el.addEventListener("pointermove", onPointer);
    el.addEventListener("pointerleave", onLeave);
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
      el.removeEventListener("pointermove", onPointer);
      el.removeEventListener("pointerleave", onLeave);
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
          {/* The link stays mounted (keyboard focus survives a change); only its number re-enters. */}
          <Link
            href={`/combinations/${current.code}`}
            className="cartouche absolute top-4 right-4 z-10 text-lg transition-transform hover:-translate-y-0.5 md:text-xl"
            aria-label={t("print.open", { code: current.code })}
          >
            <span key={current.code} className="print-in block">
              {current.code}
            </span>
          </Link>
        </div>
      </div>
      <div className="mt-3 flex items-start justify-between gap-x-4 px-[var(--gutter)] lg:px-0">
        <ul className="flex min-w-0 flex-1 flex-wrap gap-x-4 gap-y-1.5 sm:gap-x-5 sm:gap-y-2" aria-live="polite" aria-label={t("print.colours", { code: current.code })}>
          {current.colors.map((c, k) => (
            <li key={`${current.code}-${c.id}`} className="print-in" style={{ animationDelay: `${k * STAGGER_MS}ms` }}>
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
            aria-label={playing ? t("print.pause") : t("print.play")}
            aria-pressed={!playing}
          >
            {playing ? <Pause className="size-4" strokeWidth={1.6} /> : <Play className="size-4" strokeWidth={1.6} />}
          </button>
          <button type="button" onClick={() => go(index + 1)} className="grid size-11 place-items-center hover:bg-washi-deep" aria-label={t("print.next")}>
            <StepForward className="size-4" strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </div>
  );
}
