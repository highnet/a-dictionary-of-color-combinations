/**
 * One periodic state that every system reads, so the whole print moves as a
 * single composition and loops with no visible reset (all curves are smooth
 * and periodic in φ).
 *
 *  0–3 s gathering · 3–6 s curling · 6–9 s breaking · 9–13 s receding
 */
export const CYCLE = 13;

export interface WaveState {
  phase: number; // 0..1 through the cycle
  swell: number; // height of the great wave, 0..1
  curl: number; // how far the crest has folded over, 0..1
  turbulence: number; // spray and droplet emission, 0..1
  foam: number; // foam rim width and finger length, 0..1
}

const TAU = Math.PI * 2;

/** Smooth periodic bump centred at c with half-width w (C∞, wraps at 1). */
function bump(phi: number, c: number, w: number) {
  let d = phi - c;
  d -= Math.round(d);
  const x = d / w;
  return Math.abs(x) >= 1 ? 0 : Math.exp(1 - 1 / (1 - x * x));
}

export function stateAt(t: number, offset = 0): WaveState {
  const phase = (((t / CYCLE + offset) % 1) + 1) % 1;
  // Swell: gathers through the first half, holds, recedes. Never fully flat.
  const swell = 0.62 + 0.38 * (0.5 - 0.5 * Math.cos(TAU * (phase - 0.12)));
  // Curl lags the swell; it always keeps a hook so the print stays recognisable.
  const curl = 0.3 + 0.7 * bump(phase, 0.58, 0.42);
  const turbulence = bump(phase, 0.62, 0.22);
  const foam = 0.35 + 0.65 * bump(phase, 0.55, 0.4);
  return { phase, swell, curl, turbulence, foam };
}
