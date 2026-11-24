"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, StepForward } from "lucide-react";
import { WavePrint } from "./wave-print";

export interface WavePlate {
  code: string;
  colors: { name: string; hex: string }[];
}

const HOLD_MS = 6500;
const WIPE_MS = 1600;

function hexToVec(hex: string): [number, number, number] {
  const v = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255) as [number, number, number];
}

const VERT = /* glsl */ `
uniform float uTime;
varying float vH;
varying vec3 vWorld;

// Rolling swells: trochoid-like crests (sharp tops, broad troughs) travelling
// toward the viewer, with a slow cross-swell so the bands never sit still.
float swell(float x, float k) {
  float s = sin(x) * 0.5 + 0.5;
  return pow(s, k);
}

float wave(vec2 p) {
  float t = uTime;
  float h = 0.0;
  h += swell(p.y * 0.62 + t * 0.7 + sin(p.x * 0.23 + t * 0.15) * 1.4, 2.2) * 0.95;
  h += swell(p.y * 1.15 - p.x * 0.38 + t * 1.05, 3.0) * 0.38;
  h += sin(p.x * 0.5 - t * 0.35 + p.y * 0.2) * 0.12;
  h += sin((p.x * 1.6 + p.y * 2.3) + t * 1.6) * 0.03;
  return h - 0.68;
}

void main() {
  vec3 pos = position;
  pos.y = wave(pos.xz);
  vH = clamp((pos.y + 0.66) / 1.32, 0.0, 0.9999);
  vec4 world = modelMatrix * vec4(pos, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

// Colours are written as raw sRGB: no lighting, no tone mapping, no colour-space
// conversion, so every flat band is exactly the plate's HEX value.
const FRAG = /* glsl */ `
uniform vec3 uA[4];
uniform vec3 uB[4];
uniform float uCountA;
uniform float uCountB;
uniform float uMix;
uniform vec3 uInk;
varying float vH;
varying vec3 vWorld;

vec3 pickA(float i) { return i < 0.5 ? uA[0] : i < 1.5 ? uA[1] : i < 2.5 ? uA[2] : uA[3]; }
vec3 pickB(float i) { return i < 0.5 ? uB[0] : i < 1.5 ? uB[1] : i < 2.5 ? uB[2] : uB[3]; }

void main() {
  // The next plate is printed across the sheet from left to right.
  float s = (vWorld.x + 9.0) / 18.0 + sin(vWorld.z * 1.7) * 0.03;
  float useB = step(s, uMix * 1.12 - 0.06);
  float n = mix(uCountA, uCountB, useB);
  float f = vH * n;
  float idx = floor(f);
  vec3 col = mix(pickA(floor(vH * uCountA)), pickB(floor(vH * uCountB)), useB);

  // Key-block: a sumi line at every band edge, finer hatching inside the crests.
  float w = fwidth(f);
  float d = abs(fract(f + 0.5) - 0.5);
  // Lines thin out with distance and vanish where they would alias.
  float key = (1.0 - smoothstep(w * 0.55, w * 1.55, d)) * (1.0 - smoothstep(0.12, 0.3, w));
  float f2 = f * 4.0;
  float w2 = fwidth(f2);
  float d2 = abs(fract(f2 + 0.5) - 0.5);
  float hatch = (1.0 - smoothstep(w2 * 0.35, w2 * 1.1, d2)) * step(n - 1.0, idx) * 0.5
    * (1.0 - smoothstep(0.08, 0.2, w2));
  col = mix(col, uInk, max(key, hatch));
  gl_FragColor = vec4(col, 1.0);
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

  // Auto-advance while playing and on screen.
  const visible = useRef(true);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      if (visible.current && !document.hidden) go(indexRef.current + 1);
    }, HOLD_MS);
    return () => clearInterval(t);
  }, [playing, go]);

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
      if (/swiftshader|llvmpipe|software|basic render/i.test(gpu)) {
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
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // pass raw sRGB through untouched
      const el = renderer.domElement;
      el.setAttribute("aria-hidden", "true");
      el.className = "absolute inset-0 size-full opacity-0 transition-opacity duration-700";
      host.appendChild(el);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      const small = host.clientWidth < 700;
      const geo = new THREE.PlaneGeometry(26, 18, small ? 150 : 260, small ? 104 : 180);
      geo.rotateX(-Math.PI / 2);

      const toVecs = (p: WavePlate) => {
        const v = p.colors.map((c) => new THREE.Vector3(...hexToVec(c.hex)));
        while (v.length < 4) v.push(v[v.length - 1].clone());
        return v;
      };

      const uniforms = {
        uTime: { value: 2.0 },
        uA: { value: toVecs(plates[0]) },
        uB: { value: toVecs(plates[0]) },
        uCountA: { value: plates[0].colors.length },
        uCountB: { value: plates[0].colors.length },
        uMix: { value: 0 },
        uInk: { value: new THREE.Vector3(31 / 255, 28 / 255, 25 / 255) },
      };
      const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.z = -4;
      scene.add(mesh);

      const pointer = { x: 0, y: 0, cx: 0, cy: 0 };
      const onPointer = (e: PointerEvent) => {
        const r = host.getBoundingClientRect();
        pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1;
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      const resize = () => {
        const { clientWidth: w, clientHeight: h } = host;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        // Keep the horizon roughly a third from the top at every aspect.
        camera.fov = w / h < 1 ? 46 : 34;
        camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(resize);
      ro.observe(host);
      resize();

      let wipeStart = -1;
      let running = !reduced.current;
      let raf = 0;
      let last = performance.now();
      let onScreen = true;

      const render = (now: number) => {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        if (running) uniforms.uTime.value += dt;
        if (wipeStart >= 0) {
          const p = Math.min((now - wipeStart) / WIPE_MS, 1);
          uniforms.uMix.value = 1 - Math.pow(1 - p, 3);
          if (p >= 1) {
            uniforms.uA.value = uniforms.uB.value.map((v) => v.clone());
            uniforms.uCountA.value = uniforms.uCountB.value;
            uniforms.uMix.value = 0;
            wipeStart = -1;
          }
        }
        pointer.cx += (pointer.x - pointer.cx) * 0.04;
        pointer.cy += (pointer.y - pointer.cy) * 0.04;
        camera.position.set(pointer.cx * 0.7, 1.75 - pointer.cy * 0.2, 6.5);
        camera.lookAt(0, 0.35, -3);
        renderer.render(scene, camera);
      };

      const loop = (now: number) => {
        raf = 0;
        render(now);
        if (onScreen && !document.hidden && (running || wipeStart >= 0)) raf = requestAnimationFrame(loop);
      };
      const kick = () => {
        if (!raf) {
          last = performance.now();
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
      <div className="kento relative min-h-0 flex-1 overflow-hidden" ref={canvasHost}>
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
        {webgl !== "on" ? <WavePrint colors={current.colors.map((c) => c.hex)} className="absolute inset-x-0 bottom-0 h-[72%] w-full" /> : null}
        <Link
          href={`/combinations/${current.code}`}
          className="cartouche absolute top-4 right-4 z-10 text-lg transition-transform hover:-translate-y-0.5 md:text-xl"
          aria-label={`Open combination ${current.code}`}
        >
          {current.code}
        </Link>
      </div>

      <div className="mt-3 flex items-start justify-between gap-x-4 px-[var(--gutter)] lg:px-0">
        <ul className="flex min-w-0 flex-1 flex-wrap gap-x-4 gap-y-1.5 sm:gap-x-5 sm:gap-y-2" aria-live="polite" aria-label={`Colours of combination ${current.code}`}>
          {current.colors.map((c) => (
            <li key={c.hex + c.name} className="flex items-center gap-2.5">
              <span className="size-4 shrink-0 ring-1 ring-sumi/15" style={{ backgroundColor: c.hex }} aria-hidden="true" />
              <span className="text-[0.8rem] leading-tight">
                {c.name}
                <span className="ml-2 hidden font-data text-xs text-sumi-soft uppercase sm:inline">{c.hex}</span>
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
