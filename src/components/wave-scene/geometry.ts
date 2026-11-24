/**
 * Procedural geometry for the print, in stage units: the view is 10 tall
 * (y −5…5) and 10·aspect wide. All shapes are deterministic functions of the
 * layout and the shared WaveState, so the scene and the static poster agree.
 */
import type { WaveState } from "./timeline";

export type V2 = [number, number];

export interface Layout {
  W: number; // stage width
  L: number; // left edge x
  O: number; // left edge of the composition (centred on wide stages)
  C: number; // composition width (clamped so wide screens don't stretch the wave)
  crestX: number;
  sea: number; // mean sea level
}

export function layout(aspect: number): Layout {
  const W = 10 * aspect;
  const L = -W / 2;
  const C = Math.min(W, 13);
  const O = W > C ? -C / 2 - 0.04 * C : L;
  return { W, L, O, C, crestX: O + 0.4 * C, sea: -2.6 };
}

function cubic(p0: V2, p1: V2, p2: V2, p3: V2, t: number): V2 {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
}

export interface TongueSpec {
  base: V2; // root, below the sea
  crest: V2; // crest at full swell
  reach: number; // how far the lip reaches past the crest
  rise: number; // crest rise from swell 0 → 1
  width: number; // body width at the root (the inner edge becomes the wave's face)
  lip: number; // thickness of the lip at the crest
}

/** The great wave and the small foreground wave, placed for this layout. */
export function tongues(l: Layout): { main: TongueSpec; small: TongueSpec; front: TongueSpec } {
  return {
    main: {
      base: [l.O - 0.6, l.sea - 0.9],
      crest: [l.crestX, 2.5],
      reach: 0.21 * l.C,
      rise: 2.1,
      width: 6.4,
      lip: 1.15,
    },
    small: {
      base: [l.O + 0.47 * l.C, l.sea - 0.55],
      crest: [l.O + 0.6 * l.C, -1.25],
      reach: 0.07 * l.C,
      rise: 0.5,
      width: 2.6,
      lip: 0.38,
    },
    // The wave in front of the great wave's root, as in the print.
    front: {
      base: [l.O - 0.9, l.sea - 0.7],
      crest: [l.O + 0.17 * l.C, -1.05],
      reach: 0.1 * l.C,
      rise: 0.75,
      width: 3.2,
      lip: 0.5,
    },
  };
}

/**
 * The spine of a curling tongue: a long rise from the root to the crest, then
 * the lip folding forward and down into the tip. Two cubic segments joined
 * with a shared tangent at the crest. Returns points along t ∈ [0, 1].
 */
export function spine(spec: TongueSpec, s: WaveState, n: number): V2[] {
  const sw = s.swell;
  const c = s.curl;
  const crestY = spec.crest[1] - spec.rise * (1 - sw);
  const P0 = spec.base;
  const P1: V2 = [spec.crest[0] + spec.reach * 0.22 * c, crestY];
  const dx = spec.crest[0] - spec.base[0];
  const tip: V2 = [P1[0] + spec.reach * (0.82 + 0.28 * c), crestY - spec.rise * 0.32 - 1.85 * c * (spec.reach / 2.6)];
  // Shared tangent at the crest (G1): rising into the lip as it curls.
  const tan: V2 = [1, 0.12 + 0.35 * c];
  const tl = Math.hypot(tan[0], tan[1]);
  const k0 = dx * 0.32;
  const k1 = spec.reach * 0.55;
  // The back rises steeply from the sea and leans into the crest (concave).
  const A1: V2 = [P0[0] + dx * 0.42, P0[1] + (crestY - P0[1]) * 0.18];
  const A2: V2 = [P1[0] - (tan[0] / tl) * k0, P1[1] - (tan[1] / tl) * k0];
  const B1: V2 = [P1[0] + (tan[0] / tl) * k1, P1[1] + (tan[1] / tl) * k1];
  const B2: V2 = [tip[0] + spec.reach * (0.42 + 0.18 * c), tip[1] + spec.reach * (0.42 + 0.5 * c)];
  const out: V2[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    out.push(t < 0.5 ? cubic(P0, A1, A2, P1, t * 2) : cubic(P1, B1, B2, tip, t * 2 - 1));
  }
  return out;
}

/**
 * Body width along the spine. Broad at the root, so the ribbon's inner edge
 * becomes the wave's face rising out of the sea; the lip's thickness at the
 * crest; tapering to the claw tip.
 */
export function tongueWidth(spec: TongueSpec, t: number) {
  if (t < 0.5) return spec.lip + (spec.width - spec.lip) * Math.pow(1 - t / 0.5, 2.3);
  // Zero slope at the crest on both sides (no kink), tapering to the tip.
  return Math.max(spec.lip * Math.pow(1 - Math.pow((t - 0.5) / 0.5, 1.6), 0.9), 0.012);
}

/** Unit tangents and right-hand normals (into the body) of a polyline. */
export function frames(p: V2[]) {
  const tan: V2[] = [];
  const nor: V2[] = [];
  for (let i = 0; i < p.length; i++) {
    const a = p[Math.max(i - 1, 0)];
    const b = p[Math.min(i + 1, p.length - 1)];
    const x = b[0] - a[0];
    const y = b[1] - a[1];
    const m = Math.hypot(x, y) || 1;
    tan.push([x / m, y / m]);
    nor.push([y / m, -x / m]);
  }
  return { tan, nor };
}

/** Outer (spine) and inner edges of a tongue ribbon. */
export function ribbon(spec: TongueSpec, s: WaveState, n: number) {
  const raw = spine(spec, s, n);
  // Undulations travel up the body toward the lip.
  const f0 = frames(raw);
  const outer: V2[] = raw.map((p, i) => {
    const t = i / (n - 1);
    const a = 0.09 * spec.lip * Math.sin(t * 14 - s.phase * Math.PI * 2 * 3) * Math.sin(Math.PI * t);
    return [p[0] + f0.nor[i][0] * a, p[1] + f0.nor[i][1] * a];
  });
  const { tan, nor } = frames(outer);
  const inner: V2[] = outer.map((p, i) => {
    const w = tongueWidth(spec, i / (n - 1));
    return [p[0] + nor[i][0] * w, p[1] + nor[i][1] * w];
  });
  return { outer, inner, tan, nor };
}

/** Sea surface height: two swells with phase offsets and a trough under the great wave. */
export function seaY(l: Layout, s: WaveState, x: number, t: number) {
  const trough = Math.exp(-(((x - (l.crestX + 0.16 * l.C)) / 1.6) ** 2));
  return (
    l.sea +
    0.17 * Math.sin(1.25 * x - 0.85 * t) +
    0.08 * Math.sin(2.6 * x + 1.25 * t + 1.1) +
    0.035 * Math.sin(5.3 * x - 2.1 * t + 0.4) -
    0.45 * trough * s.swell
  );
}

/** Three flat sea bands (far, middle, near): each rolls at its own pace. */
export const BANDS = 3;
export function bandY(l: Layout, s: WaveState, k: number, x: number, t: number) {
  const off = [0.25, -0.45, -1.35][k];
  const amp = [0.09, 0.15, 0.2][k];
  const sp = [0.5, 0.8, 1.1][k];
  const trough = k === 0 ? 0 : 0.35 * s.swell * Math.exp(-(((x - (l.crestX + 0.16 * l.C)) / 1.8) ** 2));
  return l.sea + off + amp * Math.sin((1.1 + 0.3 * k) * x - sp * t + k * 1.9) + amp * 0.4 * Math.sin((2.3 + 0.5 * k) * x + sp * 1.3 * t + k) - trough;
}
