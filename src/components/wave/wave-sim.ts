/**
 * The sea. Sheet units: 1 = canvas height, x runs 0 → aspect, y up.
 *
 * Background swell: Lagrangian Gerstner waves, each component obeying the
 * deep-water dispersion relation ω² = g·k (long waves outrun short ones).
 *
 * The great wave is a constructed silhouette (back slope, crest, lip, barrel
 * ceiling, face) whose every parameter is driven by physics:
 *  - shoaling: height grows and the face steepens as it nears the break point;
 *  - plunge: the lip tip leaves the crest at constant horizontal speed and
 *    falls freely, y = H − ½·g·τ², landing at τ = √(2H/g);
 *  - impact: ballistic spray with air drag, and a 1D wave-equation height
 *    field (also driven by the pointer) that carries the ripples away.
 * Everything is returned as polylines; the renderer only fills and strokes.
 */

export const G = 0.3;
const TAU = Math.PI * 2;

const HMAX = 0.3; // crest height above the sea at the break
const SWELL = 3.6; // s of shoaling before the break
const COLLAPSE = 1.0; // s for the lip to sink after impact
const CALM = 1.6; // s of quiet before the next set
const SPEED = 0.07; // crest speed across the sheet
const BREAK_AT = 0.38; // fraction of the width where the crest breaks
export const FIELD_N = 160;

export type Stage = "swell" | "break" | "collapse" | "calm";
export type Pt = { x: number; y: number; w: number }; // w: key-line weight 0..1

export interface Drop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  r: number;
}

export interface Claw {
  x: number;
  y: number;
  dx: number;
  dy: number;
  len: number;
}

export function bandBase(j: number, n: number) {
  return 0.56 - ((j + 1) / (n + 0.35)) * 0.4;
}

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
};

type V = [number, number];
/** Flatten a cubic Bézier into points (excluding the start point). */
function cubic(out: Pt[], p0: V, p1: V, p2: V, p3: V, w0: number, w1: number, steps = 28) {
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
    const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
    out.push({ x, y, w: w0 + (w1 - w0) * t });
  }
}

export class Sea {
  t = 0;
  aspect = 1;
  sets = 0;
  stage: Stage = "swell";
  drops: Drop[] = [];
  claws: Claw[] = [];
  field = new Float32Array(FIELD_N);
  fieldV = new Float32Array(FIELD_N);

  private tStage = 0;
  private H = 0.08;
  private Tf = 1;
  private xc = 0;
  private seed = 11;

  private rand() {
    this.seed = (this.seed * 16807) % 2147483647;
    return this.seed / 2147483647;
  }

  launch() {
    this.stage = "swell";
    this.tStage = this.t;
  }

  /** Progress through the current stage, 0..1. */
  private progress(duration: number) {
    return Math.min((this.t - this.tStage) / duration, 1);
  }

  fieldAt(x: number) {
    const f = Math.min(Math.max(x / this.aspect, 0), 1) * (FIELD_N - 1);
    const i = Math.min(Math.floor(f), FIELD_N - 2);
    return this.field[i] + (this.field[i + 1] - this.field[i]) * (f - i);
  }

  /** Background swell of band j: Gerstner particle at rest position x0. */
  private gerstner(j: number, n: number, x0: number, calm = 1): Pt {
    const depth = j / Math.max(n - 1, 1);
    const l1 = 0.34 + 0.22 * depth;
    const a1 = (0.007 + 0.015 * depth) * calm;
    const k1 = TAU / l1;
    const k2 = TAU / (l1 * 0.47);
    const a2 = a1 * 0.4;
    const th1 = k1 * x0 - Math.sqrt(G * k1) * this.t + j * 1.37;
    const th2 = k2 * x0 - Math.sqrt(G * k2) * this.t + j * 2.9 + 0.7;
    return {
      x: x0 - a1 * Math.sin(th1) - a2 * Math.sin(th2),
      y: bandBase(j, n) + a1 * Math.cos(th1) + a2 * Math.cos(th2),
      w: 0.5 + 0.5 * Math.cos(th1),
    };
  }

  /** Front band's calm surface height at x (small swell plus ripples). */
  private sea(x: number, n: number) {
    const p = this.gerstner(n - 1, n, x, 0.6);
    return p.y + this.fieldAt(x);
  }

  /** The great wave's geometry for the current moment. */
  private wave() {
    const s = this.stage;
    let H = this.H;
    let lam = 0; // lip extension 0..1 (ballistic time / fall time)
    let thick = 1;
    if (s === "swell") {
      H = HMAX * smooth(0, 1, this.progress(SWELL));
    } else if (s === "break") {
      lam = this.progress(this.Tf);
    } else if (s === "collapse") {
      const k = this.progress(COLLAPSE);
      lam = 1;
      H = this.H * (1 - 0.8 * smooth(0, 1, k));
      thick = 1 - k;
    } else {
      H = this.H * 0.2 * (1 - smooth(0, 0.45, this.progress(CALM)));
      lam = 0;
    }
    const steep =
      s === "swell" ? smooth(0.2, 1, this.progress(SWELL)) : s === "calm" ? 1 - smooth(0, 0.3, this.progress(CALM)) : 1;
    return { H, lam, thick, steep };
  }

  /** Top edge of band j as a polyline, left to right (the front band may overhang). */
  edge(j: number, n: number): Pt[] {
    const out: Pt[] = [];
    const x0s = -0.12;
    const x1s = this.aspect + 0.12;
    if (j < n - 1) {
      for (let x0 = x0s; x0 <= x1s; x0 += 0.004) out.push(this.gerstner(j, n, x0));
      return out;
    }

    const { H, lam, thick, steep } = this.wave();
    const xc = this.xc;
    const backLen = H * 3.2;
    const faceLen = H * (2.3 - 1.3 * steep);
    const xb = xc - backLen;
    const L = 0.95 * this.H; // lip reach at impact
    const tipX = xc + L * lam;
    const xt = Math.max(xc + faceLen, tipX + H * 0.55);

    // Calm sea up to the back of the wave.
    for (let x = x0s; x < xb; x += 0.004) out.push({ x, y: this.sea(x, n), w: 0.3 });

    const y0b = this.sea(xb, n);
    const y0t = this.sea(xt, n);
    const C: V = [xc, Math.max(y0b, y0t) + H];
    const B: V = [xb, y0b];
    const T: V = [xt, y0t];
    out.push({ x: B[0], y: B[1], w: 0.3 });

    // Tangent at the crest, shared by both sides so the crest is smooth (G1).
    const rise = lam > 0.001 ? 0.75 * Math.min(lam * 3, 1) : 0.04;
    const tm = Math.hypot(1, rise);
    const tau: V = [1 / tm, rise / tm];

    // Back slope: a long rise that gathers into the crest.
    cubic(out, B, [xb + backLen * 0.55, y0b + H * 0.05], [xc - tau[0] * backLen * 0.3, C[1] - tau[1] * backLen * 0.3], C, 0.3, 1);

    if (lam <= 0.001) {
      // Shoaling crest: the face steepens as the wave nears its break.
      cubic(out, C, [xc + tau[0] * faceLen * 0.22, C[1] + tau[1] * faceLen * 0.22], [xt - faceLen * 0.55, y0t], T, 1, 0.3);
    } else {
      // Ballistic tip: forward at constant speed, falling freely to the sea.
      const tip: V = [tipX, C[1] + H * 0.12 * Math.sin(Math.PI * lam) - (C[1] - y0t) * lam * lam];
      const r = H * 0.5 * Math.min(lam * 2, 1); // curl radius
      const reach = L * lam * 0.32 + r * 0.25;
      // Outer edge: up and over, then down into the tip from the front.
      cubic(out, C, [xc + tau[0] * reach, C[1] + tau[1] * reach], [tip[0] + r * 0.62, tip[1] + r * 0.95], tip, 1, 1);
      const lipEnd = out.length;
      // Barrel ceiling: back from the tip under the lip. On collapse it comes
      // down onto the tip, closing and filling the barrel.
      const fill = 1 - thick;
      const I0: V = [xc + H * 0.12 * lam, C[1] - H * (0.28 + 0.2 * lam) * Math.min(lam * 3, 1)];
      const f = Math.pow(fill, 0.6);
      const I: V = [I0[0] + (tip[0] - I0[0]) * f, I0[1] + (tip[1] - I0[1]) * f];
      const c2: V = [I[0] + r * 0.65 * thick + 0.001, I[1] + r * 0.25 * thick];
      cubic(out, tip, [tip[0] - r * 0.05, tip[1] + r * (0.45 + 0.24 * thick) * (0.4 + 0.6 * thick)], c2, I, 0.8, 0.6);
      // Face: the barrel's back wall, leaving the ceiling on its own tangent.
      const dx = I[0] - c2[0];
      const dy = I[1] - c2[1];
      const dm = Math.hypot(dx, dy) || 1;
      const out1: V = [I[0] + (dx / dm) * H * 0.3, I[1] + (dy / dm) * H * 0.3 - H * 0.12];
      cubic(out, I, out1, [xt - faceLen * 0.6, y0t], T, 0.6, 0.3);

      // Claws: washi fingers fanning from the outer edge near the tip.
      this.claws = [];
      if (this.stage === "break" && lam > 0.18) {
        const span = Math.min(14, lipEnd - 2);
        for (let k = 0; k < 7; k++) {
          const i = lipEnd - 2 - Math.round((k / 6) * span);
          const a = out[i];
          const b = out[i + 1];
          const tx = b.x - a.x;
          const ty = b.y - a.y;
          const m = Math.hypot(tx, ty) || 1;
          // Outward normal of a left-to-right edge is (−ty, tx); rake toward travel.
          const nx = -ty / m;
          const ny = tx / m;
          this.claws.push({
            x: a.x,
            y: a.y,
            dx: nx * 0.55 + (tx / m) * 0.85,
            dy: ny * 0.55 + (ty / m) * 0.85,
            len: H * (0.07 + 0.05 * ((k * 7) % 3) / 2) * Math.min((lam - 0.18) * 2.2, 1),
          });
        }
      } else {
        this.claws = [];
      }
    }
    if (lam <= 0.001) this.claws = [];

    for (let x = xt + 0.004; x <= x1s; x += 0.004) out.push({ x, y: this.sea(x, n), w: 0.3 });
    return out;
  }

  private kick(x: number, dv: number) {
    const i = Math.round(Math.min(Math.max(x / this.aspect, 0), 1) * (FIELD_N - 1));
    for (let o = -10; o <= 10; o++) {
      const k = i + o;
      if (k >= 0 && k < FIELD_N) this.fieldV[k] += dv * Math.exp(-(o * o) / 24);
    }
  }

  /** Pointer drag over the water. */
  disturb(x: number, strength: number) {
    this.kick(x, -Math.min(strength, 0.008));
  }

  /** A tap: a splash where the pointer touched the water. */
  splash(x: number, n: number) {
    const y = this.sea(x, n);
    this.kick(x, -0.01);
    for (let i = 0; i < 9; i++) {
      this.drops.push({ x, y, vx: (this.rand() - 0.5) * 0.3, vy: 0.2 + this.rand() * 0.3, life: 1, r: 0.004 + this.rand() * 0.004 });
    }
  }

  step(dt: number, n: number) {
    this.t += dt;
    const xbreak = this.aspect * BREAK_AT;
    if (this.stage === "swell") {
      this.xc = xbreak - SPEED * (SWELL - (this.t - this.tStage));
      if (this.t - this.tStage >= SWELL) {
        this.stage = "break";
        this.tStage = this.t;
        this.H = HMAX;
        this.Tf = Math.sqrt((2 * HMAX) / G); // free-fall time of the tip
      }
    } else {
      // Breaking slows the crest; it keeps creeping forward.
      this.xc += SPEED * 0.5 * dt;
      if (this.stage === "break" && this.t - this.tStage >= this.Tf) {
        this.stage = "collapse";
        this.tStage = this.t;
        // Impact: the tip lands at speed √(2gH) and throws spray.
        const tipX = this.xc + 0.95 * this.H;
        const y = this.sea(tipX, n);
        const v = Math.sqrt(2 * G * this.H);
        this.kick(tipX, -0.014);
        for (let i = 0; i < 30; i++) {
          this.drops.push({
            x: tipX + (this.rand() - 0.6) * 0.04,
            y,
            vx: (0.05 + this.rand() * 0.25) * (this.rand() < 0.75 ? 1 : -0.6),
            vy: v * (0.2 + this.rand() * 0.45),
            life: 1,
            r: 0.003 + this.rand() * 0.006,
          });
        }
      } else if (this.stage === "collapse" && this.t - this.tStage >= COLLAPSE) {
        this.stage = "calm";
        this.tStage = this.t;
      } else if (this.stage === "calm" && this.t - this.tStage >= CALM) {
        this.sets++;
        this.launch();
      }
    }

    for (const d of this.drops) {
      d.vy -= G * dt;
      d.vx *= Math.exp(-0.9 * dt);
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.life -= dt / 1.6;
    }
    this.drops = this.drops.filter((d) => d.life > 0 && (d.vy > 0 || d.y > this.sea(d.x, n)));

    const h = this.field;
    const v = this.fieldV;
    for (let s = 0; s < 2; s++) {
      for (let i = 0; i < FIELD_N; i++) {
        const l = h[Math.max(i - 1, 0)];
        const r = h[Math.min(i + 1, FIELD_N - 1)];
        v[i] += (l + r - 2 * h[i]) * 0.2 - h[i] * 0.006;
        v[i] *= 0.984;
      }
      for (let i = 0; i < FIELD_N; i++) h[i] = Math.max(-0.02, Math.min(0.02, h[i] + v[i] * 0.5));
    }
  }
}
