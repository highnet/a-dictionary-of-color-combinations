/**
 * The Great Wave, abstracted: a curling wave and its small echo drawn as flat
 * stripes of Wada's colours, rising between three flat sea bands. Three.js as
 * a 2D stage (orthographic camera, painter's order, fixed-topology meshes).
 * Colours are written as raw sRGB, so every fill is exactly a Wada colour.
 */
import * as THREE from "three";
import { INKS, rgb } from "./palette";
import { bandY, layout, ribbon, tongues, type Layout, type TongueSpec } from "./geometry";
import { stateAt } from "./timeline";

THREE.ColorManagement.enabled = false;

const vec = (key: keyof typeof INKS) => new THREE.Vector3(...rgb(INKS[key].hex));

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Flat stripes along the wave: a thin foam rim on the crest, the deep body,
// the inner blue, and a pale edge toward the hollow. The boundaries drift
// along the form, so the water flows while the shapes stay flat.
const TONGUE_FRAG = /* glsl */ `
uniform vec3 uFoamC;
uniform vec3 uBody;
uniform vec3 uMid;
uniform vec3 uPale;
uniform float uTime;
uniform float uFoam;
varying vec2 vUv;
float step2(float edge, float v) {
  float w = max(fwidth(v), 1e-5);
  return smoothstep(edge - w * 0.75, edge + w * 0.75, v);
}
void main() {
  float t = vUv.x;
  float v = vUv.y;
  float flow = sin(t * 9.0 - uTime * 1.6);
  float rim = (0.035 + 0.05 * uFoam) * smoothstep(0.3, 0.55, t);
  vec3 c = uFoamC;
  c = mix(c, uBody, step2(rim, v));
  c = mix(c, uMid, step2(0.56 + 0.05 * flow, v));
  c = mix(c, uPale, step2(0.88 + 0.03 * flow, v));
  gl_FragColor = vec4(c, 1.0);
}
`;

const FLAT_FRAG = /* glsl */ `
uniform vec3 uColor;
void main() { gl_FragColor = vec4(uColor, 1.0); }
`;

function strip(columns: number) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(columns * 6), 3));
  g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(columns * 4), 2));
  const idx: number[] = [];
  for (let i = 0; i < columns - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  g.setIndex(idx);
  return g;
}

function material(frag: string, uniforms: Record<string, THREE.IUniform>) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: frag,
    uniforms,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

const TONGUE_N = 220;
const SEA_N = 200;

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
  const scene = new THREE.Scene();
  let l: Layout = layout(1);
  let t = startTime;
  let lean = 0;
  const time = { value: t };

  // Far band, the waves, then the middle and near bands over their roots.
  const seaColors: (keyof typeof INKS)[] = ["pale", "mid", "body"];
  const bands = seaColors.map((key, k) => {
    const geo = strip(SEA_N);
    const mesh = new THREE.Mesh(geo, material(FLAT_FRAG, { uColor: { value: vec(key) } }));
    mesh.frustumCulled = false;
    return { geo, mesh, k };
  });
  const waves = (["main", "small"] as const).map((name, i) => {
    const geo = strip(TONGUE_N);
    const mat = material(TONGUE_FRAG, {
      uFoamC: { value: vec("foam") },
      uBody: { value: vec("body") },
      uMid: { value: vec("mid") },
      uPale: { value: vec("pale") },
      uTime: time,
      uFoam: { value: 0.5 },
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    return { name, geo, mat, mesh, offset: i === 0 ? 0 : 0.37, spec: null as TongueSpec | null };
  });
  let order = 0;
  for (const o of [bands[0].mesh, waves[0].mesh, waves[1].mesh, bands[1].mesh, bands[2].mesh]) {
    o.renderOrder = order++;
    scene.add(o);
  }

  function frame(dt: number, running: boolean) {
    if (running) t += dt;
    time.value = t;
    const s = stateAt(t);

    for (const b of bands) {
      const pos = b.geo.attributes.position.array as Float32Array;
      for (let i = 0; i < SEA_N; i++) {
        const x = l.L - 0.2 + ((l.W + 0.4) * i) / (SEA_N - 1);
        pos.set([x, bandY(l, s, b.k, x, t), 0, x, -5.5, 0], i * 6);
      }
      b.geo.attributes.position.needsUpdate = true;
    }

    for (const w of waves) {
      const ws = stateAt(t, w.offset);
      const spec = { ...w.spec! };
      spec.crest = [spec.crest[0] + lean * spec.reach * 0.15, spec.crest[1]];
      const r = ribbon(spec, ws, TONGUE_N);
      const pos = w.geo.attributes.position.array as Float32Array;
      const uv = w.geo.attributes.uv.array as Float32Array;
      for (let i = 0; i < TONGUE_N; i++) {
        const u = i / (TONGUE_N - 1);
        pos.set([r.outer[i][0], r.outer[i][1], 0, r.inner[i][0], r.inner[i][1], 0], i * 6);
        uv.set([u, 0, u, 1], i * 4);
      }
      w.geo.attributes.position.needsUpdate = true;
      w.geo.attributes.uv.needsUpdate = true;
      w.mat.uniforms.uFoam.value = ws.foam;
    }
    renderer.render(scene, camera);
  }

  return {
    render: frame,
    resize(width, height) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      l = layout(width / height);
      camera.left = -l.W / 2;
      camera.right = l.W / 2;
      camera.updateProjectionMatrix();
      const specs = tongues(l);
      waves[0].spec = specs.main;
      waves[1].spec = specs.small;
      frame(0, false);
    },
    setWind(w) {
      // The pointer leans the crests a little.
      lean += (w - lean) * 0.3;
    },
    dispose() {
      for (const b of bands) {
        b.geo.dispose();
        (b.mesh.material as THREE.Material).dispose();
      }
      for (const w of waves) {
        w.geo.dispose();
        w.mat.dispose();
      }
      renderer.dispose();
    },
  };
}
