/**
 * Foam fingers as Verlet particle chains:
 *   x(t+Δt) = x + (x − x_prev)·damping + a·Δt² + k·(rest − x)
 * then several passes of distance constraints. Each chain is pulled softly
 * toward a curling rest pose rooted on the crest, so the fingers keep
 * Hokusai's clawed shape while trailing, stretching and whipping with the
 * wave. Fast-moving tips shed droplets.
 */
import type { V2 } from "./geometry";

export interface Anchor {
  p: V2; // root position
  dir: V2; // direction the finger leaves the crest
}

interface Chain {
  x: Float32Array;
  px: Float32Array;
  seg: number; // number of segments
  len: number[]; // rest length of each segment
  t: number; // where along the crest it is rooted (0..1)
  parent: number; // −1 for a root finger, else index of the chain it branches from
  at: number; // particle of the parent it branches from
  bend: number; // branch angle offset (radians)
  scale: number;
}

export interface Drop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  spin: number;
}

const ITER = 5;

export class Foam {
  chains: Chain[] = [];
  drops: Drop[] = [];
  private seed: number;

  constructor(
    roots: number[],
    private segs = 7,
    seed = 3,
  ) {
    this.seed = seed;
    for (const t of roots) {
      const main = this.add(t, -1, 0, 0, 1);
      // Each finger splits: one smaller branch outward, one inward.
      this.add(t, main, 2, 0.75, 0.48);
      this.add(t, main, 4, -0.55, 0.32);
    }
  }

  private rand() {
    this.seed = (this.seed * 16807) % 2147483647;
    return this.seed / 2147483647;
  }

  private add(t: number, parent: number, at: number, bend: number, scale: number) {
    const seg = parent < 0 ? this.segs : Math.max(3, Math.round(this.segs * 0.55));
    this.chains.push({
      x: new Float32Array((seg + 1) * 2),
      px: new Float32Array((seg + 1) * 2),
      seg,
      len: new Array(seg).fill(0),
      t,
      parent,
      at,
      bend,
      scale,
    });
    return this.chains.length - 1;
  }

  /** Place every particle on its rest pose (no history), e.g. after a resize. */
  reset(anchor: (t: number) => Anchor, size: (t: number) => number, curl: number) {
    for (let c = 0; c < this.chains.length; c++) {
      const ch = this.chains[c];
      const rest = this.restPose(c, anchor, size, curl);
      ch.x.set(rest);
      ch.px.set(rest);
    }
  }

  private restPose(c: number, anchor: (t: number) => Anchor, size: (t: number) => number, curl: number) {
    const ch = this.chains[c];
    let p: V2;
    let a: number;
    if (ch.parent < 0) {
      const an = anchor(ch.t);
      p = an.p;
      a = Math.atan2(an.dir[1], an.dir[0]);
    } else {
      const par = this.chains[ch.parent];
      const i = Math.min(ch.at, par.seg - 1);
      p = [par.x[i * 2], par.x[i * 2 + 1]];
      a = Math.atan2(par.x[i * 2 + 3] - par.x[i * 2 + 1], par.x[i * 2 + 2] - par.x[i * 2]) + ch.bend;
    }
    const total = size(ch.t) * ch.scale;
    const out = new Float32Array((ch.seg + 1) * 2);
    out[0] = p[0];
    out[1] = p[1];
    for (let k = 0; k < ch.seg; k++) {
      // Clockwise curl that tightens toward the tip: a claw closing.
      // ≈100–130° in all: a hook, never a loop.
      a -= ((0.1 + 0.16 * curl) * (0.4 + (k / ch.seg) * 1.6) * 7) / ch.seg;
      const L = (total / ch.seg) * (1.35 - (0.75 * k) / ch.seg);
      ch.len[k] = L;
      out[(k + 1) * 2] = out[k * 2] + Math.cos(a) * L;
      out[(k + 1) * 2 + 1] = out[k * 2 + 1] + Math.sin(a) * L;
    }
    return out;
  }

  step(
    dt: number,
    anchor: (t: number) => Anchor,
    size: (t: number) => number,
    curl: number,
    turbulence: number,
    wind: number,
  ) {
    const g = -2.4;
    const ax = 0.9 * turbulence + wind;
    for (let c = 0; c < this.chains.length; c++) {
      const ch = this.chains[c];
      const rest = this.restPose(c, anchor, size, curl);
      const x = ch.x;
      const px = ch.px;
      const stiff = ch.parent < 0 ? 0.16 : 0.22;
      for (let i = 1; i <= ch.seg; i++) {
        const k = i * 2;
        const vx = (x[k] - px[k]) * 0.94;
        const vy = (x[k + 1] - px[k + 1]) * 0.94;
        px[k] = x[k];
        px[k + 1] = x[k + 1];
        const tipward = i / ch.seg;
        x[k] += vx + ax * dt * dt * tipward + (rest[k] - x[k]) * stiff;
        x[k + 1] += vy + g * dt * dt * tipward + (rest[k + 1] - x[k + 1]) * stiff;
      }
      // Root follows the crest exactly.
      px[0] = x[0];
      px[1] = x[1];
      x[0] = rest[0];
      x[1] = rest[1];
      for (let it = 0; it < ITER; it++) {
        for (let s = 0; s < ch.seg; s++) {
          const a = s * 2;
          const b = a + 2;
          const dx = x[b] - x[a];
          const dy = x[b + 1] - x[a + 1];
          const d = Math.hypot(dx, dy) || 1e-6;
          const diff = (d - ch.len[s]) / d;
          if (s === 0) {
            x[b] -= dx * diff;
            x[b + 1] -= dy * diff;
          } else {
            x[a] += dx * diff * 0.5;
            x[a + 1] += dy * diff * 0.5;
            x[b] -= dx * diff * 0.5;
            x[b + 1] -= dy * diff * 0.5;
          }
        }
      }
      // A tip whipping fast enough throws a droplet.
      if (ch.parent < 0) {
        const k = ch.seg * 2;
        const vx = (x[k] - px[k]) / dt;
        const vy = (x[k + 1] - px[k + 1]) / dt;
        const speed = Math.hypot(vx, vy);
        if (this.drops.length < 220 && this.rand() < dt * (0.6 + 14 * turbulence * Math.min(speed / 0.8, 1.5))) {
          this.drops.push({
            x: x[k],
            y: x[k + 1],
            vx: vx * 0.6 + (this.rand() - 0.3) * 0.7,
            vy: vy * 0.6 + this.rand() * 0.6,
            life: 1,
            size: 0.022 + this.rand() * 0.03,
            spin: this.rand(),
          });
        }
      }
    }
    for (const d of this.drops) {
      d.vy += -3.2 * dt;
      d.vx *= Math.exp(-0.8 * dt);
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.life -= dt / (1.2 + d.spin * 0.8);
    }
    this.drops = this.drops.filter((d) => d.life > 0);
  }
}
