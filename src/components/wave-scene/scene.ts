/**
 * The Great Wave as a 2D animated print on a Three.js stage: orthographic
 * camera, painter's order via renderOrder (z only layers), fixed-topology
 * meshes whose vertices move each frame. Colours are written as raw sRGB
 * (colour management off), so every fill is exactly a Wada colour.
 */
import * as THREE from "three";
import { INKS, rgb } from "./palette";
import { frames, fuji, layout, ribbon, seaY, tongues, type Layout, type TongueSpec, type V2 } from "./geometry";
import { stateAt, type WaveState } from "./timeline";
import { Foam, type Anchor } from "./verlet";

THREE.ColorManagement.enabled = false;

const col = (key: keyof typeof INKS) => new THREE.Vector3(...rgb(INKS[key].hex));

// ---------- shaders -------------------------------------------------------

const RIBBON_VERT = /* glsl */ `
varying vec2 vUv;
varying vec2 vPos;
void main() {
  vUv = uv;
  vPos = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SEA_FN = /* glsl */ `
uniform float uTime;
uniform float uSea;
uniform float uCrestX;
uniform float uComp;
uniform float uSwell;
float seaY(float x) {
  float trough = exp(-pow((x - (uCrestX + 0.16 * uComp)) / 1.6, 2.0));
  return uSea + 0.17 * sin(1.25 * x - 0.85 * uTime) + 0.08 * sin(2.6 * x + 1.25 * uTime + 1.1)
    + 0.035 * sin(5.3 * x - 2.1 * uTime + 0.4) - 0.45 * trough * uSwell;
}
// Anti-aliased line of the given pixel half-width at integer values of f.
float lines(float f, float halfPx) {
  float d = abs(fract(f + 0.5) - 0.5) / max(fwidth(f), 1e-5);
  return 1.0 - smoothstep(halfPx - 0.5, halfPx + 0.5, d);
}
float edge(float v, float px) {
  return 1.0 - smoothstep(px - 0.5, px + 0.5, v / max(fwidth(v), 1e-5));
}
`;

const TONGUE_FRAG = /* glsl */ `
uniform vec3 uBody;
uniform vec3 uMid;
uniform vec3 uPale;
uniform vec3 uFoamC;
uniform vec3 uInk;
uniform float uFoam;
varying vec2 vUv;
varying vec2 vPos;
${SEA_FN}
void main() {
  // The wave rises out of the sea: nothing of it is drawn below the surface.
  if (vPos.y < seaY(vPos.x) - 0.02) discard;
  float t = vUv.x;
  float v = vUv.y;
  float fv = max(fwidth(v), 1e-5);
  vec3 c = uBody;
  // Lighter water toward the hollow, its boundary rippling with the crest.
  float b = 0.6 + 0.06 * sin(t * 30.0 - uTime * 2.6);
  float inner = smoothstep(b - fv, b + fv, v);
  c = mix(c, uMid, inner);
  // Engraved lines following the form, finer toward the outer edge.
  float L = pow(v, 0.75) * 24.0 + 0.6 * sin(t * 22.0 - uTime * 2.4) + 0.25 * sin(t * 61.0 - uTime * 3.7);
  float ln = lines(L, 0.45) * smoothstep(0.03, 0.12, v) * smoothstep(1.0, 0.9, v);
  c = mix(c, mix(uPale, uBody, inner), ln * 0.9);
  // Foam rim along the crest and lip, its underside scalloped.
  float fz = (0.06 + 0.13 * uFoam) * smoothstep(0.3, 0.56, t) * (0.6 + 0.4 * abs(sin(t * 120.0 - 3.2 * uTime)));
  float foam = 1.0 - smoothstep(fz - fv, fz + fv, v);
  c = mix(c, uFoamC, foam);
  float fl = (1.0 - smoothstep(0.35, 1.15, abs(v - fz) / fv)) * step(0.004, fz);
  c = mix(c, uInk, fl);
  // Key-lines on both edges.
  c = mix(c, uInk, max(edge(v, 1.5), edge(1.0 - v, 1.2)));
  gl_FragColor = vec4(c, 1.0);
}
`;

const SEA_VERT = /* glsl */ `
attribute float depth;
attribute float crest;
varying float vDepth;
varying float vCrest;
varying vec2 vPos;
void main() {
  vDepth = depth;
  vCrest = crest;
  vPos = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SEA_FRAG = /* glsl */ `
uniform vec3 uBody;
uniform vec3 uPale;
uniform vec3 uFoamC;
uniform vec3 uInk;
varying float vDepth;
varying float vCrest;
varying vec2 vPos;
${SEA_FN}
void main() {
  vec3 c = uBody;
  // Engraved lines parallel to the surface, fading with depth.
  float L = vDepth * 4.2 + 0.35 * sin(vPos.x * 2.7 + uTime * 0.6);
  float ln = lines(L, 0.45) * smoothstep(1.7, 0.35, vDepth) * step(0.1, vDepth);
  c = mix(c, uPale, ln * 0.85);
  // Foam caps on the swells' crests.
  float cap = 0.09 * pow(vCrest, 2.5) * (0.6 + 0.4 * abs(sin(vPos.x * 34.0 + uTime * 0.4)));
  float fd = max(fwidth(vDepth), 1e-5);
  float foam = 1.0 - smoothstep(cap - fd, cap + fd, vDepth);
  c = mix(c, uFoamC, foam * step(0.006, cap));
  c = mix(c, uInk, (1.0 - smoothstep(0.35, 1.1, abs(vDepth - cap) / fd)) * step(0.006, cap));
  c = mix(c, uInk, edge(vDepth, 1.4));
  gl_FragColor = vec4(c, 1.0);
}
`;

const FOAM_FRAG = /* glsl */ `
uniform vec3 uFoamC;
uniform vec3 uInk;
varying vec2 vUv;
void main() {
  float v = vUv.y;
  float fv = max(fwidth(v), 1e-5);
  float e = min(v, 1.0 - v) / fv;
  vec3 c = mix(uInk, uFoamC, smoothstep(0.7, 1.6, e));
  gl_FragColor = vec4(c, 1.0);
}
`;

const SKY_FRAG = /* glsl */ `
uniform vec3 uSky;
uniform vec3 uLow;
uniform vec3 uInk;
varying vec2 vUv;
void main() {
  vec3 c = mix(uLow, uSky, smoothstep(0.25, 0.85, vUv.y));
  // Bokashi: a graded band of ink across the top of the sheet.
  c = mix(c, uInk, 0.22 * smoothstep(0.82, 1.0, vUv.y));
  gl_FragColor = vec4(c, 1.0);
}
`;

const GRAIN_FRAG = /* glsl */ `
uniform vec3 uInk;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec2 q = floor(gl_FragCoord.xy / 1.5);
  float n = hash(q) * 0.7 + hash(floor(q / 7.0) + 3.1) * 0.3;
  gl_FragColor = vec4(uInk, 0.075 * n);
}
`;

// ---------- helpers -------------------------------------------------------

function mat(frag: string, uniforms: Record<string, THREE.IUniform>, vert = RIBBON_VERT, transparent = false) {
  return new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms,
    depthTest: false,
    depthWrite: false,
    transparent,
    side: THREE.DoubleSide,
  });
}

function stripGeometry(columns: number, extra: Record<string, number> = {}) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(columns * 2 * 3), 3));
  g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(columns * 2 * 2), 2));
  for (const [name, size] of Object.entries(extra)) {
    g.setAttribute(name, new THREE.BufferAttribute(new Float32Array(columns * 2 * size), size));
  }
  const idx: number[] = [];
  for (let i = 0; i < columns - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  g.setIndex(idx);
  return g;
}

/** Catmull–Rom subdivision of a polyline, `sub` points per segment. */
function smoothChain(x: Float32Array, n: number, sub: number, out: V2[]) {
  out.length = 0;
  const P = (i: number): V2 => {
    const k = Math.min(Math.max(i, 0), n - 1) * 2;
    return [x[k], x[k + 1]];
  };
  for (let i = 0; i < n - 1; i++) {
    const p0 = P(i - 1);
    const p1 = P(i);
    const p2 = P(i + 1);
    const p3 = P(i + 2);
    for (let s = 0; s < sub; s++) {
      const t = s / sub;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(P(n - 1));
}

// ---------- scene ---------------------------------------------------------

const TONGUE_N = 200;
const SEA_N = 240;
const SUB = 4;

interface Wave {
  spec: TongueSpec;
  geo: THREE.BufferGeometry;
  mat: THREE.ShaderMaterial;
  foam: Foam;
  foamGeo: THREE.BufferGeometry;
  foamCols: number;
  offset: number;
  sizeScale: number;
  outer: V2[];
  tan: V2[];
  nor: V2[];
}

interface Boat {
  group: THREE.Group;
  x0: number;
  y: number;
  vy: number;
  rot: number;
  scale: number;
  phase: number;
}

export interface WaveStage {
  render(dt: number, running: boolean): void;
  resize(width: number, height: number): void;
  setWind(w: number): void;
  dispose(): void;
}

export function createStage(canvas: HTMLCanvasElement, startTime = 0): WaveStage {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "low-power" });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(new THREE.Color(INKS.sky.hex));
  const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, -10, 10);
  let scene = new THREE.Scene();
  let l: Layout = layout(1);
  let t = startTime;
  let wind = 0;
  let waves: Wave[] = [];
  let boats: Boat[] = [];
  let seaGeo: THREE.BufferGeometry;
  let seaMat: THREE.ShaderMaterial;
  let drops: THREE.InstancedMesh;
  let dropRims: THREE.InstancedMesh;
  const disposables: { dispose(): void }[] = [];
  const shared: Record<string, THREE.IUniform> = {
    uTime: { value: t },
    uSea: { value: l.sea },
    uCrestX: { value: l.crestX },
    uComp: { value: l.C },
    uSwell: { value: 1 },
    uBody: { value: col("body") },
    uMid: { value: col("mid") },
    uPale: { value: col("pale") },
    uFoamC: { value: col("foam") },
    uInk: { value: col("ink") },
    uSky: { value: col("sky") },
    uLow: { value: col("foam") },
  };

  const track = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);

  function build() {
    disposables.splice(0).forEach((d) => d.dispose());
    scene = new THREE.Scene();
    let order = 0;
    const add = (o: THREE.Object3D) => {
      o.renderOrder = order++;
      o.frustumCulled = false;
      scene.add(o);
      return o;
    };

    // Sky.
    const sky = track(new THREE.PlaneGeometry(l.W, 10));
    add(new THREE.Mesh(sky, track(mat(SKY_FRAG, shared))));

    // Fuji, distant and still.
    const f = fuji(l);
    const shape = (pts: V2[]) => new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    const inkLine = track(new THREE.LineBasicMaterial({ color: INKS.ink.hex, depthTest: false }));
    add(new THREE.Mesh(track(new THREE.ShapeGeometry(shape(f.body))), track(new THREE.MeshBasicMaterial({ color: INKS.body.hex, depthTest: false }))));
    add(new THREE.Mesh(track(new THREE.ShapeGeometry(shape(f.snow))), track(new THREE.MeshBasicMaterial({ color: INKS.foam.hex, depthTest: false }))));
    add(new THREE.LineLoop(track(new THREE.BufferGeometry().setFromPoints(f.body.map(([x, y]) => new THREE.Vector3(x, y, 0)))), inkLine));

    // Sea.
    seaGeo = track(stripGeometry(SEA_N, { depth: 1, crest: 1 }));
    seaMat = track(mat(SEA_FRAG, shared, SEA_VERT));
    add(new THREE.Mesh(seaGeo, seaMat));

    // Waves: the great wave and the small one answering Fuji, each with its foam.
    const specs = tongues(l);
    waves = [
      { spec: specs.main, offset: 0, sizeScale: 1, roots: [0.52, 0.58, 0.64, 0.7, 0.75, 0.8, 0.85, 0.89, 0.93, 0.965] },
      { spec: specs.small, offset: 0.37, sizeScale: 0.42, roots: [0.6, 0.72, 0.82, 0.91] },
      { spec: specs.front, offset: 0.18, sizeScale: 0.55, roots: [0.58, 0.68, 0.77, 0.85, 0.92] },
    ].map(({ spec, offset, sizeScale, roots }) => {
      const geo = track(stripGeometry(TONGUE_N));
      const m = track(mat(TONGUE_FRAG, { ...shared, uFoam: { value: 0.5 } }));
      add(new THREE.Mesh(geo, m));
      const foam = new Foam(roots, 7, roots.length * 7 + 1);
      const cols = foam.chains.reduce((n, c) => n + c.seg * SUB + 1, 0);
      const foamGeo = track(stripGeometry(cols));
      // Separate chains: break the strip between them by degenerate indices.
      const idx: number[] = [];
      let base = 0;
      for (const c of foam.chains) {
        const n = c.seg * SUB + 1;
        for (let i = 0; i < n - 1; i++) {
          const a = (base + i) * 2;
          idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
        base += n;
      }
      foamGeo.setIndex(idx);
      return { spec, geo, mat: m, foam, foamGeo, foamCols: cols, offset, sizeScale, outer: [], tan: [], nor: [] } as Wave;
    });

    // Boats, trapped in the sea's motion.
    const hull = new THREE.Shape();
    hull.moveTo(-1.3, 0.2);
    hull.quadraticCurveTo(-0.25, -0.38, 1.38, 0.34);
    hull.lineTo(1.2, 0.2);
    hull.quadraticCurveTo(-0.1, 0.02, -1.12, 0.16);
    hull.closePath();
    const hullGeo = track(new THREE.ShapeGeometry(hull, 16));
    const hullLine = track(new THREE.BufferGeometry().setFromPoints(hull.getPoints(24).map((p) => new THREE.Vector3(p.x, p.y, 0))));
    const hullMat = track(new THREE.MeshBasicMaterial({ color: INKS.sky.hex, depthTest: false }));
    const rowerGeo = track(new THREE.CircleGeometry(0.034, 10));
    const rowerMat = track(new THREE.MeshBasicMaterial({ color: INKS.ink.hex, depthTest: false }));
    boats = [
      { fx: 0.25, s: 1.0, ph: 0 },
      { fx: 0.55, s: 0.78, ph: 1.7 },
      { fx: 0.85, s: 0.6, ph: 3.1 },
    ]
      .filter((b) => l.O + b.fx * l.C < l.L + l.W - 0.6)
      .map(({ fx, s, ph }) => {
        const group = new THREE.Group();
        const h = new THREE.Mesh(hullGeo, hullMat);
        const line = new THREE.LineLoop(hullLine, inkLine);
        group.add(h, line);
        for (let r = 0; r < 8; r++) {
          const m = new THREE.Mesh(rowerGeo, rowerMat);
          m.position.set(-0.72 + r * 0.2, 0.17 + 0.012 * Math.sin(r * 1.3), 0);
          m.scale.set(1.25, 0.9, 1);
          group.add(m);
        }
        group.children.forEach((c, i) => {
          c.renderOrder = 100 + i;
          c.frustumCulled = false;
        });
        group.scale.setScalar(s * Math.min(l.C / 8, 1.15));
        const x0 = l.O + fx * l.C;
        return { group, x0, y: seaY(l, stateAt(t), x0, t), vy: 0, rot: 0, scale: s, phase: ph };
      });
    // Order: sea, great wave, boats, then the small and front waves, foam, droplets, grain.
    const [, smallMesh, frontMesh] = scene.children.slice(-3);
    scene.remove(smallMesh, frontMesh);
    // No renderOrder on the groups themselves: three.js would then sort the
    // whole subtree by the group's order ahead of everything else.
    for (const b of boats) {
      b.group.children.forEach((c) => (c.renderOrder = order++));
      scene.add(b.group);
    }
    smallMesh.renderOrder = order++;
    frontMesh.renderOrder = order++;
    scene.add(smallMesh, frontMesh);

    const foamMat = track(mat(FOAM_FRAG, shared));
    for (const w of waves) add(new THREE.Mesh(w.foamGeo, foamMat));

    // Droplets: instanced discs with an ink rim behind.
    const disc = track(new THREE.CircleGeometry(1, 16));
    dropRims = new THREE.InstancedMesh(disc, track(new THREE.MeshBasicMaterial({ color: INKS.ink.hex, depthTest: false })), 400);
    drops = new THREE.InstancedMesh(disc, track(new THREE.MeshBasicMaterial({ color: INKS.foam.hex, depthTest: false })), 400);
    add(dropRims);
    add(drops);

    // Paper grain over the whole sheet.
    add(new THREE.Mesh(sky, track(mat(GRAIN_FRAG, shared, RIBBON_VERT, true))));

    // Settle the foam into its pose before the first frame.
    for (const w of waves) {
      const s = stateAt(t, w.offset);
      updateWave(w, s);
      w.foam.reset((q) => anchor(w, q), (q) => size(w, q, s), s.curl);
      for (let i = 0; i < 90; i++) w.foam.step(1 / 60, (q) => anchor(w, q), (q) => size(w, q, s), s.curl, 0, 0);
    }
  }

  function updateWave(w: Wave, s: WaveState) {
    const r = ribbon(w.spec, s, TONGUE_N);
    w.outer = r.outer;
    w.tan = r.tan;
    w.nor = r.nor;
    const pos = w.geo.attributes.position.array as Float32Array;
    const uv = w.geo.attributes.uv.array as Float32Array;
    for (let i = 0; i < TONGUE_N; i++) {
      const u = i / (TONGUE_N - 1);
      pos.set([r.outer[i][0], r.outer[i][1], 0, r.inner[i][0], r.inner[i][1], 0], i * 6);
      uv.set([u, 0, u, 1], i * 4);
    }
    w.geo.attributes.position.needsUpdate = true;
    w.geo.attributes.uv.needsUpdate = true;
    w.mat.uniforms.uFoam.value = s.foam;
  }

  function anchor(w: Wave, q: number): Anchor {
    const i = Math.min(Math.round(q * (TONGUE_N - 1)), TONGUE_N - 1);
    const p = w.outer[i];
    const n = w.nor[i];
    const tg = w.tan[i];
    // Fingers leave the crest outward and forward, rooted just inside the rim.
    const dx = -n[0] * 0.7 + tg[0] * 0.75;
    const dy = -n[1] * 0.7 + tg[1] * 0.75;
    const m = Math.hypot(dx, dy) || 1;
    return { p: [p[0] + n[0] * 0.03, p[1] + n[1] * 0.03], dir: [dx / m, dy / m] };
  }

  function size(w: Wave, q: number, s: WaveState) {
    const along = Math.min(Math.max((q - 0.5) / 0.5, 0), 1);
    return (0.32 + 0.62 * along) * (0.55 + 0.6 * s.foam) * w.sizeScale;
  }

  const tmp: V2[] = [];
  function updateFoamGeometry(w: Wave) {
    const pos = w.foamGeo.attributes.position.array as Float32Array;
    const uv = w.foamGeo.attributes.uv.array as Float32Array;
    let k = 0;
    for (const c of w.foam.chains) {
      smoothChain(c.x, c.seg + 1, SUB, tmp);
      const { nor } = frames(tmp);
      const w0 = (c.parent < 0 ? 0.085 : 0.055) * w.sizeScale ** 0.6 * (0.7 + 0.3 * c.scale);
      for (let i = 0; i < tmp.length; i++) {
        const along = i / (tmp.length - 1);
        const half = (w0 / 2) * Math.pow(1 - along, 0.85) + 0.004;
        const p = tmp[i];
        pos.set([p[0] - nor[i][0] * half, p[1] - nor[i][1] * half, 0, p[0] + nor[i][0] * half, p[1] + nor[i][1] * half, 0], k * 6);
        uv.set([along, 0, along, 1], k * 4);
        k++;
      }
    }
    w.foamGeo.attributes.position.needsUpdate = true;
    w.foamGeo.attributes.uv.needsUpdate = true;
  }

  const m4 = new THREE.Matrix4();
  const q4 = new THREE.Quaternion();
  const v3 = new THREE.Vector3();
  const s3 = new THREE.Vector3();

  function frame(dt: number, running: boolean) {
    if (running) t += dt;
    const s = stateAt(t);
    shared.uTime.value = t;
    shared.uSwell.value = s.swell;

    // Sea band.
    const pos = seaGeo.attributes.position.array as Float32Array;
    const depth = seaGeo.attributes.depth.array as Float32Array;
    const crest = seaGeo.attributes.crest.array as Float32Array;
    for (let i = 0; i < SEA_N; i++) {
      const x = l.L - 0.2 + ((l.W + 0.4) * i) / (SEA_N - 1);
      const y = seaY(l, s, x, t);
      pos.set([x, y, 0, x, -5.5, 0], i * 6);
      depth[i * 2] = 0;
      depth[i * 2 + 1] = y + 5.5;
      const c = Math.min(Math.max((y - l.sea + 0.08) / 0.34, 0), 1);
      crest[i * 2] = c;
      crest[i * 2 + 1] = c;
    }
    seaGeo.attributes.position.needsUpdate = true;
    seaGeo.attributes.depth.needsUpdate = true;
    seaGeo.attributes.crest.needsUpdate = true;

    // Waves and their foam (two physics substeps per frame).
    for (const w of waves) {
      const ws = stateAt(t, w.offset);
      updateWave(w, ws);
      if (running) {
        const h = dt / 2;
        for (let k = 0; k < 2; k++) w.foam.step(h, (q) => anchor(w, q), (q) => size(w, q, ws), ws.curl, ws.turbulence, wind);
      }
      updateFoamGeometry(w);
    }

    // Boats: spring-damped buoyancy, pitched by the local slope.
    for (const b of boats) {
      const x = b.x0 + 0.12 * Math.sin(t * 0.45 + b.phase);
      const target = seaY(l, s, x, t) - 0.05; // seated in the water, not on it
      const slope = (seaY(l, s, x + 0.15, t) - seaY(l, s, x - 0.15, t)) / 0.3;
      if (running) {
        b.vy += (target - b.y) * 0.3;
        b.vy *= 0.72;
        b.y += b.vy;
        b.rot += (Math.atan(slope) * 0.85 - b.rot) * 0.07;
      }
      b.group.position.set(x, b.y, 0);
      b.group.rotation.z = b.rot;
    }

    // Droplets from every wave's foam.
    let n = 0;
    for (const w of waves) {
      for (const d of w.foam.drops) {
        if (n >= 400) break;
        const r = d.size * (0.5 + 0.5 * Math.sin(Math.PI * Math.min(d.life * 1.4, 1))) * w.sizeScale ** 0.5;
        v3.set(d.x, d.y, 0);
        s3.set(r, r, 1);
        m4.compose(v3, q4, s3);
        drops.setMatrixAt(n, m4);
        s3.set(r + 0.02, r + 0.02, 1);
        m4.compose(v3, q4, s3);
        dropRims.setMatrixAt(n, m4);
        n++;
      }
    }
    drops.count = n;
    dropRims.count = n;
    drops.instanceMatrix.needsUpdate = true;
    dropRims.instanceMatrix.needsUpdate = true;

    renderer.render(scene, camera);
  }

  return {
    render: frame,
    resize(width, height) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      const aspect = width / height;
      l = layout(aspect);
      camera.left = -l.W / 2;
      camera.right = l.W / 2;
      camera.updateProjectionMatrix();
      shared.uSea.value = l.sea;
      shared.uCrestX.value = l.crestX;
      shared.uComp.value = l.C;
      build();
      frame(0, false);
    },
    setWind(w) {
      wind = w;
    },
    dispose() {
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    },
  };
}
