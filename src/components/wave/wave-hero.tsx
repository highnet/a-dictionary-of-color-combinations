"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, StepForward } from "lucide-react";
import { WavePrint } from "./wave-print";
import { FIELD_N, MAX_JET, MAX_SPRAY, WaveSim, surfaceGlsl } from "./wave-sim";

export interface WavePlate {
  code: string;
  colors: { name: string; hex: string }[];
}

const HOLD_MS = 6500;
const WIPE_MS = 900;

function hexToVec(hex: string): [number, number, number] {
  const v = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255) as [number, number, number];
}

// A full-sheet quad: the print is drawn in 2D, as a woodblock is.
const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// Draws the simulated sea (see wave-sim.ts) as a carved print: flat bands of
// the plate's exact sRGB colours, tapered sumi key-lines, washi foam on steep
// crests, the breaking jet as a keyed ribbon with claws, and spray. No
// lighting, tone mapping or colour blending ever touches a band colour.
const FRAG = /* glsl */ `
uniform vec3 uA[4];
uniform vec3 uB[4];
uniform float uCountA;
uniform float uCountB;
uniform float uMix;
uniform vec3 uInk;
uniform vec3 uPaper;
uniform float uTime;
uniform float uAspect;
uniform float uPx;
uniform float uWipe;
uniform vec4 uPacket;
uniform sampler2D uField;
uniform vec4 uJet[${MAX_JET}];
uniform float uJetN;
uniform vec4 uSpray[${MAX_SPRAY}];
uniform float uSprayN;
varying vec2 vUv;

vec3 pickA(float i) { return i < 0.5 ? uA[0] : i < 1.5 ? uA[1] : i < 2.5 ? uA[2] : uA[3]; }
vec3 pickB(float i) { return i < 0.5 ? uB[0] : i < 1.5 ? uB[1] : i < 2.5 ? uB[2] : uB[3]; }
${surfaceGlsl()}

// Distance to a segment whose radius tapers from ra to rb.
float taper(vec2 p, vec2 a, vec2 b, float ra, float rb) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0.0, 1.0);
  return length(pa - ba * h) - mix(ra, rb, h);
}

void main() {
  vec2 p = vec2(vUv.x * uAspect, vUv.y);
  // The next plate is printed across the sheet from left to right.
  float s = vUv.x + sin(vUv.y * 13.0) * 0.015;
  float edgeX = uMix * 1.06 - 0.03;
  bool useB = s < edgeX;
  float n = useB ? uCountB : uCountA;
  float aa = uPx * 1.2;
  vec4 col = vec4(0.0);

  // Back to front: each nearer band paints over the ones behind it.
  for (int ji = 0; ji < 4; ji++) {
    float j = float(ji);
    if (j > n - 0.5) break;
    vec2 e = bandEdge(j, n, p.x);
    float d = e.x - p.y;                                  // > 0 inside the band
    if (d > -aa) {
      vec3 c = useB ? pickB(j) : pickA(j);
      float cover = smoothstep(-aa, aa, d);
      col = mix(col, vec4(c, 1.0), cover);
      float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
      vec3 lc = lum < 0.2 ? uPaper : uInk;
      // A smooth washi cap on the steepest crests, keyed beneath.
      float foamOn = smoothstep(0.7, 0.97, e.y) * step(n - 1.5, j);
      float cap = 0.018 * foamOn;
      float foam = foamOn * (1.0 - smoothstep(cap - aa, cap + aa, d)) * cover;
      col.rgb = mix(col.rgb, uPaper, foam);
      float foamLine = foamOn * step(0.3, foamOn) * (1.0 - smoothstep(uPx * 0.6, uPx * 1.4, abs(d - cap)));
      // Key-line along the top edge, swelling at the crests.
      float w = uPx * (1.3 + 2.4 * e.y);
      float key = (1.0 - smoothstep(w - aa, w + aa, d)) * cover;
      col.rgb = mix(col.rgb, lc, max(key, foamLine));
    }
  }

  // The breaking jet: a ribbon through the simulated particles, rooted in the crest.
  float j = n - 1.0;
  vec3 front = useB ? pickB(j) : pickA(j);
  float lumF = dot(front, vec3(0.2126, 0.7152, 0.0722));
  vec3 lcF = lumF < 0.2 ? uPaper : uInk;
  float frontY = bandEdge(j, n, p.x).x;
  // Fine marks (claws, spray) need room: drop them on small canvases.
  bool detail = uPx < 1.0 / 300.0;
  if (uJetN > 1.5) {
    float sd = 1e5;
    for (int i = 0; i < ${MAX_JET - 1}; i++) {
      if (float(i) > uJetN - 2.0) break;
      vec4 a = uJet[i];
      vec4 b = uJet[i + 1];
      sd = min(sd, taper(p, a.xy, b.xy, a.z, b.z));
    }
    float fill = 1.0 - smoothstep(-aa, aa, sd);
    col = mix(col, vec4(front, 1.0), fill);
    // Keyed outside the water only, so the root runs seamlessly into the swell.
    float w = uPx * 2.4;
    float key = (1.0 - smoothstep(w - aa, w + aa, abs(sd))) * step(frontY - aa, p.y);
    col.rgb = mix(col.rgb, lcF, key * col.a);
    // Claws: washi fingers on the leading particles, raking along their flight.
    for (int i = 0; i < ${MAX_JET - 1}; i++) {
      if (!detail || float(i) > uJetN - 2.0) break;
      if (float(i) < uJetN - 7.0) continue;
      vec4 a = uJet[i];
      vec4 b = uJet[i + 1];
      vec2 dir = normalize(b.xy - a.xy + vec2(1e-5));
      vec2 up = vec2(-dir.y, dir.x);
      vec2 base = b.xy + up * b.z * 0.8;
      float len = 0.022 + 0.01 * fract(float(i) * 0.618);
      float dc = taper(p, base, base + normalize(dir + up * 0.9) * len, 0.0055, 0.0012);
      col = mix(col, vec4(uPaper, 1.0), 1.0 - smoothstep(-aa, aa, dc));
      col.rgb = mix(col.rgb, uInk, 1.0 - smoothstep(uPx * 0.8 - aa, uPx * 0.8 + aa, abs(dc)));
    }
  }

  // Spray: short streaks along each droplet's velocity.
  for (int i = 0; i < ${MAX_SPRAY}; i++) {
    if (!detail || float(i) > uSprayN - 0.5) break;
    vec4 q = uSpray[i];
    vec2 tail = q.xy - q.zw * 0.05;
    float dc = taper(p, q.xy, tail, 0.005, 0.0015);
    col = mix(col, vec4(front, 1.0), 1.0 - smoothstep(-aa, aa, dc));
    col.rgb = mix(col.rgb, lcF, 1.0 - smoothstep(uPx * 0.8 - aa, uPx * 0.8 + aa, abs(dc)));
  }

  // While a new plate is being printed, its leading edge is keyed like a block.
  if (uWipe > 0.5) {
    float wl = uPx / uAspect * 1.6;
    float edge = (1.0 - smoothstep(wl, wl * 2.0, abs(s - edgeX))) * col.a;
    col.rgb = mix(col.rgb, uInk, edge);
  }

  gl_FragColor = col;
}
`;

export function WaveHero({ plates }: { plates: WavePlate[] }) {
  const canvasHost = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [webgl, setWebgl] = useState<"pending" | "on" | "off">("pending");
  const api = useRef<{ show: (i: number, animate: boolean) => void; setPlaying: (p: boolean) => void } | null>(null);
  const indexRef = useRef(0);
  const reduced = useRef(false);

  const current = plates[index];

  const go = useCallback(
    (next: number) => {
      const i = (next + plates.length) % plates.length;
      indexRef.current = i;
      setIndex(i);
      api.current?.show(i, !reduced.current);
    },
    [plates.length],
  );

  // Auto-advance between sets (the sea is calm then), while playing and on screen.
  const visible = useRef(true);
  const onSet = useRef<(() => void) | null>(null);
  useEffect(() => {
    onSet.current = () => {
      if (playing && visible.current && !document.hidden) go(indexRef.current + 1);
    };
  }, [playing, go]);
  // Fallback cadence when WebGL is off (static print): change plate on a timer.
  useEffect(() => {
    if (!playing || webgl === "on") return;
    const t = setInterval(() => {
      if (visible.current && !document.hidden) go(indexRef.current + 1);
    }, HOLD_MS);
    return () => clearInterval(t);
  }, [playing, go, webgl]);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) setPlaying(false);
    const host = canvasHost.current;
    if (!host) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      // Wait for an idle moment so the wave never competes with first paint.
      await new Promise<void>((r) =>
        "requestIdleCallback" in window ? requestIdleCallback(() => r(), { timeout: 1500 }) : setTimeout(r, 300),
      );
      if (disposed) return;
      const probe = document.createElement("canvas");
      const gl = (probe.getContext("webgl2") ?? probe.getContext("webgl")) as WebGLRenderingContext | null;
      if (!gl) {
        setWebgl("off");
        return;
      }
      // Software rasterisers (SwiftShader, llvmpipe) would run the wave on the
      // CPU and drain the device: keep the static print instead.
      const dbg = gl.getExtension("WEBGL_debug_renderer_info");
      const gpu = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : "";
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      const force = new URLSearchParams(window.location.search).has("gl");
      if (!force && /swiftshader|llvmpipe|software|basic render/i.test(gpu)) {
        setWebgl("off");
        return;
      }
      const THREE = await import("three");
      if (disposed) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      } catch {
        setWebgl("off");
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // pass raw sRGB through untouched
      const el = renderer.domElement;
      el.setAttribute("aria-hidden", "true");
      el.className = "absolute inset-0 size-full opacity-0 transition-opacity duration-700";
      host.appendChild(el);

      const scene = new THREE.Scene();
      const camera = new THREE.Camera();
      const geo = new THREE.PlaneGeometry(2, 2);

      const toVecs = (p: WavePlate) => {
        const v = p.colors.map((c) => new THREE.Vector3(...hexToVec(c.hex)));
        while (v.length < 4) v.push(v[v.length - 1].clone());
        return v;
      };

      const sim = new WaveSim();
      const fieldTex = new THREE.DataTexture(sim.field, FIELD_N, 1, THREE.RedFormat, THREE.FloatType);
      fieldTex.needsUpdate = true;
      const uniforms = {
        uTime: { value: 0 },
        uA: { value: toVecs(plates[0]) },
        uB: { value: toVecs(plates[0]) },
        uCountA: { value: plates[0].colors.length },
        uCountB: { value: plates[0].colors.length },
        uMix: { value: 0 },
        uInk: { value: new THREE.Vector3(31 / 255, 28 / 255, 25 / 255) },
        uPaper: { value: new THREE.Vector3(236 / 255, 238 / 255, 232 / 255) },
        uAspect: { value: 1 },
        uWipe: { value: 0 },
        uPx: { value: 0.002 },
        uPacket: { value: new THREE.Vector4() },
        uField: { value: fieldTex },
        uJet: { value: Array.from({ length: MAX_JET }, () => new THREE.Vector4()) },
        uJetN: { value: 0 },
        uSpray: { value: Array.from({ length: MAX_SPRAY }, () => new THREE.Vector4()) },
        uSprayN: { value: 0 },
      };
      const count = () => uniforms.uCountA.value;
      const sync = () => {
        uniforms.uTime.value = sim.t;
        uniforms.uPacket.value.set(sim.packet.x, sim.packet.amp, sim.packet.phase, 0);
        fieldTex.needsUpdate = true;
        const rib = sim.ribbon(count());
        rib.forEach(([x, y, r], i) => uniforms.uJet.value[i].set(x, y, r, 0));
        uniforms.uJetN.value = rib.length;
        sim.spray.slice(0, MAX_SPRAY).forEach((q, i) => uniforms.uSpray.value[i].set(q.x, q.y, q.vx, q.vy));
        uniforms.uSprayN.value = Math.min(sim.spray.length, MAX_SPRAY);
      };
      const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, transparent: true });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      scene.add(mesh);

      // The pointer disturbs the water: moving across it drags ripples, a tap splashes.
      let last: { x: number; y: number } | null = null;
      const toSheet = (e: PointerEvent) => {
        const r = host.getBoundingClientRect();
        return { x: (e.clientX - r.left) / r.height, y: 1 - (e.clientY - r.top) / r.height, inside: e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom };
      };
      const onPointer = (e: PointerEvent) => {
        const q = toSheet(e);
        if (q.inside && last && q.y < sim.surfaceY(count() - 1, count(), q.x) + 0.08) {
          sim.disturb(q.x, Math.hypot(q.x - last.x, q.y - last.y) * 0.25);
          kick();
        }
        last = q.inside ? q : null;
      };
      const onDown = (e: PointerEvent) => {
        const q = toSheet(e);
        if (q.inside) {
          sim.disturb(q.x, 0.02);
          kick();
        }
      };
      window.addEventListener("pointermove", onPointer, { passive: true });
      host.addEventListener("pointerdown", onDown, { passive: true });

      let sized = false;
      const resize = () => {
        const { clientWidth: w, clientHeight: h } = host;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        uniforms.uAspect.value = w / h;
        if (!sized) {
          sim.aspect = w / h;
          sim.launch(true);
          sized = true;
        }
        sim.aspect = w / h;
        uniforms.uPx.value = 1 / h; // one CSS pixel in sheet units
      };
      const ro = new ResizeObserver(resize);
      ro.observe(host);
      resize();

      let wipeStart = -1;
      let running = !reduced.current;
      let raf = 0;
      let lastFrame = performance.now();
      let onScreen = true;
      // Reduced motion: advance the physics to a breaking moment, then hold it.
      // `?wave=<seconds>` does the same at a chosen moment (used for captures).
      const hold = Number(new URLSearchParams(window.location.search).get("wave"));
      if (hold > 0) {
        running = false;
        for (let i = 0; i < Math.round(hold * 60); i++) sim.step(1 / 60, count());
      } else if (!running) {
        for (let i = 0; i < 60 * 9 && sim.jet.length < 14; i++) sim.step(1 / 60, count());
      }

      const render = (now: number) => {
        const dt = Math.min((now - lastFrame) / 1000, 0.05);
        lastFrame = now;
        if (running) {
          const sets = sim.sets;
          sim.step(dt, count());
          if (sim.sets !== sets) onSet.current?.();
        }
        if (wipeStart >= 0) {
          const p = Math.min((now - wipeStart) / WIPE_MS, 1);
          uniforms.uMix.value = 1 - Math.pow(1 - p, 3);
          uniforms.uWipe.value = 1;
          if (p >= 1) {
            uniforms.uWipe.value = 0;
            uniforms.uA.value = uniforms.uB.value.map((v) => v.clone());
            uniforms.uCountA.value = uniforms.uCountB.value;
            uniforms.uMix.value = 0;
            wipeStart = -1;
          }
        }
        sync();
        renderer.render(scene, camera);
      };

      const loop = (now: number) => {
        raf = 0;
        render(now);
        if (onScreen && !document.hidden && (running || wipeStart >= 0)) raf = requestAnimationFrame(loop);
      };
      const kick = () => {
        if (!raf) {
          lastFrame = performance.now();
          raf = requestAnimationFrame(loop);
        }
      };

      const io = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        visible.current = onScreen;
        if (onScreen) kick();
      });
      io.observe(host);
      const onVis = () => !document.hidden && kick();
      document.addEventListener("visibilitychange", onVis);

      api.current = {
        show(i, animate) {
          uniforms.uB.value = toVecs(plates[i]);
          uniforms.uCountB.value = plates[i].colors.length;
          if (animate) {
            wipeStart = performance.now();
          } else {
            uniforms.uA.value = toVecs(plates[i]);
            uniforms.uCountA.value = plates[i].colors.length;
            uniforms.uMix.value = 0;
            wipeStart = -1;
            render(performance.now());
          }
          kick();
        },
        setPlaying(p) {
          running = p;
          kick();
        },
      };

      render(performance.now());
      requestAnimationFrame(() => (el.style.opacity = "1"));
      setWebgl("on");
      kick();

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        window.removeEventListener("pointermove", onPointer);
        host.removeEventListener("pointerdown", onDown);
        fieldTex.dispose();
        document.removeEventListener("visibilitychange", onVis);
        geo.dispose();
        mat.dispose();
        renderer.dispose();
        el.remove();
        api.current = null;
      };
    })().catch(() => setWebgl("off"));

    return () => {
      disposed = true;
      cleanup();
    };
  }, [plates]);

  useEffect(() => {
    api.current?.setPlaying(playing);
  }, [playing]);

  const sky = current.colors[0].hex;

  return (
    <div className="relative flex h-full flex-col">
      <div className="kento relative min-h-0 flex-1">
      <div className="absolute inset-0 overflow-hidden" ref={canvasHost}>
        {/* Bokashi: the plate's first colour graded into the paper, as in a printed sky. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[46%] transition-[background-color] duration-[1600ms]"
          style={{
            backgroundColor: sky,
            maskImage: "linear-gradient(to bottom, #000 0%, #000 18%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 18%, transparent 100%)",
          }}
        />
        {webgl !== "on" ? <WavePrint colors={current.colors.map((c) => c.hex)} className="absolute inset-x-0 bottom-0 h-[74%] w-full" /> : null}
        <Link
          href={`/combinations/${current.code}`}
          className="cartouche absolute top-4 right-4 z-10 text-lg transition-transform hover:-translate-y-0.5 md:text-xl"
          aria-label={`Open combination ${current.code}`}
        >
          {current.code}
        </Link>
      </div>
      </div>

      <div className="mt-3 flex items-start justify-between gap-x-4 px-[var(--gutter)] lg:px-0">
        <ul className="flex min-w-0 flex-1 flex-wrap gap-x-4 gap-y-1.5 sm:gap-x-5 sm:gap-y-2" aria-live="polite" aria-label={`Colours of combination ${current.code}`}>
          {current.colors.map((c) => (
            <li key={c.hex + c.name} className="flex items-center gap-2.5">
              <span className="size-4 shrink-0 ring-1 ring-sumi/15" style={{ backgroundColor: c.hex }} aria-hidden="true" />
              <span className="text-[0.8rem] leading-tight">
                <span className="sr-only sm:not-sr-only">{c.name}</span>
                <span className="font-data text-xs text-sumi-soft uppercase sm:ml-2">{c.hex}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="grid size-11 place-items-center hover:bg-washi-deep"
            aria-label={playing ? "Pause the wave" : "Play the wave"}
            aria-pressed={!playing}
          >
            {playing ? <Pause className="size-4" strokeWidth={1.6} /> : <Play className="size-4" strokeWidth={1.6} />}
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="grid size-11 place-items-center hover:bg-washi-deep"
            aria-label="Print the next combination"
          >
            <StepForward className="size-4" strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </div>
  );
}
