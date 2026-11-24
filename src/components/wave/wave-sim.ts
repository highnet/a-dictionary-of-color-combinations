/**
 * Physics for the hero wave, in sheet units (1 = canvas height; x runs 0 → aspect).
 *
 * - The sea is a sum of Gerstner (trochoidal) waves obeying the deep-water
 *   dispersion relation ω² = g·k, so long swells outrun short ones and crests
 *   travel through wave groups at twice the group speed.
 * - A wave group shoals in from the left. When a crest's steepness k·A passes
 *   the Stokes limit it breaks: water leaves the crest as a jet whose particles
 *   fly ballistically under gravity. That arc is the curl; its leading
 *   particles are the claws.
 * - Where the jet lands it throws spray (ballistic, with drag) and drives a 1D
 *   wave-equation height field along the surface; the pointer drives it too.
 *
 * The shader evaluates the same surface functions, so the two must agree:
 * constants here are mirrored in GLSL by `surfaceGlsl()`.
 */

export const G = 0.25; // gravity, sheet units / s²
export const FIELD_N = 192; // height-field cells across the sheet
export const MAX_JET = 24;
export const MAX_SPRAY = 40;

const TAU = Math.PI * 2;

/** The breaking wave group. */
export const PACKET = {
  wavelength: 1.5,
  sigma: 0.28, // envelope half-width
  maxAmp: 0.115,
  startAmp: 0.035,
  breakAt: 0.42, // near the Stokes limit (k·A ≈ 0.44) crests break
  spentBelow: 0.26,
  arrive: 4, // seconds from a set's entry to its peak at the break point
  breakPoint: 0.42, // where along the sheet (fraction of width) the set peaks
};
const KP = TAU / PACKET.wavelength;
const WP = Math.sqrt(G * KP);
const CP = WP / KP; // phase speed
const CG = CP / 2; // group speed (deep water)

/** Ambient swell components for band j (0 = back … 1 = front). */
export function bandParams(j: number, n: number) {
  const depth = j / Math.max(n - 1, 1);
  const base = 0.6 - ((j + 1) / (n + 0.35)) * 0.44;
  const l1 = 0.3 + 0.2 * depth;
  const a1 = 0.008 + 0.018 * depth;
  const l2 = l1 * 0.53;
  const a2 = a1 * 0.42;
  return { depth, base, k1: TAU / l1, a1, p1: j * 1.37, k2: TAU / l2, a2, p2: j * 2.9 + 0.7 };
}

export interface Packet {
  x: number; // envelope centre (undisplaced coordinate)
  amp: number;
  phase: number;
  state: "growing" | "breaking" | "spent";
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
}

export class WaveSim {
  t = 0;
  aspect = 1.4;
  packet: Packet = { x: 0, amp: PACKET.startAmp, phase: 0, state: "growing" };
  /** Completed sets; the hero changes plate between sets, while the sea is calm. */
  sets = 0;
  private growth = 0;
  jet: Particle[] = [];
  spray: Particle[] = [];
  field = new Float32Array(FIELD_N);
  fieldV = new Float32Array(FIELD_N);
  private emitClock = 0;
  private seed = 1;

  private rand() {
    // Small deterministic LCG so reduced-motion stills are reproducible.
    this.seed = (this.seed * 16807) % 2147483647;
    return this.seed / 2147483647;
  }

  /**
   * Launch a new set. Its phase is chosen so that its biggest crest reaches
   * the envelope peak exactly when the group arrives at the break point, which
   * is where, in nature, the largest wave of a set breaks.
   */
  launch(atStart = false) {
    const xb = this.aspect * PACKET.breakPoint;
    const x = xb - CG * PACKET.arrive;
    const tb = this.t + PACKET.arrive;
    this.packet = { x, amp: atStart ? 0.06 : PACKET.startAmp, phase: WP * tb - KP * xb, state: "growing" };
    this.growth = (PACKET.maxAmp - this.packet.amp) / (PACKET.arrive * 0.85);
  }

  /** Height-field displacement at x (linear interpolation). */
  fieldAt(x: number) {
    const f = (x / this.aspect) * (FIELD_N - 1);
    if (f <= 0) return this.field[0];
    if (f >= FIELD_N - 1) return this.field[FIELD_N - 1];
    const i = Math.floor(f);
    return this.field[i] + (this.field[i + 1] - this.field[i]) * (f - i);
  }

  /** Surface of band j at the undisplaced coordinate x0: [X, Y]. */
  surfaceAt0(j: number, n: number, x0: number): [number, number] {
    const b = bandParams(j, n);
    const th1 = b.k1 * x0 - Math.sqrt(G * b.k1) * this.t + b.p1;
    const th2 = b.k2 * x0 - Math.sqrt(G * b.k2) * this.t + b.p2;
    let X = x0 - b.a1 * Math.sin(th1) - b.a2 * Math.sin(th2);
    let Y = b.base + b.a1 * Math.cos(th1) + b.a2 * Math.cos(th2);
    if (j === n - 1) {
      const env = Math.exp(-(((x0 - this.packet.x) / PACKET.sigma) ** 2));
      const a = this.packet.amp * env;
      const th = KP * x0 - WP * this.t + this.packet.phase;
      X -= a * Math.sin(th);
      Y += a * Math.cos(th) + 1.1 * a; // wave set-up lifts the group's mean level
    }
    return [X, Y];
  }

  /** Surface height of band j at sheet position X (Newton-inverts the Gerstner map). */
  surfaceY(j: number, n: number, X: number) {
    let x0 = X;
    for (let i = 0; i < 6; i++) {
      const [fx] = this.surfaceAt0(j, n, x0);
      const [fx2] = this.surfaceAt0(j, n, x0 + 1e-3);
      const d = Math.max((fx2 - fx) / 1e-3, 0.12);
      x0 -= (fx - X) / d;
    }
    const y = this.surfaceAt0(j, n, x0)[1];
    return j === n - 1 ? y + this.fieldAt(X) : y;
  }

  /** Nearest packet crest to the envelope centre: undisplaced x and steepness. */
  private crest() {
    const p = this.packet;
    const m = Math.round((KP * p.x - (WP * this.t - p.phase)) / TAU);
    const x0 = (WP * this.t - p.phase + TAU * m) / KP;
    const env = Math.exp(-(((x0 - p.x) / PACKET.sigma) ** 2));
    return { x0, steep: KP * p.amp * env };
  }

  private kick(x: number, dv: number) {
    const i = Math.round((x / this.aspect) * (FIELD_N - 1));
    for (let o = -8; o <= 8; o++) {
      const k = i + o;
      if (k >= 0 && k < FIELD_N) this.fieldV[k] += dv * Math.exp(-(o * o) / 18) * 0.35;
    }
  }

  /** Pointer disturbance: x in sheet units, strength ~ pointer speed. */
  disturb(x: number, strength: number) {
    this.kick(x, -Math.min(strength, 0.02));
  }

  step(dt: number, n: number) {
    this.t += dt;
    const p = this.packet;

    // The group travels at the group speed; crests overtake it at the phase speed.
    p.x += CG * dt;
    const c = this.crest();
    if (p.state === "growing") {
      p.amp = Math.min(p.amp + this.growth * dt, PACKET.maxAmp);
      if (c.steep > PACKET.breakAt) p.state = "breaking";
    } else if (p.state === "breaking") {
      // Breaking takes energy out of the group.
      p.amp *= Math.exp(-0.45 * dt);
      if (c.steep < PACKET.spentBelow) p.state = "spent";
    } else {
      p.amp *= Math.exp(-0.6 * dt);
    }
    if ((p.state === "spent" && p.amp < 0.012) || p.x > this.aspect + 0.6) {
      this.sets++;
      this.launch();
    }

    // Jet: water leaves the breaking crest at about the phase speed.
    const front = n - 1;
    if (p.state === "breaking" && c.steep > PACKET.spentBelow) {
      this.emitClock += dt;
      while (this.emitClock > 0.05) {
        this.emitClock -= 0.05;
        // Plunging breaker: the jet leaves the crest faster than the crest moves,
        // so it overtakes the face and falls ahead of it.
        const [cx, cy] = this.surfaceAt0(front, n, c.x0 + 0.01);
        if (this.jet.length < MAX_JET) {
          this.jet.push({ x: cx, y: cy, vx: CP * 1.6, vy: CP * 0.22, born: this.t });
        }
      }
    }

    // Ballistic flight; landing throws spray and disturbs the surface.
    for (const q of this.jet) {
      q.vy -= G * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
    }
    this.jet = this.jet.filter((q) => {
      const landed = this.t - q.born > 0.25 && q.y < this.surfaceY(front, n, q.x);
      if (landed) {
        this.kick(q.x, q.vy * 0.018);
        for (let s = 0; s < 2 && this.spray.length < MAX_SPRAY; s++) {
          this.spray.push({
            x: q.x,
            y: q.y,
            vx: q.vx * 0.4 + (this.rand() - 0.3) * 0.12,
            vy: 0.08 + this.rand() * 0.16,
            born: this.t,
          });
        }
      }
      return !landed && q.x < this.aspect + 0.2;
    });
    for (const q of this.spray) {
      q.vy -= G * dt;
      q.vx *= Math.exp(-1.2 * dt); // air drag
      q.vy *= Math.exp(-0.4 * dt);
      q.x += q.vx * dt;
      q.y += q.vy * dt;
    }
    this.spray = this.spray.filter((q) => this.t - q.born < 1.6 && q.y > this.surfaceY(front, n, q.x) - 0.01);

    // Height field: discrete wave equation with damping and a weak restoring force.
    const h = this.field;
    const v = this.fieldV;
    const sub = 2;
    for (let s = 0; s < sub; s++) {
      for (let i = 0; i < FIELD_N; i++) {
        const l = h[Math.max(i - 1, 0)];
        const r = h[Math.min(i + 1, FIELD_N - 1)];
        v[i] += (l + r - 2 * h[i]) * 0.22 - h[i] * 0.006;
        v[i] *= 0.982;
      }
      for (let i = 0; i < FIELD_N; i++) h[i] = Math.max(-0.03, Math.min(0.03, h[i] + v[i] * 0.5));
    }
  }

  /** The curl as a ribbon: current crest (root) then jet particles, newest first. */
  ribbon(n: number): [number, number, number][] {
    const out: [number, number, number][] = [];
    const scale = Math.min(this.packet.amp / PACKET.maxAmp, 1);
    if (this.packet.state === "breaking" && this.jet.length) {
      const c = this.crest();
      const [x, y] = this.surfaceAt0(n - 1, n, c.x0);
      out.push([x, y, 0.022 * scale + 0.006]);
    }
    for (let i = this.jet.length - 1; i >= 0; i--) {
      const q = this.jet[i];
      const age = this.t - q.born;
      out.push([q.x, q.y, (0.026 * Math.min(age / 0.12 + 0.35, 1) * Math.max(1 - age / 1.1, 0.1)) * (0.45 + 0.55 * scale)]);
    }
    return out.slice(0, MAX_JET);
  }
}

/** GLSL mirror of `surfaceAt0`/`surfaceY` (front band adds the packet and field). */
export function surfaceGlsl() {
  return /* glsl */ `
const float G = ${G.toFixed(4)};
const float KP = ${KP.toFixed(5)};
const float WP = ${WP.toFixed(5)};
const float SIGMA = ${PACKET.sigma.toFixed(4)};

vec2 surfaceAt0(float j, float n, float x0) {
  float depth = j / max(n - 1.0, 1.0);
  float base = 0.6 - (j + 1.0) / (n + 0.35) * 0.44;
  float l1 = 0.3 + 0.2 * depth;
  float a1 = 0.008 + 0.018 * depth;
  float k1 = 6.2831853 / l1;
  float k2 = 6.2831853 / (l1 * 0.53);
  float a2 = a1 * 0.42;
  float th1 = k1 * x0 - sqrt(G * k1) * uTime + j * 1.37;
  float th2 = k2 * x0 - sqrt(G * k2) * uTime + j * 2.9 + 0.7;
  float X = x0 - a1 * sin(th1) - a2 * sin(th2);
  float Y = base + a1 * cos(th1) + a2 * cos(th2);
  if (j > n - 1.5) {
    float env = exp(-pow((x0 - uPacket.x) / SIGMA, 2.0));
    float a = uPacket.y * env;
    float th = KP * x0 - WP * uTime + uPacket.z;
    X -= a * sin(th);
    Y += a * cos(th) + 1.1 * a;
  }
  return vec2(X, Y);
}

float fieldAt(float x) {
  float f = clamp(x / uAspect, 0.0, 1.0) * ${(FIELD_N - 1).toFixed(1)};
  float i = floor(f);
  float a = texture2D(uField, vec2((i + 0.5) / ${FIELD_N.toFixed(1)}, 0.5)).r;
  float b = texture2D(uField, vec2((min(i + 1.0, ${(FIELD_N - 1).toFixed(1)}) + 0.5) / ${FIELD_N.toFixed(1)}, 0.5)).r;
  return mix(a, b, f - i);
}

// Returns (surface y, crest factor 0..1) of band j at sheet x.
vec2 bandEdge(float j, float n, float X) {
  float x0 = X;
  for (int i = 0; i < 5; i++) {
    float fx = surfaceAt0(j, n, x0).x;
    float fx2 = surfaceAt0(j, n, x0 + 0.001).x;
    x0 -= (fx - X) / max((fx2 - fx) / 0.001, 0.12);
  }
  vec2 s = surfaceAt0(j, n, x0);
  float y = s.y;
  // Crest factor: how far above the band's mean the surface stands, by amplitude.
  float depth = j / max(n - 1.0, 1.0);
  float base = 0.6 - (j + 1.0) / (n + 0.35) * 0.44;
  float amp = 0.011 + 0.026 * depth;
  float crest = clamp((y - base) / (amp * 1.6), 0.0, 1.0);
  if (j > n - 1.5) {
    y += fieldAt(X);
    float env = exp(-pow((x0 - uPacket.x) / SIGMA, 2.0));
    crest = max(crest, clamp((y - base) / (uPacket.y * 2.1 + 0.001), 0.0, 1.0) * env);
  }
  return vec2(y, crest);
}
`;
}
