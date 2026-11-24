/**
 * The misregistered print: one calm swell, printed once per colour of a
 * four-colour combination. Each plate sits slightly off register and drifts
 * at its own pace. Pure geometry, shared by the canvas and the static SVG.
 */

export const SKY = { top: "#b8a989", mid: "#ebd3a2", low: "#f5ecc2" };

/** Registration of plate k (back → front): offset as fractions of the sheet. */
const REG = [
  { dx: -0.034, dy: -0.06, ph: 0 },
  { dx: -0.014, dy: -0.036, ph: 0.9 },
  { dx: 0.006, dy: -0.016, ph: 1.8 },
  { dx: 0.022, dy: 0.0, ph: 2.7 },
];

/**
 * SVG path of plate k at time t on a w×h sheet. `lift` (0..1) raises the
 * plate as it is re-inked during a change of combination.
 */
export function platePath(k: number, n: number, w: number, h: number, t: number, lift = 0) {
  const r = REG[Math.min(k + (4 - n), 3)];
  const cx = 0.48 + r.dx + 0.028 * Math.sin(t * 0.45 + r.ph);
  const base = 0.72 + r.dy - 0.045 * lift;
  const H = 0.3 + 0.025 * Math.sin(t * 0.6 + r.ph * 0.7);
  const parts = [`M0,${h + 2}`];
  const steps = 96;
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const g = Math.exp(-(((u - cx) / 0.22) ** 2));
    const y = base - g * H + 0.012 * Math.sin(u * 10 - t * 0.9 + r.ph);
    parts.push(`L${(u * w).toFixed(1)},${(y * h).toFixed(1)}`);
  }
  parts.push(`L${w},${h + 2}Z`);
  return parts.join("");
}
