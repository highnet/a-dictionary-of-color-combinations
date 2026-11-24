"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, StepForward } from "lucide-react";
import { WavePrint } from "./wave-print";
import { Sea, type Pt } from "./wave-sim";

export interface WavePlate {
  code: string;
  colors: { name: string; hex: string }[];
}

const WIPE_MS = 900;
const INK = "#1f1c19";
const PAPER = "#eceee8";

function luminance(hex: string) {
  const v = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(v.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Stroke a polyline with per-vertex width (round caps join the pieces). */
function strokeTapered(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  X: (x: number) => number,
  Y: (y: number) => number,
  width: (p: Pt) => number,
) {
  const q = (p: Pt) => Math.round(width(p) * 4) / 4;
  let i = 0;
  while (i < pts.length - 1) {
    const w0 = q(pts[i]);
    ctx.beginPath();
    ctx.moveTo(X(pts[i].x), Y(pts[i].y));
    let k = i + 1;
    // Batch consecutive segments of the same quantised width into one path.
    while (k < pts.length && q(pts[k]) === w0) {
      ctx.lineTo(X(pts[k].x), Y(pts[k].y));
      k++;
    }
    if (k < pts.length) ctx.lineTo(X(pts[k].x), Y(pts[k].y));
    ctx.lineWidth = w0;
    ctx.stroke();
    i = k;
  }
}

/**
 * Draws one plate's print of the simulated sea: flat bands in the plate's
 * exact colours, key-lines that swell at the crest and taper away, washi
 * claw-fingers on the lip, and spray. Vector, at device resolution.
 */
function drawPrint(ctx: CanvasRenderingContext2D, sea: Sea, colors: string[], w: number, h: number) {
  const n = colors.length;
  const X = (x: number) => x * h;
  const Y = (y: number) => (1 - y) * h;

  for (let j = 0; j < n; j++) {
    const edge = sea.edge(j, n);
    const front = j === n - 1;
    ctx.beginPath();
    ctx.moveTo(X(edge[0].x), Y(edge[0].y));
    for (let i = 1; i < edge.length; i++) ctx.lineTo(X(edge[i].x), Y(edge[i].y));
    ctx.lineTo(w + 40, h + 40);
    ctx.lineTo(-40, h + 40);
    ctx.closePath();
    ctx.fillStyle = colors[j];
    ctx.fill("nonzero");

    // Key-line: a carved line whose weight follows the crest.
    ctx.strokeStyle = luminance(colors[j]) < 0.05 ? PAPER : INK;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const base = front ? 1.15 : 0.9;
    const gain = front ? 1.9 : 0.9;
    strokeTapered(ctx, edge, X, Y, (p) => base + gain * p.w * p.w);
  }

  // Claws: washi fingers raking forward off the lip, curling down at the tips.
  for (const c of sea.claws) {
    const dm = Math.hypot(c.dx, c.dy) || 1;
    const dx = c.dx / dm;
    const dy = c.dy / dm;
    const pts: [number, number][] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const x = c.x + dx * c.len * t + 0.15 * c.len * t * t;
      const y = c.y + dy * c.len * t - 0.55 * c.len * t * t;
      pts.push([X(x), Y(y)]);
    }
    const width = Math.max(c.len * h * 0.32, 1.2);
    const left: [number, number][] = [];
    const right: [number, number][] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(i - 1, 0)];
      const b = pts[Math.min(i + 1, pts.length - 1)];
      const tx = b[0] - a[0];
      const ty = b[1] - a[1];
      const m = Math.hypot(tx, ty) || 1;
      const half = (width / 2) * (1 - i / pts.length) ** 0.8;
      left.push([pts[i][0] - (ty / m) * half, pts[i][1] + (tx / m) * half]);
      right.push([pts[i][0] + (ty / m) * half, pts[i][1] - (tx / m) * half]);
    }
    ctx.beginPath();
    ctx.moveTo(left[0][0], left[0][1]);
    for (const p of left.slice(1)) ctx.lineTo(p[0], p[1]);
    for (const p of right.reverse()) ctx.lineTo(p[0], p[1]);
    ctx.closePath();
    ctx.fillStyle = PAPER;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }

  // Spray: washi droplets, keyed.
  for (const d of sea.drops) {
    const r = d.r * h * (0.6 + 0.4 * d.life);
    ctx.beginPath();
    ctx.arc(X(d.x), Y(d.y), Math.max(r, 1), 0, Math.PI * 2);
    ctx.fillStyle = PAPER;
    ctx.fill();
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }
}

export function WaveHero({ plates }: { plates: WavePlate[] }) {
  const host = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [ready, setReady] = useState(false);
  const api = useRef<{ show: (i: number, animate: boolean) => void; setPlaying: (p: boolean) => void } | null>(null);
  const indexRef = useRef(0);
  const reduced = useRef(false);
  const visible = useRef(true);
  const onSet = useRef<(() => void) | null>(null);

  const current = plates[index];

  const go = useCallback(
    (next: number) => {
      const i = (next + plates.length) % plates.length;
      indexRef.current = i;
      setIndex(i);
      api.current?.show(i, !reduced.current);
    },
    [plates.length],
  );

  // A new plate is printed between sets, while the sea is calm.
  useEffect(() => {
    onSet.current = () => {
      if (playing && visible.current && !document.hidden) go(indexRef.current + 1);
    };
  }, [playing, go]);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) setPlaying(false);
    const el = host.current;
    if (!el) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.setAttribute("aria-hidden", "true");
    canvas.className = "absolute inset-0 size-full";
    el.appendChild(canvas);

    const sea = new Sea();
    let w = 0;
    let h = 0;
    let dpr = 1;
    let plate = 0;
    let nextPlate = 0;
    let wipeStart = -1;
    let running = !reduced.current;
    let raf = 0;
    let last = performance.now();
    let onScreen = true;
    let started = false;
    const colorsOf = (i: number) => plates[i].colors.map((c) => c.hex);

    const draw = (now: number) => {
      if (!w || !h) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      drawPrint(ctx, sea, colorsOf(plate), w, h);
      if (wipeStart >= 0) {
        // The next plate is printed across the sheet behind a keyed edge.
        const p = Math.min((now - wipeStart) / WIPE_MS, 1);
        const edge = w * (1 - Math.pow(1 - p, 3));
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, edge, h);
        ctx.clip();
        ctx.clearRect(0, 0, edge, h);
        drawPrint(ctx, sea, colorsOf(nextPlate), w, h);
        ctx.restore();
        const top = (1 - sea.edge(0, colorsOf(nextPlate).length).reduce((m, q) => Math.max(m, q.y), 0)) * h;
        ctx.fillStyle = INK;
        ctx.fillRect(edge - 0.75, top, 1.5, h - top);
        if (p >= 1) {
          plate = nextPlate;
          wipeStart = -1;
        }
      }
    };

    const resize = () => {
      w = el.clientWidth;
      h = el.clientHeight;
      if (!w || !h) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      sea.aspect = w / h;
      if (!started) {
        started = true;
        sea.launch();
        // `?wave=<s>` holds a chosen moment (captures); reduced motion holds the plunge.
        const hold = Number(new URLSearchParams(window.location.search).get("wave"));
        const t = hold > 0 ? hold : reduced.current ? 4.55 : 0;
        if (hold > 0) running = false;
        for (let i = 0; i < Math.round(t * 60); i++) sea.step(1 / 60, colorsOf(plate).length);
      }
      draw(performance.now());
    };

    const loop = (now: number) => {
      raf = 0;
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      if (running) {
        const sets = sea.sets;
        sea.step(dt, colorsOf(plate).length);
        if (sea.sets !== sets) onSet.current?.();
      }
      draw(now);
      if (onScreen && !document.hidden && (running || wipeStart >= 0)) raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    // The pointer disturbs the water; a tap splashes.
    let prev: { x: number; y: number } | null = null;
    const toSheet = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      return { x: (e.clientX - r.left) / r.height, y: 1 - (e.clientY - r.top) / r.height, inside };
    };
    const onMove = (e: PointerEvent) => {
      const q = toSheet(e);
      if (q.inside && prev && running) sea.disturb(q.x, Math.hypot(q.x - prev.x, q.y - prev.y) * 0.2);
      prev = q.inside ? q : null;
    };
    const onDown = (e: PointerEvent) => {
      const q = toSheet(e);
      if (q.inside && running) sea.splash(q.x, colorsOf(plate).length);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerdown", onDown, { passive: true });

    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      visible.current = onScreen;
      if (onScreen) kick();
    });
    io.observe(el);
    const onVis = () => !document.hidden && kick();
    document.addEventListener("visibilitychange", onVis);

    api.current = {
      show(i, animate) {
        if (animate) {
          nextPlate = i;
          wipeStart = performance.now();
          kick();
        } else {
          plate = i;
          nextPlate = i;
          wipeStart = -1;
          draw(performance.now());
        }
      },
      setPlaying(p) {
        running = p && !reduced.current;
        kick();
      },
    };
    kick();
    const readyFrame = requestAnimationFrame(() => setReady(true));

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(readyFrame);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onDown);
      document.removeEventListener("visibilitychange", onVis);
      canvas.remove();
      api.current = null;
    };
  }, [plates]);

  useEffect(() => {
    api.current?.setPlaying(playing);
  }, [playing]);

  const sky = current.colors[0].hex;

  return (
    <div className="relative flex h-full flex-col">
      <div className="kento relative min-h-0 flex-1">
        <div className="absolute inset-0 overflow-hidden" ref={host}>
          {/* Bokashi: the plate's first colour graded into the paper, as in a printed sky. */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-[46%] transition-[background-color] duration-[1600ms]"
            style={{
              backgroundColor: sky,
              maskImage: "linear-gradient(to bottom, #000 0%, #000 18%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 18%, transparent 100%)",
            }}
          />
          {!ready ? (
            <WavePrint colors={current.colors.map((c) => c.hex)} className="absolute inset-x-0 bottom-0 h-[74%] w-full" />
          ) : null}
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
        <ul
          className="flex min-w-0 flex-1 flex-wrap gap-x-4 gap-y-1.5 sm:gap-x-5 sm:gap-y-2"
          aria-live="polite"
          aria-label={`Colours of combination ${current.code}`}
        >
          {current.colors.map((c) => (
            <li key={c.hex + c.name} className="flex items-center gap-2.5">
              <span className="size-4 shrink-0 ring-1 ring-sumi/15" style={{ backgroundColor: c.hex }} aria-hidden="true" />
              <span className="text-[0.8rem] leading-tight">
                <span className="sr-only sm:not-sr-only">{c.name}</span>
                <span className="font-data text-xs text-sumi-soft uppercase sm:ml-2">{c.hex}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="grid size-11 place-items-center hover:bg-washi-deep"
            aria-label={playing ? "Pause the wave" : "Play the wave"}
            aria-pressed={!playing}
          >
            {playing ? <Pause className="size-4" strokeWidth={1.6} /> : <Play className="size-4" strokeWidth={1.6} />}
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="grid size-11 place-items-center hover:bg-washi-deep"
            aria-label="Print the next combination"
          >
            <StepForward className="size-4" strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </div>
  );
}
