"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

/**
 * Ten abstract directions for the hero wave, each a small animated sketch in
 * Wada's colours. Browse with the arrows (buttons or keyboard).
 */

const C = {
  sky: "#ebd3a2",
  body: "#12354e",
  mid: "#007190",
  pale: "#a5c8d1",
  foam: "#f5ecc2",
  ink: "#051230",
};

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void;

const TAU = Math.PI * 2;

function bands(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, levels: number[], colors: string[], amp = 0.012) {
  levels.forEach((lv, k) => {
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 6) {
      const y = h * lv + h * amp * (1 + k * 0.6) * Math.sin((x / w) * TAU * (1.5 + k * 0.4) - t * (0.6 + 0.25 * k) + k * 1.7);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = colors[k];
    ctx.fill();
  });
}

/** Tapered stroke along a polyline (width per point). */
function taperPath(ctx: CanvasRenderingContext2D, pts: [number, number][], width: (i: number) => number, color: string) {
  const L: [number, number][] = [];
  const R: [number, number][] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(i - 1, 0)];
    const b = pts[Math.min(i + 1, pts.length - 1)];
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const m = Math.hypot(tx, ty) || 1;
    const hw = width(i) / 2;
    L.push([pts[i][0] - (ty / m) * hw, pts[i][1] + (tx / m) * hw]);
    R.push([pts[i][0] + (ty / m) * hw, pts[i][1] - (tx / m) * hw]);
  }
  ctx.beginPath();
  ctx.moveTo(L[0][0], L[0][1]);
  for (const p of L) ctx.lineTo(p[0], p[1]);
  for (let i = R.length - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

/** A rising back that rolls into a logarithmic spiral. */
function curlPath(cx: number, cy: number, R: number, turns: number, startX: number, startY: number) {
  const pts: [number, number][] = [];
  // Rise: quadratic from the root to the top of the curl.
  const top: [number, number] = [cx - R * 0.15, cy - R];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const u = 1 - t;
    const ctrl: [number, number] = [cx - R * 1.3, cy - R * 0.9];
    pts.push([u * u * startX + 2 * u * t * ctrl[0] + t * t * top[0], u * u * startY + 2 * u * t * ctrl[1] + t * t * top[1]]);
  }
  // Spiral: clockwise from the top, shrinking.
  const n = 120;
  for (let i = 1; i <= n; i++) {
    const a = -Math.PI / 2 + (i / n) * TAU * turns;
    const r = R * Math.exp(-0.32 * (i / n) * TAU * turns);
    pts.push([cx + Math.cos(a) * r * 1.05 - R * 0.15 * (1 - i / n), cy + Math.sin(a) * r]);
  }
  return pts;
}

const SKETCHES: { name: string; note: string; draw: Draw }[] = [
  {
    name: "Crescent",
    note: "The breaking curl reduced to one thick crescent, rocking over three flat bands.",
    draw(ctx, w, h, t) {
      const m = Math.min(w, h);
      const cx = w * 0.46;
      const cy = h * 0.5;
      const R = m * 0.3 * (1 + 0.03 * Math.sin(t * 0.9));
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.15 + 0.09 * Math.sin(t * 0.7));
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, TAU);
      ctx.arc(R * 0.32, R * 0.1, R * 0.74, 0, TAU, true);
      ctx.fillStyle = C.body;
      ctx.fill("evenodd");
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.98, Math.PI * 1.05, Math.PI * 1.75);
      ctx.lineWidth = R * 0.05;
      ctx.strokeStyle = C.foam;
      ctx.stroke();
      ctx.restore();
      bands(ctx, w, h, t, [0.66, 0.74, 0.84], [C.pale, C.mid, C.body]);
    },
  },
  {
    name: "Spiral",
    note: "A long back that rolls into a logarithmic spiral: geometry first, water second.",
    draw(ctx, w, h, t) {
      const m = Math.min(w, h);
      const R = m * 0.26;
      const cx = w * 0.55;
      const cy = h * 0.42 + Math.sin(t * 0.8) * m * 0.015;
      const turns = 1.05 + 0.15 * Math.sin(t * 0.6);
      const pts = curlPath(cx, cy, R, turns, w * 0.05, h * 0.72);
      taperPath(ctx, pts, (i) => Math.max(m * 0.13 * Math.pow(1 - i / pts.length, 0.9), 1.5), C.body);
      taperPath(ctx, pts.slice(20), (i) => Math.max(m * 0.025 * Math.pow(1 - i / (pts.length - 20), 0.7), 1), C.foam);
      bands(ctx, w, h, t, [0.7, 0.8, 0.9], [C.pale, C.mid, C.body]);
    },
  },
  {
    name: "Seigaiha",
    note: "No single wave: the classic scale pattern of concentric arcs, rows sliding at different speeds.",
    draw(ctx, w, h, t) {
      const r = Math.min(w, h) * 0.085;
      const rings = [C.body, C.mid, C.pale, C.foam, C.mid];
      for (let row = 0; row * r * 0.5 < h * 0.62 + r; row++) {
        const y = h * 0.38 + row * r * 0.5;
        const shift = ((row % 2) * r + t * r * (0.25 + 0.08 * (row % 3))) % (2 * r);
        for (let x = -2 * r + shift; x < w + 2 * r; x += 2 * r) {
          rings.forEach((c, k) => {
            ctx.beginPath();
            ctx.arc(x, y, r * (1 - k * 0.19), Math.PI, 0);
            ctx.closePath();
            ctx.fillStyle = c;
            ctx.fill();
          });
        }
      }
    },
  },
  {
    name: "Swells",
    note: "Five stacked swells; the nearest gathers into a soft crest that leans and tips, then settles.",
    draw(ctx, w, h, t) {
      bands(ctx, w, h, t, [0.42, 0.52, 0.62], [C.pale, C.mid, C.body], 0.018);
      const k = 0.5 - 0.5 * Math.cos(t * 0.7);
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let i = 0; i <= 200; i++) {
        const x0 = (i / 200) * w;
        const g = Math.exp(-(((x0 - w * 0.45) / (w * 0.2)) ** 2));
        const lean = g * g * k * w * 0.06;
        const y = h * 0.6 - g * h * 0.2 * (0.4 + 0.6 * k) + h * 0.012 * Math.sin((x0 / w) * 9 - t);
        ctx.lineTo(x0 + lean, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = C.mid;
      ctx.fill();
      bands(ctx, w, h, t + 1, [0.86], [C.body], 0.02);
    },
  },
  {
    name: "Arc fan",
    note: "Nested arcs rising from one corner and curling over, each a different blue, rolling in turn.",
    draw(ctx, w, h, t) {
      const m = Math.min(w, h);
      const cx = w * 0.28;
      const cy = h * 0.82;
      const cols = [C.body, C.mid, C.pale, C.foam, C.mid, C.body];
      for (let k = 0; k < 9; k++) {
        const r = m * (0.62 - k * 0.06);
        const end = Math.PI * (1.95 + 0.12 * Math.sin(t * 0.9 - k * 0.45));
        ctx.beginPath();
        ctx.arc(cx, cy, r, Math.PI, end);
        ctx.lineWidth = m * 0.05;
        ctx.lineCap = "round";
        ctx.strokeStyle = cols[k % cols.length];
        ctx.stroke();
      }
      bands(ctx, w, h, t, [0.84], [C.body], 0.015);
    },
  },
  {
    name: "One line",
    note: "A single sumi line draws the wave and its curl, holds, and lets go. Paper does the rest.",
    draw(ctx, w, h, t) {
      const m = Math.min(w, h);
      const pts = curlPath(w * 0.55, h * 0.45, m * 0.24, 1.2, w * 0.02, h * 0.74);
      const cycle = (t % 7) / 7;
      const show = cycle < 0.55 ? cycle / 0.55 : cycle < 0.8 ? 1 : 1 - (cycle - 0.8) / 0.2;
      const n = Math.max(2, Math.floor(pts.length * Math.min(show, 1)));
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < n; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.lineWidth = Math.max(m * 0.012, 2);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = C.ink;
      ctx.stroke();
      ctx.beginPath();
      for (let x = 0; x <= w; x += 6) ctx.lineTo(x, h * 0.78 + h * 0.01 * Math.sin((x / w) * 14 - t));
      ctx.lineWidth = Math.max(m * 0.006, 1.2);
      ctx.stroke();
    },
  },
  {
    name: "Circles",
    note: "Waves as circles: three discs rise and sink behind the bands, like a printed moon over water.",
    draw(ctx, w, h, t) {
      const m = Math.min(w, h);
      const discs = [
        { x: 0.3, r: 0.3, c: C.body, ph: 0 },
        { x: 0.62, r: 0.2, c: C.mid, ph: 1.6 },
        { x: 0.82, r: 0.12, c: C.pale, ph: 3.1 },
      ];
      for (const d of discs) {
        ctx.beginPath();
        ctx.arc(w * d.x, h * 0.66 - m * 0.08 * (0.5 + 0.5 * Math.sin(t * 0.7 + d.ph)), m * d.r, 0, TAU);
        ctx.fillStyle = d.c;
        ctx.fill();
      }
      bands(ctx, w, h, t, [0.66, 0.76, 0.87], [C.foam, C.mid, C.body], 0.01);
    },
  },
  {
    name: "Stripes",
    note: "The curl built from parallel stripes in four blues; colour flows through them like a current.",
    draw(ctx, w, h, t) {
      const m = Math.min(w, h);
      const pts = curlPath(w * 0.56, h * 0.44, m * 0.25, 0.85, w * 0.0, h * 0.8);
      const cols = [C.body, C.mid, C.pale, C.foam];
      const N = 10;
      const width = m * 0.018;
      for (let k = N - 1; k >= 0; k--) {
        const off = (k - N / 2) * width;
        const shifted = pts.map((p, i) => {
          const a = pts[Math.max(i - 1, 0)];
          const b = pts[Math.min(i + 1, pts.length - 1)];
          const tx = b[0] - a[0];
          const ty = b[1] - a[1];
          const mm = Math.hypot(tx, ty) || 1;
          const taper = Math.pow(1 - i / pts.length, 0.6);
          return [p[0] - (ty / mm) * off * taper, p[1] + (tx / mm) * off * taper] as [number, number];
        });
        taperPath(ctx, shifted, (i) => Math.max(width * Math.pow(1 - i / pts.length, 0.6), 0.8), cols[(k + Math.floor(t * 1.5)) % cols.length]);
      }
      bands(ctx, w, h, t, [0.8, 0.9], [C.mid, C.body]);
    },
  },
  {
    name: "Blocks",
    note: "The wave quantised into vertical bars; a swell travels through them and the tallest wear foam.",
    draw(ctx, w, h, t) {
      const n = 34;
      const bw = w / n;
      for (let i = 0; i < n; i++) {
        const x = i * bw;
        const p = i / n;
        const crest = Math.exp(-(((p - (0.15 + 0.7 * ((t * 0.08) % 1))) / 0.12) ** 2));
        const hh = h * (0.18 + 0.05 * Math.sin(p * 18 - t * 1.4) + 0.42 * crest);
        const col = crest > 0.6 ? C.body : crest > 0.25 ? C.mid : C.pale;
        ctx.fillStyle = col;
        ctx.fillRect(x + 1, h - hh, bw - 2, hh);
        if (crest > 0.75) {
          ctx.fillStyle = C.foam;
          ctx.fillRect(x + 1, h - hh, bw - 2, Math.max(bw * 0.45, 3));
        }
      }
    },
  },
  {
    name: "Misregistered",
    note: "One calm swell printed four times, each plate slightly off register and drifting at its own pace.",
    draw(ctx, w, h, t) {
      const plates = [
        { c: C.pale, dx: -0.02, dy: -0.03, ph: 0 },
        { c: C.mid, dx: 0.0, dy: -0.01, ph: 0.6 },
        { c: C.body, dx: 0.015, dy: 0.01, ph: 1.2 },
      ];
      for (const pl of plates) {
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let i = 0; i <= 200; i++) {
          const x0 = (i / 200) * w;
          const g = Math.exp(-(((x0 / w - 0.48 - pl.dx - 0.03 * Math.sin(t * 0.5 + pl.ph)) / 0.22) ** 2));
          const y = h * (0.7 + pl.dy) - g * h * 0.3 + h * 0.012 * Math.sin((x0 / w) * 10 - t * 0.9 + pl.ph);
          ctx.lineTo(x0, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = pl.c;
        ctx.fill();
      }
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const x0 = (i / 200) * w;
        const g = Math.exp(-(((x0 / w - 0.495 - 0.03 * Math.sin(t * 0.5 + 1.2)) / 0.22) ** 2));
        const y = h * 0.71 - g * h * 0.3 + h * 0.012 * Math.sin((x0 / w) * 10 - t * 0.9 + 1.2);
        if (i === 0) ctx.moveTo(x0, y);
        else ctx.lineTo(x0, y);
      }
      ctx.lineWidth = Math.max(Math.min(w, h) * 0.01, 2);
      ctx.strokeStyle = C.foam;
      ctx.stroke();
    },
  },
];

export function WaveLab() {
  const [i, setI] = useState(0);
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const sketch = SKETCHES[i];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setI((v) => (v + 1) % SKETCHES.length);
      if (e.key === "ArrowLeft") setI((v) => (v - 1 + SKETCHES.length) % SKETCHES.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const el = host.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const start = performance.now();
    const hold = Number(new URLSearchParams(window.location.search).get("t"));
    const frame = (now: number) => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
        cv.width = Math.round(w * dpr);
        cv.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = C.sky;
      ctx.fillRect(0, 0, w, h);
      sketch.draw(ctx, w, h, hold > 0 ? hold : (now - start) / 1000);
      if (!(hold > 0)) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [sketch]);

  const go = (d: number) => setI((v) => (v + d + SKETCHES.length) % SKETCHES.length);

  return (
    <div>
      <div className="kento relative">
        <div ref={host} className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/10]">
          <canvas ref={canvas} className="absolute inset-0 size-full" aria-label={`Wave sketch ${i + 1}: ${sketch.name}`} role="img" />
        </div>
      </div>
      <div className="mt-6 flex items-start justify-between gap-6">
        <div aria-live="polite">
          <p className="font-data text-xs text-sumi-soft">
            {String(i + 1).padStart(2, "0")} / {SKETCHES.length}
          </p>
          <h2 className="mt-1 font-display text-3xl font-bold">{sketch.name}</h2>
          <p className="mt-2 max-w-xl text-sumi-soft">{sketch.note}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => go(-1)} className="grid size-12 place-items-center border border-sumi hover:bg-washi-deep" aria-label="Previous sketch">
            <ArrowLeft className="size-5" />
          </button>
          <button type="button" onClick={() => go(1)} className="grid size-12 place-items-center border border-sumi hover:bg-washi-deep" aria-label="Next sketch">
            <ArrowRight className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
