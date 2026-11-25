/**
 * The misregistered print: one calm swell, printed once per colour of a
 * four-colour combination. Each plate sits slightly off register and drifts
 * at its own pace. Pure geometry, shared by the canvas and the static SVG.
 */

export const SKY = { top: "#b8a989", mid: "#ebd3a2", low: "#f5ecc2" };

/**
 * Registration of plate k (back → front): offset as fractions of the sheet,
 * a phase, and a depth (0 back … 1 front) that scales motion and parallax.
 */
const REG = [
  { dx: -0.034, dy: -0.06, ph: 0, depth: 0.25 },
  { dx: -0.014, dy: -0.036, ph: 0.9, depth: 0.5 },
  { dx: 0.006, dy: -0.016, ph: 1.8, depth: 0.75 },
  { dx: 0.022, dy: 0.0, ph: 2.7, depth: 1 },
];

export function plateDepth(k: number, n: number) {
  return REG[Math.min(k + (4 - n), 3)].depth;
}

const STEPS = 120;
// The curve runs a little past both edges so parallax never shows a gap.
const U0 = -0.06;
const U1 = 1.06;

/**
 * Top edge of plate k at time t on a w×h sheet, as points. `lift` (0..1)
 * raises the plate while it is re-inked.
 *
 * The idle swell sums slow sines at incommensurate rates, so it never visibly
 * repeats; back plates move less than front ones, and the crest leans a little
 * forward, like a wave about to break.
 */
export function plateCurve(k: number, n: number, w: number, h: number, t: number, lift = 0): [number, number][] {
  const r = REG[Math.min(k + (4 - n), 3)];
  const a = 0.6 + 0.4 * r.depth; // amplitude of motion by depth
  const cx = 0.48 + r.dx + a * (0.022 * Math.sin(t * 0.31 + r.ph) + 0.011 * Math.sin(t * 0.173 + r.ph * 1.7));
  const base = 0.72 + r.dy - 0.05 * lift;
  const H = 0.3 + a * (0.02 * Math.sin(t * 0.43 + r.ph * 0.7) + 0.01 * Math.sin(t * 0.229 + r.ph * 1.3));
  const sigma = 0.22 + 0.014 * Math.sin(t * 0.27 + r.ph);
  const lean = 0.08 + 0.04 * Math.sin(t * 0.19 + r.ph); // forward slope steeper than the back
  const pts: [number, number][] = [];
  for (let i = 0; i <= STEPS; i++) {
    const u = U0 + ((U1 - U0) * i) / STEPS;
    const s = u < cx ? sigma * (1 + lean) : sigma * (1 - lean);
    const g = Math.exp(-(((u - cx) / s) ** 2));
    const ripple = a * (0.009 * Math.sin(u * 9 - t * 0.8 + r.ph) + 0.004 * Math.sin(u * 17 + t * 0.53 + r.ph * 2));
    const y = base - g * H + ripple;
    pts.push([u * w, y * h]);
  }
  return pts;
}

/** Closed SVG path of plate k (curve plus the sheet below it). */
export function platePath(k: number, n: number, w: number, h: number, t: number, lift = 0) {
  const pts = plateCurve(k, n, w, h, t, lift);
  const parts = [`M${pts[0][0].toFixed(1)},${h + 2}`];
  for (const [x, y] of pts) parts.push(`L${x.toFixed(1)},${y.toFixed(1)}`);
  parts.push(`L${pts[pts.length - 1][0].toFixed(1)},${h + 2}Z`);
  return parts.join("");
}
